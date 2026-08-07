"""Industry & Market workspace service — mirrors Management & Governance persistence."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.business_operations_workspace import BusinessOperationsWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.financials_kpis_workspace import FinancialsKpisWorkspace
from app.models.industry_market_workspace import IndustryMarketWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.user import User
from app.modules.capital_ownership.compute import ipo_setup_reference_from_payload
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.industry_market.assessment import assess_industry_market
from app.modules.industry_market.compute import compute_industry_market_model
from app.modules.industry_market.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    IndustryMarketErrorCode,
)
from app.modules.industry_market.defaults import clone_empty_payload
from app.modules.industry_market.overview import build_overview_summary
from app.modules.industry_market.progress import calculate_industry_market_progress
from app.modules.industry_market.schemas import (
    BusinessOperationsReferenceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    FinancialsKpisReferenceResponse,
    IndustryAssessmentResponse,
    IndustryMarketWorkspaceResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    LinkedWorkstreamReferencesResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.industry_market.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import INDUSTRY_MARKET_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_industry_market_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> IndustryMarketWorkspace | None:
    return db.scalar(
        select(IndustryMarketWorkspace).where(
            IndustryMarketWorkspace.user_id == user_id,
        ),
    )


def get_company_reference(db: Session, user_id: uuid.UUID) -> CompanyReferenceResponse:
    workspace = db.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return CompanyReferenceResponse(available=False)

    identity = (workspace.payload or {}).get("identity") or {}
    legal_name = str(identity.get("legalName") or "").strip() or None
    company_class = str(identity.get("companyClass") or "").strip() or None
    cin = str(identity.get("cin") or "").strip() or None

    if not any([legal_name, company_class, cin]):
        return CompanyReferenceResponse(available=False)

    return CompanyReferenceResponse(
        available=True,
        legal_name=legal_name,
        company_class=company_class,
        cin=cin,
    )


def get_ipo_setup_reference(db: Session, user_id: uuid.UUID) -> dict[str, Any]:
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(
            IpoSetupEligibilityWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return ipo_setup_reference_from_payload(None)
    return ipo_setup_reference_from_payload(workspace.payload)


def get_business_operations_reference(
    db: Session,
    user_id: uuid.UUID,
) -> BusinessOperationsReferenceResponse:
    workspace = db.scalar(
        select(BusinessOperationsWorkspace).where(
            BusinessOperationsWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return BusinessOperationsReferenceResponse(available=False)

    products_section = (workspace.payload or {}).get("productsServicesAndRevenueMix") or {}
    products = products_section.get("productsServices") or []
    revenue_rows = products_section.get("revenueMixRows") or []
    segment_ids: list[str] = []
    for product in products:
        if isinstance(product, dict) and product.get("id"):
            segment_ids.append(str(product["id"]))
    for row in revenue_rows:
        if isinstance(row, dict):
            ref = str(row.get("productOrSegmentId") or "").strip()
            if ref and ref not in segment_ids:
                segment_ids.append(ref)

    has_products = bool(products)
    has_revenue = bool(revenue_rows)
    if not has_products and not has_revenue:
        return BusinessOperationsReferenceResponse(available=False)

    return BusinessOperationsReferenceResponse(
        available=True,
        product_service_context_available=has_products,
        business_segment_context_available=has_revenue or has_products,
        segment_ids=segment_ids,
    )


def get_financials_kpis_reference(
    db: Session,
    user_id: uuid.UUID,
) -> FinancialsKpisReferenceResponse:
    workspace = db.scalar(
        select(FinancialsKpisWorkspace).where(
            FinancialsKpisWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return FinancialsKpisReferenceResponse(available=False)

    payload = workspace.payload or {}
    segment_ids: list[str] = []
    other = payload.get("otherFinancialInformation") or {}
    for segment in other.get("segmentRecords") or []:
        if isinstance(segment, dict) and segment.get("id"):
            segment_ids.append(str(segment["id"]))

    kpi_section = payload.get("kpiSelectionGovernanceAndPeerComparison") or {}
    kpi_register = kpi_section.get("kpiRegister") or []
    certified_kpi = any(
        isinstance(row, dict) and str(row.get("certificationStatus") or "").strip()
        for row in kpi_register
    )

    if not segment_ids and not certified_kpi:
        return FinancialsKpisReferenceResponse(available=False)

    return FinancialsKpisReferenceResponse(
        available=True,
        reporting_segment_context_available=bool(segment_ids),
        certified_kpi_context_available=certified_kpi,
        segment_ids=segment_ids,
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    ipo_reference = get_ipo_setup_reference(db, user_id)
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        business_operations=get_business_operations_reference(db, user_id),
        financials_kpis=get_financials_kpis_reference(db, user_id),
        ipo_setup=IpoSetupReferenceResponse.model_validate(ipo_reference),
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(
        calculate_industry_market_progress(payload),
    )


def _build_computations(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> ComputationsResponse:
    model = compute_industry_market_model(payload, linked_references)
    return ComputationsResponse.model_validate(model)


def _build_workspace_response(
    db: Session,
    workspace: IndustryMarketWorkspace,
) -> IndustryMarketWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    linked_dict = _linked_dict(linked_references)
    payload = workspace.payload
    return IndustryMarketWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict),
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> IndustryMarketWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = IndustryMarketWorkspace(
        user_id=user.id,
        source_onboarding_application_id=application.id,
        payload=payload,
        schema_version=payload["schemaVersion"],
        version=1,
        last_saved_at=now,
    )
    try:
        with db.begin_nested():
            db.add(workspace)
            db.flush()
    except IntegrityError:
        return None
    db.refresh(workspace)
    return workspace


def initialize_or_get_workspace(db: Session, user: User) -> InitializeWorkspaceResponse:
    existing = get_workspace_for_user(db, user.id)

    if existing is None:
        created = _insert_workspace(db, user)
        if created is not None:
            base = _build_workspace_response(db, created)
            return InitializeWorkspaceResponse(**base.model_dump(), created=True)
        existing = get_workspace_for_user(db, user.id)

    if existing is None:
        raise AppException(
            status_code=404,
            code=IndustryMarketErrorCode.WORKSPACE_NOT_FOUND,
            message="Industry & Market workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> IndustryMarketWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IndustryMarketErrorCode.WORKSPACE_NOT_FOUND,
            message="Industry & Market workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> IndustryMarketWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IndustryMarketErrorCode.WORKSPACE_NOT_FOUND,
            message="Industry & Market workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session,
    workspace: IndustryMarketWorkspace,
    expected_version: int,
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=IndustryMarketErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_industry_market_progress(workspace.payload),
                "computations": _build_computations(
                    workspace.payload,
                    linked_dict,
                ).model_dump(by_alias=True),
            },
        )


def save_section(
    db: Session,
    user: User,
    *,
    section_id: str,
    expected_version: int,
    data: dict[str, Any],
) -> SectionSaveResponse:
    if section_id not in SECTION_IDS:
        raise AppException(
            status_code=404,
            code=IndustryMarketErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Industry & Market section: {section_id}",
        )

    workspace = _require_workspace(db, user)
    payload_key = SECTION_PAYLOAD_KEYS[section_id]
    next_payload = deepcopy(workspace.payload)
    section_data = deepcopy(data)

    validator = VALIDATORS[section_id]
    try:
        validator(section_data, next_payload)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=IndustryMarketErrorCode.VALIDATION_FAILED,
            message=f"{section_id} contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc

    next_payload[payload_key] = section_data
    _assert_version(db, workspace, expected_version)

    now = _now()
    workspace.payload = next_payload
    workspace.version = expected_version + 1
    workspace.last_saved_at = now
    db.flush()
    db.refresh(workspace)

    linked_references = get_linked_references(db, user.id)
    linked_dict = _linked_dict(linked_references)
    notification = create_industry_market_save_notification(
        db,
        user=user,
        section_id=section_id,
        saved_at=now,
    )
    progress = _build_progress(workspace.payload)
    return SectionSaveResponse(
        version=workspace.version,
        last_saved_at=now,
        saved_section_id=section_id,
        saved_section={payload_key: section_data},
        progress=progress,
        payload=workspace.payload,
        computations=_build_computations(workspace.payload, linked_dict),
        acknowledgement=SaveAcknowledgementResponse(
            message=INDUSTRY_MARKET_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    summary = build_overview_summary(workspace.payload, _linked_dict(linked_references))
    summary["lastUpdatedAt"] = workspace.last_saved_at
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> IndustryAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, workspace.user_id)
    assessment = assess_industry_market(workspace.payload, _linked_dict(linked_references))
    return IndustryAssessmentResponse.model_validate(assessment)
