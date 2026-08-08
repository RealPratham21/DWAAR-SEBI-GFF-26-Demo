"""DRHP export orchestration — load persisted ASTs and render PDF/DOCX."""

from __future__ import annotations

import uuid
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
from app.models.user import User
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    ChapterVersionStatus,
    DocumentVersionStatus,
    DrhpErrorCode,
)
from app.modules.drhp.export.document import assemble_export_document
from app.modules.drhp.export.docx_renderer import render_docx
from app.modules.drhp.export.filenames import build_export_filename
from app.modules.drhp.export.pdf_renderer import render_pdf

ExportFormat = Literal["pdf", "docx"]

_EXPORTABLE_DOCUMENT_STATUSES = {
    DocumentVersionStatus.GENERATED,
    DocumentVersionStatus.GENERATED_WITH_WARNINGS,
    DocumentVersionStatus.PARTIALLY_GENERATED,
    DocumentVersionStatus.FAILED,
}

_EXPORT_MIME = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _load_owned_document_version(
    db: Session,
    user: User,
    document_version_id: uuid.UUID,
) -> DrhpDocumentVersion:
    doc_version = db.get(DrhpDocumentVersion, document_version_id)
    if doc_version is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.DOCUMENT_VERSION_NOT_FOUND,
            message="DRHP document version not found.",
        )
    if doc_version.user_id != user.id:
        raise AppException(
            status_code=403,
            code=DrhpErrorCode.DOCUMENT_FORBIDDEN,
            message="DRHP document access denied.",
        )
    return doc_version


def _assert_export_allowed(doc_version: DrhpDocumentVersion) -> None:
    if doc_version.status == DocumentVersionStatus.QUEUED:
        raise AppException(
            status_code=409,
            code=DrhpErrorCode.EXPORT_NOT_AVAILABLE,
            message="Generate a draft before exporting.",
        )
    if (
        doc_version.status == DocumentVersionStatus.GENERATING
        and doc_version.completed_chapters <= 0
    ):
        raise AppException(
            status_code=409,
            code=DrhpErrorCode.EXPORT_NOT_AVAILABLE,
            message="Generate a draft before exporting. Document generation is still in progress.",
        )
    if doc_version.completed_chapters <= 0:
        raise AppException(
            status_code=409,
            code=DrhpErrorCode.EXPORT_NOT_AVAILABLE,
            message="Generate a draft before exporting.",
        )


def build_export_document_for_version(
    db: Session,
    user: User,
    document_version_id: uuid.UUID,
):
    doc_version = _load_owned_document_version(db, user, document_version_id)
    _assert_export_allowed(doc_version)

    rows = db.scalars(
        select(DrhpChapterVersion).where(
            DrhpChapterVersion.document_version_id == document_version_id,
            DrhpChapterVersion.chapter_key.in_(ALL_CHAPTER_KEYS),
        )
    ).all()
    rows_by_key = {row.chapter_key: row for row in rows}
    is_partial = doc_version.status in {
        DocumentVersionStatus.PARTIALLY_GENERATED,
        DocumentVersionStatus.FAILED,
    } or any(
        row.status
        not in {ChapterVersionStatus.GENERATED, ChapterVersionStatus.GENERATED_WITH_WARNINGS}
        for row in rows_by_key.values()
    )
    return assemble_export_document(
        version_number=doc_version.version_number,
        generated_at=doc_version.completed_at or doc_version.created_at,
        is_partial=is_partial,
        chapter_rows_by_key=rows_by_key,
    )


def render_document_export(
    db: Session,
    user: User,
    document_version_id: uuid.UUID,
    export_format: ExportFormat,
) -> tuple[bytes, str, str]:
    export_document = build_export_document_for_version(db, user, document_version_id)
    if export_format == "pdf":
        payload = render_pdf(export_document)
    else:
        payload = render_docx(export_document)
    filename = build_export_filename(export_document, extension=export_format)
    return payload, filename, _EXPORT_MIME[export_format]
