import os
import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.main import app
from app.models.enums import OnboardingCurrentStep, OnboardingJourneyType, OnboardingStatus
from app.models.onboarding_application import OnboardingApplication
from app.models.refresh_session import RefreshSession
from app.models.user import User
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker


def _resolve_database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    if _resolve_database_url():
        return

    skip_postgres = pytest.mark.skip(reason="PostgreSQL DATABASE_URL not configured")
    for item in items:
        if "postgres" in item.keywords:
            item.add_marker(skip_postgres)


@pytest.fixture(scope="session")
def database_url() -> str:
    url = _resolve_database_url()
    if not url:
        pytest.skip("PostgreSQL DATABASE_URL not configured")
    return url


@pytest.fixture(scope="session")
def engine(database_url: str):
    eng = create_engine(database_url, pool_pre_ping=True)
    yield eng
    eng.dispose()


@pytest.fixture(scope="session", autouse=True)
def apply_migrations() -> Generator[None, None, None]:
    url = _resolve_database_url()
    if not url:
        yield
        return

    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", url)
    command.upgrade(alembic_cfg, "head")
    yield


@pytest.fixture
def db_session(engine) -> Generator[Session, None, None]:
    session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    yield session
    session.rollback()
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE TABLE drhp_snapshot_items, drhp_source_snapshots, "
                "fact_issue_resolutions, fact_issue_assertions, fact_issues, "
                "fact_assertion_reviews, fact_evidence_references, fact_assertions, "
                "structured_extraction_runs, document_pages, document_processing_runs, "
                "document_versions, documents, user_notifications, "
                "ipo_setup_eligibility_workspaces, "
                "capital_ownership_workspaces, "
                "business_operations_workspaces, "
                "objects_issue_workspaces, "
                "company_incorporation_workspaces, "
                "refresh_sessions, onboarding_applications, users RESTART IDENTITY CASCADE"
            )
        )
        session.close()


def make_user(*, email: str = "user@example.com") -> User:
    return User(
        full_name="Test User",
        email=email,
        phone_e164="+919876543210",
        password_hash="hashed-password-placeholder",
    )


def make_refresh_session(user_id: uuid.UUID, *, token_hash: str) -> RefreshSession:
    return RefreshSession(
        user_id=user_id,
        token_hash=token_hash,
        remember_me=False,
        expires_at=datetime.now(tz=UTC) + timedelta(days=7),
    )


def make_onboarding_application(
    user_id: uuid.UUID,
    *,
    status: str = OnboardingStatus.DRAFT,
    current_step: str = OnboardingCurrentStep.ROLE_AUTHORITY,
) -> OnboardingApplication:
    return OnboardingApplication(
        user_id=user_id,
        journey_type=OnboardingJourneyType.SME,
        status=status,
        current_step=current_step,
    )


@pytest.fixture(autouse=True)
def auth_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "test-jwt-secret-key-minimum-32-characters-long")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    monkeypatch.setenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    monkeypatch.setenv("REFRESH_TOKEN_REMEMBER_ME_EXPIRE_DAYS", "30")
    monkeypatch.setenv("REFRESH_COOKIE_NAME", "dwaar_refresh")
    monkeypatch.setenv("REFRESH_COOKIE_PATH", "/api/v1/auth")
    monkeypatch.setenv("REFRESH_COOKIE_SECURE", "false")
    monkeypatch.setenv("REFRESH_COOKIE_SAMESITE", "lax")
    get_settings.cache_clear()
    from app.storage.s3 import get_object_storage

    get_object_storage.cache_clear()


@pytest.fixture
def truncate_auth_tables(engine) -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE TABLE drhp_snapshot_items, drhp_source_snapshots, "
                "fact_issue_resolutions, fact_issue_assertions, fact_issues, "
                "fact_assertion_reviews, fact_evidence_references, fact_assertions, "
                "structured_extraction_runs, document_pages, document_processing_runs, "
                "document_versions, documents, user_notifications, "
                "ipo_setup_eligibility_workspaces, "
                "capital_ownership_workspaces, "
                "business_operations_workspaces, "
                "objects_issue_workspaces, "
                "company_incorporation_workspaces, "
                "refresh_sessions, onboarding_applications, users RESTART IDENTITY CASCADE"
            )
        )


@pytest.fixture
async def auth_client(truncate_auth_tables) -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client


def register_payload(**overrides: object) -> dict[str, object]:
    payload = {
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "phone": "9876543210",
        "password": "Password1",
        "rememberMe": False,
    }
    payload.update(overrides)
    return payload
