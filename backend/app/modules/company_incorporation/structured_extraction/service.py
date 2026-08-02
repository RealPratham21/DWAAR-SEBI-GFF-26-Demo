"""Authenticated structured-extraction status, facts, reviews, and issue APIs."""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.models.document import Document
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.fact_assertion import FactAssertion
from app.models.fact_assertion_review import FactAssertionReview
from app.models.fact_evidence_reference import FactEvidenceReference
from app.models.fact_issue import FactIssue, FactIssueResolution
from app.models.structured_extraction_run import StructuredExtractionRun
from app.models.user import User
from app.modules.company_incorporation.document_processing.constants import ProcessingRunStatus
from app.modules.company_incorporation.document_processing.service import _latest_evidence_ready
from app.modules.company_incorporation.documents.constants import (
    CURRENT_VERSION_STATUSES,
    DocumentVersionStatus,
)
from app.modules.company_incorporation.documents.requirements_config import REQUIREMENT_DEFINITIONS
from app.modules.company_incorporation.documents.service import (
    _get_owned_version,
    _require_workspace,
)
from app.modules.company_incorporation.structured_extraction.constants import (
    IssueAssertionRole,
    IssueStatus,
    ResolutionDecision,
    ReviewAction,
    ReviewStatus,
    StructuredExtractionErrorCode,
    StructuredRunStatus,
)
from app.modules.company_incorporation.structured_extraction.queue import (
    enqueue_structured_extraction_run,
    has_active_structured_run,
)
from app.modules.company_incorporation.structured_extraction.registry import (
    get_fact,
    get_information_value,
)
from app.modules.company_incorporation.structured_extraction.schemas import (
    FactAssertionDetailResponse,
    FactAssertionReviewEntryResponse,
    FactAssertionSummaryResponse,
    FactEvidenceItemResponse,
    FactEvidenceResponse,
    FactGroupResponse,
    FactIssueAssertionLinkResponse,
    FactIssueDetailResponse,
    FactIssueResolutionHistoryItem,
    FactIssuesListResponse,
    FactIssueSummaryResponse,
    FactsListResponse,
    ResolveIssueResponse,
    RetryStructuredExtractionResponse,
    ReviewAssertionResponse,
    StructuredExtractionHistoryResponse,
    StructuredExtractionRunSummaryResponse,
    StructuredExtractionStatusResponse,
)

USABLE_STRUCTURED_STATUSES = frozenset(
    {
        StructuredRunStatus.COMPLETED,
        StructuredRunStatus.COMPLETED_WITH_WARNINGS,
    }
)

OPEN_ISSUE_STATUSES = frozenset(
    {
        IssueStatus.OPEN,
        IssueStatus.AWAITING_CLARIFICATION,
        IssueStatus.ESCALATED,
    }
)

_DECISIONS_REQUIRING_ASSERTION = frozenset(
    {
        ResolutionDecision.ACCEPT_DOCUMENT,
        ResolutionDecision.MARK_DOCUMENT_HISTORICAL,
        ResolutionDecision.REJECT_DOCUMENT_VALUE,
    }
)

_DECISION_TO_ISSUE_STATUS = {
    ResolutionDecision.KEEP_INFORMATION: IssueStatus.RESOLVED,
    ResolutionDecision.ACCEPT_DOCUMENT: IssueStatus.RESOLVED,
    ResolutionDecision.MARK_DOCUMENT_HISTORICAL: IssueStatus.RESOLVED,
    ResolutionDecision.REJECT_DOCUMENT_VALUE: IssueStatus.RESOLVED,
    ResolutionDecision.REQUEST_CLARIFICATION: IssueStatus.AWAITING_CLARIFICATION,
    ResolutionDecision.ESCALATE_FOR_PROFESSIONAL_REVIEW: IssueStatus.ESCALATED,
    ResolutionDecision.DISMISS_NON_MATERIAL: IssueStatus.DISMISSED,
}

