import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.enums import (
    ACTIVE_ONBOARDING_STATUSES,
    OnboardingCurrentStep,
    OnboardingJourneyType,
    OnboardingStatus,
)
from app.models.onboarding_application import OnboardingApplication
from app.models.user import User
from app.modules.onboarding.constants import OnboardingErrorCode
from app.modules.onboarding.sme.defaults import empty_draft_data
from app.modules.onboarding.sme.schemas import (
    STEP_MODELS,
    OnboardingApplicationResponse,
    OnboardingSummaryOnlyResponse,
    SubmitOnboardingRequest,
    SubmitOnboardingResponse,
)
from app.modules.onboarding.sme.step_mappings import (
    NEXT_STEP_AFTER,
    REQUIRED_SUBMIT_STEPS,
    STEP_TO_DRAFT_KEY,
)


def _validation_details(error: ValidationError) -> list[dict[str, str]]:
    details: list[dict[str, str]] = []
    for issue in error.errors():
        field = ".".join(str(part) for part in issue.get("loc", ()))
        details.append({"field": field, "message": issue.get("msg", "Invalid value")})
    return details


def validate_step_payload(step: str, payload: dict[str, Any]) -> dict[str, Any]:
    model = STEP_MODELS.get(step)
    if model is None:
        msg = "Unknown onboarding step"
        raise AppException(
            status_code=400,
            code=OnboardingErrorCode.ONBOARDING_VALIDATION_ERROR,
            message=msg,
        )
    try:
        validated = model.model_validate(payload)
    except ValidationError as error:
        raise AppException(
            status_code=422,
            code=OnboardingErrorCode.ONBOARDING_VALIDATION_ERROR,
            message="Please check the highlighted fields and try again.",
            details=_validation_details(error),
        ) from error
    return validated.model_dump(by_alias=True)


def build_application_response(application: OnboardingApplication) -> OnboardingApplicationResponse:
    return OnboardingApplicationResponse(
        id=str(application.id),
        status=application.status,
        current_step=application.current_step,
        completed_steps=list(application.completed_steps or []),
        draft_data=dict(application.draft_data or {}),
        schema_version=application.schema_version,
        version=application.version,
        submitted_at=application.submitted_at,
    )


def build_summary_response(application: OnboardingApplication) -> OnboardingSummaryOnlyResponse:
    return OnboardingSummaryOnlyResponse(
        id=str(application.id),
        status=application.status,
        current_step=application.current_step,
        completed_steps=list(application.completed_steps or []),
    )


def get_owned_application(
    db: Session,
    *,
    user: User,
    onboarding_id: uuid.UUID,
) -> OnboardingApplication:
    application = db.get(OnboardingApplication, onboarding_id)
    if application is None:
        raise AppException(
            status_code=404,
            code=OnboardingErrorCode.ONBOARDING_NOT_FOUND,
            message="Onboarding application not found.",
        )
    if application.user_id != user.id:
        raise AppException(
            status_code=403,
            code=OnboardingErrorCode.ONBOARDING_FORBIDDEN,
            message="You do not have access to this onboarding application.",
        )
    return application


def ensure_editable(application: OnboardingApplication) -> None:
    if application.status == OnboardingStatus.SUBMITTED:
        raise AppException(
            status_code=409,
            code=OnboardingErrorCode.ONBOARDING_ALREADY_SUBMITTED,
            message="This onboarding application has already been submitted.",
        )


def get_active_sme_application(db: Session, user_id: uuid.UUID) -> OnboardingApplication | None:
    return db.scalar(
        select(OnboardingApplication)
        .where(
            OnboardingApplication.user_id == user_id,
            OnboardingApplication.journey_type == OnboardingJourneyType.SME,
            OnboardingApplication.status.in_(ACTIVE_ONBOARDING_STATUSES),
        )
        .order_by(OnboardingApplication.updated_at.desc())
        .limit(1),
    )


def create_or_get_sme_application(db: Session, user: User) -> OnboardingApplication:
    existing = get_active_sme_application(db, user.id)
    if existing is not None:
        return existing

    application = OnboardingApplication(
        user_id=user.id,
        journey_type=OnboardingJourneyType.SME,
        status=OnboardingStatus.DRAFT,
        current_step=OnboardingCurrentStep.ROLE_AUTHORITY,
        completed_steps=[],
        draft_data=empty_draft_data(),
    )
    db.add(application)
    db.flush()
    return application


def get_current_sme_application(db: Session, user: User) -> OnboardingApplication | None:
    active = get_active_sme_application(db, user.id)
    if active is not None:
        return active
    return db.scalar(
        select(OnboardingApplication)
        .where(
            OnboardingApplication.user_id == user.id,
            OnboardingApplication.journey_type == OnboardingJourneyType.SME,
        )
        .order_by(OnboardingApplication.updated_at.desc())
        .limit(1),
    )


def save_step(
    db: Session,
    *,
    application: OnboardingApplication,
    step: str,
    payload: dict[str, Any],
) -> OnboardingApplication:
    ensure_editable(application)
    validated = validate_step_payload(step, payload)
    draft_key = STEP_TO_DRAFT_KEY[step]
    draft_data = dict(application.draft_data or {})
    draft_data[draft_key] = validated

    completed_steps = list(application.completed_steps or [])
    if step not in completed_steps:
        completed_steps.append(step)

    application.draft_data = draft_data
    application.completed_steps = completed_steps
    application.status = OnboardingStatus.IN_PROGRESS
    application.current_step = NEXT_STEP_AFTER[step]
    application.version += 1
    db.add(application)
    db.flush()
    return application


def submit_application(
    db: Session,
    *,
    application: OnboardingApplication,
    payload: SubmitOnboardingRequest,
) -> SubmitOnboardingResponse:
    ensure_editable(application)
    draft_data = dict(application.draft_data or {})
    completed_steps = set(application.completed_steps or [])

    missing_steps = [step for step in REQUIRED_SUBMIT_STEPS if step not in completed_steps]
    if missing_steps:
        raise AppException(
            status_code=422,
            code=OnboardingErrorCode.ONBOARDING_INCOMPLETE,
            message="Complete all required onboarding steps before submitting.",
            details={"missingSteps": missing_steps},
        )

    for step in REQUIRED_SUBMIT_STEPS:
        draft_key = STEP_TO_DRAFT_KEY[step]
        section = draft_data.get(draft_key)
        if section is None:
            raise AppException(
                status_code=422,
                code=OnboardingErrorCode.ONBOARDING_INCOMPLETE,
                message="Complete all required onboarding steps before submitting.",
            )
        validate_step_payload(step, section)

    confirmations = validate_step_payload(
        OnboardingCurrentStep.REVIEW_SUBMIT,
        payload.submission_confirmations.model_dump(by_alias=True),
    )
    draft_data["submissionConfirmations"] = confirmations
    application.draft_data = draft_data
    application.status = OnboardingStatus.SUBMITTED
    application.current_step = OnboardingCurrentStep.REVIEW_SUBMIT
    if OnboardingCurrentStep.REVIEW_SUBMIT not in completed_steps:
        completed_steps.add(OnboardingCurrentStep.REVIEW_SUBMIT)
    application.completed_steps = list(completed_steps)
    application.submitted_at = datetime.now(tz=UTC)
    application.version += 1
    db.add(application)
    db.flush()
    return SubmitOnboardingResponse(id=str(application.id), status=application.status)
