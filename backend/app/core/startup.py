"""Application startup validation helpers."""

from __future__ import annotations

import logging
import time

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.config import ConfigurationError, Settings, validate_settings_for_role
from app.db.session import engine

logger = logging.getLogger(__name__)


def validate_runtime_configuration(settings: Settings) -> None:
    validate_settings_for_role(settings)
    logger.info(
        "Configuration validated for service_role=%s app_env=%s",
        settings.service_role,
        settings.app_env,
    )


def wait_for_database(
    settings: Settings, *, attempts: int = 10, delay_seconds: float = 1.0
) -> None:
    """Retry database connectivity for short Railway startup races."""
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            if attempt > 1:
                logger.info("Database connection established on attempt %s", attempt)
            return
        except OperationalError as exc:
            last_error = exc
            logger.warning(
                "Database not ready (attempt %s/%s); retrying…",
                attempt,
                attempts,
            )
            time.sleep(delay_seconds)
    raise ConfigurationError("Unable to connect to PostgreSQL during startup.") from last_error
