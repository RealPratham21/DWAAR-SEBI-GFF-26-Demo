"""Focused tests for production settings validation and helpers."""

from __future__ import annotations

import pytest
from app.core.config import (
    ConfigurationError,
    Settings,
    clear_settings_cache,
    validate_settings_for_role,
)
from app.core.database_url import normalize_database_url


def _production_api_kwargs(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "APP_ENV": "production",
        "DEBUG": "false",
        "SERVICE_ROLE": "api",
        "DATABASE_URL": "postgresql://user:pass@postgres.railway.internal:5432/railway",
        "JWT_SECRET": "a-sufficiently-long-production-jwt-secret-value",
        "FRONTEND_ORIGINS": "https://dwaar.vercel.app",
        "TRUSTED_HOSTS": "api.up.railway.app",
        "REFRESH_COOKIE_SECURE": "true",
        "REFRESH_COOKIE_SAMESITE": "none",
        "S3_ENDPOINT": "https://storage.railway.app",
        "S3_PUBLIC_ENDPOINT": "https://storage.railway.app",
        "S3_ACCESS_KEY": "railway-access",
        "S3_SECRET_KEY": "railway-secret",
        "S3_BUCKET": "dwaar-documents",
        "S3_SECURE": "true",
        "S3_ADDRESSING_STYLE": "virtual",
        "ENABLE_API_DOCS": "false",
    }
    base.update(overrides)
    return base


def test_normalize_database_url_postgresql_and_postgres() -> None:
    assert (
        normalize_database_url("postgresql://u:p@host:5432/db")
        == "postgresql+psycopg://u:p@host:5432/db"
    )
    assert (
        normalize_database_url("postgres://u:p@host:5432/db")
        == "postgresql+psycopg://u:p@host:5432/db"
    )
    assert (
        normalize_database_url("postgresql+psycopg://u:p@host:5432/db")
        == "postgresql+psycopg://u:p@host:5432/db"
    )


def test_settings_normalises_railway_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db.railway.internal:5432/railway")
    settings = Settings()
    assert settings.database_url.startswith("postgresql+psycopg://")


def test_production_api_settings_accept_safe_config(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs().items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    validate_settings_for_role(settings)
    assert settings.api_docs_enabled is False
    assert settings.effective_db_pool_size == 5
    assert settings.refresh_cookie_samesite == "none"


def test_production_rejects_weak_jwt(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(JWT_SECRET="change-me").items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="JWT_SECRET"):
        validate_settings_for_role(settings)


def test_production_rejects_debug(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(DEBUG="true").items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="DEBUG"):
        validate_settings_for_role(settings)


def test_production_rejects_localhost_s3(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(
        S3_ENDPOINT="https://localhost:9000",
        S3_PUBLIC_ENDPOINT="https://localhost:9000",
    ).items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="localhost"):
        validate_settings_for_role(settings)


def test_production_rejects_insecure_http_s3(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(
        S3_ENDPOINT="http://bucket.railway.app",
        S3_PUBLIC_ENDPOINT="http://bucket.railway.app",
        S3_SECURE="true",
    ).items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="HTTPS"):
        validate_settings_for_role(settings)


def test_production_rejects_inconsistent_cookie_security(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(
        REFRESH_COOKIE_SECURE="false",
        REFRESH_COOKIE_SAMESITE="none",
    ).items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="REFRESH_COOKIE"):
        validate_settings_for_role(settings)


def test_api_role_does_not_require_cohere_key(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(COHERE_API_KEY="").items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    validate_settings_for_role(settings)


def test_worker_requires_cohere_when_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(
        SERVICE_ROLE="worker",
        STRUCTURED_EXTRACTION_ENABLED="true",
        STRUCTURED_EXTRACTION_PROVIDER="cohere",
        COHERE_API_KEY="",
        TRUSTED_HOSTS="",
        FRONTEND_ORIGINS="",
    ).items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    with pytest.raises(ConfigurationError, match="COHERE_API_KEY"):
        validate_settings_for_role(settings)


def test_worker_allows_missing_cohere_when_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    for key, value in _production_api_kwargs(
        SERVICE_ROLE="worker",
        STRUCTURED_EXTRACTION_ENABLED="false",
        COHERE_API_KEY="",
        TRUSTED_HOSTS="",
        FRONTEND_ORIGINS="",
    ).items():
        monkeypatch.setenv(key, str(value))
    settings = Settings()
    validate_settings_for_role(settings)
    assert settings.effective_db_pool_size == 2


def test_local_defaults_remain_permissive() -> None:
    clear_settings_cache()
    settings = Settings(
        APP_ENV="local",
        DEBUG=True,
        JWT_SECRET="change-me-in-production-use-a-long-random-secret",
    )
    validate_settings_for_role(settings)
    assert settings.api_docs_enabled is True


def test_frontend_origins_and_trusted_hosts_parsing(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    monkeypatch.setenv(
        "FRONTEND_ORIGINS",
        "https://a.vercel.app, https://b.example.com ",
    )
    monkeypatch.setenv("TRUSTED_HOSTS", "api.up.railway.app,*.up.railway.app")
    settings = Settings()
    assert settings.frontend_origins_list == [
        "https://a.vercel.app",
        "https://b.example.com",
    ]
    assert settings.trusted_hosts_list == ["api.up.railway.app", "*.up.railway.app"]
