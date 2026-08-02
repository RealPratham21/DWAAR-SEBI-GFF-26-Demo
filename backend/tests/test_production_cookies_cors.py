"""Cookie flag and CORS origin behaviour for production vs local."""

from __future__ import annotations

import pytest
from app.core.config import Settings, clear_settings_cache, get_settings
from app.main import create_application
from app.modules.auth.cookies import clear_refresh_cookie, set_refresh_cookie
from fastapi import Response
from httpx import ASGITransport, AsyncClient


def test_production_refresh_cookie_flags() -> None:
    settings = Settings(
        APP_ENV="production",
        REFRESH_COOKIE_SECURE=True,
        REFRESH_COOKIE_SAMESITE="none",
        REFRESH_COOKIE_PATH="/api/v1/auth",
        REFRESH_COOKIE_NAME="dwaar_refresh",
        REFRESH_COOKIE_DOMAIN=None,
    )
    response = Response()
    set_refresh_cookie(
        response,
        refresh_token="token-value",
        remember_me=False,
        settings=settings,
    )
    header = response.headers.get("set-cookie", "")
    assert "dwaar_refresh=token-value" in header
    assert "HttpOnly" in header
    assert "Secure" in header
    assert "SameSite=none" in header or "SameSite=None" in header
    assert "Path=/api/v1/auth" in header
    assert "Domain=" not in header


def test_development_refresh_cookie_flags() -> None:
    settings = Settings(
        APP_ENV="local",
        REFRESH_COOKIE_SECURE=False,
        REFRESH_COOKIE_SAMESITE="lax",
        REFRESH_COOKIE_PATH="/api/v1/auth",
        REFRESH_COOKIE_NAME="dwaar_refresh",
    )
    response = Response()
    set_refresh_cookie(
        response,
        refresh_token="dev-token",
        remember_me=False,
        settings=settings,
    )
    header = response.headers.get("set-cookie", "")
    assert "HttpOnly" in header
    assert "SameSite=lax" in header or "SameSite=Lax" in header
    assert "Secure" not in header


def test_clear_refresh_cookie_emits_expiry() -> None:
    settings = Settings(
        REFRESH_COOKIE_SECURE=True,
        REFRESH_COOKIE_SAMESITE="none",
        REFRESH_COOKIE_PATH="/api/v1/auth",
        REFRESH_COOKIE_NAME="dwaar_refresh",
    )
    response = Response()
    clear_refresh_cookie(response, settings=settings)
    header = response.headers.get("set-cookie", "")
    assert "dwaar_refresh=" in header
    assert "Max-Age=0" in header or "max-age=0" in header.lower()


@pytest.fixture
def _bypass_startup(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.validate_runtime_configuration", lambda _s: None)
    monkeypatch.setattr("app.main.wait_for_database", lambda _s: None)


@pytest.mark.asyncio
async def test_cors_allows_configured_origin(
    monkeypatch: pytest.MonkeyPatch,
    _bypass_startup: None,
) -> None:
    clear_settings_cache()
    monkeypatch.setenv("FRONTEND_ORIGINS", "https://dwaar.vercel.app")
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("DEBUG", "true")
    clear_settings_cache()
    application = create_application()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://dwaar.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://dwaar.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_rejects_unknown_origin(
    monkeypatch: pytest.MonkeyPatch,
    _bypass_startup: None,
) -> None:
    clear_settings_cache()
    monkeypatch.setenv("FRONTEND_ORIGINS", "https://dwaar.vercel.app")
    monkeypatch.setenv("APP_ENV", "local")
    clear_settings_cache()
    application = create_application()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://evil.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.headers.get("access-control-allow-origin") != "https://evil.example.com"


def test_api_docs_disabled_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_settings_cache()
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DEBUG", "false")
    monkeypatch.setenv("ENABLE_API_DOCS", "false")
    monkeypatch.setenv(
        "JWT_SECRET",
        "a-sufficiently-long-production-jwt-secret-value",
    )
    monkeypatch.setenv("FRONTEND_ORIGINS", "https://dwaar.vercel.app")
    monkeypatch.setenv("TRUSTED_HOSTS", "testserver,test")
    monkeypatch.setenv("REFRESH_COOKIE_SECURE", "true")
    monkeypatch.setenv("REFRESH_COOKIE_SAMESITE", "none")
    monkeypatch.setenv("S3_ENDPOINT", "https://storage.railway.app")
    monkeypatch.setenv("S3_PUBLIC_ENDPOINT", "https://storage.railway.app")
    monkeypatch.setenv("S3_ACCESS_KEY", "key")
    monkeypatch.setenv("S3_SECRET_KEY", "secret")
    monkeypatch.setenv("S3_SECURE", "true")
    clear_settings_cache()
    settings = get_settings()
    assert settings.api_docs_enabled is False
    application = create_application()
    assert application.docs_url is None
    assert application.redoc_url is None
    assert application.openapi_url is None
