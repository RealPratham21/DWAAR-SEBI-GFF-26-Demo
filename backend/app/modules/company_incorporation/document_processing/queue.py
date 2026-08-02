"""PostgreSQL-backed durable processing queue."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.document import Document
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.modules.company_incorporation.document_processing.constants import (
    ACTIVE_PROCESSING_RUN_STATUSES,
    CURRENT_OUTPUT_SCHEMA_VERSION,
    ProcessingErrorCode,
    ProcessingRunStatus,
)
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus


def _now() -> datetime:
    return datetime.now(tz=UTC)


def next_attempt_number(db: Session, document_version_id: uuid.UUID) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(DocumentProcessingRun.attempt_number), 0)).where(
            DocumentProcessingRun.document_version_id == document_version_id,
        )
    )
    return int(current or 0) + 1


def has_active_run(db: Session, document_version_id: uuid.UUID) -> bool:
    run = db.scalar(
        select(DocumentProcessingRun.id).where(
            DocumentProcessingRun.document_version_id == document_version_id,
            DocumentProcessingRun.status.in_(ACTIVE_PROCESSING_RUN_STATUSES),
        )
    )
    return run is not None


def cancel_active_runs_for_version(
    db: Session,
    *,
    document_version_id: uuid.UUID,
    reason: str,
) -> int:
    now = _now()
    runs = db.scalars(
        select(DocumentProcessingRun).where(
            DocumentProcessingRun.document_version_id == document_version_id,
            DocumentProcessingRun.status.in_(ACTIVE_PROCESSING_RUN_STATUSES),
        )
    ).all()
    for run in runs:
        run.status = ProcessingRunStatus.CANCELLED
        run.error_code = ProcessingErrorCode.CANCELLED
        run.error_message = reason
        run.completed_at = now
        run.updated_at = now
        run.heartbeat_at = now
    if runs:
        db.flush()
    return len(runs)


def cancel_active_runs_for_document(
    db: Session,
    *,
    document_id: uuid.UUID,
    reason: str,
) -> int:
    version_ids = db.scalars(
        select(DocumentVersion.id).where(DocumentVersion.document_id == document_id)
    ).all()
    cancelled = 0
    for version_id in version_ids:
        cancelled += cancel_active_runs_for_version(
            db,
            document_version_id=version_id,
            reason=reason,
        )
    return cancelled


def enqueue_processing_run(
    db: Session,
    *,
    document_version: DocumentVersion,
    settings: Settings | None = None,
) -> DocumentProcessingRun:
    cfg = settings or get_settings()
    now = _now()
    schema_version = int(
        getattr(cfg, "doc_processing_output_schema_version", CURRENT_OUTPUT_SCHEMA_VERSION)
    )
    run = DocumentProcessingRun(
        document_version_id=document_version.id,
        status=ProcessingRunStatus.QUEUED,
        attempt_number=next_attempt_number(db, document_version.id),
        processor_version=cfg.doc_processing_processor_version,
        output_schema_version=schema_version,
        queued_at=now,
        available_at=now,
        warnings=[],
    )
    document_version.status = DocumentVersionStatus.PENDING_PROCESSING
    document_version.updated_at = now
    db.add(run)
    db.flush()
    db.refresh(run)
    return run


def recover_stale_runs(db: Session, *, settings: Settings | None = None) -> int:
    cfg = settings or get_settings()
    now = _now()
    cutoff = now - timedelta(seconds=cfg.doc_processing_stale_heartbeat_seconds)
    stale_runs = db.scalars(
        select(DocumentProcessingRun).where(
            DocumentProcessingRun.status == ProcessingRunStatus.PROCESSING,
            DocumentProcessingRun.heartbeat_at.is_not(None),
            DocumentProcessingRun.heartbeat_at < cutoff,
        )
    ).all()

    recovered = 0
    for run in stale_runs:
        version = db.get(DocumentVersion, run.document_version_id)
        run.status = ProcessingRunStatus.FAILED
        run.error_code = "DOCUMENT_PROCESSING_TIMEOUT"
        run.error_message = "Processing timed out after losing worker heartbeat."
        run.completed_at = now
        run.updated_at = now
        if version is None:
            recovered += 1
            continue
        if run.attempt_number < cfg.doc_processing_max_attempts:
            enqueue_processing_run(db, document_version=version, settings=cfg)
        else:
            version.status = DocumentVersionStatus.PROCESSING_FAILED
            version.updated_at = now
        recovered += 1
    if recovered:
        db.flush()
    return recovered


def claim_next_run(
    db: Session, *, settings: Settings | None = None
) -> DocumentProcessingRun | None:
    """Claim one available queued run using SKIP LOCKED."""
    cfg = settings or get_settings()
    now = _now()
    recover_stale_runs(db, settings=cfg)

    row = db.execute(
        text(
            """
            SELECT id
            FROM document_processing_runs
            WHERE status = :queued
              AND available_at <= :now
            ORDER BY available_at ASC, queued_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """
        ),
        {"queued": ProcessingRunStatus.QUEUED, "now": now},
    ).first()
    if row is None:
        return None

    run = db.get(DocumentProcessingRun, row[0])
    if run is None:
        return None

    version = db.get(DocumentVersion, run.document_version_id)
    run.status = ProcessingRunStatus.PROCESSING
    run.claimed_at = now
    run.heartbeat_at = now
    run.updated_at = now
    if version is not None:
        version.status = DocumentVersionStatus.PROCESSING
        version.updated_at = now
    db.flush()
    db.refresh(run)
    return run


def touch_heartbeat(db: Session, run_id: uuid.UUID) -> None:
    now = _now()
    db.execute(
        update(DocumentProcessingRun)
        .where(DocumentProcessingRun.id == run_id)
        .values(heartbeat_at=now, updated_at=now)
    )
    db.flush()


def load_promotion_gate(
    db: Session,
    *,
    run_id: uuid.UUID,
) -> tuple[DocumentProcessingRun | None, DocumentVersion | None, Document | None]:
    run = db.get(DocumentProcessingRun, run_id)
    if run is None:
        return None, None, None
    version = db.get(DocumentVersion, run.document_version_id)
    document = db.get(Document, version.document_id) if version is not None else None
    return run, version, document


def can_promote_run(
    *,
    run: DocumentProcessingRun,
    version: DocumentVersion | None,
    document: Document | None,
) -> bool:
    if run.status != ProcessingRunStatus.PROCESSING:
        return False
    if version is None:
        return False
    if version.status == DocumentVersionStatus.SUPERSEDED:
        return False
    if document is not None and document.archived_at is not None:
        return False
    return True
