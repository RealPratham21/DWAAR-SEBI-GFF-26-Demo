import uuid
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.user import User
from app.modules.company_incorporation.constants import CompanyIncorporationErrorCode
from app.modules.company_incorporation.defaults import SCHEMA_VERSION, empty_payload
from app.modules.company_incorporation.prefill import build_prefilled_payload
from app.modules.company_incorporation.progress import calculate_progress
from app.modules.company_incorporation.schemas import (
    CompanyIncorporationWorkspaceResponse,
    InitializeWorkspaceResponse,
    SectionSaveResponse,
    WorkspaceProgressResponse,
)
from app.modules.company_incorporation.validation import (
    ValidationError,
    validate_confirmations_draft,
    validate_constitutional_documents_draft,
    validate_corporate_events_draft,
    validate_identity_draft,
    validate_offices_draft,
    validate_registrations_draft,
)
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.notifications.constants import WORKSTREAM_SAVE_MESSAGE
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_workstream_save_notification,
    to_notification_response,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def get_workspace_for_user(db: Session, user_id: uuid.UUID) -> CompanyIncorporationWorkspace | None:
    return db.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user_id,
        ),
    )


def _build_progress(payload: dict[str, Any]) -> WorkspaceProgressResponse:
    progress = calculate_progress(payload)
    return WorkspaceProgressResponse.model_validate(progress)


def _build_workspace_response(
    workspace: CompanyIncorporationWorkspace,
) -> CompanyIncorporationWorkspaceResponse:
    return CompanyIncorporationWorkspaceResponse(
        id=str(workspace.id),
        version=workspace.version,
        schema_version=workspace.schema_version,
        initialized_from_onboarding=workspace.initialized_from_onboarding,
        initialized_at=workspace.initialized_at,
        last_saved_at=workspace.last_saved_at,
        payload=workspace.payload,
        progress=_build_progress(workspace.payload),
    )


def initialize_or_get_workspace(db: Session, user: User) -> InitializeWorkspaceResponse:
    existing = get_workspace_for_user(db, user.id)
    if existing is not None:
        return InitializeWorkspaceResponse(
            **_build_workspace_response(existing).model_dump(),
            created=False,
        )

    application = get_submitted_sme_application(db, user.id)
    payload = build_prefilled_payload(dict(application.draft_data or {}))
    now = _now()
    workspace = CompanyIncorporationWorkspace(
        user_id=user.id,
        source_onboarding_application_id=application.id,
        payload=payload,
        schema_version=SCHEMA_VERSION,
        initialized_from_onboarding=True,
        initialized_at=now,
        version=1,
        last_saved_at=now,
    )
    db.add(workspace)
    db.flush()
    db.refresh(workspace)
    return InitializeWorkspaceResponse(
        **_build_workspace_response(workspace).model_dump(),
        created=True,
    )


def get_workspace(db: Session, user: User) -> CompanyIncorporationWorkspaceResponse:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=CompanyIncorporationErrorCode.WORKSPACE_NOT_FOUND,
            message="Company & Incorporation workspace has not been initialized.",
        )
    return _build_workspace_response(workspace)


def _require_workspace(db: Session, user: User) -> CompanyIncorporationWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=CompanyIncorporationErrorCode.WORKSPACE_NOT_FOUND,
            message="Company & Incorporation workspace has not been initialized.",
        )
    return workspace


def _assert_version(workspace: CompanyIncorporationWorkspace, expected_version: int) -> None:
    if workspace.version != expected_version:
        raise AppException(
            status_code=409,
            code=CompanyIncorporationErrorCode.WORKSPACE_VERSION_CONFLICT,
            message="The workspace was updated elsewhere. Refresh and try again.",
            details={
                "currentVersion": workspace.version,
                "payload": workspace.payload,
                "progress": calculate_progress(workspace.payload),
            },
        )


