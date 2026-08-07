"""Financials & KPIs workspace service — mirrors Objects of the Issue persistence."""

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
from app.models.capital_ownership_workspace import CapitalOwnershipWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.financials_kpis_workspace import FinancialsKpisWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.capital_ownership.compute import ipo_setup_reference_from_payload
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.financials_kpis.assessment import assess_financials_kpis
from app.modules.financials_kpis.compute import compute_financials_kpis_model
from app.modules.financials_kpis.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    FinancialsKpisErrorCode,
)
from app.modules.financials_kpis.defaults import clone_empty_payload
from app.modules.financials_kpis.overview import build_overview_summary
from app.modules.financials_kpis.periods import get_financial_periods
from app.modules.financials_kpis.progress import calculate_progress
from app.modules.financials_kpis.schemas import (
    BusinessOperationsReferenceResponse,
    CapitalOwnershipReferenceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    FinancialAssessmentResponse,
    FinancialsKpisWorkspaceResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    LinkedPlaceholderResponse,
    LinkedWorkstreamReferencesResponse,
    ObjectsOfIssueReferenceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.financials_kpis.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import FINANCIALS_KPIS_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_financials_kpis_save_notification,
    to_notification_response,
)
from app.modules.financials_kpis import decimal_math as dm

_EMPTY_LINKED_PLACEHOLDER = LinkedPlaceholderResponse(available=False)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(db: Session, user_id: uuid.UUID) -> FinancialsKpisWorkspace | None:
    return db.scalar(
        select(FinancialsKpisWorkspace).where(
            FinancialsKpisWorkspace.user_id == user_id,
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
    if not legal_name and not company_class and not cin:
        return CompanyReferenceResponse(available=False)
    return CompanyReferenceResponse(
        legal_name=legal_name,
        company_class=company_class,
        cin=cin,
        available=True,
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


def get_capital_ownership_reference(db: Session, user_id: uuid.UUID) -> CapitalOwnershipReferenceResponse:
    workspace = db.scalar(
        select(CapitalOwnershipWorkspace).where(
            CapitalOwnershipWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return CapitalOwnershipReferenceResponse(available=False)
    structure = (workspace.payload or {}).get("currentCapitalStructure") or {}
    equity_capital = dm.to_decimal_string(structure.get("paidUpEquityShareCapital"))
    face_value = ""
    equity_classes = structure.get("equityClasses") or []
    if equity_classes and isinstance(equity_classes[0], dict):
        face_value = dm.to_decimal_string(equity_classes[0].get("faceValuePerShare"))
    if not dm.is_filled(equity_capital) and not dm.is_filled(face_value):
        return CapitalOwnershipReferenceResponse(available=False)
    return CapitalOwnershipReferenceResponse(
        available=True,
        equity_share_capital=equity_capital or None,
        face_value=face_value or None,
    )


def get_business_operations_reference(
    db: Session, user_id: uuid.UUID
) -> BusinessOperationsReferenceResponse:
    workspace = db.scalar(
        select(BusinessOperationsWorkspace).where(
            BusinessOperationsWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return BusinessOperationsReferenceResponse(available=False)
    products_section = (workspace.payload or {}).get("productsServicesAndRevenueMix") or {}
    segment_ids: list[str] = []
    for product in products_section.get("productsServices") or []:
        if isinstance(product, dict) and product.get("id"):
            segment_ids.append(str(product["id"]))
    for row in products_section.get("revenueMixRows") or []:
        if isinstance(row, dict):
            ref = str(row.get("productOrSegmentId") or "").strip()
            if ref and ref not in segment_ids:
                segment_ids.append(ref)
    if not segment_ids:
        return BusinessOperationsReferenceResponse(available=False)
    return BusinessOperationsReferenceResponse(available=True, segment_ids=segment_ids)


def get_objects_of_issue_reference(db: Session, user_id: uuid.UUID) -> ObjectsOfIssueReferenceResponse:
    workspace = db.scalar(
        select(ObjectsIssueWorkspace).where(
            ObjectsIssueWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return ObjectsOfIssueReferenceResponse(available=False)
    working_capital = (workspace.payload or {}).get("workingCapitalAndBorrowingRepayment") or {}
    wc_amount = dm.to_decimal_string(working_capital.get("workingCapitalRequirementAmount"))
    borrowing_total = dm.sum_decimals(
        [
            item.get("amountProposedForRepayment")
            for item in working_capital.get("borrowingRepaymentItems") or []
            if isinstance(item, dict)
        ]
    )
    if not dm.is_filled(wc_amount) and not dm.is_filled(borrowing_total):
        return ObjectsOfIssueReferenceResponse(available=False)
    return ObjectsOfIssueReferenceResponse(
        available=True,
        working_capital_requirement=wc_amount or None,
        borrowing_repayment_total=borrowing_total or None,
    )


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    ipo_reference = get_ipo_setup_reference(db, user_id)
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        capital_ownership=get_capital_ownership_reference(db, user_id),
        ipo_setup=IpoSetupReferenceResponse.model_validate(ipo_reference),
        business_operations=get_business_operations_reference(db, user_id),
        objects_of_issue=get_objects_of_issue_reference(db, user_id),
        borrowings=_EMPTY_LINKED_PLACEHOLDER,
        group_entities=_EMPTY_LINKED_PLACEHOLDER,
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_progress(payload))


def _build_computations(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
    ipo_reference: dict[str, Any],
) -> ComputationsResponse:
    model = compute_financials_kpis_model(payload, linked_references, ipo_reference)
    pl_rows = model.get("plByPeriod") or []
    latest_pl = pl_rows[-1] if pl_rows else {}
    restatement_checks = model.get("restatementChecks") or []
    return ComputationsResponse(
        period_count=len(get_financial_periods(payload)),
        pl_period_count=len(pl_rows),
        latest_period_label=model.get("latestPeriodLabel") or "",
        display_unit=model.get("displayUnit") or "",
        latest_revenue=latest_pl.get("revenueFromOperations") or "",
        latest_profit_after_tax=latest_pl.get("profitAfterTax") or "",
        latest_ebitda=latest_pl.get("ebitda") or "",
        reconciled_checks_count=len(
            [c for c in model.get("reconciliation") or [] if c["status"] == "reconciled"]
        ),
        variance_checks_count=len(
            [c for c in model.get("reconciliation") or [] if c["status"] == "variance"]
        ),
        missing_information_checks_count=len(
            [c for c in model.get("reconciliation") or [] if c["status"] == "missing_information"]
        ),
        period_comparison_warnings_count=len(model.get("periodComparisonWarnings") or []),
        restatement_checks_count=len(restatement_checks),
        restatement_checks_reconciled_count=sum(
            1 for check in restatement_checks if check.get("reconciles")
        ),
        sme_eligibility_count=len(model.get("smeEligibility") or []),
        kpi_count=len(
            (payload.get("kpiSelectionGovernanceAndPeerComparison") or {}).get("kpiRegister") or []
        ),
        pl_line_count=len(
            (payload.get("restatedStatementOfProfitAndLoss") or {}).get("plLineValues") or []
        ),
    )


def _build_workspace_response(
    db: Session,
    workspace: FinancialsKpisWorkspace,
) -> FinancialsKpisWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
    payload = workspace.payload
    linked_dict = _linked_dict(linked_references)
    return FinancialsKpisWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, linked_dict, ipo_reference),
        ipo_setup_reference=linked_references.ipo_setup,
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> FinancialsKpisWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = FinancialsKpisWorkspace(
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
            code=FinancialsKpisErrorCode.WORKSPACE_NOT_FOUND,
            message="Financials & KPIs workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> FinancialsKpisWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=FinancialsKpisErrorCode.WORKSPACE_NOT_FOUND,
            message="Financials & KPIs workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> FinancialsKpisWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=FinancialsKpisErrorCode.WORKSPACE_NOT_FOUND,
            message="Financials & KPIs workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session, workspace: FinancialsKpisWorkspace, expected_version: int
) -> None:
    if workspace.version != expected_version:
        linked_references = get_linked_references(db, workspace.user_id)
        ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
        linked_dict = _linked_dict(linked_references)
        raise AppException(
            status_code=409,
            code=FinancialsKpisErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_progress(workspace.payload),
                "computations": _build_computations(
                    workspace.payload, linked_dict, ipo_reference
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
            code=FinancialsKpisErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Financials & KPIs section: {section_id}",
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
            code=FinancialsKpisErrorCode.VALIDATION_FAILED,
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
    ipo_reference = get_ipo_setup_reference(db, user.id)
    linked_dict = _linked_dict(linked_references)
    notification = create_financials_kpis_save_notification(
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
        computations=_build_computations(workspace.payload, linked_dict, ipo_reference),
        acknowledgement=SaveAcknowledgementResponse(
            message=FINANCIALS_KPIS_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    summary = build_overview_summary(workspace.payload, _linked_dict(linked_references))
    summary["lastUpdatedAt"] = workspace.last_saved_at
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> FinancialAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    assessment = assess_financials_kpis(workspace.payload, _linked_dict(linked_references))
    return FinancialAssessmentResponse.model_validate(assessment)
