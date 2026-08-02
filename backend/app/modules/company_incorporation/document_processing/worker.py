"""Long-running worker for page-processing and structured-extraction queues."""

from __future__ import annotations

import logging
import signal
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

from app.core.config import ConfigurationError, get_settings
from app.core.logging import configure_logging
from app.core.startup import validate_runtime_configuration, wait_for_database
from app.db.session import SessionLocal
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import claim_next_run
from app.modules.company_incorporation.structured_extraction.pipeline import (
    process_structured_run,
)
from app.modules.company_incorporation.structured_extraction.queue import (
    claim_next_structured_run,
)

logger = logging.getLogger("document-worker")

_shutdown = False


def _handle_signal(signum: int, _frame) -> None:
    global _shutdown
    logger.info("Received signal %s — shutting down after current job", signum)
    _shutdown = True


def _write_heartbeat_file(path: str) -> None:
    try:
        heartbeat_path = Path(path)
        heartbeat_path.parent.mkdir(parents=True, exist_ok=True)
        heartbeat_path.write_text(datetime.now(tz=UTC).isoformat(), encoding="utf-8")
    except OSError as exc:
        logger.warning("Unable to write worker heartbeat file: %s", type(exc).__name__)


def run_forever() -> None:
    settings = get_settings()
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)
    logger.info(
        "Document worker started (poll=%ss, structured_enabled=%s, provider=%s)",
        settings.doc_processing_poll_interval_seconds,
        settings.structured_extraction_enabled,
        settings.structured_extraction_provider,
    )

    while not _shutdown:
        if settings.doc_processing_write_heartbeat_file:
            _write_heartbeat_file(settings.doc_processing_heartbeat_path)
        db = SessionLocal()
        try:
            # Prefer page-processing jobs, then structured extraction.
            run = claim_next_run(db, settings=settings)
            if run is not None:
                run_id = run.id
                db.commit()
                logger.info("Claimed processing run_id=%s", run_id)
                process_run(db, run_id, settings=settings)
                logger.info("Completed processing run_id=%s", run_id)
                continue

            structured = claim_next_structured_run(db, settings=settings)
            if structured is not None:
                structured_id = structured.id
                db.commit()
                logger.info("Claimed structured-extraction run_id=%s", structured_id)
                process_structured_run(db, structured_id, settings=settings)
                logger.info("Completed structured-extraction run_id=%s", structured_id)
                continue

            db.commit()
            time.sleep(settings.doc_processing_poll_interval_seconds)
        except Exception:  # noqa: BLE001
            logger.exception("Worker loop error")
            db.rollback()
            time.sleep(settings.doc_processing_poll_interval_seconds)
        finally:
            db.close()

    logger.info("Document worker stopped")


def main() -> int:
    settings = get_settings()
    configure_logging(settings.log_level, debug=False)
    try:
        validate_runtime_configuration(settings)
        wait_for_database(settings)
    except ConfigurationError as exc:
        logger.error("Worker configuration failed: %s", exc)
        return 1
    run_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
