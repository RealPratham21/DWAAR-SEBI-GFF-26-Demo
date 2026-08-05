"""IPO Setup & Eligibility workspace service."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.user import User
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.ipo_setup_eligibility.assessment import assess_ipo_eligibility
from app.modules.ipo_setup_eligibility.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    IpoSetupErrorCode,
)
from app.modules.ipo_setup_eligibility.defaults import clone_empty_payload
from app.modules.ipo_setup_eligibility.offer_compute import offer_computations_for_api
from app.modules.ipo_setup_eligibility.overview import build_overview_summary
from app.modules.ipo_setup_eligibility.progress import calculate_progress
from app.modules.ipo_setup_eligibility.schemas import (
    CompanyReferenceResponse,
    EligibilityAssessmentResponse,
    InitializeWorkspaceResponse,
    IpoSetupWorkspaceResponse,
    OfferComputationsResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.ipo_setup_eligibility.validation import VALIDATORS, ValidationError
from app.modules.notifications.constants import IPO_SETUP_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_ipo_setup_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session, user_id: uuid.UUID
) -> IpoSetupEligibilityWorkspace | None:
    return db.scalar(
        select(IpoSetupEligibilityWorkspace).where(
            IpoSetupEligibilityWorkspace.user_id == user_id,
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


def _sync_referenced_company_class(
    payload: dict[str, Any],
    company_reference: CompanyReferenceResponse,
) -> dict[str, Any]:
    """Mirror C&I class into payload display field without making IPO authoritative."""
    next_payload = deepcopy(payload)
    direction = dict(next_payload.get("ipoDirection") or {})
    direction["referencedCompanyClass"] = company_reference.company_class or ""
    next_payload["ipoDirection"] = direction
    return next_payload


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_progress(payload))


def _build_offer(payload: dict[str, Any]) -> OfferComputationsResponse:
    return OfferComputationsResponse.model_validate(offer_computations_for_api(payload))


def _build_workspace_response(
    db: Session,
    workspace: IpoSetupEligibilityWorkspace,
) -> IpoSetupWorkspaceResponse:
    company_reference = get_company_reference(db, workspace.user_id)
    payload = _sync_referenced_company_class(workspace.payload, company_reference)
    return IpoSetupWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        offer_computations=_build_offer(payload),
        company_reference=company_reference,
    )


def initialize_or_get_workspace(db: Session, user: User) -> InitializeWorkspaceResponse:
    existing = get_workspace_for_user(db, user.id)
    if existing is not None:
        base = _build_workspace_response(db, existing)
        return InitializeWorkspaceResponse(**base.model_dump(), created=False)

    application = get_submitted_sme_application(db, user.id)
    company_reference = get_company_reference(db, user.id)
    payload = _sync_referenced_company_class(clone_empty_payload(), company_reference)
    now = _now()
    workspace = IpoSetupEligibilityWorkspace(
        user_id=user.id,
        source_onboarding_application_id=application.id,
        payload=payload,
        schema_version=payload["schemaVersion"],
        version=1,
        last_saved_at=now,
    )
    db.add(workspace)
    db.flush()
    db.refresh(workspace)
    base = _build_workspace_response(db, workspace)
    return InitializeWorkspaceResponse(**base.model_dump(), created=True)


def get_workspace(db: Session, user: User) -> IpoSetupWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IpoSetupErrorCode.WORKSPACE_NOT_FOUND,
            message="IPO Setup & Eligibility workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> IpoSetupEligibilityWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=IpoSetupErrorCode.WORKSPACE_NOT_FOUND,
            message="IPO Setup & Eligibility workspace has not been initialized.",
        )
    return workspace


def _assert_version(workspace: IpoSetupEligibilityWorkspace, expected_version: int) -> None:
    if workspace.version != expected_version:
        raise AppException(
            status_code=409,
            code=IpoSetupErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_progress(workspace.payload),
                "offerComputations": offer_computations_for_api(workspace.payload),
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
            code=IpoSetupErrorCode.UNKNOWN_SECTION,
            message=f"Unknown IPO Setup section: {section_id}",
        )

    workspace = _require_workspace(db, user)
    payload_key = SECTION_PAYLOAD_KEYS[section_id]
    next_payload = deepcopy(workspace.payload)

    section_data = deepcopy(data)
    if section_id == "ipo-direction":
        # Never accept client write-back of authoritative C&I class; refresh mirror.
        company_reference = get_company_reference(db, user.id)
        section_data["referencedCompanyClass"] = company_reference.company_class or ""

    validator = VALIDATORS[section_id]
    try:
        validator(section_data, next_payload)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=IpoSetupErrorCode.VALIDATION_FAILED,
            message=f"{section_id} contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc

    # Ensure track-record always keeps exactly three rows after validation.
    if section_id == "track-record-financial":
        years = section_data.get("financialYears") or []
        if len(years) != 3:
            raise AppException(
                status_code=422,
                code=IpoSetupErrorCode.VALIDATION_FAILED,
                message="Track record must include exactly three financial-year rows.",
                details={"fieldErrors": {"financialYears": "Exactly three financial-year rows are required."}},
            )

    next_payload[payload_key] = section_data
    _assert_version(workspace, expected_version)

    now = _now()
    workspace.payload = next_payload
    workspace.version = expected_version + 1
    workspace.last_saved_at = now
    db.flush()
    db.refresh(workspace)

    notification = create_ipo_setup_save_notification(
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
        offer_computations=_build_offer(workspace.payload),
        acknowledgement=SaveAcknowledgementResponse(
            message=IPO_SETUP_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    company_reference = get_company_reference(db, user.id)
    payload = _sync_referenced_company_class(workspace.payload, company_reference)
    summary = build_overview_summary(payload)
    summary["companyReference"] = company_reference.model_dump(by_alias=True)
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> EligibilityAssessmentResponse:
    workspace = _require_workspace(db, user)
    company_reference = get_company_reference(db, user.id)
    payload = _sync_referenced_company_class(workspace.payload, company_reference)
    assessment = assess_ipo_eligibility(payload)
    return EligibilityAssessmentResponse.model_validate(assessment)
