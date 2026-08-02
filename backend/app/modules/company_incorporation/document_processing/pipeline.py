"""Process a claimed document processing run end-to-end."""

from __future__ import annotations

import logging
import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import Settings, get_settings
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.modules.company_incorporation.document_processing.constants import (
    ProcessingErrorCode,
    ProcessingRunStatus,
    ProcessingWarning,
)
from app.modules.company_incorporation.document_processing.extractor import (
    DocumentProcessingError,
    extract_document,
)
from app.modules.company_incorporation.document_processing.queue import (
    can_promote_run,
    enqueue_processing_run,
    load_promotion_gate,
    touch_heartbeat,
)
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from app.modules.company_incorporation.documents.requirements_config import (
    REQUIREMENT_DEFINITIONS,
)
from app.modules.notifications.service import (
    create_document_processing_failed_notification,
    create_document_processing_success_notification,
)
from app.storage import ObjectStorageError, get_object_storage

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _safe_error_message(message: str, *, limit: int = 500) -> str:
    cleaned = " ".join(message.split())
    return cleaned[:limit]


def _requirement_name(requirement_key: str) -> str:
    definition = REQUIREMENT_DEFINITIONS.get(requirement_key)
    return definition.name if definition else "Document"


def _abort_without_promotion(db: Session, run_id: uuid.UUID, *, reason: str) -> None:
    """Leave cancelled/archived/superseded runs untouched; never mark completed."""
    run, _version, _document = load_promotion_gate(db, run_id=run_id)
    if run is None:
        return
    if run.status == ProcessingRunStatus.PROCESSING:
        # Defensive: if gate failed for archive/supersede without cancel, cancel safely.
        now = _now()
        run.status = ProcessingRunStatus.CANCELLED
        run.error_code = ProcessingErrorCode.CANCELLED
        run.error_message = reason
        run.completed_at = now
        run.updated_at = now
        db.flush()
    db.commit()
    logger.info("Processing run %s aborted without promotion: %s", run_id, reason)


