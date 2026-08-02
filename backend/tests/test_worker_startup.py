"""Worker startup configuration smoke (no live Cohere calls)."""

from __future__ import annotations

import pytest
from app.core.config import ConfigurationError, Settings, validate_settings_for_role
from app.core.startup import validate_runtime_configuration


def test_worker_startup_validation_succeeds_without_cohere() -> None:
    settings = Settings(
        APP_ENV="local",
        SERVICE_ROLE="worker",
        STRUCTURED_EXTRACTION_ENABLED=False,
        COHERE_API_KEY="",
        DATABASE_URL="postgresql+psycopg://dwaar:dwaar_local@localhost:5432/dwaar",
    )
    validate_runtime_configuration(settings)


def test_worker_startup_fails_for_enabled_cohere_without_key() -> None:
    settings = Settings(
        APP_ENV="local",
        SERVICE_ROLE="worker",
        STRUCTURED_EXTRACTION_ENABLED=True,
        STRUCTURED_EXTRACTION_PROVIDER="cohere",
        COHERE_API_KEY="",
    )
    with pytest.raises(ConfigurationError, match="COHERE_API_KEY"):
        validate_settings_for_role(settings)


def test_worker_does_not_open_http_port_by_default() -> None:
    # The worker module entrypoint is a process loop, not an ASGI server.
    from app.modules.company_incorporation.document_processing import worker as worker_mod

    assert hasattr(worker_mod, "run_forever")
    assert hasattr(worker_mod, "main")
    assert not hasattr(worker_mod, "app")
