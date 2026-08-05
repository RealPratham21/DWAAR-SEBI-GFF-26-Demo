"""Gated Nivara test-user bootstrap (skip UI onboarding)."""

from __future__ import annotations

import secrets

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import AppException
from app.modules.auth.schemas import RegisterRequest
from app.modules.auth.service import register_user
from app.modules.company_incorporation.service import initialize_or_get_workspace
from app.modules.dev.nivara_seed_data import NIVARA_ONBOARDING_STEPS
from app.modules.onboarding.sme.schemas import (
    SubmissionConfirmationsData,
    SubmitOnboardingRequest,
)
from app.modules.onboarding.sme.service import (
    create_or_get_sme_application,
    save_step,
    submit_application,
)

DEFAULT_PASSWORD = "Password1"
DEFAULT_FULL_NAME = "Nivara Demo User"


def assert_dev_seed_allowed(settings: Settings, *, provided_secret: str | None) -> None:
    if not settings.enable_dev_seed:
        raise AppException(
            status_code=404,
            code="NOT_FOUND",
            message="Not found",
        )
    expected = settings.dev_seed_secret.strip()
    if not expected or not provided_secret or not secrets.compare_digest(provided_secret, expected):
        raise AppException(
            status_code=401,
            code="DEV_SEED_UNAUTHORIZED",
            message="Invalid or missing seed secret.",
        )


def seed_nivara_ready_user(
    db: Session,
    *,
    settings: Settings,
    email: str | None = None,
    password: str | None = None,
    full_name: str | None = None,
) -> dict[str, object]:
    """Register + complete Nivara SME onboarding + init CI workspace."""
    suffix = secrets.token_hex(5)
    resolved_email = (email or f"nivara.seed.{suffix}@example.com").strip().lower()
    resolved_password = password or DEFAULT_PASSWORD
    resolved_name = full_name or DEFAULT_FULL_NAME
    # Unique-looking phone; not unique-constrained, but avoids collisions in demos.
    phone = f"+9198{secrets.randbelow(100_000_000):08d}"

    register_response, _refresh = register_user(
        db,
        RegisterRequest(
            fullName=resolved_name,
            email=resolved_email,
            phone=phone,
            password=resolved_password,
            rememberMe=False,
        ),
        settings=settings,
    )
    user_id = register_response.user.id

    from app.models.user import User

    user = db.get(User, user_id)
    if user is None:
        raise AppException(
            status_code=500,
            code="DEV_SEED_FAILED",
            message="Seed user was not created.",
        )

    application = create_or_get_sme_application(db, user)
    for step, payload in NIVARA_ONBOARDING_STEPS:
        save_step(db, application=application, step=step, payload=payload)

    submit_application(
        db,
        application=application,
        payload=SubmitOnboardingRequest(
            submission_confirmations=SubmissionConfirmationsData(
                confirm_accuracy=True,
                confirm_authorised=True,
                confirm_verification=True,
                agree_terms=True,
            )
        ),
    )
    workspace = initialize_or_get_workspace(db, user)
    db.commit()

    return {
        "email": resolved_email,
        "password": resolved_password,
        "fullName": resolved_name,
        "userId": str(user.id),
        "onboardingId": str(application.id),
        "workspaceId": str(workspace.id),
        "nextAction": "open_dashboard",
        "loginHint": "POST /api/v1/auth/login with the email/password above, then open /projects/demo",
        "company": "Nivara Techfab Private Limited",
    }
