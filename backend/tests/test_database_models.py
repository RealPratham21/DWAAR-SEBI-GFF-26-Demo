import pytest
from app.db.health import check_database_connection
from app.models.enums import OnboardingCurrentStep, OnboardingStatus
from app.models.onboarding_application import OnboardingApplication
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from tests.conftest import (
    make_onboarding_application,
    make_refresh_session,
    make_user,
)

pytestmark = pytest.mark.postgres


def test_database_connection(db_session: Session) -> None:
    check_database_connection(db_session)


def test_case_insensitive_email_uniqueness(db_session: Session) -> None:
    db_session.add(make_user(email="Person@Example.com"))
    db_session.commit()

    db_session.add(make_user(email="person@example.com"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_refresh_session_token_hash_uniqueness(db_session: Session) -> None:
    user = make_user(email="session-user@example.com")
    db_session.add(user)
    db_session.commit()

    db_session.add(make_refresh_session(user.id, token_hash="same-token-hash"))
    db_session.commit()

    db_session.add(make_refresh_session(user.id, token_hash="same-token-hash"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_onboarding_jsonb_defaults(db_session: Session) -> None:
    user = make_user(email="onboarding-defaults@example.com")
    db_session.add(user)
    db_session.commit()

    application = make_onboarding_application(user.id)
    db_session.add(application)
    db_session.commit()
    db_session.refresh(application)

    assert application.completed_steps == []
    assert application.draft_data == {}
    assert application.schema_version == 1
    assert application.version == 1


def test_only_one_active_sme_onboarding_application_per_user(db_session: Session) -> None:
    user = make_user(email="active-sme@example.com")
    db_session.add(user)
    db_session.commit()

    db_session.add(make_onboarding_application(user.id, status=OnboardingStatus.DRAFT))
    db_session.commit()

    db_session.add(
        make_onboarding_application(
            user.id,
            status=OnboardingStatus.IN_PROGRESS,
            current_step=OnboardingCurrentStep.COMPANY_IDENTITY,
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_multiple_cancelled_or_submitted_onboarding_records_allowed(db_session: Session) -> None:
    user = make_user(email="historical-sme@example.com")
    db_session.add(user)
    db_session.commit()

    db_session.add(make_onboarding_application(user.id, status=OnboardingStatus.SUBMITTED))
    db_session.add(make_onboarding_application(user.id, status=OnboardingStatus.CANCELLED))
    db_session.commit()

    applications = db_session.query(OnboardingApplication).filter_by(user_id=user.id).all()
    assert len(applications) == 2
