import uuid
from datetime import UTC, datetime
from pathlib import PurePath

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AppException
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.onboarding_application import OnboardingApplication
from app.models.user import User
from app.modules.company_incorporation.documents.constants import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    CURRENT_VERSION_STATUSES,
    DISCARDABLE_VERSION_STATUSES,
    DOCUMENT_ARCHIVE_MESSAGE,
    DOCUMENT_REPLACE_MESSAGE,
    DOCUMENT_UPLOAD_MESSAGE,
    MAX_FILE_SIZE_BYTES,
    ONBOARDING_SELECTION_HINT,
    SHA256_PATTERN,
    DocumentErrorCode,
    DocumentVersionStatus,
    build_storage_key,
)
from app.modules.company_incorporation.documents.requirements_config import (
    DOCUMENT_REQUIREMENT_GROUPS,
    ONBOARDING_TO_REQUIREMENT_KEY,
    REQUIREMENT_DEFINITIONS,
)
from app.modules.company_incorporation.documents.schemas import (
    ArchiveDocumentResponse,
    DiscardUploadResponse,
    DocumentRequirementGroupResponse,
    DocumentRequirementStateResponse,
    DocumentsListResponse,
    DocumentVersionSummaryResponse,
    DownloadUrlResponse,
    FinalizeUploadResponse,
    InitiateUploadRequest,
    InitiateUploadResponse,
    OnboardingSelectionHintResponse,
    StorageSummaryResponse,
    StoredDocumentResponse,
    VersionHistoryResponse,
)
from app.modules.company_incorporation.service import get_workspace_for_user
from app.modules.notifications.schemas import SaveAcknowledgementResponse
from app.modules.notifications.service import (
    create_document_archive_notification,
    create_document_replace_notification,
    create_document_upload_notification,
    to_notification_response,
)
from app.storage import ObjectStorageError, get_object_storage


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _require_workspace(db: Session, user: User) -> CompanyIncorporationWorkspace:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=DocumentErrorCode.WORKSPACE_NOT_FOUND,
            message="Company & Incorporation workspace has not been initialized.",
        )
    return workspace


def _get_requirement_definition(requirement_key: str):
    definition = REQUIREMENT_DEFINITIONS.get(requirement_key)
    if definition is None:
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.REQUIREMENT_NOT_FOUND,
            message="Unsupported document requirement.",
            details={"requirementKey": requirement_key},
        )
    return definition


def _validate_upload_request(body: InitiateUploadRequest) -> None:
    if body.content_type not in ALLOWED_CONTENT_TYPES:
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.INVALID_FILE_TYPE,
            message="Only PDF, PNG, and JPEG files are allowed.",
        )
    extension = PurePath(body.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.INVALID_FILE_TYPE,
            message="Only PDF, PNG, and JPEG files are allowed.",
        )
    if body.size_bytes > MAX_FILE_SIZE_BYTES:
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.INVALID_FILE_SIZE,
            message="Files must be 20 MB or smaller.",
        )
    checksum = body.checksum_sha256.lower()
    if not SHA256_PATTERN.match(checksum):
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.INVALID_CHECKSUM,
            message="Checksum must be a valid SHA-256 hash.",
        )


def _load_onboarding_selections(
    db: Session, workspace: CompanyIncorporationWorkspace
) -> dict[str, dict]:
    application = db.get(OnboardingApplication, workspace.source_onboarding_application_id)
    if application is None:
        return {}
    draft_data = application.draft_data or {}
    initial_documents = draft_data.get("initialDocuments") or {}
    selections = initial_documents.get("selections") or {}
    mapped: dict[str, dict] = {}
    for onboarding_id, requirement_key in ONBOARDING_TO_REQUIREMENT_KEY.items():
        selection = selections.get(onboarding_id)
        if isinstance(selection, dict) and selection.get("fileName"):
            mapped[requirement_key] = selection
    return mapped


def _current_version_for_document(document: Document) -> DocumentVersion | None:
    active_versions = [
        version for version in document.versions if version.status in CURRENT_VERSION_STATUSES
    ]
    if not active_versions:
        return None
    return max(active_versions, key=lambda item: item.version_number)


def _version_summary(
    version: DocumentVersion, *, is_current: bool
) -> DocumentVersionSummaryResponse:
    return DocumentVersionSummaryResponse(
        id=str(version.id),
        version_number=version.version_number,
        original_filename=version.original_filename,
        content_type=version.content_type,
        size_bytes=version.size_bytes,
        checksum_sha256=version.checksum_sha256,
        status=version.status,
        uploaded_at=version.uploaded_at,
        is_current=is_current,
    )


