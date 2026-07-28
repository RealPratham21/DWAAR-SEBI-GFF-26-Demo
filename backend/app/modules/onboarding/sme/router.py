import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.onboarding.sme.schemas import (
    BusinessClassificationStepData,
    CompanyIdentityStepData,
    InitialDocumentsStepData,
    IpoIntentStepData,
    OnboardingApplicationResponse,
    OwnershipSnapshotStepData,
    RoleAuthorityStepData,
    SubmitOnboardingRequest,
    SubmitOnboardingResponse,
)
from app.modules.onboarding.sme.service import (
    build_application_response,
    create_or_get_sme_application,
    get_current_sme_application,
    get_owned_application,
    save_step,
    submit_application,
)

router = APIRouter(prefix="/sme", tags=["onboarding"])


@router.post("", response_model=OnboardingApplicationResponse)
def create_sme_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    application = create_or_get_sme_application(db, current_user)
    db.commit()
    return build_application_response(application)


@router.get("/current", response_model=OnboardingApplicationResponse)
def get_current_sme_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    application = get_current_sme_application(db, current_user)
    if application is None:
        application = create_or_get_sme_application(db, current_user)
    db.commit()
    return build_application_response(application)


@router.get("/{onboarding_id}", response_model=OnboardingApplicationResponse)
def get_sme_onboarding(
    onboarding_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    application = get_owned_application(db, user=current_user, onboarding_id=onboarding_id)
    return build_application_response(application)


def _patch_step(
    onboarding_id: uuid.UUID,
    step: str,
    payload: dict,
    db: Session,
    current_user: User,
) -> OnboardingApplicationResponse:
    application = get_owned_application(db, user=current_user, onboarding_id=onboarding_id)
    save_step(db, application=application, step=step, payload=payload)
    db.commit()
    db.refresh(application)
    return build_application_response(application)


@router.patch("/{onboarding_id}/role-authority", response_model=OnboardingApplicationResponse)
def patch_role_authority(
    onboarding_id: uuid.UUID,
    payload: RoleAuthorityStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "role_authority",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.patch("/{onboarding_id}/company-identity", response_model=OnboardingApplicationResponse)
def patch_company_identity(
    onboarding_id: uuid.UUID,
    payload: CompanyIdentityStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "company_identity",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.patch(
    "/{onboarding_id}/business-classification",
    response_model=OnboardingApplicationResponse,
)
def patch_business_classification(
    onboarding_id: uuid.UUID,
    payload: BusinessClassificationStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "business_classification",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.patch("/{onboarding_id}/ownership-snapshot", response_model=OnboardingApplicationResponse)
def patch_ownership_snapshot(
    onboarding_id: uuid.UUID,
    payload: OwnershipSnapshotStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "ownership_snapshot",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.patch("/{onboarding_id}/ipo-intent", response_model=OnboardingApplicationResponse)
def patch_ipo_intent(
    onboarding_id: uuid.UUID,
    payload: IpoIntentStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "ipo_intent",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.patch("/{onboarding_id}/initial-documents", response_model=OnboardingApplicationResponse)
def patch_initial_documents(
    onboarding_id: uuid.UUID,
    payload: InitialDocumentsStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingApplicationResponse:
    return _patch_step(
        onboarding_id,
        "initial_documents",
        payload.model_dump(by_alias=True),
        db,
        current_user,
    )


@router.post("/{onboarding_id}/submit", response_model=SubmitOnboardingResponse)
def post_submit(
    onboarding_id: uuid.UUID,
    payload: SubmitOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubmitOnboardingResponse:
    application = get_owned_application(db, user=current_user, onboarding_id=onboarding_id)
    response = submit_application(db, application=application, payload=payload)
    db.commit()
    return response
