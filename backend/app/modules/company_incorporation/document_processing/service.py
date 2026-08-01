"""Authenticated processing status, history, pages, and retry APIs."""

from __future__ import annotations

import uuid
from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.modules.company_incorporation.document_processing.blocks import (
    page_is_evidence_contract_ready,
)
from app.modules.company_incorporation.document_processing.constants import (
    ProcessingRunStatus,
)
from app.modules.company_incorporation.document_processing.queue import (
    enqueue_processing_run,
    has_active_run,
)
from app.modules.company_incorporation.document_processing.schemas import (
    DocumentPageResponse,
    DocumentPagesResponse,
    ProcessingHistoryResponse,
    ProcessingRunSummaryResponse,
    ProcessingStatusResponse,
    RetryProcessingResponse,
)
from app.modules.company_incorporation.documents.constants import (
    DocumentErrorCode,
    DocumentVersionStatus,
)
from app.modules.company_incorporation.documents.service import (
    _get_owned_version,
    _require_workspace,
)


def _pages_for_run(db: Session, run_id: uuid.UUID) -> list[DocumentPage]:
    return list(
        db.scalars(
            select(DocumentPage)
            .where(DocumentPage.processing_run_id == run_id)
            .order_by(DocumentPage.page_number.asc())
        ).all()
    )


def _page_count(db: Session, run_id: uuid.UUID) -> int:
    return int(
        db.scalar(
            select(func.count()).select_from(DocumentPage).where(
                DocumentPage.processing_run_id == run_id,
            )
        )
        or 0
    )


def _block_count(pages: list[DocumentPage]) -> int:
    total = 0
    for page in pages:
        blocks = page.text_blocks or []
        total += len(blocks) if isinstance(blocks, list) else 0
    return total


def _schema_v2_page_count(run: DocumentProcessingRun, pages: list[DocumentPage]) -> int:
    if int(run.output_schema_version or 1) < 2:
        return 0
    return sum(
        1
        for page in pages
        if page_is_evidence_contract_ready(
            output_schema_version=run.output_schema_version,
            text_blocks=page.text_blocks,
            coordinate_metadata=page.coordinate_metadata,
        )
    )


def run_is_evidence_ready(run: DocumentProcessingRun, pages: list[DocumentPage]) -> bool:
    if run.status != ProcessingRunStatus.COMPLETED:
        return False
    if int(run.output_schema_version or 1) < 2:
        return False
    if not pages:
        return False
    return all(
        page_is_evidence_contract_ready(
            output_schema_version=run.output_schema_version,
            text_blocks=page.text_blocks,
            coordinate_metadata=page.coordinate_metadata,
        )
        for page in pages
    )


def _latest_attempt(db: Session, version_id: uuid.UUID) -> DocumentProcessingRun | None:
    return db.scalar(
        select(DocumentProcessingRun)
        .where(DocumentProcessingRun.document_version_id == version_id)
        .order_by(
            DocumentProcessingRun.attempt_number.desc(),
            DocumentProcessingRun.queued_at.desc(),
        )
        .limit(1)
    )


def _latest_completed(db: Session, version_id: uuid.UUID) -> DocumentProcessingRun | None:
    return db.scalar(
        select(DocumentProcessingRun)
        .where(
            DocumentProcessingRun.document_version_id == version_id,
            DocumentProcessingRun.status == ProcessingRunStatus.COMPLETED,
        )
        .order_by(
            DocumentProcessingRun.attempt_number.desc(),
            DocumentProcessingRun.queued_at.desc(),
        )
        .limit(1)
    )


def _latest_evidence_ready(db: Session, version_id: uuid.UUID) -> DocumentProcessingRun | None:
    runs = db.scalars(
        select(DocumentProcessingRun)
        .where(
            DocumentProcessingRun.document_version_id == version_id,
            DocumentProcessingRun.status == ProcessingRunStatus.COMPLETED,
            DocumentProcessingRun.output_schema_version >= 2,
        )
        .order_by(
            DocumentProcessingRun.attempt_number.desc(),
            DocumentProcessingRun.queued_at.desc(),
        )
    ).all()
    for run in runs:
        pages = _pages_for_run(db, run.id)
        if run_is_evidence_ready(run, pages):
            return run
    return None


def _preferred_pages_run(db: Session, version_id: uuid.UUID) -> DocumentProcessingRun | None:
    """Prefer evidence-ready, then completed, then latest attempt."""
    ready = _latest_evidence_ready(db, version_id)
    if ready is not None:
        return ready
    completed = _latest_completed(db, version_id)
    if completed is not None:
        return completed
    return _latest_attempt(db, version_id)


