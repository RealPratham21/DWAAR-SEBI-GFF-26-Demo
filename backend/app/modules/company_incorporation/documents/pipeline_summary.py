"""Workstream-level document page + structured pipeline summary."""

from __future__ import annotations

import uuid
from collections import Counter, defaultdict
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.fact_assertion import FactAssertion
from app.models.fact_issue import FactIssue, FactIssueAssertion
from app.models.structured_extraction_run import StructuredExtractionRun
from app.models.user import User
from app.modules.company_incorporation.document_processing.blocks import (
    page_is_evidence_contract_ready,
)
from app.modules.company_incorporation.document_processing.constants import (
    ACTIVE_PROCESSING_RUN_STATUSES,
    ProcessingRunStatus,
)
from app.modules.company_incorporation.documents.constants import (
    CURRENT_VERSION_STATUSES,
    DocumentVersionStatus,
)
from app.modules.company_incorporation.documents.pipeline_summary_schemas import (
    DocumentPipelineSummaryItem,
    DocumentPipelineSummaryResponse,
    PageProcessingPipelineSummary,
    StructuredExtractionPipelineSummary,
    WorkstreamPipelineAggregation,
)
from app.modules.company_incorporation.documents.requirements_config import REQUIREMENT_DEFINITIONS
from app.modules.company_incorporation.documents.service import _require_workspace
from app.modules.company_incorporation.structured_extraction.constants import (
    ACTIVE_STRUCTURED_RUN_STATUSES,
    IssueStatus,
    ReviewStatus,
    StructuredRunStatus,
)

