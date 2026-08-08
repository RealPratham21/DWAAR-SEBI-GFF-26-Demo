"""Global Facts & Evidence API routes (G5)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.facts_evidence.schemas import (
    DrhpUsageBlockResponse,
    GlobalEvidenceListResponse,
    GlobalEvidenceResponse,
    GlobalEvidenceSummaryResponse,
    GlobalFactListResponse,
    GlobalFactResponse,
    GlobalFactSummaryResponse,
)
from app.modules.facts_evidence.service import (
    build_evidence_summary,
    build_fact_summary,
    get_evidence,
    get_fact,
    get_fact_drhp_usage,
    list_evidence,
    list_facts,
)

router = APIRouter(prefix="/facts-evidence", tags=["facts-evidence"])


@router.get("/facts", response_model=GlobalFactListResponse)
def get_global_facts(
    search: str | None = Query(default=None),
    workstream: str | None = Query(default=None),
    support_type: str | None = Query(default=None, alias="supportType"),
    used_in_drhp: bool | None = Query(default=None, alias="usedInDrhp"),
    has_issue: bool | None = Query(default=None, alias="hasIssue"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200, alias="pageSize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalFactListResponse:
    return list_facts(
        db,
        current_user,
        search=search,
        workstream=workstream,
        support_type=support_type,
        used_in_drhp=used_in_drhp,
        has_issue=has_issue,
        page=page,
        page_size=page_size,
    )


@router.get("/facts/summary", response_model=GlobalFactSummaryResponse)
def get_global_facts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalFactSummaryResponse:
    return build_fact_summary(db, current_user)


@router.get("/facts/{fact_id}", response_model=GlobalFactResponse)
def get_global_fact(
    fact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalFactResponse:
    return get_fact(db, current_user, fact_id)


@router.get("/facts/{fact_id}/drhp-usage", response_model=list[DrhpUsageBlockResponse])
def get_global_fact_drhp_usage(
    fact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DrhpUsageBlockResponse]:
    return get_fact_drhp_usage(db, current_user, fact_id)


@router.get("/evidence", response_model=GlobalEvidenceListResponse)
def get_global_evidence(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200, alias="pageSize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalEvidenceListResponse:
    return list_evidence(db, current_user, page=page, page_size=page_size)


@router.get("/evidence/summary", response_model=GlobalEvidenceSummaryResponse)
def get_global_evidence_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalEvidenceSummaryResponse:
    return build_evidence_summary(db, current_user)


@router.get("/evidence/{evidence_id}", response_model=GlobalEvidenceResponse)
def get_global_evidence_item(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GlobalEvidenceResponse:
    return get_evidence(db, current_user, evidence_id)