def _cancellation_fields(run: DocumentProcessingRun | None) -> tuple[bool, str | None]:
    if run is None or run.status != ProcessingRunStatus.CANCELLED:
        return False, None
    return True, run.error_message


def _retry_available(db: Session, version: DocumentVersion) -> bool:
    if version.status not in {
        DocumentVersionStatus.UPLOADED,
        DocumentVersionStatus.PROCESSED,
        DocumentVersionStatus.PROCESSING_FAILED,
    }:
        return False
    return not has_active_run(db, version.id)


def _run_summary(
    db: Session,
    run: DocumentProcessingRun,
) -> ProcessingRunSummaryResponse:
    pages = _pages_for_run(db, run.id)
    cancelled, cancellation_reason = _cancellation_fields(run)
    return ProcessingRunSummaryResponse(
        id=str(run.id),
        status=run.status,
        attempt_number=run.attempt_number,
        processor_version=run.processor_version,
        output_schema_version=int(run.output_schema_version or 1),
        evidence_ready=run_is_evidence_ready(run, pages),
        queued_at=run.queued_at,
        claimed_at=run.claimed_at,
        completed_at=run.completed_at,
        page_count=len(pages),
        schema_v2_page_count=_schema_v2_page_count(run, pages),
        block_count=_block_count(pages),
        warnings=list(run.warnings or []),
        error_code=run.error_code,
        error_message=run.error_message,
        cancelled=cancelled,
        cancellation_reason=cancellation_reason,
    )


def get_processing_status(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> ProcessingStatusResponse:
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)
    latest_attempt = _latest_attempt(db, version.id)
    latest_completed = _latest_completed(db, version.id)
    latest_ready = _latest_evidence_ready(db, version.id)

    # Prefer completed evidence-ready for "usable" status fields when latest attempt is cancelled.
    display_run = latest_attempt
    if (
        latest_attempt is not None
        and latest_attempt.status == ProcessingRunStatus.CANCELLED
        and latest_ready is not None
    ):
        display_run = latest_ready
    elif (
        latest_attempt is not None
        and latest_attempt.status == ProcessingRunStatus.CANCELLED
        and latest_completed is not None
    ):
        display_run = latest_completed

    method_counts: dict[str, int] = {}
    warnings: list[str] = []
    pages: list[DocumentPage] = []
    if display_run is not None:
        pages = _pages_for_run(db, display_run.id)
        method_counts = dict(Counter(page.extraction_method for page in pages))
        warning_values = list(display_run.warnings or [])
        for page in pages:
            warning_values.extend(page.warnings or [])
        warnings = sorted(set(warning_values))

    cancelled, cancellation_reason = _cancellation_fields(latest_attempt)
    evidence_ready = bool(
        display_run is not None and run_is_evidence_ready(display_run, pages)
    )

    return ProcessingStatusResponse(
        document_version_id=str(version.id),
        document_status=version.status,
        latest_run_status=display_run.status if display_run else None,
        latest_attempt_status=latest_attempt.status if latest_attempt else None,
        latest_completed_run_status=latest_completed.status if latest_completed else None,
        latest_evidence_ready_run_id=str(latest_ready.id) if latest_ready else None,
        attempt_number=display_run.attempt_number if display_run else None,
        processor_version=display_run.processor_version if display_run else None,
        output_schema_version=(
            int(display_run.output_schema_version or 1) if display_run else None
        ),
        evidence_ready=evidence_ready,
        queued_at=display_run.queued_at if display_run else None,
        claimed_at=display_run.claimed_at if display_run else None,
        completed_at=display_run.completed_at if display_run else None,
        page_count=len(pages),
        schema_v2_page_count=(
            _schema_v2_page_count(display_run, pages) if display_run else 0
        ),
        block_count=_block_count(pages),
        extraction_method_counts=method_counts,
        warnings=warnings,
        error_code=display_run.error_code if display_run else None,
        error_message=display_run.error_message if display_run else None,
        cancelled=cancelled,
        cancellation_reason=cancellation_reason,
        retry_available=_retry_available(db, version),
    )


def get_processing_history(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> ProcessingHistoryResponse:
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)
    runs = db.scalars(
        select(DocumentProcessingRun)
        .where(DocumentProcessingRun.document_version_id == version.id)
        .order_by(
            DocumentProcessingRun.attempt_number.desc(),
            DocumentProcessingRun.queued_at.desc(),
        )
    ).all()

    latest_attempt = runs[0] if runs else None
    latest_completed = _latest_completed(db, version.id)
    latest_ready = _latest_evidence_ready(db, version.id)

    return ProcessingHistoryResponse(
        document_version_id=str(version.id),
        latest_attempt_run_id=str(latest_attempt.id) if latest_attempt else None,
        latest_completed_run_id=str(latest_completed.id) if latest_completed else None,
        latest_evidence_ready_run_id=str(latest_ready.id) if latest_ready else None,
        runs=[_run_summary(db, run) for run in runs],
    )


