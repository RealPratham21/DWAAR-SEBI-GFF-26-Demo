"""Objects of the Issue workspace service — mirrors Business & Operations persistence."""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.user import User
from app.modules.capital_ownership.compute import ipo_setup_reference_from_payload
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.notifications.constants import OBJECTS_ISSUE_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_objects_issue_save_notification,
    to_notification_response,
)
from app.modules.objects_issue.assessment import assess_objects_of_issue
from app.modules.objects_issue.compute import compute_objects_of_issue_model
from app.modules.objects_issue.constants import (
    IPO_TO_OBJECTS_OFFER_TYPE,
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    ObjectsIssueErrorCode,
)
from app.modules.objects_issue.defaults import clone_empty_payload
from app.modules.objects_issue.overview import build_overview_summary
from app.modules.objects_issue.progress import calculate_progress
from app.modules.objects_issue.schemas import (
    CompanyReferenceResponse,
    ComputationsResponse,
    InitializeWorkspaceResponse,
    IpoSetupReferenceResponse,
    LinkedPlaceholderResponse,
    LinkedWorkstreamReferencesResponse,
    ObjectsAssessmentResponse,
    ObjectsIssueWorkspaceResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.objects_issue.validation import VALIDATORS, ValidationError

_EMPTY_LINKED_PLACEHOLDER = LinkedPlaceholderResponse(available=False)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(db: Session, user_id: uuid.UUID) -> ObjectsIssueWorkspace | None:
    return db.scalar(
        select(ObjectsIssueWorkspace).where(
            ObjectsIssueWorkspace.user_id == user_id,
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
    """Read-only mirror of IPO Setup & Eligibility with Objects-of-Issue offer-type mapping."""
    workspace = db.scalar(
        select(IpoSetupEligibilityWorkspace).where(
            IpoSetupEligibilityWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        reference = ipo_setup_reference_from_payload(None)
    else:
        reference = ipo_setup_reference_from_payload(workspace.payload)

    ipo_offer_type = reference.get("proposedOfferType") or ""
    mapped_offer_type = IPO_TO_OBJECTS_OFFER_TYPE.get(ipo_offer_type, ipo_offer_type)
    reference["proposedOfferType"] = mapped_offer_type
    return reference


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    """Read-only mirrors of other workstreams. Objects of the Issue never writes back."""
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        business_operations=_EMPTY_LINKED_PLACEHOLDER,
        capital_ownership=_EMPTY_LINKED_PLACEHOLDER,
        borrowings=_EMPTY_LINKED_PLACEHOLDER,
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_progress(payload))


def _build_computations(
    payload: dict[str, Any], ipo_reference: dict[str, Any]
) -> ComputationsResponse:
    model = compute_objects_of_issue_model(payload, ipo_reference)
    reconciliation = model["reconciliation"]
    return ComputationsResponse(
        is_pure_ofs=model["isPureOfs"],
        net_fresh_issue_proceeds=model["netFreshIssueProceeds"],
        total_estimated_objects_cost=model["totalEstimatedObjectsCost"],
        total_allocated_from_net_proceeds=model["totalAllocatedFromNetProceeds"],
        total_allocated_from_all_sources=model["totalAllocatedFromAllSources"],
        unallocated_net_proceeds=model["unallocatedNetProceeds"],
        allocation_reconciles=model["allocationReconciles"],
        total_means_of_finance=model["totalMeansOfFinance"],
        total_deployment_scheduled=model["totalDeploymentScheduled"],
        means_of_finance_reconciles=model["meansOfFinanceReconciles"],
        total_issue_expenses=model["totalIssueExpenses"],
        gcp_percentage_of_fresh_issue=model["gcpPercentageOfFreshIssue"],
        gcp_applicable_cap=model["gcpApplicableCap"],
        gcp_within_limit=model["gcpWithinLimit"],
        objects_count=model["counts"]["objects"],
        capex_items_count=model["counts"]["capexItems"],
        borrowing_repayment_items_count=model["counts"]["borrowingRepaymentItems"],
        investment_items_count=model["counts"]["investmentItems"],
        reconciled_checks_count=len([c for c in reconciliation if c["status"] == "reconciled"]),
        variance_checks_count=len([c for c in reconciliation if c["status"] == "variance"]),
        pending_checks_count=len([c for c in reconciliation if c["status"] == "pending"]),
    )


def _build_workspace_response(
    db: Session,
    workspace: ObjectsIssueWorkspace,
) -> ObjectsIssueWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
    payload = workspace.payload
    return ObjectsIssueWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload, ipo_reference),
        ipo_setup_reference=IpoSetupReferenceResponse.model_validate(ipo_reference),
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> ObjectsIssueWorkspace | None:
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = ObjectsIssueWorkspace(
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
            code=ObjectsIssueErrorCode.WORKSPACE_NOT_FOUND,
            message="Objects of the Issue workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> ObjectsIssueWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=ObjectsIssueErrorCode.WORKSPACE_NOT_FOUND,
            message="Objects of the Issue workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> ObjectsIssueWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=ObjectsIssueErrorCode.WORKSPACE_NOT_FOUND,
            message="Objects of the Issue workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session, workspace: ObjectsIssueWorkspace, expected_version: int
) -> None:
    if workspace.version != expected_version:
        ipo_reference = get_ipo_setup_reference(db, workspace.user_id)
        raise AppException(
            status_code=409,
            code=ObjectsIssueErrorCode.WORKSPACE_VERSION_CONFLICT,
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
            code=ObjectsIssueErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Objects of the Issue section: {section_id}",
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
            code=ObjectsIssueErrorCode.VALIDATION_FAILED,
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

    ipo_reference = get_ipo_setup_reference(db, user.id)
    notification = create_objects_issue_save_notification(
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
        computations=_build_computations(workspace.payload, ipo_reference),
        acknowledgement=SaveAcknowledgementResponse(
            message=OBJECTS_ISSUE_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    ipo_reference = get_ipo_setup_reference(db, user.id)
    summary = build_overview_summary(
        workspace.payload,
        ipo_reference,
        _linked_dict(linked_references),
    )
    summary["lastUpdatedAt"] = workspace.last_saved_at
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> ObjectsAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    ipo_reference = get_ipo_setup_reference(db, user.id)
    assessment = assess_objects_of_issue(
        workspace.payload,
        ipo_reference,
        _linked_dict(linked_references),
    )
    return ObjectsAssessmentResponse.model_validate(assessment)