_REVIEW_ACTION_TO_STATUS = {
    ReviewAction.APPROVE: ReviewStatus.APPROVED,
    ReviewAction.REJECT: ReviewStatus.REJECTED,
    ReviewAction.MARK_HISTORICAL: ReviewStatus.HISTORICAL,
    ReviewAction.RETURN_TO_PENDING: ReviewStatus.PENDING,
}


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _cancellation_fields(run: StructuredExtractionRun | None) -> tuple[bool, str | None]:
    if run is None or run.status != StructuredRunStatus.CANCELLED:
        return False, None
    return True, run.error_message


def _run_is_usable(run: StructuredExtractionRun) -> bool:
    return run.status in USABLE_STRUCTURED_STATUSES


def _assertion_count(db: Session, run_id: uuid.UUID) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(FactAssertion)
            .where(FactAssertion.structured_extraction_run_id == run_id)
        )
        or 0
    )


def _open_issue_count(db: Session, workspace_id: uuid.UUID, fact_key: str | None = None) -> int:
    query = (
        select(func.count())
        .select_from(FactIssue)
        .where(
            FactIssue.workspace_id == workspace_id,
            FactIssue.status.in_(OPEN_ISSUE_STATUSES),
        )
    )
    if fact_key is not None:
        query = query.where(FactIssue.fact_key == fact_key)
    return int(db.scalar(query) or 0)


def _latest_structured_attempt(
    db: Session,
    version_id: uuid.UUID,
) -> StructuredExtractionRun | None:
    return db.scalar(
        select(StructuredExtractionRun)
        .where(StructuredExtractionRun.document_version_id == version_id)
        .order_by(
            StructuredExtractionRun.attempt_number.desc(),
            StructuredExtractionRun.queued_at.desc(),
        )
        .limit(1)
    )


def _latest_completed_structured(
    db: Session,
    version_id: uuid.UUID,
) -> StructuredExtractionRun | None:
    return db.scalar(
        select(StructuredExtractionRun)
        .where(
            StructuredExtractionRun.document_version_id == version_id,
            StructuredExtractionRun.status.in_(USABLE_STRUCTURED_STATUSES),
        )
        .order_by(
            StructuredExtractionRun.attempt_number.desc(),
            StructuredExtractionRun.queued_at.desc(),
        )
        .limit(1)
    )


def _latest_usable_structured_for_processing(
    db: Session,
    processing_run_id: uuid.UUID,
) -> StructuredExtractionRun | None:
    return db.scalar(
        select(StructuredExtractionRun)
        .where(
            StructuredExtractionRun.document_processing_run_id == processing_run_id,
            StructuredExtractionRun.status.in_(USABLE_STRUCTURED_STATUSES),
        )
        .order_by(
            StructuredExtractionRun.attempt_number.desc(),
            StructuredExtractionRun.queued_at.desc(),
        )
        .limit(1)
    )


def _latest_usable_structured(db: Session, version_id: uuid.UUID) -> StructuredExtractionRun | None:
    processing_run = _latest_evidence_ready(db, version_id)
    if processing_run is None:
        return None
    return _latest_usable_structured_for_processing(db, processing_run.id)


def _version_is_retry_eligible(version: DocumentVersion, document: Document) -> bool:
    if document.archived_at is not None:
        return False
    if version.status == DocumentVersionStatus.SUPERSEDED:
        return False
    return version.status in CURRENT_VERSION_STATUSES


def _retry_available(
    db: Session,
    version: DocumentVersion,
    document: Document,
) -> bool:
    if not _version_is_retry_eligible(version, document):
        return False
    if not get_settings().structured_extraction_enabled:
        return False
    processing_run = _latest_evidence_ready(db, version.id)
    if processing_run is None:
        return False
    return not has_active_structured_run(db, processing_run.id)


def _run_summary(
    db: Session,
    run: StructuredExtractionRun,
    *,
    processing_run: DocumentProcessingRun | None = None,
) -> StructuredExtractionRunSummaryResponse:
    cancelled, cancellation_reason = _cancellation_fields(run)
    usable = _run_is_usable(run)
    if processing_run is not None and usable:
        usable = (
            processing_run.status == ProcessingRunStatus.COMPLETED
            and int(processing_run.output_schema_version or 1) >= 2
        )
    return StructuredExtractionRunSummaryResponse(
        id=str(run.id),
        status=run.status,
        attempt_number=run.attempt_number,
        document_processing_run_id=str(run.document_processing_run_id),
        extractor_version=run.extractor_version,
        fact_schema_version=run.fact_schema_version,
        prompt_version=run.prompt_version,
        provider=run.provider,
        model_name=run.model_name,
        deterministic_status=run.deterministic_status,
        semantic_status=run.semantic_status,
        usable=usable,
        queued_at=run.queued_at,
        claimed_at=run.claimed_at,
        completed_at=run.completed_at,
        assertion_count=_assertion_count(db, run.id),
        warnings=list(run.warnings or []),
        error_code=run.error_code,
        error_message=run.error_message,
        cancelled=cancelled,
        cancellation_reason=cancellation_reason,
    )


