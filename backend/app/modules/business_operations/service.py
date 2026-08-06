"""Business & Operations workspace service — mirrors Capital & Ownership persistence."""

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
from app.models.user import User
from app.modules.business_operations.assessment import assess_business_operations
from app.modules.business_operations.compute import compute_business_operations_model
from app.modules.business_operations.constants import (
    SECTION_IDS,
    SECTION_PAYLOAD_KEYS,
    BusinessOperationsErrorCode,
)
from app.modules.business_operations.defaults import clone_empty_payload
from app.modules.business_operations.overview import build_overview_summary
from app.modules.business_operations.progress import calculate_progress
from app.modules.business_operations.schemas import (
    BusinessAssessmentResponse,
    BusinessOperationsWorkspaceResponse,
    CompanyReferenceResponse,
    ComputationsResponse,
    InitializeWorkspaceResponse,
    LinkedPlaceholderResponse,
    LinkedWorkstreamReferencesResponse,
    OverviewSummaryResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.business_operations.validation import VALIDATORS, ValidationError
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.notifications.constants import BUSINESS_OPERATIONS_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_business_operations_save_notification,
    to_notification_response,
)

_EMPTY_LINKED_PLACEHOLDER = LinkedPlaceholderResponse(available=False)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(
    db: Session, user_id: uuid.UUID
) -> BusinessOperationsWorkspace | None:
    return db.scalar(
        select(BusinessOperationsWorkspace).where(
            BusinessOperationsWorkspace.user_id == user_id,
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


def get_linked_references(db: Session, user_id: uuid.UUID) -> LinkedWorkstreamReferencesResponse:
    """Read-only mirrors of other workstreams. Business & Operations never writes back."""
    return LinkedWorkstreamReferencesResponse(
        company=get_company_reference(db, user_id),
        financials=_EMPTY_LINKED_PLACEHOLDER,
        industry=_EMPTY_LINKED_PLACEHOLDER,
        objects_of_the_issue=_EMPTY_LINKED_PLACEHOLDER,
        assets=_EMPTY_LINKED_PLACEHOLDER,
        compliance=_EMPTY_LINKED_PLACEHOLDER,
    )


def _linked_dict(linked: LinkedWorkstreamReferencesResponse) -> dict[str, Any]:
    return linked.model_dump(by_alias=True)


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    return WorkspaceProgressResponse.model_validate(calculate_progress(payload))


def _build_computations(payload: dict[str, Any]) -> ComputationsResponse:
    model = compute_business_operations_model(payload)
    current_customer = next(
        (row for row in model["customerConcentration"] if row["isCurrentPeriod"]), None
    )
    current_supplier = next(
        (row for row in model["supplierConcentration"] if row["isCurrentPeriod"]), None
    )
    current_utilisation = next(
        (row for row in model["capacityUtilisation"] if row["isCurrentPeriod"]), None
    )
    return ComputationsResponse(
        products_count=model["counts"]["products"],
        facilities_count=model["counts"]["facilities"],
        employees_total=(model["workforceLatest"] or {}).get("totalHeadcount", ""),
        largest_segment_label=(model["largestSegment"] or {}).get("label", ""),
        largest_segment_percentage=(model["largestSegment"] or {}).get("percentage", ""),
        product_concentration=model["productConcentration"]["largestProductPercentage"],
        revenue_percentages_reconcile=model["revenuePercentagesReconcile"],
        customer_concentration_largest=(
            (current_customer or {}).get("largestPercentage")
            or (model["customerConcentration"][0]["largestPercentage"] if model["customerConcentration"] else "")
            or ""
        ),
        supplier_concentration_largest=(
            (current_supplier or {}).get("largestPercentage")
            or (model["supplierConcentration"][0]["largestPercentage"] if model["supplierConcentration"] else "")
            or ""
        ),
        capacity_utilisation_latest=(
            (current_utilisation or {}).get("utilisationPercentage")
            or (model["capacityUtilisation"][0]["utilisationPercentage"] if model["capacityUtilisation"] else "")
            or ""
        ),
        dependencies_count=model["counts"]["dependencies"],
        certifications_count=model["counts"]["certifications"],
        ip_records_count=model["counts"]["ipRecords"],
        reconciled_checks_count=len(
            [c for c in model["reconciliation"] if c["status"] == "reconciled"]
        ),
        variance_checks_count=len(
            [c for c in model["reconciliation"] if c["status"] == "variance"]
        ),
        missing_information_checks_count=len(
            [c for c in model["reconciliation"] if c["status"] == "missing_information"]
        ),
    )


def _build_workspace_response(
    db: Session,
    workspace: BusinessOperationsWorkspace,
) -> BusinessOperationsWorkspaceResponse:
    linked_references = get_linked_references(db, workspace.user_id)
    payload = workspace.payload
    return BusinessOperationsWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        last_saved_at=workspace.last_saved_at,
        payload=payload,
        progress=_build_progress(payload),
        computations=_build_computations(payload),
        company_reference=linked_references.company,
        linked_references=linked_references,
    )


def _insert_workspace(db: Session, user: User) -> BusinessOperationsWorkspace | None:
    """Insert the workspace, returning None when a concurrent request won the race."""
    application = get_submitted_sme_application(db, user.id)
    payload = clone_empty_payload()
    now = _now()
    workspace = BusinessOperationsWorkspace(
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
            code=BusinessOperationsErrorCode.WORKSPACE_NOT_FOUND,
            message="Business & Operations workspace could not be initialized.",
        )

    base = _build_workspace_response(db, existing)
    return InitializeWorkspaceResponse(**base.model_dump(), created=False)


def get_workspace(db: Session, user: User) -> BusinessOperationsWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=BusinessOperationsErrorCode.WORKSPACE_NOT_FOUND,
            message="Business & Operations workspace has not been initialized.",
        )
    return _build_workspace_response(db, workspace)


def _require_workspace(db: Session, user: User) -> BusinessOperationsWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=BusinessOperationsErrorCode.WORKSPACE_NOT_FOUND,
            message="Business & Operations workspace has not been initialized.",
        )
    return workspace


def _assert_version(
    db: Session, workspace: BusinessOperationsWorkspace, expected_version: int
) -> None:
    if workspace.version != expected_version:
        raise AppException(
            status_code=409,
            code=BusinessOperationsErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_progress(workspace.payload),
                "computations": _build_computations(workspace.payload).model_dump(by_alias=True),
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
            code=BusinessOperationsErrorCode.UNKNOWN_SECTION,
            message=f"Unknown Business & Operations section: {section_id}",
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
            code=BusinessOperationsErrorCode.VALIDATION_FAILED,
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

    notification = create_business_operations_save_notification(
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
        computations=_build_computations(workspace.payload),
        acknowledgement=SaveAcknowledgementResponse(
            message=BUSINESS_OPERATIONS_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def get_overview(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    summary = build_overview_summary(
        workspace.payload,
        linked=_linked_dict(linked_references),
        company_reference=linked_references.company.model_dump(by_alias=True),
    )
    summary["lastUpdatedAt"] = workspace.last_saved_at
    return OverviewSummaryResponse.model_validate(summary)


def get_assessment(db: Session, user: User) -> BusinessAssessmentResponse:
    workspace = _require_workspace(db, user)
    linked_references = get_linked_references(db, user.id)
    assessment = assess_business_operations(workspace.payload, _linked_dict(linked_references))
    return BusinessAssessmentResponse.model_validate(assessment)
