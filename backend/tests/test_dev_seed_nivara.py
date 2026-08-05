"""Tests for gated Nivara seed endpoint."""

from __future__ import annotations

import pytest
from app.core.config import clear_settings_cache
from app.main import create_application
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def _bypass_startup(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.validate_runtime_configuration", lambda _s: None)
    monkeypatch.setattr("app.main.wait_for_database", lambda _s: None)


@pytest.mark.asyncio
async def test_seed_nivara_disabled_returns_404(
    monkeypatch: pytest.MonkeyPatch,
    _bypass_startup: None,
) -> None:
    clear_settings_cache()
    monkeypatch.setenv("ENABLE_DEV_SEED", "false")
    monkeypatch.setenv("DEV_SEED_SECRET", "test-secret")
    clear_settings_cache()
    application = create_application()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/dev/seed-nivara",
            headers={"X-Dev-Seed-Secret": "test-secret"},
            json={},
        )
    assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_seed_nivara_creates_ready_user(
    monkeypatch: pytest.MonkeyPatch,
    auth_client: AsyncClient,
) -> None:
    clear_settings_cache()
    monkeypatch.setenv("ENABLE_DEV_SEED", "true")
    monkeypatch.setenv("DEV_SEED_SECRET", "test-seed-secret")
    clear_settings_cache()

    # Use the shared auth_client app settings via env; recreate not needed if get_settings
    # is cleared and auth_client already has lifespan bypassed through conftest.
    from app.core.config import get_settings

    get_settings.cache_clear()

    response = await auth_client.post(
        "/api/v1/dev/seed-nivara",
        headers={"X-Dev-Seed-Secret": "test-seed-secret"},
        json={},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["email"]
    assert body["password"] == "Password1"
    assert body["company"] == "Nivara Techfab Private Limited"
    assert body["nextAction"] == "open_dashboard"

    login = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": body["email"], "password": body["password"], "rememberMe": False},
    )
    assert login.status_code == 200
    assert login.json()["nextAction"] == "open_dashboard"

    token = login.json()["accessToken"]
    docs = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert docs.status_code == 200
