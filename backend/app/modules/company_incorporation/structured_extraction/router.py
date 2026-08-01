import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.company_incorporation.structured_extraction.schemas import (
    FactAssertionDetailResponse,
    FactEvidenceResponse,
    FactIssueDetailResponse,
    FactIssuesListResponse,
    FactsListResponse,
    ResolveIssueRequest,
    ResolveIssueResponse,
    RetryStructuredExtractionResponse,
    ReviewAssertionRequest,
    ReviewAssertionResponse,
    StructuredExtractionHistoryResponse,
    StructuredExtractionStatusResponse,
)
from app.modules.company_incorporation.structured_extraction.service import (
    get_assertion_detail,
    get_assertion_evidence,
    get_issue_detail,
    get_structured_history,
    get_structured_status,
    list_facts,
    list_issues,
    resolve_issue,
    retry_structured_extraction,
    review_assertion,
)

router = APIRouter(
    prefix="/workstreams/company-incorporation/structured-extraction",
    tags=["company-incorporation-structured-extraction"],
)


@router.get(
    "/versions/{version_id}/status",
    response_model=StructuredExtractionStatusResponse,
)
def get_version_structured_status(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StructuredExtractionStatusResponse:
    return get_structured_status(db, current_user, version_id)


@router.get(
    "/versions/{version_id}/history",
    response_model=StructuredExtractionHistoryResponse,
)
def get_version_structured_history(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StructuredExtractionHistoryResponse:
    return get_structured_history(db, current_user, version_id)


@router.post(
    "/versions/{version_id}/retry",
    response_model=RetryStructuredExtractionResponse,
)
def post_version_structured_retry(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetryStructuredExtractionResponse:
    response = retry_structured_extraction(db, current_user, version_id)
    db.commit()
    return response


@router.get("/facts", response_model=FactsListResponse)
def get_facts(
    fact_key: str | None = Query(default=None),
    requirement_key: str | None = Query(default=None),
    comparison_status: str | None = Query(default=None),
    review_status: str | None = Query(default=None),
    quality_category: str | None = Query(default=None),
    document_version_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactsListResponse:
    return list_facts(
        db,
        current_user,
        fact_key=fact_key,
        requirement_key=requirement_key,
        comparison_status=comparison_status,
        review_status=review_status,
        quality_category=quality_category,
        document_version_id=document_version_id,
    )


@router.get(
    "/assertions/{assertion_id}",
    response_model=FactAssertionDetailResponse,
)
def get_assertion(
    assertion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactAssertionDetailResponse:
    return get_assertion_detail(db, current_user, assertion_id)


@router.get(
    "/assertions/{assertion_id}/evidence",
    response_model=FactEvidenceResponse,
)
def get_assertion_evidence_route(
    assertion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactEvidenceResponse:
    return get_assertion_evidence(db, current_user, assertion_id)


@router.post(
    "/assertions/{assertion_id}/review",
    response_model=ReviewAssertionResponse,
)
def post_assertion_review(
    assertion_id: uuid.UUID,
    body: ReviewAssertionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewAssertionResponse:
    response = review_assertion(
        db,
        current_user,
        assertion_id,
        body.action,
        body.rationale,
    )
    db.commit()
    return response


@router.get("/issues", response_model=FactIssuesListResponse)
def get_issues(
    fact_key: str | None = Query(default=None),
    issue_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    blocking: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactIssuesListResponse:
    return list_issues(
        db,
        current_user,
        fact_key=fact_key,
        issue_type=issue_type,
        status=status,
        severity=severity,
        blocking=blocking,
    )


@router.get(
    "/issues/{issue_id}",
    response_model=FactIssueDetailResponse,
)
def get_issue(
    issue_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactIssueDetailResponse:
    return get_issue_detail(db, current_user, issue_id)


@router.post(
    "/issues/{issue_id}/resolve",
    response_model=ResolveIssueResponse,
)
def post_issue_resolve(
    issue_id: uuid.UUID,
    body: ResolveIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResolveIssueResponse:
    selected_id = (
        uuid.UUID(body.selected_assertion_id) if body.selected_assertion_id else None
    )
    response = resolve_issue(
        db,
        current_user,
        issue_id,
        body.decision,
        body.rationale,
        selected_id,
    )
    db.commit()
    return response
