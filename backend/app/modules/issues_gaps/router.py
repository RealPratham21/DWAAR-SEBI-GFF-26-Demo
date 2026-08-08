"""Global Issues & Gaps API routes (G4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.issues_gaps.schemas import (
    AcknowledgementPatchRequest,
    AcknowledgementPatchResponse,
    GlobalIssueListResponse,
    GlobalIssueResponse,
    GlobalIssueSummaryResponse,
)
from app.modules.issues_gaps.service import (
    build_summary,
    get_issue,
    list_issues,
    patch_acknowledgement,
)

router = APIRouter(prefix="/issues-gaps", tags=["issues-gaps"])


@router.get("", response_model=GlobalIssueListResponse)
def get_issues_gaps(
    severity: str | None = Query(default=None),
    category: str | None = Query(default=None),
    workstream: str | None = Query(default=None),
    lifecycle_state: str | None = Query(default=None, alias="lifecycleState"),
    search: str | None = Query(default=None),
    drhp_chapter: str | None = Query(default=None, alias="drhpChapter"),
    include_cleared: bool = Query(default=False, alias="includeCleared"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalIssueListResponse:
    return list_issues(
        db,
        current_user,
        severity=severity,
        category=category,
        workstream=workstream,
        lifecycle_state=lifecycle_state,
        search=search,
        drhp_chapter=drhp_chapter,
        include_cleared=include_cleared,
    )


@router.get("/summary", response_model=GlobalIssueSummaryResponse)
def get_issues_gaps_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalIssueSummaryResponse:
    return build_summary(db, current_user)


@router.get("/{issue_id}", response_model=GlobalIssueResponse)
def get_issue_gap(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalIssueResponse:
    return get_issue(db, current_user, issue_id)


@router.patch("/{issue_id}/acknowledgement", response_model=AcknowledgementPatchResponse)
def patch_issue_acknowledgement(
    issue_id: str,
    payload: AcknowledgementPatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AcknowledgementPatchResponse:
    response = patch_acknowledgement(
        db,
        current_user,
        issue_id,
        acknowledged=payload.acknowledged,
        note=payload.note,
    )
    db.commit()
    return response
