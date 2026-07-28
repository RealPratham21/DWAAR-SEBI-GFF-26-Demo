import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client


@pytest.mark.asyncio
async def test_liveness_returns_alive(client: AsyncClient) -> None:
    response = await client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_api_health_returns_service_metadata(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Dwaar API"
    assert payload["version"] == "0.1.0"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_readiness_returns_ready(client: AsyncClient) -> None:
    response = await client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "connected"}


@pytest.mark.asyncio
async def test_readiness_returns_service_unavailable_when_database_unavailable(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from sqlalchemy.exc import SQLAlchemyError

    def fail_check(_db: object) -> None:
        raise SQLAlchemyError("database unavailable")

    monkeypatch.setattr("app.modules.health.router.check_database_connection", fail_check)

    response = await client.get("/health/ready")

    assert response.status_code == 503
    payload = response.json()
    assert payload["error"]["code"] == "service_unavailable"
    assert payload["error"]["message"] == "Database is unavailable"
    assert payload["error"]["details"] == {"database": "disconnected"}
