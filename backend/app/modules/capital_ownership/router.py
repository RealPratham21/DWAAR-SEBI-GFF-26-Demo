"""Capital & Ownership HTTP routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.capital_ownership.schemas import (
    CapitalAssessmentResponse,
    CapitalOwnershipWorkspaceResponse,
    InitializeWorkspaceResponse,
    OverviewSummaryResponse,
    SectionSaveRequest,
    SectionSaveResponse,
)
from app.modules.capital_ownership.service import (
    get_assessment,
    get_overview,
    get_workspace,
    initialize_or_get_workspace,
    save_section,
)

router = APIRouter(
    prefix="/workstreams/capital-ownership",
    tags=["capital-ownership"],
)


@router.post("/workspace", response_model=InitializeWorkspaceResponse)
def post_initialize_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitializeWorkspaceResponse:
    response = initialize_or_get_workspace(db, current_user)
    db.commit()
    return response


@router.get("/workspace", response_model=CapitalOwnershipWorkspaceResponse)
def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CapitalOwnershipWorkspaceResponse:
    response = get_workspace(db, current_user)
    db.commit()
    return response


@router.patch("/sections/{section_id}", response_model=SectionSaveResponse)
def patch_section(
    section_id: str,
    body: SectionSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_section(
        db,
        current_user,
        section_id=section_id,
        expected_version=body.version,
        data=body.data,
    )
    db.commit()
    return response


@router.get("/overview-summary", response_model=OverviewSummaryResponse)
def get_overview_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OverviewSummaryResponse:
    return get_overview(db, current_user)


@router.get("/capital-assessment", response_model=CapitalAssessmentResponse)
def get_capital_assessment_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CapitalAssessmentResponse:
    return get_assessment(db, current_user)
