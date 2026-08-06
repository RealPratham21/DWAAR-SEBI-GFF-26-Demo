"""Capital & Ownership workspace service — mirrors IPO Setup & Eligibility persistence."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.capital_ownership_workspace import CapitalOwnershipWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.user import User
from app.modules.capital_ownership.assessment import assess_capital_ownership
from app.modules.capital_ownership.compute import (
    compute_capital_ownership_model,
    ipo_setup_reference_from_payload,
)
from app.modules.capital_ownership.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    CapitalOwnershipErrorCode,
)
from app.modules.capital_ownership.defaults import clone_empty_payload
from app.modules.capital_ownership.overview import build_overview_summary
from app.modules.capital_ownership.progress import calculate_progress
from app.modules.capital_ownership.schemas import (
    CapitalAssessmentResponse,
    CapitalOwnershipWorkspaceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.capital_ownership.validation import VALIDATORS, ValidationError
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.notifications.constants import CAPITAL_OWNERSHIP_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_capital_ownership_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session, user_id: uuid.UUID
) -> CapitalOwnershipWorkspace | None:
    return db.scalar(
        select(CapitalOwnershipWorkspace).where(
            CapitalOwnershipWorkspace.user_id == user_id,
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
    """Read-only mirror of the IPO Setup & Eligibility payload. Never writes to it."""
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(
            IpoSetupEligibilityWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return ipo_setup_reference_from_payload(None)
    return ipo_setup_reference_from_payload(workspace.payload)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_progress(payload))


def _build_computations(payload: dict[str, Any], ipo_reference: dict[str, Any]) -> ComputationsResponse:
    model = compute_capital_ownership_model(payload, ipo_reference)
    return ComputationsResponse(
        current_equity_shares=model["totals"]["currentEquityShares"],
        paid_up_equity_capital_from_classes=model["totals"]["paidUpEquityCapitalFromClasses"],
        promoter_and_group_percentage=model["capTable"]["groups"]["promoterAndGroupPercentage"],
        public_percentage=model["capTable"]["groups"]["publicPercentage"],
        post_issue_shares=model["prePost"]["postIssueShares"],
        promoter_pre_issue_percentage=model["dilution"]["promoterPreIssuePercentage"],
        promoter_post_issue_percentage=model["dilution"]["promoterPostIssuePercentage"],
        promoter_dilution_percentage_points=model["dilution"]["promoterDilutionPercentagePoints"],
        offer_as_percentage_of_post_issue_capital=model["prePost"][
            "offerAsPercentageOfPostIssueCapital"
        ],
        total_shares_offered_for_sale=model["prePost"]["totalSharesOfferedForSale"],
        potential_dilution_from_convertibles=model["outstanding"]["potentialDilutionPercentage"],
        required_contribution_shares=model["lockIn"]["requiredContributionShares"],
        eligible_contribution_shares=model["lockIn"]["eligibleShares"],
        contribution_shortfall_shares=model["lockIn"]["shortfallShares"],
        total_encumbered_shares=model["lockIn"]["totalEncumberedShares"],
    )


def _build_workspace_response(
    db: Session,
    workspace: CapitalOwnershipWorkspace,
) -> CapitalOwnershipWorkspaceResponse:
    company_reference = get_company_reference(db, workspace.user_id)
    ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
    payload = workspace.payload
    return CapitalOwnershipWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, ipo_reference),
        company_reference=company_reference,
        ipo_setup_reference=IpoSetupReferenceResponse.model_validate(ipo_reference),
    )


def _insert_workspace(db: Session, user: User) -> CapitalOwnershipWorkspace | None:
    """Insert the workspace, returning None when a concurrent request won the race."""
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = CapitalOwnershipWorkspace(
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
        # Rolling back the savepoint already detaches the pending row.
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
        # A parallel initialise committed first; treat this call as a plain load.
        existing = get_workspace_for_user(db, user.id)

    if existing is None:
        raise AppException(
            status_code=404,
            code=CapitalOwnershipErrorCode.WORKSPACE_NOT_FOUND,
            message="Capital & Ownership workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> CapitalOwnershipWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=CapitalOwnershipErrorCode.WORKSPACE_NOT_FOUND,
            message="Capital & Ownership workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> CapitalOwnershipWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=CapitalOwnershipErrorCode.WORKSPACE_NOT_FOUND,
            message="Capital & Ownership workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session, workspace: CapitalOwnershipWorkspace, expected_version: int
) -> None:
    if workspace.version != expected_version:
        ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
        raise AppException(
            status_code=409,
            code=CapitalOwnershipErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_progress(workspace.payload),
                "computations": _build_computations(workspace.payload, ipo_reference).model_dump(
                    by_alias=True
                ),
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
            code=CapitalOwnershipErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Capital & Ownership section: {section_id}",
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
            code=CapitalOwnershipErrorCode.VALIDATION_FAILED,
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

    notification = create_capital_ownership_save_notification(
        db,
        user=user,
        section_id=section_id,
        saved_at=now,
    )
    ipo_reference = get_ipo_setup_reference(db, user.id)
    progress = _build_progress(workspace.payload)
    return SectionSaveResponse(
        version=workspace.version,
        last_saved_at=now,
        saved_section_id=section_id,
        saved_section={payload_key: section_data},
        progress=progress,
        payload=workspace.payload,
        computations=_build_computations(workspace.payload, ipo_reference),
        acknowledgement=SaveAcknowledgementResponse(
            message=CAPITAL_OWNERSHIP_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    company_reference = get_company_reference(db, user.id)
    ipo_reference = get_ipo_setup_reference(db, user.id)
    summary = build_overview_summary(
        workspace.payload,
        ipo_reference,
        company_reference.model_dump(by_alias=True),
    )
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> CapitalAssessmentResponse:
    workspace = _require_workspace(db, user)
    ipo_reference = get_ipo_setup_reference(db, user.id)
    assessment = assess_capital_ownership(workspace.payload, ipo_reference)
    return CapitalAssessmentResponse.model_validate(assessment)