def _camelize_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:] if part)


def _camelize_structure(value: object) -> object:
    if isinstance(value, list):
        return [_camelize_structure(item) for item in value]
    if isinstance(value, dict):
        return {_camelize_key(str(key)): _camelize_structure(item) for key, item in value.items()}
    return value


def _serialize_page(
    page: DocumentPage,
    *,
    run: DocumentProcessingRun,
    include_content: bool,
) -> DocumentPageResponse:
    blocks = list(page.text_blocks or [])
    metadata = dict(page.coordinate_metadata or {})
    evidence_ready = page_is_evidence_contract_ready(
        output_schema_version=int(run.output_schema_version or 1),
        text_blocks=blocks,
        coordinate_metadata=metadata,
    )
    return DocumentPageResponse(
        id=str(page.id),
        page_number=page.page_number,
        extraction_method=page.extraction_method,
        block_count=len(blocks),
        page_width=page.page_width,
        page_height=page.page_height,
        detected_rotation=page.detected_rotation,
        native_text_length=page.native_text_length,
        average_ocr_confidence=page.average_ocr_confidence,
        warnings=list(page.warnings or []),
        coordinate_space=metadata.get("coordinate_space"),
        coordinate_metadata=(
            _camelize_structure(metadata) if metadata else None  # type: ignore[arg-type]
        ),
        evidence_ready=evidence_ready,
        text=page.text if include_content else None,
        text_blocks=(
            _camelize_structure(blocks) if include_content else None  # type: ignore[arg-type]
        ),
    )


def load_complete_pages_for_run(
    db: Session,
    run_id: uuid.UUID,
) -> list[DocumentPage]:
    """Internal service-level accessor for Increment 2B (full page/block content)."""
    return _pages_for_run(db, run_id)


def get_page_results(
    db: Session,
    user: User,
    version_id: uuid.UUID,
    *,
    include_content: bool = False,
    offset: int = 0,
    limit: int | None = None,
) -> DocumentPagesResponse:
    settings = get_settings()
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)

    if include_content and not settings.doc_processing_allow_full_content_api:
        raise AppException(
            status_code=403,
            code=DocumentErrorCode.FORBIDDEN,
            message="Full page content is disabled in this environment.",
        )

    run = _preferred_pages_run(db, version.id)
    if run is None:
        return DocumentPagesResponse(
            document_version_id=str(version.id),
            processing_run_id=None,
            output_schema_version=None,
            evidence_ready=False,
            processor_version=None,
            page_count=0,
            offset=max(offset, 0),
            limit=0,
            include_content=include_content,
            pages=[],
        )

    default_limit = settings.doc_processing_pages_default_limit
    max_limit = settings.doc_processing_pages_max_limit
    effective_limit = default_limit if limit is None else min(max(limit, 1), max_limit)
    effective_offset = max(offset, 0)

    all_pages = _pages_for_run(db, run.id)
    sliced = all_pages[effective_offset : effective_offset + effective_limit]
    evidence_ready = run_is_evidence_ready(run, all_pages)

    return DocumentPagesResponse(
        document_version_id=str(version.id),
        processing_run_id=str(run.id),
        output_schema_version=int(run.output_schema_version or 1),
        evidence_ready=evidence_ready,
        processor_version=run.processor_version,
        page_count=len(all_pages),
        offset=effective_offset,
        limit=effective_limit,
        include_content=include_content,
        pages=[
            _serialize_page(page, run=run, include_content=include_content)
            for page in sliced
        ],
    )


def retry_processing(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> RetryProcessingResponse:
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)

    if version.status not in {
        DocumentVersionStatus.UPLOADED,
        DocumentVersionStatus.PROCESSED,
        DocumentVersionStatus.PROCESSING_FAILED,
    }:
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.PROCESSING_RETRY_NOT_ALLOWED,
            message="Only uploaded, processed, or failed versions may be retried.",
        )

    if has_active_run(db, version.id):
        raise AppException(
            status_code=409,
            code=DocumentErrorCode.PROCESSING_ACTIVE_RUN,
            message="A processing run is already queued or in progress.",
        )

    run = enqueue_processing_run(db, document_version=version)
    return RetryProcessingResponse(
        document_version_id=str(version.id),
        processing_run_id=str(run.id),
        status=run.status,
        output_schema_version=int(run.output_schema_version or 1),
        processor_version=run.processor_version,
    )
