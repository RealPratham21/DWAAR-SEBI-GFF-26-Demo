"""Adapt Company & Incorporation documents for global Data Room (G6)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.fact_assertion import FactAssertion
from app.models.fact_evidence_reference import FactEvidenceReference
from app.models.user import User
from app.modules.company_incorporation.documents.constants import CURRENT_VERSION_STATUSES
from app.modules.company_incorporation.documents.requirements_config import REQUIREMENT_DEFINITIONS
from app.modules.company_incorporation.documents.service import get_workspace_for_user
from app.modules.data_room.constants import (
    DOC_STATUS_ARCHIVED,
    DOC_STATUS_PROCESSING,
    DOC_STATUS_PROCESSED,
    DOC_STATUS_PROCESSING_FAILED,
    DOC_STATUS_UPLOADED,
    DOC_STATUS_SUPERSEDED,
    ORIGIN_COMPANY_INCORPORATION,
    PROCESSING_DOCUMENT_EXTRACTION,
)
from app.modules.data_room.global_ids import encode_ci_document_id
from app.modules.data_room.labels import ci_document_url, workstream_url
from app.modules.data_room.schemas import RawDataRoomDocument


def _map_ci_status(version_status: str, *, archived: bool) -> str:
    if archived:
        return DOC_STATUS_ARCHIVED
    if version_status in {"processing", "pending_processing"}:
        return DOC_STATUS_PROCESSING
    if version_status == "processed":
        return DOC_STATUS_PROCESSED
    if version_status == "processing_failed":
        return DOC_STATUS_PROCESSING_FAILED
    if version_status == "superseded":
        return DOC_STATUS_SUPERSEDED
    return DOC_STATUS_UPLOADED


def _current_version(document: Document) -> DocumentVersion | None:
    active = [v for v in document.versions if v.status in CURRENT_VERSION_STATUSES]
    if not active:
        active = [v for v in document.versions if v.status != "superseded"]
    if not active:
        return None
    return max(active, key=lambda item: item.version_number)


def _counts_for_versions(
    db: Session,
    version_ids: set[uuid.UUID],
) -> tuple[dict[uuid.UUID, int], dict[uuid.UUID, int]]:
    if not version_ids:
        return {}, {}
    fact_rows = db.execute(
        select(FactAssertion.document_version_id, func.count())
        .where(FactAssertion.document_version_id.in_(version_ids))
        .group_by(FactAssertion.document_version_id)
    ).all()
    evidence_rows = db.execute(
        select(FactAssertion.document_version_id, func.count(FactEvidenceReference.id))
        .join(FactEvidenceReference, FactEvidenceReference.assertion_id == FactAssertion.id)
        .where(FactAssertion.document_version_id.in_(version_ids))
        .group_by(FactAssertion.document_version_id)
    ).all()
    return {row[0]: row[1] for row in fact_rows}, {row[0]: row[1] for row in evidence_rows}


def load_ci_documents(db: Session, user: User) -> list[RawDataRoomDocument]:
    workspace = get_workspace_for_user(db, user.id)
    if workspace is None:
        return []

    documents = db.scalars(
        select(Document)
        .where(Document.company_incorporation_workspace_id == workspace.id)
        .options(selectinload(Document.versions))
        .order_by(Document.created_at.asc())
    ).all()

    version_ids = {v.id for doc in documents for v in doc.versions}
    fact_counts, evidence_counts = _counts_for_versions(db, version_ids)

    items: list[RawDataRoomDocument] = []
    for document in documents:
        current = _current_version(document)
        if current is None:
            continue
        definition = REQUIREMENT_DEFINITIONS.get(document.requirement_key)
        category = definition.group_title if definition else document.requirement_key
        title = definition.name if definition else document.requirement_key
        archived = document.archived_at is not None
        status = _map_ci_status(current.status, archived=archived)
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
                global_document_id=encode_ci_document_id(document.id),
                origin_type=ORIGIN_COMPANY_INCORPORATION,
                origin_document_id=str(document.id),
                title=title,
                filename=current.original_filename,
                category=category,
                mime_type=current.content_type,
                file_size=current.size_bytes,
                workstream_key="company-incorporation",
                section_key="documents",
                requirement_key=f"company-incorporation:{document.requirement_key}",
                current_version=current.version_number,
                status=status,
                processing_capability=PROCESSING_DOCUMENT_EXTRACTION,
                uploaded_at=current.uploaded_at,
                updated_at=document.updated_at,
                fact_count=fact_counts.get(current.id, 0),
                evidence_count=evidence_counts.get(current.id, 0),
                open_url=ci_document_url(str(document.id), version_id=str(current.id)),
                download_available=True,
                version_history=version_history,
                metadata={
                    "ciRequirementKey": document.requirement_key,
                    "processingStatus": current.status,
                    "currentVersionId": str(current.id),
                },
            )
        )
    return items


def ci_requirement_keys_with_documents(documents: list[RawDataRoomDocument]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = {}
    for doc in documents:
        if doc.requirement_key:
            mapping.setdefault(doc.requirement_key, []).append(doc.global_document_id)
    return mapping
