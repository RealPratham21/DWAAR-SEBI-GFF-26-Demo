"""Background runner for DRHP generation — survives HTTP response."""

from __future__ import annotations

import logging
import threading
from uuid import UUID

from app.db.session import SessionLocal
from app.modules.drhp.generation.orchestrator import run_document_generation

logger = logging.getLogger(__name__)

_active_runs: set[str] = set()
_lock = threading.Lock()


def schedule_document_generation(document_version_id: UUID) -> None:
    key = str(document_version_id)
    with _lock:
        if key in _active_runs:
            return
        _active_runs.add(key)

    thread = threading.Thread(
        target=_run_in_thread,
        args=(document_version_id, key),
        name=f"drhp-gen-{key[:8]}",
        daemon=True,
    )
    thread.start()


def _run_in_thread(document_version_id: UUID, key: str) -> None:
    db = SessionLocal()
    try:
        logger.info("DRHP generation started document_version_id=%s", document_version_id)
        run_document_generation(db, document_version_id)
        logger.info("DRHP generation finished document_version_id=%s", document_version_id)
    except Exception:  # noqa: BLE001
        logger.exception("DRHP generation crashed document_version_id=%s", document_version_id)
    finally:
        db.close()
        with _lock:
            _active_runs.discard(key)


def resume_incomplete_generations() -> None:
    """On app startup, resume any document versions still generating."""
    db = SessionLocal()
    try:
        from sqlalchemy import select

        from app.models.drhp_document import DrhpDocumentVersion
        from app.modules.drhp.constants import DocumentVersionStatus

        rows = db.scalars(
            select(DrhpDocumentVersion).where(
                DrhpDocumentVersion.status.in_(
                    [DocumentVersionStatus.QUEUED, DocumentVersionStatus.GENERATING]
                )
            )
        ).all()
        for row in rows:
            schedule_document_generation(row.id)
    finally:
        db.close()
