"""Intermediaries & Filing HTTP routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.intermediaries_filing.schemas import (
    IfAssessmentResponse,
    InitializeWorkspaceResponse,
    IntermediariesFilingWorkspaceResponse,
    OverviewSummaryResponse,
    SectionSaveRequest,
    SectionSaveResponse,
)
from app.modules.intermediaries_filing.service import (
    get_filing_readiness,
    get_overview,
    get_workspace,
    initialize_or_get_workspace,
    save_section,
)

router = APIRouter(
    prefix="/workstreams/intermediaries-filing",
    tags=["intermediaries-filing"],
)


@router.post("/workspace", response_model=InitializeWorkspaceResponse)
def post_initialize_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitializeWorkspaceResponse:
    response = initialize_or_get_workspace(db, current_user)
    db.commit()
    return response


@router.get("/workspace", response_model=IntermediariesFilingWorkspaceResponse)
def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IntermediariesFilingWorkspaceResponse:
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


@router.get("/filing-readiness", response_model=IfAssessmentResponse)
def get_filing_readiness_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IfAssessmentResponse:
    return get_filing_readiness(db, current_user)
