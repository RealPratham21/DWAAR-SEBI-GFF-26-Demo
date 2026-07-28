import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.core.config import get_settings
from app.models.enums import OnboardingCurrentStep, OnboardingStatus
from app.models.onboarding_application import OnboardingApplication
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.modules.auth.passwords import verify_password
from app.modules.auth.tokens import hash_refresh_token
from httpx import AsyncClient
from sqlalchemy import func, select

from tests.conftest import make_onboarding_application, register_payload


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_register_success(auth_client: AsyncClient, db_session) -> None:
    response = await auth_client.post("/api/v1/auth/register", json=register_payload())

    assert response.status_code == 200
    payload = response.json()
    assert payload["tokenType"] == "bearer"
    assert payload["nextAction"] == "start_sme_onboarding"
    assert payload["user"]["email"] == "jane@example.com"
    assert payload["user"]["phone"] == "+919876543210"
    assert payload["user"]["fullName"] == "Jane Doe"
    assert "accessToken" in payload
    assert "refreshToken" not in payload

    user = db_session.scalar(select(User).where(User.email == "jane@example.com"))
    assert user is not None
    assert user.phone_e164 == "+919876543210"
    assert verify_password(user.password_hash, "Password1")

    sessions = db_session.scalars(
        select(RefreshSession).where(RefreshSession.user_id == user.id)
    ).all()
    assert len(sessions) == 1
    assert sessions[0].token_hash != response.cookies.get("dwaar_refresh")
    assert sessions[0].revoked_at is None

    onboarding_count = db_session.scalar(
        select(func.count()).select_from(OnboardingApplication),
    )
    assert onboarding_count == 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_register_normalizes_email_and_phone(auth_client: AsyncClient, db_session) -> None:
    response = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(
            email="  JANE@Example.COM ",
            phone="+91 98765 43210",
            fullName="  Jane Doe  ",
        ),
    )

    assert response.status_code == 200
    user = db_session.scalar(select(User))
    assert user is not None
    assert user.email == "jane@example.com"
    assert user.phone_e164 == "+919876543210"
    assert user.full_name == "Jane Doe"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_register_rejects_duplicate_email_case_insensitively(
    auth_client: AsyncClient,
) -> None:
    first = await auth_client.post("/api/v1/auth/register", json=register_payload())
    assert first.status_code == 200

    second = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="JANE@example.com"),
    )

    assert second.status_code == 409
    assert second.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_register_sets_httponly_refresh_cookie(auth_client: AsyncClient) -> None:
    response = await auth_client.post("/api/v1/auth/register", json=register_payload())

    set_cookie = response.headers.get("set-cookie", "")
    assert "dwaar_refresh=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/api/v1/auth" in set_cookie


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_login_success(auth_client: AsyncClient) -> None:
    await auth_client.post("/api/v1/auth/register", json=register_payload())

    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "Password1", "rememberMe": False},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accessToken"]
    assert payload["nextAction"] == "start_sme_onboarding"
    assert payload["onboarding"] is None


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_login_invalid_credentials_are_generic(auth_client: AsyncClient) -> None:
    await auth_client.post("/api/v1/auth/register", json=register_payload())

    unknown_email = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "Password1"},
    )
    wrong_password = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "WrongPass1"},
    )

    assert unknown_email.status_code == 401
    assert wrong_password.status_code == 401
    assert unknown_email.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert wrong_password.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert unknown_email.json()["error"]["message"] == wrong_password.json()["error"]["message"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_login_rejects_inactive_user(auth_client: AsyncClient, db_session) -> None:
    await auth_client.post(
        "/api/v1/auth/register", json=register_payload(email="inactive@example.com")
    )

    user = db_session.scalar(select(User).where(User.email == "inactive@example.com"))
    assert user is not None
    user.is_active = False
    db_session.commit()

    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "Password1"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCOUNT_INACTIVE"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_me_requires_valid_access_token(auth_client: AsyncClient) -> None:
    unauthorized = await auth_client.get("/api/v1/auth/me")
    assert unauthorized.status_code == 401
    assert unauthorized.json()["error"]["code"] == "INVALID_ACCESS_TOKEN"

    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    access_token = register.json()["accessToken"]

    authorized = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert authorized.status_code == 200
    assert authorized.json()["nextAction"] == "start_sme_onboarding"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_me_onboarding_states(auth_client: AsyncClient, db_session) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    user_id = uuid.UUID(register.json()["user"]["id"])
    access_token = register.json()["accessToken"]

    draft = make_onboarding_application(
        user_id,
        status=OnboardingStatus.DRAFT,
        current_step=OnboardingCurrentStep.COMPANY_IDENTITY,
    )
    draft.completed_steps = ["role_authority"]
    db_session.add(draft)
    db_session.commit()

    resume = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    payload = resume.json()
    assert payload["nextAction"] == "resume_sme_onboarding"
    assert payload["onboarding"]["status"] == "draft"
    assert payload["onboarding"]["currentStep"] == "company_identity"
    assert "draftData" not in payload["onboarding"]

    draft.status = OnboardingStatus.SUBMITTED
    db_session.commit()

    submitted = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert submitted.json()["nextAction"] == "open_dashboard"
    assert submitted.json()["redirectTo"] == "/projects/demo"

    draft.status = OnboardingStatus.CANCELLED
    db_session.commit()

    cancelled = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert cancelled.json()["nextAction"] == "start_sme_onboarding"
    assert cancelled.json()["onboarding"] is None


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_refresh_rotates_token_and_rejects_reuse(
    auth_client: AsyncClient, db_session
) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    old_cookie = register.cookies.get("dwaar_refresh")
    assert old_cookie

    refresh = await auth_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    assert "accessToken" in refresh.json()
    new_cookie = refresh.cookies.get("dwaar_refresh")
    assert new_cookie
    assert new_cookie != old_cookie

    old_session = db_session.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_refresh_token(old_cookie)),
    )
    new_session = db_session.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_refresh_token(new_cookie)),
    )
    assert old_session is not None and old_session.revoked_at is not None
    assert new_session is not None and new_session.rotated_from_session_id == old_session.id

    reuse = await auth_client.post(
        "/api/v1/auth/refresh",
        cookies={"dwaar_refresh": old_cookie},
    )
    assert reuse.status_code == 401
    assert reuse.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_remember_me_uses_longer_refresh_expiry(auth_client: AsyncClient, db_session) -> None:
    response = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(rememberMe=True),
    )
    assert response.status_code == 200

    session = db_session.scalar(select(RefreshSession))
    assert session is not None
    assert session.remember_me is True
    expected = datetime.now(tz=UTC) + timedelta(days=30)
    assert abs((session.expires_at - expected).total_seconds()) < 120

    set_cookie = response.headers.get("set-cookie", "")
    assert "Max-Age=2592000" in set_cookie


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_logout_is_idempotent(auth_client: AsyncClient, db_session) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    cookie = register.cookies.get("dwaar_refresh")

    first = await auth_client.post("/api/v1/auth/logout")
    assert first.status_code == 200
    assert first.json()["success"] is True

    session = db_session.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_refresh_token(cookie)),
    )
    assert session is not None and session.revoked_at is not None

    second = await auth_client.post("/api/v1/auth/logout")
    assert second.status_code == 200


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_access_token_contains_only_required_claims(auth_client: AsyncClient) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    token = register.json()["accessToken"]
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])

    assert set(payload.keys()) == {"sub", "type", "jti", "iat", "exp"}
    assert payload["type"] == "access"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_no_plaintext_password_or_refresh_token_stored(
    auth_client: AsyncClient, db_session
) -> None:
    response = await auth_client.post("/api/v1/auth/register", json=register_payload())
    cookie = response.cookies.get("dwaar_refresh")

    user = db_session.scalar(select(User))
    session = db_session.scalar(select(RefreshSession))
    assert user is not None and session is not None
    assert user.password_hash != "Password1"
    assert session.token_hash == hash_refresh_token(cookie)
    assert session.token_hash != cookie