def _stored_document_response(document: Document) -> StoredDocumentResponse:
    current = _current_version_for_document(document)
    return StoredDocumentResponse(
        id=str(document.id),
        requirement_key=document.requirement_key,
        archived_at=document.archived_at,
        current_version=_version_summary(current, is_current=True) if current else None,
    )


def _active_documents_for_requirement(
    documents: list[Document],
    requirement_key: str,
) -> list[Document]:
    return [
        document
        for document in documents
        if document.requirement_key == requirement_key and document.archived_at is None
    ]


def list_documents(db: Session, user: User) -> DocumentsListResponse:
    workspace = _require_workspace(db, user)
    documents = db.scalars(
        select(Document)
        .where(Document.company_incorporation_workspace_id == workspace.id)
        .options(selectinload(Document.versions))
        .order_by(Document.created_at.asc()),
    ).all()
    onboarding_selections = _load_onboarding_selections(db, workspace)

    groups: list[DocumentRequirementGroupResponse] = []
    for group_id, group_title, requirements in DOCUMENT_REQUIREMENT_GROUPS:
        requirement_states: list[DocumentRequirementStateResponse] = []
        for key, name, level, explanation in requirements:
            definition = REQUIREMENT_DEFINITIONS[key]
            active_docs = _active_documents_for_requirement(documents, key)
            onboarding_selection = onboarding_selections.get(key)
            onboarding_hint = None
            if onboarding_selection and not active_docs:
                onboarding_hint = OnboardingSelectionHintResponse(
                    file_name=str(onboarding_selection.get("fileName", "")),
                    file_size=int(onboarding_selection.get("fileSize") or 0),
                    mime_type=str(onboarding_selection.get("mimeType") or ""),
                    message=ONBOARDING_SELECTION_HINT,
                )
            requirement_states.append(
                DocumentRequirementStateResponse(
                    key=key,
                    name=name,
                    requirement_level=level,
                    explanation=explanation,
                    allow_multiple=definition.allow_multiple,
                    onboarding_hint=onboarding_hint,
                    documents=[_stored_document_response(document) for document in active_docs],
                ),
            )
        groups.append(
            DocumentRequirementGroupResponse(
                id=group_id,
                title=group_title,
                requirements=requirement_states,
            ),
        )

    return DocumentsListResponse(
        groups=groups,
        storage_summary=StorageSummaryResponse(
            connected=True,
            private=True,
            description=(
                "Documents are stored in private object storage. "
                "Uploads are verified by the backend before they are marked as uploaded."
            ),
        ),
    )


def _get_owned_document(
    db: Session,
    workspace: CompanyIncorporationWorkspace,
    document_id: uuid.UUID,
) -> Document:
    document = db.scalar(
        select(Document)
        .where(
            Document.id == document_id,
            Document.company_incorporation_workspace_id == workspace.id,
        )
        .options(selectinload(Document.versions)),
    )
    if document is None:
        raise AppException(
            status_code=404,
            code=DocumentErrorCode.DOCUMENT_NOT_FOUND,
            message="Document not found.",
        )
    return document


def _get_owned_version(
    db: Session,
    workspace: CompanyIncorporationWorkspace,
    version_id: uuid.UUID,
) -> tuple[DocumentVersion, Document]:
    row = db.execute(
        select(DocumentVersion, Document)
        .join(Document, Document.id == DocumentVersion.document_id)
        .where(
            DocumentVersion.id == version_id,
            Document.company_incorporation_workspace_id == workspace.id,
        ),
    ).one_or_none()
    if row is None:
        raise AppException(
            status_code=404,
            code=DocumentErrorCode.VERSION_NOT_FOUND,
            message="Document version not found.",
        )
    version, document = row
    return version, document


def _next_version_number(db: Session, document_id: uuid.UUID) -> int:
    current_max = db.scalar(
        select(func.max(DocumentVersion.version_number)).where(
            DocumentVersion.document_id == document_id,
        ),
    )
    return int(current_max or 0) + 1


