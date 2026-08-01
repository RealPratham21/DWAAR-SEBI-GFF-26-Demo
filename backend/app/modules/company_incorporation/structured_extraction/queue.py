"""PostgreSQL-backed structured-extraction queue (separate from page processing)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.document import Document
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.structured_extraction_run import StructuredExtractionRun
from app.modules.company_incorporation.document_processing.constants import ProcessingRunStatus
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from app.modules.company_incorporation.structured_extraction.constants import (
    ACTIVE_STRUCTURED_RUN_STATUSES,
    EXTRACTOR_VERSION,
    FACT_SCHEMA_VERSION,
    PROMPT_VERSION,
    DeterministicStatus,
    SemanticStatus,
    StructuredExtractionErrorCode,
    StructuredRunStatus,
)
from app.modules.company_incorporation.structured_extraction.fingerprint import (
    compute_input_fingerprint,
)
from app.modules.company_incorporation.structured_extraction.registry import get_requirement_spec
from app.modules.company_incorporation.structured_extraction.types import PageBlockIndex


def _now() -> datetime:
    return datetime.now(tz=UTC)


def next_attempt_number(db: Session, processing_run_id: uuid.UUID) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(StructuredExtractionRun.attempt_number), 0)).where(
            StructuredExtractionRun.document_processing_run_id == processing_run_id,
        )
    )
    return int(current or 0) + 1


def has_active_structured_run(db: Session, processing_run_id: uuid.UUID) -> bool:
    run = db.scalar(
        select(StructuredExtractionRun.id).where(
            StructuredExtractionRun.document_processing_run_id == processing_run_id,
            StructuredExtractionRun.status.in_(ACTIVE_STRUCTURED_RUN_STATUSES),
        )
    )
    return run is not None


def find_completed_identical_run(
    db: Session,
    *,
    fingerprint: str,
) -> StructuredExtractionRun | None:
    return db.scalar(
        select(StructuredExtractionRun)
        .where(
            StructuredExtractionRun.input_fingerprint == fingerprint,
            StructuredExtractionRun.status.in_(
                {
                    StructuredRunStatus.COMPLETED,
                    StructuredRunStatus.COMPLETED_WITH_WARNINGS,
                }
            ),
        )
        .order_by(StructuredExtractionRun.completed_at.desc())
        .limit(1)
    )


def enqueue_structured_extraction_run(
    db: Session,
    *,
    processing_run: DocumentProcessingRun,
    document_version: DocumentVersion,
    workspace_id: uuid.UUID,
    settings: Settings | None = None,
    force: bool = False,
) -> StructuredExtractionRun | None:
    """Queue structured extraction for an evidence-ready page-processing run."""
    cfg = settings or get_settings()
    if not cfg.structured_extraction_enabled:
        return None

    document = db.get(Document, document_version.document_id)
    if document is None or document.archived_at is not None:
        return None
    if document_version.status == DocumentVersionStatus.SUPERSEDED:
        return None

    from app.modules.company_incorporation.document_processing.service import (
        load_complete_pages_for_run,
        run_is_evidence_ready,
    )

    pages = load_complete_pages_for_run(db, processing_run.id)
    if not run_is_evidence_ready(processing_run, pages):
        return None

    spec = get_requirement_spec(document.requirement_key)
    if not spec["supported"]:
        return None

    if has_active_structured_run(db, processing_run.id):
        return None

    provider = cfg.structured_extraction_provider if spec["semantic_required"] else None
    model_name = cfg.cohere_model if provider == "cohere" else None
    fingerprint = compute_input_fingerprint(
        document_checksum=document_version.checksum_sha256,
        document_version_id=str(document_version.id),
        processing_run_id=str(processing_run.id),
        output_schema_version=int(processing_run.output_schema_version or 1),
        processor_version=processing_run.processor_version,
        block_index=PageBlockIndex.from_pages(pages),
        extractor_version=EXTRACTOR_VERSION,
        fact_schema_version=FACT_SCHEMA_VERSION,
        prompt_version=PROMPT_VERSION,
        provider=provider or "",
        model_name=model_name or "",
    )

    if not force:
        existing = find_completed_identical_run(db, fingerprint=fingerprint)
        if existing is not None:
            return existing

    semantic_status = (
        SemanticStatus.PENDING
        if spec["semantic_required"] and cfg.structured_extraction_enabled
        else SemanticStatus.NOT_REQUIRED
    )
    if spec["semantic_required"] and not cfg.structured_extraction_enabled:
        semantic_status = SemanticStatus.SKIPPED_DISABLED

    now = _now()
    run = StructuredExtractionRun(
        workspace_id=workspace_id,
        document_version_id=document_version.id,
        document_processing_run_id=processing_run.id,
        status=StructuredRunStatus.QUEUED,
        attempt_number=next_attempt_number(db, processing_run.id),
        extractor_version=EXTRACTOR_VERSION,
        fact_schema_version=FACT_SCHEMA_VERSION,
        prompt_version=PROMPT_VERSION,
        provider=provider,
        model_name=model_name,
        input_fingerprint=fingerprint,
        deterministic_status=DeterministicStatus.PENDING,
        semantic_status=semantic_status,
        queued_at=now,
        available_at=now,
        warnings=[],
        provider_usage={},
        audit_metadata={"requirement_key": document.requirement_key},
    )
    db.add(run)
    db.flush()
    db.refresh(run)
    return run


def cancel_structured_runs_for_version(
    db: Session,
    *,
    document_version_id: uuid.UUID,
    reason: str,
) -> int:
    now = _now()
    runs = db.scalars(
        select(StructuredExtractionRun).where(
            StructuredExtractionRun.document_version_id == document_version_id,
            StructuredExtractionRun.status.in_(ACTIVE_STRUCTURED_RUN_STATUSES),
        )
    ).all()
    for run in runs:
        run.status = StructuredRunStatus.CANCELLED
        run.error_code = StructuredExtractionErrorCode.CANCELLED
        run.error_message = reason
        run.completed_at = now
        run.updated_at = now
    if runs:
        db.flush()
    return len(runs)


def cancel_structured_runs_for_document(
    db: Session,
    *,
    document_id: uuid.UUID,
    reason: str,
) -> int:
    version_ids = db.scalars(
        select(DocumentVersion.id).where(DocumentVersion.document_id == document_id)
    ).all()
    total = 0
    for version_id in version_ids:
        total += cancel_structured_runs_for_version(
            db,
            document_version_id=version_id,
            reason=reason,
        )
    return total


def recover_stale_structured_runs(db: Session, *, settings: Settings | None = None) -> int:
    cfg = settings or get_settings()
    now = _now()
    cutoff = now - timedelta(seconds=cfg.structured_extraction_stale_heartbeat_seconds)
    stale = db.scalars(
        select(StructuredExtractionRun).where(
            StructuredExtractionRun.status == StructuredRunStatus.RUNNING,
            StructuredExtractionRun.heartbeat_at.is_not(None),
            StructuredExtractionRun.heartbeat_at < cutoff,
        )
    ).all()
    recovered = 0
    for run in stale:
        run.status = StructuredRunStatus.FAILED
        run.error_code = StructuredExtractionErrorCode.TIMEOUT
        run.error_message = "Structured extraction timed out after losing worker heartbeat."
        run.completed_at = now
        run.updated_at = now
        if run.attempt_number < cfg.structured_extraction_max_attempts:
            version = db.get(DocumentVersion, run.document_version_id)
            processing = db.get(DocumentProcessingRun, run.document_processing_run_id)
            if (
                version is not None
                and processing is not None
                and processing.status == ProcessingRunStatus.COMPLETED
            ):
                enqueue_structured_extraction_run(
                    db,
                    processing_run=processing,
                    document_version=version,
                    workspace_id=run.workspace_id,
                    settings=cfg,
                    force=True,
                )
        recovered += 1
    if recovered:
        db.flush()
    return recovered


def claim_next_structured_run(
    db: Session,
    *,
    settings: Settings | None = None,
) -> StructuredExtractionRun | None:
    cfg = settings or get_settings()
    now = _now()
    recover_stale_structured_runs(db, settings=cfg)
    row = db.execute(
        text(
            """
            SELECT id
            FROM structured_extraction_runs
            WHERE status = :queued
              AND available_at <= :now
            ORDER BY available_at ASC, queued_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """
        ),
        {"queued": StructuredRunStatus.QUEUED, "now": now},
    ).first()
    if row is None:
        return None
    run = db.get(StructuredExtractionRun, row[0])
    if run is None:
        return None
    run.status = StructuredRunStatus.RUNNING
    run.claimed_at = now
    run.heartbeat_at = now
    run.updated_at = now
    db.flush()
    db.refresh(run)
    return run


def touch_structured_heartbeat(db: Session, run_id: uuid.UUID) -> None:
    now = _now()
    db.execute(
        update(StructuredExtractionRun)
        .where(StructuredExtractionRun.id == run_id)
        .values(heartbeat_at=now, updated_at=now)
    )
    db.flush()