def _serialize_assertion_summary(assertion: FactAssertion) -> FactAssertionSummaryResponse:
    return FactAssertionSummaryResponse(
        id=str(assertion.id),
        fact_key=assertion.fact_key,
        requirement_key=assertion.requirement_key,
        document_version_id=str(assertion.document_version_id),
        structured_extraction_run_id=str(assertion.structured_extraction_run_id),
        display_value=assertion.display_value,
        comparison_status=assertion.comparison_status,
        review_status=assertion.review_status,
        quality_category=assertion.quality_category,
        quality_score=assertion.quality_score,
        extractor_kind=assertion.extractor_kind,
        validation_status=assertion.validation_status,
        source_temporality=assertion.source_temporality,
    )


def _get_owned_assertion(
    db: Session,
    workspace_id: uuid.UUID,
    assertion_id: uuid.UUID,
) -> FactAssertion:
    assertion = db.scalar(
        select(FactAssertion).where(
            FactAssertion.id == assertion_id,
            FactAssertion.workspace_id == workspace_id,
        )
    )
    if assertion is None:
        raise AppException(
            status_code=404,
            code=StructuredExtractionErrorCode.RUN_NOT_FOUND,
            message="Fact assertion not found.",
        )
    return assertion


def _get_owned_issue(db: Session, workspace_id: uuid.UUID, issue_id: uuid.UUID) -> FactIssue:
    issue = db.scalar(
        select(FactIssue)
        .options(
            selectinload(FactIssue.issue_assertions),
            selectinload(FactIssue.resolutions),
        )
        .where(
            FactIssue.id == issue_id,
            FactIssue.workspace_id == workspace_id,
        )
    )
    if issue is None:
        raise AppException(
            status_code=404,
            code=StructuredExtractionErrorCode.RUN_NOT_FOUND,
            message="Fact issue not found.",
        )
    return issue


def _current_workspace_versions(
    db: Session,
    workspace_id: uuid.UUID,
    *,
    document_version_id: uuid.UUID | None = None,
) -> list[tuple[DocumentVersion, Document]]:
    query = (
        select(DocumentVersion, Document)
        .join(Document, Document.id == DocumentVersion.document_id)
        .where(
            Document.company_incorporation_workspace_id == workspace_id,
            Document.archived_at.is_(None),
            DocumentVersion.status != DocumentVersionStatus.SUPERSEDED,
        )
    )
    if document_version_id is not None:
        query = query.where(DocumentVersion.id == document_version_id)
    return list(db.execute(query).all())


def _usable_assertions_for_workspace(
    db: Session,
    workspace_id: uuid.UUID,
    *,
    document_version_id: uuid.UUID | None = None,
) -> list[FactAssertion]:
    assertions: list[FactAssertion] = []
    for version, _document in _current_workspace_versions(
        db,
        workspace_id,
        document_version_id=document_version_id,
    ):
        usable_run = _latest_usable_structured(db, version.id)
        if usable_run is None:
            continue
        rows = db.scalars(
            select(FactAssertion).where(
                FactAssertion.structured_extraction_run_id == usable_run.id,
            )
        ).all()
        assertions.extend(rows)
    return assertions