def initiate_upload(
    db: Session,
    user: User,
    body: InitiateUploadRequest,
) -> InitiateUploadResponse:
    workspace = _require_workspace(db, user)
    definition = _get_requirement_definition(body.requirement_key)
    _validate_upload_request(body)

    document: Document
    if body.document_id:
        document = _get_owned_document(db, workspace, uuid.UUID(body.document_id))
        if document.requirement_key != body.requirement_key:
            raise AppException(
                status_code=422,
                code=DocumentErrorCode.REQUIREMENT_NOT_FOUND,
                message="Document does not belong to the requested requirement.",
            )
        if document.archived_at is not None:
            raise AppException(
                status_code=409,
                code=DocumentErrorCode.DOCUMENT_ARCHIVED,
                message="Archived documents cannot be replaced. Upload a new document instead.",
            )
    else:
        if not definition.allow_multiple:
            existing = db.scalar(
                select(Document.id)
                .where(
                    Document.company_incorporation_workspace_id == workspace.id,
                    Document.requirement_key == body.requirement_key,
                    Document.archived_at.is_(None),
                )
                .limit(1),
            )
            if existing is not None:
                raise AppException(
                    status_code=409,
                    code=DocumentErrorCode.DOCUMENT_EXISTS_USE_REPLACE,
                    message=(
                        "This requirement already has an uploaded document. "
                        "Use replace instead."
                    ),
                )
        document = Document(
            company_incorporation_workspace_id=workspace.id,
            requirement_key=body.requirement_key,
            created_by_user_id=user.id,
        )
        db.add(document)
        db.flush()

    version_id = uuid.uuid4()
    version_number = _next_version_number(db, document.id)
    storage_key = build_storage_key(
        workspace_id=str(workspace.id),
        document_id=str(document.id),
        version_id=str(version_id),
    )
    version = DocumentVersion(
        id=version_id,
        document_id=document.id,
        version_number=version_number,
        original_filename=body.filename,
        content_type=body.content_type,
        size_bytes=body.size_bytes,
        checksum_sha256=body.checksum_sha256.lower(),
        storage_key=storage_key,
        status=DocumentVersionStatus.PENDING_UPLOAD,
        uploaded_by_user_id=user.id,
    )
    db.add(version)
    db.flush()

    storage = get_object_storage()
    try:
        upload_url, required_headers, expires_in = storage.generate_upload_url(
            storage_key=storage_key,
            content_type=body.content_type,
            content_length=body.size_bytes,
        )
    except Exception as exc:
        raise AppException(
            status_code=503,
            code=DocumentErrorCode.STORAGE_ERROR,
            message="Unable to prepare upload URL.",
        ) from exc

    return InitiateUploadResponse(
        document_id=str(document.id),
        version_id=str(version.id),
        upload_url=upload_url,
        required_headers=required_headers,
        expires_in_seconds=expires_in,
    )


