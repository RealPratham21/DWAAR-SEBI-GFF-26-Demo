"""Generic Data Room document storage service (G6)."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from pathlib import PurePath

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AppException
from app.models.data_room_stored_document import DataRoomStoredDocument
from app.models.data_room_stored_document_version import DataRoomStoredDocumentVersion
from app.models.user import User
from app.modules.data_room.constants import (
    DOC_STATUS_ARCHIVED,
    DOC_STATUS_UPLOADED,
    GENERIC_ALLOWED_CONTENT_TYPES,
    GENERIC_ALLOWED_EXTENSIONS,
    MAX_GENERIC_FILE_SIZE_BYTES,
    ORIGIN_DATA_ROOM,
    PROCESSING_STORED_ONLY,
)
from app.modules.data_room.global_ids import encode_dr_document_id
from app.modules.data_room.labels import workstream_url
from app.modules.data_room.requirements_registry import REQUIREMENT_REGISTRY
from app.modules.data_room.schemas import RawDataRoomDocument
from app.storage import ObjectStorageError, get_object_storage

SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")


class DataRoomErrorCode:
    DOCUMENT_NOT_FOUND = "DATA_ROOM_DOCUMENT_NOT_FOUND"
    VERSION_NOT_FOUND = "DATA_ROOM_VERSION_NOT_FOUND"
    INVALID_FILE_TYPE = "DATA_ROOM_INVALID_FILE_TYPE"
    INVALID_FILE_SIZE = "DATA_ROOM_INVALID_FILE_SIZE"
    INVALID_CHECKSUM = "DATA_ROOM_INVALID_CHECKSUM"
    REQUIREMENT_NOT_FOUND = "DATA_ROOM_REQUIREMENT_NOT_FOUND"
    UPLOAD_NOT_READY = "DATA_ROOM_UPLOAD_NOT_READY"
    STORAGE_ERROR = "DATA_ROOM_STORAGE_ERROR"
    FORBIDDEN = "DATA_ROOM_FORBIDDEN"


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _sanitize_filename(filename: str) -> str:
    name = PurePath(filename).name
    return re.sub(r"[^\w.\- ()]", "_", name)[:512]


def build_storage_key(*, user_id: uuid.UUID, document_id: uuid.UUID, version_id: uuid.UUID) -> str:
    return f"dr/{user_id}/{document_id}/{version_id}"


def _validate_upload(filename: str, content_type: str, size_bytes: int, checksum: str) -> None:
    if content_type not in GENERIC_ALLOWED_CONTENT_TYPES:
        raise AppException(422, DataRoomErrorCode.INVALID_FILE_TYPE, "Unsupported file type.")
    ext = PurePath(filename).suffix.lower()
    if ext not in GENERIC_ALLOWED_EXTENSIONS:
        raise AppException(422, DataRoomErrorCode.INVALID_FILE_TYPE, "Unsupported file extension.")
    if size_bytes > MAX_GENERIC_FILE_SIZE_BYTES:
        raise AppException(422, DataRoomErrorCode.INVALID_FILE_SIZE, "File exceeds size limit.")
    if not SHA256_PATTERN.match(checksum.lower()):
        raise AppException(422, DataRoomErrorCode.INVALID_CHECKSUM, "Invalid checksum.")


def _current_version(document: DataRoomStoredDocument) -> DataRoomStoredDocumentVersion | None:
    if not document.versions:
        return None
    active = [v for v in document.versions if v.status != "superseded"]
    if not active:
        return None
    return max(active, key=lambda item: item.version_number)


def load_generic_documents(db: Session, user: User) -> list[RawDataRoomDocument]:
    documents = db.scalars(
        select(DataRoomStoredDocument)
        .where(DataRoomStoredDocument.user_id == user.id)
        .options(selectinload(DataRoomStoredDocument.versions))
        .order_by(DataRoomStoredDocument.created_at.asc())
    ).all()

    items: list[RawDataRoomDocument] = []
    for document in documents:
        current = _current_version(document)
        if current is None:
            continue
        requirement = REQUIREMENT_REGISTRY.get(document.requirement_key or "")
        section = requirement.source_section_keys[0] if requirement and requirement.source_section_keys else ""
        status = DOC_STATUS_ARCHIVED if document.archived_at else DOC_STATUS_UPLOADED
        version_history = [
            {
                "versionNumber": version.version_number,
                "originalFilename": version.original_filename,
                "contentType": version.content_type,
                "sizeBytes": version.size_bytes,
                "status": version.status,
                "uploadedAt": version.uploaded_at.isoformat() if version.uploaded_at else None,
                "isCurrent": version.id == current.id,
            }
            for version in sorted(document.versions, key=lambda v: v.version_number, reverse=True)
        ]
        items.append(
            RawDataRoomDocument(
                global_document_id=encode_dr_document_id(document.id),
                origin_type=ORIGIN_DATA_ROOM,
                origin_document_id=str(document.id),
                title=document.title,
                filename=current.original_filename,
                category=document.category or (requirement.category if requirement else ""),
                mime_type=current.content_type,
                file_size=current.size_bytes,
                workstream_key=document.workstream_key,
                section_key=section,
                requirement_key=document.requirement_key,
                current_version=current.version_number,
                status=status,
                processing_capability=PROCESSING_STORED_ONLY,
                uploaded_at=current.uploaded_at,
                updated_at=document.updated_at,
                open_url=workstream_url(document.workstream_key, section_key=section or None),
                download_available=True,
                version_history=version_history,
                metadata={"note": document.note or ""},
            )
        )
    return items


def initiate_upload(
    db: Session,
    user: User,
    *,
    workstream_key: str,
    requirement_key: str | None,
    title: str,
    category: str,
    filename: str,
    content_type: str,
    size_bytes: int,
    checksum_sha256: str,
    note: str = "",
) -> tuple[DataRoomStoredDocument, DataRoomStoredDocumentVersion, str]:
    if workstream_key == "company-incorporation":
        raise AppException(
            422,
            DataRoomErrorCode.INVALID_FILE_TYPE,
            "Company & Incorporation uploads must use the C&I document pipeline.",
        )
    _validate_upload(filename, content_type, size_bytes, checksum_sha256)
    requirement = None
    if requirement_key:
        requirement = REQUIREMENT_REGISTRY.get(requirement_key)
        if requirement is None:
            raise AppException(404, DataRoomErrorCode.REQUIREMENT_NOT_FOUND, "Requirement not found.")
        if requirement.workstream_key != workstream_key:
            raise AppException(422, DataRoomErrorCode.REQUIREMENT_NOT_FOUND, "Requirement/workstream mismatch.")

    safe_filename = _sanitize_filename(filename)
    document = DataRoomStoredDocument(
        user_id=user.id,
        workstream_key=workstream_key,
        requirement_key=requirement_key,
        title=title.strip() or safe_filename,
        category=category.strip() or (requirement.category if requirement else "General"),
        status=DOC_STATUS_UPLOADED,
        note=note.strip() or None,
    )
    db.add(document)
    db.flush()

    version = DataRoomStoredDocumentVersion(
        document_id=document.id,
        version_number=1,
        original_filename=safe_filename,
        content_type=content_type,
        size_bytes=size_bytes,
        checksum_sha256=checksum_sha256.lower(),
        storage_key=build_storage_key(user_id=user.id, document_id=document.id, version_id=uuid.uuid4()),
        status="pending_upload",
        uploaded_by_user_id=user.id,
        note=note.strip() or None,
    )
    version.storage_key = build_storage_key(
        user_id=user.id,
        document_id=document.id,
        version_id=version.id,
    )
    db.add(version)
    db.flush()

    storage = get_object_storage()
    try:
        upload_url, _headers, _expires = storage.generate_upload_url(
            storage_key=version.storage_key,
            content_type=content_type,
            content_length=size_bytes,
        )
    except ObjectStorageError as exc:
        raise AppException(503, DataRoomErrorCode.STORAGE_ERROR, "Storage unavailable.") from exc

    db.commit()
    db.refresh(document)
    db.refresh(version)
    return document, version, upload_url


def initiate_new_version(
    db: Session,
    user: User,
    document_id: uuid.UUID,
    *,
    filename: str,
    content_type: str,
    size_bytes: int,
    checksum_sha256: str,
    note: str = "",
) -> tuple[DataRoomStoredDocumentVersion, str]:
    document = db.scalar(
        select(DataRoomStoredDocument)
        .where(DataRoomStoredDocument.id == document_id, DataRoomStoredDocument.user_id == user.id)
        .options(selectinload(DataRoomStoredDocument.versions))
    )
    if document is None or document.archived_at is not None:
        raise AppException(404, DataRoomErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")
    _validate_upload(filename, content_type, size_bytes, checksum_sha256)

    next_version = (
        db.scalar(
            select(func.max(DataRoomStoredDocumentVersion.version_number)).where(
                DataRoomStoredDocumentVersion.document_id == document.id
            )
        )
        or 0
    ) + 1

    version = DataRoomStoredDocumentVersion(
        document_id=document.id,
        version_number=next_version,
        original_filename=_sanitize_filename(filename),
        content_type=content_type,
        size_bytes=size_bytes,
        checksum_sha256=checksum_sha256.lower(),
        storage_key="pending",
        status="pending_upload",
        uploaded_by_user_id=user.id,
        note=note.strip() or None,
    )
    db.add(version)
    db.flush()
    version.storage_key = build_storage_key(
        user_id=user.id,
        document_id=document.id,
        version_id=version.id,
    )

    for old in document.versions:
        if old.id != version.id and old.status not in {"superseded", "pending_upload"}:
            old.status = "superseded"

    storage = get_object_storage()
    upload_url, _headers, _expires = storage.generate_upload_url(
        storage_key=version.storage_key,
        content_type=content_type,
        content_length=size_bytes,
    )
    db.commit()
    db.refresh(version)
    return version, upload_url


def finalize_upload(db: Session, user: User, version_id: uuid.UUID) -> DataRoomStoredDocumentVersion:
    version = db.scalar(
        select(DataRoomStoredDocumentVersion)
        .join(DataRoomStoredDocument)
        .where(
            DataRoomStoredDocumentVersion.id == version_id,
            DataRoomStoredDocument.user_id == user.id,
        )
    )
    if version is None:
        raise AppException(404, DataRoomErrorCode.VERSION_NOT_FOUND, "Version not found.")
    if version.status != "pending_upload":
        raise AppException(409, DataRoomErrorCode.UPLOAD_NOT_READY, "Upload already finalized.")

    storage = get_object_storage()
    try:
        if not storage.object_exists(storage_key=version.storage_key):
            raise AppException(422, DataRoomErrorCode.UPLOAD_NOT_READY, "Uploaded file not found.")
        metadata = storage.get_object_metadata(storage_key=version.storage_key)
    except ObjectStorageError as exc:
        raise AppException(422, DataRoomErrorCode.UPLOAD_NOT_READY, "Upload validation failed.") from exc

    if int(metadata["content_length"]) != version.size_bytes:
        raise AppException(422, DataRoomErrorCode.UPLOAD_NOT_READY, "Uploaded file size mismatch.")

    version.status = DOC_STATUS_UPLOADED
    version.uploaded_at = _now()
    document = db.get(DataRoomStoredDocument, version.document_id)
    if document:
        document.status = DOC_STATUS_UPLOADED
        document.updated_at = _now()
    db.commit()
    db.refresh(version)
    return version


def create_download_url(db: Session, user: User, global_document_id: str) -> str:
    from app.modules.data_room.global_ids import parse_global_document_id

    origin, doc_id = parse_global_document_id(global_document_id)
    if origin == ORIGIN_DATA_ROOM:
        document = db.scalar(
            select(DataRoomStoredDocument)
            .where(DataRoomStoredDocument.id == doc_id, DataRoomStoredDocument.user_id == user.id)
            .options(selectinload(DataRoomStoredDocument.versions))
        )
        if document is None:
            raise AppException(404, DataRoomErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")
        current = _current_version(document)
        if current is None:
            raise AppException(404, DataRoomErrorCode.VERSION_NOT_FOUND, "No downloadable version.")
        storage = get_object_storage()
        url, _expires = storage.generate_download_url(storage_key=current.storage_key)
        return url

    from app.modules.company_incorporation.documents.service import create_download_url as ci_download
    from app.modules.data_room.ci_adapter import _current_version as ci_current
    from app.models.document import Document
    from app.modules.company_incorporation.documents.service import get_workspace_for_user
    from sqlalchemy.orm import selectinload

    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        raise AppException(404, DataRoomErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")
    document = db.scalar(
        select(Document)
        .where(
            Document.id == doc_id,
            Document.company_incorporation_workspace_id == workspace.id,
        )
        .options(selectinload(Document.versions))
    )
    if document is None:
        raise AppException(404, DataRoomErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")
    current = ci_current(document)
    if current is None:
        raise AppException(404, DataRoomErrorCode.VERSION_NOT_FOUND, "No downloadable version.")
    return ci_download(db, user, current.id).download_url
