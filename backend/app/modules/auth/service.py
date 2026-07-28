import uuid
from datetime import UTC, datetime

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import AppException
from app.models.enums import ACTIVE_ONBOARDING_STATUSES, OnboardingJourneyType, OnboardingStatus
from app.models.onboarding_application import OnboardingApplication
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.modules.auth.constants import AuthErrorCode, NextAction, redirect_for_next_action
from app.modules.auth.cookies import refresh_expires_at
from app.modules.auth.passwords import hash_password, verify_password
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    OnboardingSummaryResponse,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
)
from app.modules.auth.tokens import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)


def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone_e164,
        email_verified=user.email_verified_at is not None,
        is_active=user.is_active,
    )


def build_onboarding_summary(application: OnboardingApplication) -> OnboardingSummaryResponse:
    return OnboardingSummaryResponse(
        id=application.id,
        status=application.status,
        current_step=application.current_step,
        completed_steps=application.completed_steps or [],
    )


def resolve_onboarding_state(
    applications: list[OnboardingApplication],
) -> tuple[OnboardingApplication | None, NextAction]:
    sme_applications = [
        application
        for application in applications
        if application.journey_type == OnboardingJourneyType.SME
    ]
    if not sme_applications:
        return None, NextAction.START_SME_ONBOARDING

    active_applications = [
        application
        for application in sme_applications
        if application.status in ACTIVE_ONBOARDING_STATUSES
    ]
    if active_applications:
        active_applications.sort(key=lambda item: item.updated_at, reverse=True)
        return active_applications[0], NextAction.RESUME_SME_ONBOARDING

    submitted_applications = [
        application
        for application in sme_applications
        if application.status == OnboardingStatus.SUBMITTED
    ]
    if submitted_applications:
        submitted_applications.sort(key=lambda item: item.updated_at, reverse=True)
        return submitted_applications[0], NextAction.OPEN_DASHBOARD

    return None, NextAction.START_SME_ONBOARDING


def get_user_onboarding_state(
    db: Session,
    user_id: uuid.UUID,
) -> tuple[OnboardingApplication | None, NextAction]:
    applications = db.scalars(
        select(OnboardingApplication)
        .where(OnboardingApplication.user_id == user_id)
        .order_by(OnboardingApplication.updated_at.desc())
    ).all()
    return resolve_onboarding_state(list(applications))


def get_user_by_email_insensitive(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def create_refresh_session(
    db: Session,
    *,
    user_id: uuid.UUID,
    remember_me: bool,
    settings: Settings,
    user_agent: str | None = None,
    ip_address: str | None = None,
    rotated_from_session_id: uuid.UUID | None = None,
) -> tuple[RefreshSession, str]:
    refresh_token = generate_refresh_token()
    session = RefreshSession(
        user_id=user_id,
        token_hash=hash_refresh_token(refresh_token),
        remember_me=remember_me,
        expires_at=refresh_expires_at(remember_me=remember_me, settings=settings),
        rotated_from_session_id=rotated_from_session_id,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(session)
    return session, refresh_token


def register_user(
    db: Session,
    payload: RegisterRequest,
    *,
    settings: Settings,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[RegisterResponse, str]:
    if get_user_by_email_insensitive(db, payload.email):
        raise AppException(
            status_code=409,
            code=AuthErrorCode.EMAIL_ALREADY_REGISTERED,
            message="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone_e164=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    _, refresh_token = create_refresh_session(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        settings=settings,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    access_token, expires_in = create_access_token(user_id=user.id, settings=settings)
    response = RegisterResponse(
        user=build_user_response(user),
        access_token=access_token,
        expires_in=expires_in,
        next_action=NextAction.START_SME_ONBOARDING,
        redirect_to=redirect_for_next_action(NextAction.START_SME_ONBOARDING),
    )
    return response, refresh_token


def login_user(
    db: Session,
    payload: LoginRequest,
    *,
    settings: Settings,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[LoginResponse, str]:
    user = get_user_by_email_insensitive(db, payload.email)
    if user is None or not verify_password(user.password_hash, payload.password):
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_CREDENTIALS,
            message="Invalid email or password.",
        )

    if not user.is_active:
        raise AppException(
            status_code=403,
            code=AuthErrorCode.ACCOUNT_INACTIVE,
            message="This account is inactive.",
        )

    _, refresh_token = create_refresh_session(
        db,
        user_id=user.id,
        remember_me=payload.remember_me,
        settings=settings,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    onboarding_application, next_action = get_user_onboarding_state(db, user.id)
    access_token, expires_in = create_access_token(user_id=user.id, settings=settings)
    response = LoginResponse(
        user=build_user_response(user),
        onboarding=(
            build_onboarding_summary(onboarding_application)
            if onboarding_application is not None
            else None
        ),
        access_token=access_token,
        expires_in=expires_in,
        next_action=next_action,
        redirect_to=redirect_for_next_action(next_action),
    )
    return response, refresh_token


def refresh_access_token(
    db: Session,
    *,
    refresh_token: str | None,
    settings: Settings,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[RefreshResponse, str, bool]:
    if not refresh_token:
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_REFRESH_TOKEN,
            message="Refresh token is invalid or expired.",
        )

    token_hash = hash_refresh_token(refresh_token)
    session = db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash),
    )
    now = datetime.now(tz=UTC)
    if session is None or session.revoked_at is not None or session.expires_at <= now:
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_REFRESH_TOKEN,
            message="Refresh token is invalid or expired.",
        )

    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_REFRESH_TOKEN,
            message="Refresh token is invalid or expired.",
        )

    remember_me = session.remember_me
    session.revoked_at = now
    session.last_used_at = now
    _, new_refresh_token = create_refresh_session(
        db,
        user_id=user.id,
        remember_me=remember_me,
        settings=settings,
        user_agent=user_agent,
        ip_address=ip_address,
        rotated_from_session_id=session.id,
    )

    access_token, expires_in = create_access_token(user_id=user.id, settings=settings)
    return (
        RefreshResponse(access_token=access_token, expires_in=expires_in),
        new_refresh_token,
        remember_me,
    )


def logout_user(
    db: Session,
    *,
    refresh_token: str | None,
) -> None:
    if not refresh_token:
        return

    token_hash = hash_refresh_token(refresh_token)
    session = db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash),
    )
    if session is None or session.revoked_at is not None:
        return

    session.revoked_at = datetime.now(tz=UTC)


def get_me_response(db: Session, user: User) -> MeResponse:
    onboarding_application, next_action = get_user_onboarding_state(db, user.id)
    return MeResponse(
        user=build_user_response(user),
        onboarding=(
            build_onboarding_summary(onboarding_application)
            if onboarding_application is not None
            else None
        ),
        next_action=next_action,
        redirect_to=redirect_for_next_action(next_action),
    )


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client is None:
        return None
    return request.client.host