USABLE_STRUCTURED = frozenset(
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


def get_document_pipeline_summary(
    db: Session,
    user: User,
) -> DocumentPipelineSummaryResponse:
    workspace = _require_workspace(db, user)
    documents = list(
        db.scalars(
            select(Document)
            .options(selectinload(Document.versions))
            .where(
                Document.company_incorporation_workspace_id == workspace.id,
                Document.archived_at.is_(None),
            )
            .order_by(Document.requirement_key.asc(), Document.created_at.asc())
        ).all()
    )

    current_pairs: list[tuple[Document, DocumentVersion]] = []
    for document in documents:
        current = _current_version(document)
        if current is not None:
            current_pairs.append((document, current))

    version_ids = [version.id for _document, version in current_pairs]
    processing_by_version = _latest_processing_runs_by_version(db, version_ids)
    structured_by_version = _structured_runs_by_version(db, version_ids)

    page_stats_run_ids: list[uuid.UUID] = []
    for runs in processing_by_version.values():
        for run in runs:
            if run.status == ProcessingRunStatus.COMPLETED:
                page_stats_run_ids.append(run.id)
                break
    page_stats = _page_stats_by_run(db, page_stats_run_ids)

    # Prefer one usable run per version (latest attempt first already ordered).
    preferred_usable: dict[uuid.UUID, uuid.UUID] = {}
    for version_id, runs in structured_by_version.items():
        for run in runs:
            if run.status in USABLE_STRUCTURED:
                preferred_usable[version_id] = run.id
                break
    assertion_stats = _assertion_stats_by_run(db, list(preferred_usable.values()))
    issue_stats = _issue_stats_by_version(db, workspace.id, version_ids)

    items: list[DocumentPipelineSummaryItem] = []
    for document, version in current_pairs:
        definition = REQUIREMENT_DEFINITIONS.get(document.requirement_key)
        processing_runs = processing_by_version.get(version.id, [])
        latest_processing = processing_runs[0] if processing_runs else None
        completed_processing = next(
            (run for run in processing_runs if run.status == ProcessingRunStatus.COMPLETED),
            None,
        )
        evidence_ready_run = next(
            (
                run
                for run in processing_runs
                if run.status == ProcessingRunStatus.COMPLETED
                and page_stats.get(run.id, {}).get("evidence_ready")
            ),
            None,
        )
        stats_run = evidence_ready_run or completed_processing
        page_stat = (
            page_stats.get(stats_run.id, {"page_count": 0, "methods": {}, "evidence_ready": False})
            if stats_run
            else {"page_count": 0, "methods": {}, "evidence_ready": False}
        )

        structured_runs = structured_by_version.get(version.id, [])
        latest_structured = structured_runs[0] if structured_runs else None
        usable_structured = next(
            (run for run in structured_runs if run.status in USABLE_STRUCTURED),
            None,
        )
        stats = assertion_stats.get(usable_structured.id, {}) if usable_structured else {}
        version_issues = issue_stats.get(version.id, {})

        items.append(
            DocumentPipelineSummaryItem(
                document_id=str(document.id),
                document_version_id=str(version.id),
                requirement_key=document.requirement_key,
                requirement_label=definition.name if definition else document.requirement_key,
                original_filename=version.original_filename,
                version_number=version.version_number,
                uploaded_at=version.uploaded_at,
                document_version_status=version.status,
                is_current=True,
                archived=False,
                page_processing=PageProcessingPipelineSummary(
                    latest_attempt_id=str(latest_processing.id) if latest_processing else None,
                    latest_attempt_status=latest_processing.status if latest_processing else None,
                    latest_completed_run_id=(
                        str(completed_processing.id) if completed_processing else None
                    ),
                    latest_evidence_ready_run_id=(
                        str(evidence_ready_run.id) if evidence_ready_run else None
                    ),
                    evidence_ready=bool(evidence_ready_run is not None),
                    page_count=int(page_stat["page_count"]),
                    extraction_method_counts=dict(page_stat["methods"]),
                    warning_count=len((stats_run or latest_processing).warnings or [])
                    if (stats_run or latest_processing)
                    else 0,
                    warnings=list((stats_run or latest_processing).warnings or [])
                    if (stats_run or latest_processing)
                    else [],
                    retry_available=version.status
                    in {
                        DocumentVersionStatus.UPLOADED,
                        DocumentVersionStatus.PROCESSED,
                        DocumentVersionStatus.PROCESSING_FAILED,
                    }
                    and not any(
                        run.status in ACTIVE_PROCESSING_RUN_STATUSES for run in processing_runs
                    ),
                    safe_error_message=(
                        latest_processing.error_message
                        if latest_processing
                        and latest_processing.status == ProcessingRunStatus.FAILED
                        else None
                    ),
                    queued_at=latest_processing.queued_at if latest_processing else None,
                    started_at=latest_processing.claimed_at if latest_processing else None,
                    completed_at=(
                        (stats_run or latest_processing).completed_at
                        if (stats_run or latest_processing)
                        else None
                    ),
                ),
                structured_extraction=StructuredExtractionPipelineSummary(
                    latest_run_id=str(latest_structured.id) if latest_structured else None,
                    latest_run_status=latest_structured.status if latest_structured else None,
                    latest_usable_run_id=str(usable_structured.id) if usable_structured else None,
                    deterministic_status=(
                        latest_structured.deterministic_status if latest_structured else None
                    ),
                    semantic_status=(
                        latest_structured.semantic_status if latest_structured else None
                    ),
                    provider=latest_structured.provider if latest_structured else None,
                    model_name=latest_structured.model_name if latest_structured else None,
                    assertion_count=int(stats.get("total", 0)),
                    pending_review_count=int(stats.get("pending", 0)),
                    approved_count=int(stats.get("approved", 0)),
                    open_issue_count=int(version_issues.get("open", 0)),
                    blocking_issue_count=int(version_issues.get("blocking", 0)),
                    warning_issue_count=int(version_issues.get("warning", 0)),
                    warnings=list(latest_structured.warnings or []) if latest_structured else [],
                    retry_available=bool(
                        evidence_ready_run is not None
                        and not any(
                            run.status in ACTIVE_STRUCTURED_RUN_STATUSES for run in structured_runs
                        )
                    ),
                    safe_error_message=(
                        latest_structured.error_message
                        if latest_structured
                        and latest_structured.status == StructuredRunStatus.FAILED
                        else None
                    ),
                    queued_at=latest_structured.queued_at if latest_structured else None,
                    started_at=latest_structured.claimed_at if latest_structured else None,
                    completed_at=latest_structured.completed_at if latest_structured else None,
                ),
            )
        )

    return DocumentPipelineSummaryResponse(documents=items, aggregation=_aggregate(items))


def _current_version(document: Document) -> DocumentVersion | None:
    active = [
        version for version in document.versions if version.status in CURRENT_VERSION_STATUSES
    ]
    if not active:
        return None
    return max(active, key=lambda item: item.version_number)


def _latest_processing_runs_by_version(
    db: Session,
    version_ids: list[uuid.UUID],
) -> dict[uuid.UUID, list[DocumentProcessingRun]]:
    if not version_ids:
        return {}
    rows = db.scalars(
        select(DocumentProcessingRun)
        .where(DocumentProcessingRun.document_version_id.in_(version_ids))
        .order_by(
            DocumentProcessingRun.document_version_id.asc(),
            DocumentProcessingRun.attempt_number.desc(),
            DocumentProcessingRun.queued_at.desc(),
        )
    ).all()
    grouped: dict[uuid.UUID, list[DocumentProcessingRun]] = defaultdict(list)
    for row in rows:
        grouped[row.document_version_id].append(row)
    return grouped


def _structured_runs_by_version(
    db: Session,
    version_ids: list[uuid.UUID],
) -> dict[uuid.UUID, list[StructuredExtractionRun]]:
    if not version_ids:
        return {}
    rows = db.scalars(
        select(StructuredExtractionRun)
        .where(StructuredExtractionRun.document_version_id.in_(version_ids))
        .order_by(
            StructuredExtractionRun.document_version_id.asc(),
            StructuredExtractionRun.attempt_number.desc(),
            StructuredExtractionRun.queued_at.desc(),
        )
    ).all()
    grouped: dict[uuid.UUID, list[StructuredExtractionRun]] = defaultdict(list)
    for row in rows:
        grouped[row.document_version_id].append(row)
    return grouped


def _page_stats_by_run(
    db: Session,
    run_ids: list[uuid.UUID],
) -> dict[uuid.UUID, dict]:
    if not run_ids:
        return {}
    pages = db.scalars(
        select(DocumentPage).where(DocumentPage.processing_run_id.in_(run_ids))
    ).all()
    runs_by_id = {
        run.id: run
        for run in db.scalars(
            select(DocumentProcessingRun).where(DocumentProcessingRun.id.in_(run_ids))
        ).all()
    }
    grouped: dict[uuid.UUID, list[DocumentPage]] = defaultdict(list)
    for page in pages:
        grouped[page.processing_run_id].append(page)
    stats: dict[uuid.UUID, dict] = {}
    for run_id, items in grouped.items():
        run = runs_by_id.get(run_id)
        schema_version = int(run.output_schema_version or 1) if run else 1
        evidence_ready = bool(items) and all(
            page_is_evidence_contract_ready(
                output_schema_version=schema_version,
                text_blocks=page.text_blocks,
                coordinate_metadata=page.coordinate_metadata,
            )
            for page in items
        )
        stats[run_id] = {
            "page_count": len(items),
            "methods": dict(Counter(page.extraction_method for page in items)),
            "evidence_ready": evidence_ready,
        }
    return stats


def _assertion_stats_by_run(
    db: Session,
    run_ids: list[uuid.UUID],
) -> dict[uuid.UUID, dict[str, int]]:
    if not run_ids:
        return {}
    rows = db.execute(
        select(
            FactAssertion.structured_extraction_run_id,
            FactAssertion.review_status,
            func.count(),
        )
        .where(FactAssertion.structured_extraction_run_id.in_(run_ids))
        .group_by(FactAssertion.structured_extraction_run_id, FactAssertion.review_status)
    ).all()
    stats: dict[uuid.UUID, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for run_id, review_status, count in rows:
        stats[run_id]["total"] += int(count)
        if review_status == ReviewStatus.PENDING:
            stats[run_id]["pending"] += int(count)
        elif review_status == ReviewStatus.APPROVED:
            stats[run_id]["approved"] += int(count)
    return {key: dict(value) for key, value in stats.items()}


def _issue_stats_by_version(
    db: Session,
    workspace_id: uuid.UUID,
    version_ids: list[uuid.UUID],
) -> dict[uuid.UUID, dict[str, int]]:
    if not version_ids:
        return {}
    rows = db.execute(
        select(
            FactAssertion.document_version_id,
            FactIssue.severity,
            FactIssue.blocking,
            func.count(func.distinct(FactIssue.id)),
        )
        .select_from(FactIssue)
        .join(FactIssueAssertion, FactIssueAssertion.issue_id == FactIssue.id)
        .join(FactAssertion, FactAssertion.id == FactIssueAssertion.fact_assertion_id)
        .where(
            FactIssue.workspace_id == workspace_id,
            FactIssue.status.in_(OPEN_ISSUE_STATUSES),
            FactAssertion.document_version_id.in_(version_ids),
        )
        .group_by(FactAssertion.document_version_id, FactIssue.severity, FactIssue.blocking)
    ).all()
    stats: dict[uuid.UUID, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for version_id, severity, blocking, count in rows:
        stats[version_id]["open"] += int(count)
        if blocking:
            stats[version_id]["blocking"] += int(count)
        if severity == "warning":
            stats[version_id]["warning"] += int(count)
    return {key: dict(value) for key, value in stats.items()}


def _aggregate(items: list[DocumentPipelineSummaryItem]) -> WorkstreamPipelineAggregation:
    now = datetime.now(tz=UTC)
    has_active_page = any(
        item.page_processing.latest_attempt_status in ACTIVE_PROCESSING_RUN_STATUSES
        for item in items
    )
    has_active_structured = any(
        item.structured_extraction.latest_run_status in ACTIVE_STRUCTURED_RUN_STATUSES
        for item in items
    )
    return WorkstreamPipelineAggregation(
        has_active_page_processing=has_active_page,
        has_active_structured_extraction=has_active_structured,
        has_any_active_pipeline=has_active_page or has_active_structured,
        total_current_documents=len(items),
        documents_awaiting_processing=sum(
            1
            for item in items
            if item.document_version_status
            in {DocumentVersionStatus.UPLOADED, DocumentVersionStatus.PENDING_PROCESSING}
        ),
        documents_processing=sum(
            1
            for item in items
            if item.document_version_status == DocumentVersionStatus.PROCESSING
            or item.page_processing.latest_attempt_status in ACTIVE_PROCESSING_RUN_STATUSES
        ),
        documents_extracting_facts=sum(
            1
            for item in items
            if item.structured_extraction.latest_run_status in ACTIVE_STRUCTURED_RUN_STATUSES
        ),
        documents_ready_for_review=sum(
            1
            for item in items
            if item.structured_extraction.latest_usable_run_id
            and (
                item.structured_extraction.pending_review_count > 0
                or item.structured_extraction.open_issue_count > 0
            )
        ),
        documents_with_failures=sum(
            1
            for item in items
            if item.document_version_status == DocumentVersionStatus.PROCESSING_FAILED
            or item.structured_extraction.latest_run_status == StructuredRunStatus.FAILED
        ),
        last_updated_at=now,
    )