def get_structured_status(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> StructuredExtractionStatusResponse:
    workspace = _require_workspace(db, user)
    version, document = _get_owned_version(db, workspace, version_id)
    latest_attempt = _latest_structured_attempt(db, version.id)
    latest_completed = _latest_completed_structured(db, version.id)
    latest_usable = _latest_usable_structured(db, version.id)

    display_run = latest_attempt
    if (
        latest_attempt is not None
        and latest_attempt.status == StructuredRunStatus.CANCELLED
        and latest_usable is not None
    ):
        display_run = latest_usable
    elif (
        latest_attempt is not None
        and latest_attempt.status == StructuredRunStatus.CANCELLED
        and latest_completed is not None
    ):
        display_run = latest_completed

    assertion_count = _assertion_count(db, display_run.id) if display_run else 0
    cancelled, cancellation_reason = _cancellation_fields(latest_attempt)
    usable = bool(display_run is not None and _run_is_usable(display_run))

    return StructuredExtractionStatusResponse(
        document_version_id=str(version.id),
        document_status=version.status,
        document_processing_run_id=(
            str(display_run.document_processing_run_id) if display_run else None
        ),
        latest_run_status=display_run.status if display_run else None,
        latest_attempt_status=latest_attempt.status if latest_attempt else None,
        latest_completed_run_status=latest_completed.status if latest_completed else None,
        latest_usable_run_id=str(latest_usable.id) if latest_usable else None,
        attempt_number=display_run.attempt_number if display_run else None,
        extractor_version=display_run.extractor_version if display_run else None,
        fact_schema_version=display_run.fact_schema_version if display_run else None,
        prompt_version=display_run.prompt_version if display_run else None,
        provider=display_run.provider if display_run else None,
        model_name=display_run.model_name if display_run else None,
        deterministic_status=display_run.deterministic_status if display_run else None,
        semantic_status=display_run.semantic_status if display_run else None,
        usable=usable,
        queued_at=display_run.queued_at if display_run else None,
        claimed_at=display_run.claimed_at if display_run else None,
        completed_at=display_run.completed_at if display_run else None,
        assertion_count=assertion_count,
        open_issue_count=_open_issue_count(db, workspace.id),
        warnings=list(display_run.warnings or []) if display_run else [],
        error_code=display_run.error_code if display_run else None,
        error_message=display_run.error_message if display_run else None,
        cancelled=cancelled,
        cancellation_reason=cancellation_reason,
        retry_available=_retry_available(db, version, document),
    )


def get_structured_history(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> StructuredExtractionHistoryResponse:
    workspace = _require_workspace(db, user)
    version, _document = _get_owned_version(db, workspace, version_id)
    runs = db.scalars(
        select(StructuredExtractionRun)
        .where(StructuredExtractionRun.document_version_id == version.id)
        .order_by(
            StructuredExtractionRun.attempt_number.desc(),
            StructuredExtractionRun.queued_at.desc(),
        )
    ).all()

    processing_by_id: dict[uuid.UUID, DocumentProcessingRun] = {}
    if runs:
        processing_by_id = {
            row.id: row
            for row in db.scalars(
                select(DocumentProcessingRun).where(
                    DocumentProcessingRun.id.in_({run.document_processing_run_id for run in runs})
                )
            ).all()
        }

    latest_attempt = runs[0] if runs else None
    latest_completed = _latest_completed_structured(db, version.id)
    latest_usable = _latest_usable_structured(db, version.id)

    return StructuredExtractionHistoryResponse(
        document_version_id=str(version.id),
        latest_attempt_run_id=str(latest_attempt.id) if latest_attempt else None,
        latest_completed_run_id=str(latest_completed.id) if latest_completed else None,
        latest_usable_run_id=str(latest_usable.id) if latest_usable else None,
        runs=[
            _run_summary(
                db,
                run,
                processing_run=processing_by_id.get(run.document_processing_run_id),
            )
            for run in runs
        ],
    )


def retry_structured_extraction(
    db: Session,
    user: User,
    version_id: uuid.UUID,
) -> RetryStructuredExtractionResponse:
    settings = get_settings()
    workspace = _require_workspace(db, user)
    version, document = _get_owned_version(db, workspace, version_id)

    if not settings.structured_extraction_enabled:
        raise AppException(
            status_code=403,
            code=StructuredExtractionErrorCode.DISABLED,
            message="Structured extraction is disabled in this environment.",
        )

    if document.archived_at is not None or version.status == DocumentVersionStatus.SUPERSEDED:
        raise AppException(
            status_code=409,
            code=StructuredExtractionErrorCode.ARCHIVED_OR_SUPERSEDED,
            message="Structured extraction cannot be retried for archived or superseded documents.",
        )

    if not _version_is_retry_eligible(version, document):
        raise AppException(
            status_code=409,
            code=StructuredExtractionErrorCode.RETRY_NOT_ALLOWED,
            message="Structured extraction retry is not allowed for this document version.",
        )

    processing_run = _latest_evidence_ready(db, version.id)
    if processing_run is None:
        raise AppException(
            status_code=409,
            code=StructuredExtractionErrorCode.NOT_EVIDENCE_READY,
            message="No evidence-ready processing run is available for structured extraction.",
        )

    if has_active_structured_run(db, processing_run.id):
        raise AppException(
            status_code=409,
            code=StructuredExtractionErrorCode.ACTIVE_RUN_EXISTS,
            message="A structured extraction run is already queued or in progress.",
        )

    run = enqueue_structured_extraction_run(
        db,
        processing_run=processing_run,
        document_version=version,
        workspace_id=workspace.id,
        settings=settings,
        force=True,
    )
    if run is None:
        raise AppException(
            status_code=409,
            code=StructuredExtractionErrorCode.RETRY_NOT_ALLOWED,
            message="Structured extraction could not be queued for this document version.",
        )

    return RetryStructuredExtractionResponse(
        document_version_id=str(version.id),
        document_processing_run_id=str(processing_run.id),
        structured_extraction_run_id=str(run.id),
        status=run.status,
        extractor_version=run.extractor_version,
        fact_schema_version=run.fact_schema_version,
        prompt_version=run.prompt_version,
    )


def list_facts(
    db: Session,
    user: User,
    *,
    fact_key: str | None = None,
    requirement_key: str | None = None,
    comparison_status: str | None = None,
    review_status: str | None = None,
    quality_category: str | None = None,
    document_version_id: uuid.UUID | None = None,
) -> FactsListResponse:
    workspace = _require_workspace(db, user)
    if document_version_id is not None:
        _get_owned_version(db, workspace, document_version_id)

    assertions = _usable_assertions_for_workspace(
        db,
        workspace.id,
        document_version_id=document_version_id,
    )

    filtered: list[FactAssertion] = []
    for assertion in assertions:
        if fact_key is not None and assertion.fact_key != fact_key:
            continue
        if requirement_key is not None and assertion.requirement_key != requirement_key:
            continue
        if comparison_status is not None and assertion.comparison_status != comparison_status:
            continue
        if review_status is not None and assertion.review_status != review_status:
            continue
        if quality_category is not None and assertion.quality_category != quality_category:
            continue
        filtered.append(assertion)

    payload = dict(workspace.payload or {})
    grouped: dict[str, list[FactAssertion]] = defaultdict(list)
    for assertion in filtered:
        grouped[assertion.fact_key].append(assertion)

    groups: list[FactGroupResponse] = []
    for key in sorted(grouped.keys()):
        try:
            display_label = get_fact(key).display_label
        except KeyError:
            display_label = key
        groups.append(
            FactGroupResponse(
                fact_key=key,
                display_label=display_label,
                information_value=get_information_value(payload, key),
                assertions=[
                    _serialize_assertion_summary(assertion)
                    for assertion in sorted(
                        grouped[key],
                        key=lambda row: (row.requirement_key, row.display_value),
                    )
                ],
            )
        )

    return FactsListResponse(
        total_fact_keys=len(groups),
        total_assertions=len(filtered),
        groups=groups,
    )


def get_assertion_detail(
    db: Session,
    user: User,
    assertion_id: uuid.UUID,
) -> FactAssertionDetailResponse:
    workspace = _require_workspace(db, user)
    assertion = db.scalar(
        select(FactAssertion)
        .options(selectinload(FactAssertion.reviews))
        .where(
            FactAssertion.id == assertion_id,
            FactAssertion.workspace_id == workspace.id,
        )
    )
    if assertion is None:
        raise AppException(
            status_code=404,
            code=StructuredExtractionErrorCode.RUN_NOT_FOUND,
            message="Fact assertion not found.",
        )

    summary = _serialize_assertion_summary(assertion)
    return FactAssertionDetailResponse(
        **summary.model_dump(),
        raw_value=assertion.raw_value,
        normalized_value=assertion.normalized_value,
        quality_signals=dict(assertion.quality_signals or {}),
        document_processing_run_id=str(assertion.document_processing_run_id),
        reviews=[
            FactAssertionReviewEntryResponse(
                id=str(review.id),
                action=review.action,
                rationale=review.rationale,
                reviewed_by_user_id=str(review.reviewed_by_user_id),
                created_at=review.created_at,
            )
            for review in sorted(assertion.reviews, key=lambda row: row.created_at, reverse=True)
        ],
    )


def get_assertion_evidence(
    db: Session,
    user: User,
    assertion_id: uuid.UUID,
) -> FactEvidenceResponse:
    workspace = _require_workspace(db, user)
    assertion = _get_owned_assertion(db, workspace.id, assertion_id)
    items = db.scalars(
        select(FactEvidenceReference)
        .where(FactEvidenceReference.fact_assertion_id == assertion.id)
        .order_by(
            FactEvidenceReference.page_number.asc(),
            FactEvidenceReference.block_order_index.asc(),
        )
    ).all()

    return FactEvidenceResponse(
        assertion_id=str(assertion.id),
        items=[
            FactEvidenceItemResponse(
                id=str(item.id),
                document_page_id=str(item.document_page_id),
                block_id=item.block_id,
                evidence_role=item.evidence_role,
                quote_snapshot=item.quote_snapshot,
                bbox_snapshot=dict(item.bbox_snapshot or {}),
                page_number=item.page_number,
                extraction_method=item.extraction_method,
                ocr_confidence=item.ocr_confidence,
                block_order_index=item.block_order_index,
            )
            for item in items
        ],
    )


def review_assertion(
    db: Session,
    user: User,
    assertion_id: uuid.UUID,
    action: str,
    rationale: str | None,
) -> ReviewAssertionResponse:
    workspace = _require_workspace(db, user)
    assertion = _get_owned_assertion(db, workspace.id, assertion_id)

    if action not in _REVIEW_ACTION_TO_STATUS:
        raise AppException(
            status_code=400,
            code=StructuredExtractionErrorCode.VALIDATION_FAILED,
            message="Unsupported review action.",
        )

    review_status = _REVIEW_ACTION_TO_STATUS[action]
    review = FactAssertionReview(
        fact_assertion_id=assertion.id,
        action=action,
        rationale=rationale,
        reviewed_by_user_id=user.id,
    )
    db.add(review)
    assertion.review_status = review_status
    db.flush()

    return ReviewAssertionResponse(
        assertion_id=str(assertion.id),
        review_status=review_status,
        action=action,
        review_id=str(review.id),
        created_at=review.created_at,
    )


def list_issues(
    db: Session,
    user: User,
    *,
    fact_key: str | None = None,
    issue_type: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    blocking: bool | None = None,
) -> FactIssuesListResponse:
    workspace = _require_workspace(db, user)
    query = select(FactIssue).where(FactIssue.workspace_id == workspace.id)
    if fact_key is not None:
        query = query.where(FactIssue.fact_key == fact_key)
    if issue_type is not None:
        query = query.where(FactIssue.issue_type == issue_type)
    if status is not None:
        query = query.where(FactIssue.status == status)
    if severity is not None:
        query = query.where(FactIssue.severity == severity)
    if blocking is not None:
        query = query.where(FactIssue.blocking.is_(blocking))

    issues = db.scalars(query.order_by(FactIssue.created_at.desc())).all()
    return FactIssuesListResponse(
        total=len(issues),
        issues=[
            FactIssueSummaryResponse(
                id=str(issue.id),
                fact_key=issue.fact_key,
                issue_type=issue.issue_type,
                title=issue.title,
                severity=issue.severity,
                blocking=issue.blocking,
                status=issue.status,
                created_at=issue.created_at,
                resolved_at=issue.resolved_at,
            )
            for issue in issues
        ],
    )


def get_issue_detail(
    db: Session,
    user: User,
    issue_id: uuid.UUID,
) -> FactIssueDetailResponse:
    workspace = _require_workspace(db, user)
    issue = _get_owned_issue(db, workspace.id, issue_id)

    assertion_ids = [link.fact_assertion_id for link in issue.issue_assertions]
    assertions_by_id: dict[uuid.UUID, FactAssertion] = {}
    if assertion_ids:
        assertions_by_id = {
            row.id: row
            for row in db.scalars(
                select(FactAssertion)
                .options(selectinload(FactAssertion.evidence_references))
                .where(FactAssertion.id.in_(assertion_ids))
            ).all()
        }

    version_ids = {row.document_version_id for row in assertions_by_id.values()}
    versions_by_id: dict[uuid.UUID, DocumentVersion] = {}
    documents_by_id: dict[uuid.UUID, Document] = {}
    if version_ids:
        for version, document in db.execute(
            select(DocumentVersion, Document)
            .join(Document, Document.id == DocumentVersion.document_id)
            .where(DocumentVersion.id.in_(version_ids))
        ).all():
            versions_by_id[version.id] = version
            documents_by_id[document.id] = document

    resolutions = sorted(
        list(issue.resolutions or []),
        key=lambda row: row.created_at,
        reverse=True,
    )
    resolver_ids = {row.resolved_by_user_id for row in resolutions if row.resolved_by_user_id}
    resolvers = (
        {row.id: row for row in db.scalars(select(User).where(User.id.in_(resolver_ids))).all()}
        if resolver_ids
        else {}
    )

    linked: list[FactIssueAssertionLinkResponse] = []
    for link in issue.issue_assertions:
        assertion = assertions_by_id.get(link.fact_assertion_id)
        if assertion is None:
            linked.append(
                FactIssueAssertionLinkResponse(
                    fact_assertion_id=str(link.fact_assertion_id),
                    role=link.role,
                )
            )
            continue
        version = versions_by_id.get(assertion.document_version_id)
        document = documents_by_id.get(version.document_id) if version else None
        definition = REQUIREMENT_DEFINITIONS.get(assertion.requirement_key)
        evidence = list(assertion.evidence_references or [])
        page_numbers = sorted({item.page_number for item in evidence})
        methods = sorted({item.extraction_method for item in evidence if item.extraction_method})
        linked.append(
            FactIssueAssertionLinkResponse(
                fact_assertion_id=str(assertion.id),
                role=link.role,
                fact_key=assertion.fact_key,
                display_value=assertion.display_value,
                normalized_value=assertion.normalized_value,
                comparison_status=assertion.comparison_status,
                review_status=assertion.review_status,
                quality_category=assertion.quality_category,
                source_temporality=assertion.source_temporality,
                document_id=str(document.id) if document else None,
                document_version_id=str(version.id) if version else None,
                original_filename=version.original_filename if version else None,
                version_number=version.version_number if version else None,
                requirement_key=assertion.requirement_key,
                requirement_label=definition.name if definition else assertion.requirement_key,
                page_numbers=page_numbers,
                evidence_summary=[item.quote_snapshot for item in evidence[:5]],
                extraction_methods=methods,
                ocr_derived=any(method == "ocr" for method in methods),
            )
        )

    return FactIssueDetailResponse(
        id=str(issue.id),
        fact_key=issue.fact_key,
        issue_type=issue.issue_type,
        title=issue.title,
        severity=issue.severity,
        blocking=issue.blocking,
        status=issue.status,
        created_at=issue.created_at,
        resolved_at=issue.resolved_at,
        description=issue.description,
        suggested_actions=list(issue.suggested_actions or []),
        information_value_snapshot=issue.information_value_snapshot,
        information_normalized_snapshot=issue.information_normalized_snapshot,
        linked_assertions=linked,
        resolution_history=[
            FactIssueResolutionHistoryItem(
                id=str(row.id),
                decision=row.decision,
                rationale=row.rationale,
                selected_assertion_id=(
                    str(row.selected_assertion_id) if row.selected_assertion_id else None
                ),
                resolved_by_user_id=(
                    str(row.resolved_by_user_id) if row.resolved_by_user_id else None
                ),
                resolver_display_name=(
                    resolvers[row.resolved_by_user_id].full_name
                    if row.resolved_by_user_id in resolvers
                    else None
                ),
                information_value_snapshot=row.information_value_snapshot,
                document_value_snapshot=row.document_value_snapshot,
                created_at=row.created_at,
            )
            for row in resolutions
        ],
    )


def resolve_issue(
    db: Session,
    user: User,
    issue_id: uuid.UUID,
    decision: str,
    rationale: str,
    selected_assertion_id: uuid.UUID | None = None,
) -> ResolveIssueResponse:
    workspace = _require_workspace(db, user)
    issue = _get_owned_issue(db, workspace.id, issue_id)

    if decision not in _DECISION_TO_ISSUE_STATUS:
        raise AppException(
            status_code=400,
            code=StructuredExtractionErrorCode.VALIDATION_FAILED,
            message="Unsupported resolution decision.",
        )

    linked_links = list(issue.issue_assertions)
    linked_assertion_ids = {link.fact_assertion_id for link in linked_links}
    selected_assertion: FactAssertion | None = None
    if selected_assertion_id is None and decision in {
        ResolutionDecision.MARK_DOCUMENT_HISTORICAL,
        ResolutionDecision.KEEP_INFORMATION,
        ResolutionDecision.REJECT_DOCUMENT_VALUE,
    }:
        preferred_roles = {
            ResolutionDecision.MARK_DOCUMENT_HISTORICAL: {
                IssueAssertionRole.HISTORICAL,
                IssueAssertionRole.CONFLICTING,
            },
            ResolutionDecision.KEEP_INFORMATION: {
                IssueAssertionRole.CONFLICTING,
                IssueAssertionRole.HISTORICAL,
            },
            ResolutionDecision.REJECT_DOCUMENT_VALUE: {
                IssueAssertionRole.CONFLICTING,
                IssueAssertionRole.HISTORICAL,
            },
        }[decision]
        for link in linked_links:
            if link.role in preferred_roles:
                selected_assertion_id = link.fact_assertion_id
                break
        if selected_assertion_id is None and linked_links:
            selected_assertion_id = linked_links[0].fact_assertion_id

    if decision in _DECISIONS_REQUIRING_ASSERTION and selected_assertion_id is None:
        raise AppException(
            status_code=400,
            code=StructuredExtractionErrorCode.VALIDATION_FAILED,
            message="This resolution decision requires a selected assertion.",
        )

    if selected_assertion_id is not None:
        if selected_assertion_id not in linked_assertion_ids:
            raise AppException(
                status_code=400,
                code=StructuredExtractionErrorCode.VALIDATION_FAILED,
                message="Selected assertion is not linked to this issue.",
            )
        selected_assertion = _get_owned_assertion(db, workspace.id, selected_assertion_id)

    new_status = _DECISION_TO_ISSUE_STATUS[decision]
    information_update_required = decision == ResolutionDecision.ACCEPT_DOCUMENT

    if selected_assertion is not None:
        if decision == ResolutionDecision.MARK_DOCUMENT_HISTORICAL:
            selected_assertion.review_status = ReviewStatus.HISTORICAL
            selected_assertion.source_temporality = "historical"
        elif decision == ResolutionDecision.REJECT_DOCUMENT_VALUE:
            selected_assertion.review_status = ReviewStatus.REJECTED
        elif decision == ResolutionDecision.KEEP_INFORMATION:
            selected_assertion.review_status = ReviewStatus.REJECTED
        elif decision == ResolutionDecision.ACCEPT_DOCUMENT:
            selected_assertion.review_status = ReviewStatus.APPROVED

    resolution = FactIssueResolution(
        fact_issue_id=issue.id,
        decision=decision,
        selected_assertion_id=selected_assertion.id if selected_assertion else None,
        rationale=rationale,
        resolved_by_user_id=user.id,
        information_value_snapshot=issue.information_value_snapshot,
        document_value_snapshot=selected_assertion.normalized_value if selected_assertion else None,
    )
    db.add(resolution)

    issue.status = new_status
    if new_status in {IssueStatus.RESOLVED, IssueStatus.DISMISSED}:
        issue.resolved_at = _now()

    db.flush()

    return ResolveIssueResponse(
        issue_id=str(issue.id),
        status=new_status,
        decision=decision,
        resolution_id=str(resolution.id),
        information_update_required=information_update_required,
    )