def finalize_upload(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> FinalizeUploadResponse:
    workspace = _require_workspace(db, user)
    version, document = _get_owned_version(db, workspace, version_id)

    if version.status != DocumentVersionStatus.PENDING_UPLOAD:
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.UPLOAD_NOT_READY,
            message="This upload is not awaiting finalization.",
        )

    storage = get_object_storage()
    try:
        if not storage.object_exists(storage_key=version.storage_key):
            version.status = DocumentVersionStatus.UPLOAD_FAILED
            db.flush()
            raise AppException(
                status_code=422,
                code=DocumentErrorCode.UPLOAD_VALIDATION_FAILED,
                message="Uploaded file was not found in storage.",
            )
        metadata = storage.get_object_metadata(storage_key=version.storage_key)
    except ObjectStorageError as exc:
        version.status = DocumentVersionStatus.UPLOAD_FAILED
        db.flush()
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.UPLOAD_VALIDATION_FAILED,
            message=str(exc),
        ) from exc

    actual_size = int(metadata["content_length"])
    if actual_size != version.size_bytes:
        version.status = DocumentVersionStatus.UPLOAD_FAILED
        db.flush()
        raise AppException(
            status_code=422,
            code=DocumentErrorCode.UPLOAD_VALIDATION_FAILED,
            message="Uploaded file size does not match the expected size.",
        )

    now = _now()
    previous_uploaded = db.scalars(
        select(DocumentVersion).where(
            DocumentVersion.document_id == document.id,
            DocumentVersion.status == DocumentVersionStatus.UPLOADED,
        ),
    ).all()
    for previous in previous_uploaded:
        previous.status = DocumentVersionStatus.SUPERSEDED
        previous.updated_at = now

    version.status = DocumentVersionStatus.UPLOADED
    version.uploaded_at = now
    version.updated_at = now
    document.updated_at = now
    db.flush()
    db.refresh(document)
    db.refresh(version)

    requirement = _get_requirement_definition(document.requirement_key)
    is_replacement = version.version_number > 1
    if is_replacement:
        notification = create_document_replace_notification(
            db,
            user=user,
            requirement_name=requirement.name,
            saved_at=now,
        )
        acknowledgement_message = DOCUMENT_REPLACE_MESSAGE
    else:
        notification = create_document_upload_notification(
            db,
            user=user,
            requirement_name=requirement.name,
            saved_at=now,
        )
        acknowledgement_message = DOCUMENT_UPLOAD_MESSAGE

    return FinalizeUploadResponse(
        document=_stored_document_response(document),
        acknowledgement=SaveAcknowledgementResponse(
            message=acknowledgement_message,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def create_download_url(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> DownloadUrlResponse:
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)

    if version.status not in CURRENT_VERSION_STATUSES | {DocumentVersionStatus.SUPERSEDED}:
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.UPLOAD_NOT_READY,
            message="This version is not available for download.",
        )

    storage = get_object_storage()
    try:
        if not storage.object_exists(storage_key=version.storage_key):
            raise AppException(
                status_code=404,
                code=DocumentErrorCode.UPLOAD_VALIDATION_FAILED,
                message="Stored file was not found.",
            )
        download_url, expires_in = storage.generate_download_url(storage_key=version.storage_key)
    except ObjectStorageError as exc:
        raise AppException(
            status_code=503,
            code=DocumentErrorCode.STORAGE_ERROR,
            message="Unable to prepare download URL.",
        ) from exc

    return DownloadUrlResponse(
        download_url=download_url,
        expires_in_seconds=expires_in,
        original_filename=version.original_filename,
        content_type=version.content_type,
        size_bytes=version.size_bytes,
        version_number=version.version_number,
    )


def list_version_history(
    db: Session,
    user: User,
    document_id: uuid.UUID,
) -> VersionHistoryResponse:
    workspace = _require_workspace(db, user)
    document = _get_owned_document(db, workspace, document_id)
    current = _current_version_for_document(document)
    current_id = current.id if current else None
    versions = sorted(document.versions, key=lambda item: item.version_number, reverse=True)
    return VersionHistoryResponse(
        document_id=str(document.id),
        requirement_key=document.requirement_key,
        versions=[
            _version_summary(version, is_current=version.id == current_id)
            for version in versions
            if version.status
            not in {DocumentVersionStatus.PENDING_UPLOAD, DocumentVersionStatus.UPLOAD_FAILED}
        ],
    )


def archive_document(
    db: Session,
    user: User,
    document_id: uuid.UUID,
) -> ArchiveDocumentResponse:
    workspace = _require_workspace(db, user)
    document = _get_owned_document(db, workspace, document_id)
    if document.archived_at is not None:
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.DOCUMENT_ARCHIVED,
            message="Document is already archived.",
        )

    now = _now()
    document.archived_at = now
    document.updated_at = now
    db.flush()
    db.refresh(document)

    requirement = _get_requirement_definition(document.requirement_key)
    notification = create_document_archive_notification(
        db,
        user=user,
        requirement_name=requirement.name,
        saved_at=now,
    )

    return ArchiveDocumentResponse(
        document=_stored_document_response(document),
        acknowledgement=SaveAcknowledgementResponse(
            message=DOCUMENT_ARCHIVE_MESSAGE,
            saved_at=now,
        ),
        notification=to_notification_response(notification),
    )


def discard_upload(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> DiscardUploadResponse:
    workspace = _require_workspace(db, user)
    version, document = _get_owned_version(db, workspace, version_id)

    if version.status not in DISCARDABLE_VERSION_STATUSES:
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.VERSION_NOT_DISCARDABLE,
            message="Only pending or failed uploads can be discarded.",
        )

    storage = get_object_storage()
    try:
        if storage.object_exists(storage_key=version.storage_key):
            storage.delete_object(storage_key=version.storage_key)
    except ObjectStorageError:
        pass

    db.delete(version)
    db.flush()

    remaining_versions = db.scalar(
        select(func.count())
        .select_from(DocumentVersion)
        .where(DocumentVersion.document_id == document.id),
    )
    if not remaining_versions:
        db.delete(document)
        db.flush()

    return DiscardUploadResponse(discarded=True)