def process_run(db: Session, run_id: uuid.UUID, *, settings: Settings | None = None) -> None:
    cfg = settings or get_settings()
    run = db.scalar(
        select(DocumentProcessingRun)
        .where(DocumentProcessingRun.id == run_id)
        .options(selectinload(DocumentProcessingRun.pages))
    )
    if run is None or run.status != ProcessingRunStatus.PROCESSING:
        return

    version = db.get(DocumentVersion, run.document_version_id)
    if version is None:
        run.status = ProcessingRunStatus.FAILED
        run.error_code = ProcessingErrorCode.INTERNAL_ERROR
        run.error_message = "Document version missing."
        run.completed_at = _now()
        db.flush()
        db.commit()
        return

    document = db.get(Document, version.document_id)
    user = db.get(User, version.uploaded_by_user_id)
    temp_path: Path | None = None

    try:
        # Checkpoint before beginning file processing.
        run, version, document = load_promotion_gate(db, run_id=run_id)
        if run is None or not can_promote_run(run=run, version=version, document=document):
            _abort_without_promotion(
                db,
                run_id,
                reason="Processing aborted before start because the run is no longer promotable.",
            )
            return

        touch_heartbeat(db, run.id)
        db.commit()

        assert version is not None
        suffix = {
            "application/pdf": ".pdf",
            "image/png": ".png",
            "image/jpeg": ".jpg",
        }.get(version.content_type.lower(), "")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
            temp_path = Path(handle.name)

        storage = get_object_storage()
        storage.download_object(storage_key=version.storage_key, destination=temp_path)
        touch_heartbeat(db, run.id)
        db.commit()

        run, version, document = load_promotion_gate(db, run_id=run_id)
        if (
            run is None
            or version is None
            or not can_promote_run(run=run, version=version, document=document)
        ):
            _abort_without_promotion(
                db,
                run_id,
                reason="Processing aborted after download because the run is no longer promotable.",
            )
            return

        pages = extract_document(
            temp_path,
            content_type=version.content_type,
            settings=cfg,
        )
        touch_heartbeat(db, run.id)

        for existing in list(run.pages):
            db.delete(existing)
        db.flush()

        run_warnings: list[str] = []
        for page in pages:
            run, version, document = load_promotion_gate(db, run_id=run_id)
            if (
                run is None
                or version is None
                or not can_promote_run(run=run, version=version, document=document)
            ):
                db.commit()
                _abort_without_promotion(
                    db,
                    run_id,
                    reason="Processing aborted between pages because the run is no longer promotable.",
                )
                return

            db.add(
                DocumentPage(
                    processing_run_id=run.id,
                    document_version_id=version.id,
                    page_number=page.page_number,
                    extraction_method=page.extraction_method,
                    text=page.text,
                    text_blocks=page.text_blocks,
                    page_width=page.page_width,
                    page_height=page.page_height,
                    detected_rotation=page.detected_rotation,
                    native_text_length=page.native_text_length,
                    average_ocr_confidence=page.average_ocr_confidence,
                    warnings=page.warnings,
                    coordinate_metadata=page.coordinate_metadata or {},
                )
            )
            run_warnings.extend(page.warnings)
            touch_heartbeat(db, run.id)
            db.flush()

        # Checkpoint before committing successful completion.
        run, version, document = load_promotion_gate(db, run_id=run_id)
        if (
            run is None
            or version is None
            or not can_promote_run(run=run, version=version, document=document)
        ):
            db.commit()
            _abort_without_promotion(
                db,
                run_id,
                reason="Processing aborted before completion because the run is no longer promotable.",
            )
            return

        now = _now()
        run.status = ProcessingRunStatus.COMPLETED
        run.completed_at = now
        run.heartbeat_at = now
        run.updated_at = now
        run.warnings = sorted(set(run_warnings))
        run.error_code = None
        run.error_message = None
        version.status = DocumentVersionStatus.PROCESSED
        version.updated_at = now
        db.flush()

        if document is not None and user is not None:
            create_document_processing_success_notification(
                db,
                user=user,
                requirement_name=_requirement_name(document.requirement_key),
                processing_run_id=run.id,
                saved_at=now,
            )

        # Enqueue structured extraction for evidence-ready runs (Increment 2B).
        try:
            from app.modules.company_incorporation.document_processing.service import (
                load_complete_pages_for_run,
                run_is_evidence_ready,
            )
            from app.modules.company_incorporation.structured_extraction.queue import (
                enqueue_structured_extraction_run,
            )

            page_rows = load_complete_pages_for_run(db, run.id)
            if run_is_evidence_ready(run, page_rows) and document is not None:
                enqueue_structured_extraction_run(
                    db,
                    processing_run=run,
                    document_version=version,
                    workspace_id=document.company_incorporation_workspace_id,
                    settings=cfg,
                )
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to enqueue structured extraction for processing run %s",
                run.id,
            )

        db.commit()
        logger.info("Processing run %s completed (%s pages)", run.id, len(pages))

    except DocumentProcessingError as exc:
        db.rollback()
        if not _should_report_failure(db, run_id):
            return
        _fail_run(
            db,
            run_id=run_id,
            version_id=version.id,
            code=exc.code,
            message=exc.message,
            settings=cfg,
            document=document,
            user=user,
            automatic_retry=exc.code
            not in {
                ProcessingErrorCode.UNSUPPORTED_FILE_TYPE,
                ProcessingErrorCode.ENCRYPTED_PDF,
            },
        )
    except ObjectStorageError as exc:
        db.rollback()
        if not _should_report_failure(db, run_id):
            return
        _fail_run(
            db,
            run_id=run_id,
            version_id=version.id,
            code=ProcessingErrorCode.STORAGE_ERROR,
            message=str(exc),
            settings=cfg,
            document=document,
            user=user,
            automatic_retry=True,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected processing failure for run %s", run_id)
        db.rollback()
        if not _should_report_failure(db, run_id):
            return
        _fail_run(
            db,
            run_id=run_id,
            version_id=version.id,
            code=ProcessingErrorCode.INTERNAL_ERROR,
            message="Document processing failed unexpectedly.",
            settings=cfg,
            document=document,
            user=user,
            automatic_retry=True,
            log_detail=str(exc),
        )
    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Failed to delete temporary file %s", temp_path)


def _should_report_failure(db: Session, run_id: uuid.UUID) -> bool:
    run, version, document = load_promotion_gate(db, run_id=run_id)
    if run is None:
        return False
    if run.status == ProcessingRunStatus.CANCELLED:
        db.commit()
        return False
    if version is not None and version.status == DocumentVersionStatus.SUPERSEDED:
        _abort_without_promotion(
            db,
            run_id,
            reason="Processing aborted because the document version was superseded.",
        )
        return False
    if document is not None and document.archived_at is not None:
        _abort_without_promotion(
            db,
            run_id,
            reason="Processing aborted because the document was archived.",
        )
        return False
    return True


def _fail_run(
    db: Session,
    *,
    run_id: uuid.UUID,
    version_id: uuid.UUID,
    code: str,
    message: str,
    settings: Settings,
    document: Document | None,
    user: User | None,
    automatic_retry: bool,
    log_detail: str | None = None,
) -> None:
    if log_detail:
        logger.error("Processing run %s failed: %s", run_id, log_detail)

    run = db.get(DocumentProcessingRun, run_id)
    version = db.get(DocumentVersion, version_id)
    if run is None or version is None:
        return
    if run.status == ProcessingRunStatus.CANCELLED:
        db.commit()
        return

    now = _now()
    run.status = ProcessingRunStatus.FAILED
    run.error_code = code
    run.error_message = _safe_error_message(message)
    run.completed_at = now
    run.updated_at = now
    run.heartbeat_at = now
    if code == ProcessingErrorCode.UNSUPPORTED_FILE_TYPE:
        run.warnings = sorted(set((run.warnings or []) + [ProcessingWarning.UNSUPPORTED_FILE_TYPE]))
    elif code == ProcessingErrorCode.ENCRYPTED_PDF:
        run.warnings = sorted(set((run.warnings or []) + [ProcessingWarning.ENCRYPTED_PDF]))
    elif code == ProcessingErrorCode.PAGE_LIMIT_EXCEEDED:
        run.warnings = sorted(set((run.warnings or []) + [ProcessingWarning.PAGE_LIMIT_EXCEEDED]))

    should_retry = automatic_retry and run.attempt_number < settings.doc_processing_max_attempts
    if should_retry:
        enqueue_processing_run(db, document_version=version, settings=settings)
        db.commit()
        return

    version.status = DocumentVersionStatus.PROCESSING_FAILED
    version.updated_at = now
    db.flush()
    if document is not None and user is not None:
        create_document_processing_failed_notification(
            db,
            user=user,
            requirement_name=_requirement_name(document.requirement_key),
            processing_run_id=run.id,
            saved_at=now,
        )
    db.commit()