def _save_payload(
    db: Session,
    workspace: CompanyIncorporationWorkspace,
    user: User,
    *,
    section_id: str,
    expected_version: int,
    payload: dict[str, Any],
    saved_section: dict[str, Any],
) -> SectionSaveResponse:
    _assert_version(workspace, expected_version)
    now = _now()
    workspace.payload = payload
    workspace.version = expected_version + 1
    workspace.last_saved_at = now
    db.flush()
    db.refresh(workspace)
    notification = create_workstream_save_notification(
        db,
        user=user,
        section_id=section_id,
        saved_at=now,
    )
    progress = _build_progress(workspace.payload)
    return SectionSaveResponse(
        version=workspace.version,
        last_saved_at=now,
        saved_section=saved_section,
        progress=progress,
        payload=workspace.payload,
        acknowledgement=SaveAcknowledgementResponse(
            message=WORKSTREAM_SAVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def _merge_identity_special_type(identity: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(identity)
    special = str(merged.get("specialCompanyType", "")).strip()
    merged["specialCompanyType"] = special if special else "none"
    return merged


def save_legal_identity(
    db: Session,
    user: User,
    *,
    expected_version: int,
    identity: dict[str, Any],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    normalized = _merge_identity_special_type(identity)
    try:
        validate_identity_draft(normalized)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Legal identity contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["identity"] = normalized
    return _save_payload(
        db,
        workspace,
        user,
        section_id="legal-identity",
        expected_version=expected_version,
        payload=payload,
        saved_section={"identity": normalized},
    )


def save_corporate_history(
    db: Session,
    user: User,
    *,
    expected_version: int,
    corporate_events: list[dict[str, Any]],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    try:
        validate_corporate_events_draft(corporate_events)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Corporate history contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["corporateEvents"] = corporate_events
    return _save_payload(
        db,
        workspace,
        user,
        section_id="corporate-history",
        expected_version=expected_version,
        payload=payload,
        saved_section={"corporateEvents": corporate_events},
    )


def save_offices_contact(
    db: Session,
    user: User,
    *,
    expected_version: int,
    offices: list[dict[str, Any]],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    try:
        validate_offices_draft(offices)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Offices & contact information contains invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["offices"] = offices
    return _save_payload(
        db,
        workspace,
        user,
        section_id="offices-contact",
        expected_version=expected_version,
        payload=payload,
        saved_section={"offices": offices},
    )


def save_constitutional_documents(
    db: Session,
    user: User,
    *,
    expected_version: int,
    constitutional_record: dict[str, Any],
    constitutional_amendments: list[dict[str, Any]],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    try:
        validate_constitutional_documents_draft(constitutional_record, constitutional_amendments)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Constitutional documents contain invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["constitutionalRecord"] = constitutional_record
    payload["constitutionalAmendments"] = constitutional_amendments
    return _save_payload(
        db,
        workspace,
        user,
        section_id="constitutional-documents",
        expected_version=expected_version,
        payload=payload,
        saved_section={
            "constitutionalRecord": constitutional_record,
            "constitutionalAmendments": constitutional_amendments,
        },
    )


def save_core_registrations(
    db: Session,
    user: User,
    *,
    expected_version: int,
    registrations: list[dict[str, Any]],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    normalized = []
    for registration in registrations:
        item = deepcopy(registration)
        number = str(item.get("registrationNumber", "")).strip().upper()
        item["registrationNumber"] = number
        normalized.append(item)
    try:
        validate_registrations_draft(normalized)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Core registrations contain invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["registrations"] = normalized
    return _save_payload(
        db,
        workspace,
        user,
        section_id="core-registrations",
        expected_version=expected_version,
        payload=payload,
        saved_section={"registrations": normalized},
    )


def save_issuer_confirmations(
    db: Session,
    user: User,
    *,
    expected_version: int,
    confirmations: dict[str, Any],
) -> SectionSaveResponse:
    workspace = _require_workspace(db, user)
    try:
        validate_confirmations_draft(confirmations)
    except ValidationError as exc:
        raise AppException(
            status_code=422,
            code=CompanyIncorporationErrorCode.VALIDATION_FAILED,
            message="Issuer confirmations contain invalid values.",
            details={"fieldErrors": exc.field_errors},
        ) from exc
    payload = deepcopy(workspace.payload)
    payload["confirmations"] = confirmations
    return _save_payload(
        db,
        workspace,
        user,
        section_id="issuer-confirmations",
        expected_version=expected_version,
        payload=payload,
        saved_section={"confirmations": confirmations},
    )


def empty_workspace_progress() -> dict[str, Any]:
    return calculate_progress(empty_payload())
