"""Authoritative Company & Incorporation overview readiness summary."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.fact_assertion import FactAssertion
from app.models.fact_issue import FactIssue
from app.models.user import User
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from app.modules.company_incorporation.documents.pipeline_summary import (
    get_document_pipeline_summary,
)
from app.modules.company_incorporation.documents.requirements_config import (
    REQUIREMENT_DEFINITIONS,
)
from app.modules.company_incorporation.documents.service import _require_workspace
from app.modules.company_incorporation.overview_summary_schemas import (
    OverviewBlocker,
    OverviewConflictsSummary,
    OverviewDisclosuresSummary,
    OverviewDocumentsSummary,
    OverviewFactsSummary,
    OverviewInformationSummary,
    OverviewProfessionalReviewSummary,
    OverviewSectionStatus,
    OverviewSummaryResponse,
    OverviewWarning,
)
from app.modules.company_incorporation.progress import (
    TOTAL_SECTIONS,
    calculate_progress,
    calculate_section_progress,
)
from app.modules.company_incorporation.structured_extraction.constants import (
    ACTIVE_STRUCTURED_RUN_STATUSES,
    IssueStatus,
    QualityCategory,
    ReviewStatus,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.service import (
    _usable_assertions_for_workspace,
)

ReadinessStatus = Literal[
    "not_started",
    "in_progress",
    "complete",
    "failed",
    "review_required",
    "clear",
    "blocking",
    "processing",
    "not_assessed",
]


OPEN_ISSUE_STATUSES = frozenset(
    {
        IssueStatus.OPEN,
        IssueStatus.AWAITING_CLARIFICATION,
        IssueStatus.ESCALATED,
    }
)


def get_overview_summary(db: Session, user: User) -> OverviewSummaryResponse:
    workspace = _require_workspace(db, user)
    payload = dict(workspace.payload or {})
    progress = calculate_progress(payload)
    section_progress = calculate_section_progress(payload)

    information = OverviewInformationSummary(
        completed_sections=int(progress["sectionsComplete"]),
        total_sections=TOTAL_SECTIONS,
        status=progress["overallStatus"],
        sections=[
            OverviewSectionStatus(section_id=section_id, status=status)
            for section_id, status in section_progress.items()
        ],
    )

    pipeline = get_document_pipeline_summary(db, user)
    documents = _documents_summary(pipeline)
    assertions = _usable_assertions_for_workspace(db, workspace.id)
    facts = _facts_summary(assertions, pipeline)
    conflicts = _conflicts_summary(db, workspace.id)
    disclosures = OverviewDisclosuresSummary(status="not_assessed")
    professional = OverviewProfessionalReviewSummary(status="not_assessed")

    blockers: list[OverviewBlocker] = []
    warnings: list[OverviewWarning] = []
    if documents.status == "failed":
        blockers.append(
            OverviewBlocker(
                code="document_processing_failed",
                message="One or more mandatory documents failed page processing.",
            )
        )
    if conflicts.blocking_issue_count > 0:
        blockers.append(
            OverviewBlocker(
                code="blocking_conflicts",
                message=f"{conflicts.blocking_issue_count} blocking conflict(s) require resolution.",
            )
        )
    if facts.pending_review_count > 0:
        warnings.append(
            OverviewWarning(
                code="facts_pending_review",
                message=f"{facts.pending_review_count} assertion(s) are pending review.",
            )
        )
    if conflicts.warning_issue_count > 0:
        warnings.append(
            OverviewWarning(
                code="warning_conflicts",
                message=f"{conflicts.warning_issue_count} warning issue(s) remain open.",
            )
        )
    if documents.documents_with_warnings > 0:
        warnings.append(
            OverviewWarning(
                code="document_warnings",
                message="One or more documents completed with processing warnings.",
            )
        )

    overall_status = _overall_status(
        information_status=information.status,
        documents_status=documents.status,
        facts_status=facts.status,
        conflicts_status=conflicts.status,
        has_blockers=bool(blockers),
    )

    return OverviewSummaryResponse(
        information=information,
        documents=documents,
        facts=facts,
        conflicts=conflicts,
        disclosures=disclosures,
        professional_review=professional,
        overall_status=overall_status,
        ready_for_disclosure_generation=False,
        blockers=blockers,
        warnings=warnings,
        last_updated_at=datetime.now(tz=UTC),
    )


def _documents_summary(pipeline) -> OverviewDocumentsSummary:
    mandatory_keys = {
        key
        for key, definition in REQUIREMENT_DEFINITIONS.items()
        if definition.requirement_level == "mandatory"
    }
    docs = [item for item in pipeline.documents if item.requirement_key in mandatory_keys]
    mandatory_required = len(mandatory_keys)
    mandatory_uploaded = len({item.requirement_key for item in docs})
    mandatory_processed = len(
        {
            item.requirement_key
            for item in docs
            if item.document_version_status == DocumentVersionStatus.PROCESSED
            and item.page_processing.evidence_ready
        }
    )
    mandatory_failed = len(
        {
            item.requirement_key
            for item in docs
            if item.document_version_status == DocumentVersionStatus.PROCESSING_FAILED
        }
    )
    active_processing = pipeline.aggregation.documents_processing
    structured_active = pipeline.aggregation.documents_extracting_facts
    with_warnings = sum(1 for item in pipeline.documents if item.page_processing.warning_count > 0)

    if mandatory_failed:
        status: ReadinessStatus = "failed"
    elif (
        active_processing or structured_active or pipeline.aggregation.documents_awaiting_processing
    ):
        status = "in_progress"
    elif pipeline.aggregation.documents_ready_for_review:
        status = "review_required"
    elif mandatory_uploaded == 0:
        status = "not_started"
    elif mandatory_processed >= mandatory_uploaded and mandatory_uploaded > 0:
        status = "complete"
    else:
        status = "in_progress"

    return OverviewDocumentsSummary(
        mandatory_required=mandatory_required,
        mandatory_uploaded=mandatory_uploaded,
        mandatory_processed=mandatory_processed,
        mandatory_failed=mandatory_failed,
        active_processing_count=active_processing,
        structured_extraction_active_count=structured_active,
        documents_with_warnings=with_warnings,
        status=status,
    )


def _facts_summary(assertions: list[FactAssertion], pipeline) -> OverviewFactsSummary:
    if any(
        item.structured_extraction.latest_run_status in ACTIVE_STRUCTURED_RUN_STATUSES
        for item in pipeline.documents
    ):
        status: ReadinessStatus = "processing"
    elif any(
        item.structured_extraction.latest_run_status == "failed"
        and not item.structured_extraction.latest_usable_run_id
        for item in pipeline.documents
    ):
        status = "failed"
    elif not assertions:
        status = "not_started"
    else:
        pending = sum(1 for row in assertions if row.review_status == ReviewStatus.PENDING)
        status = "review_required" if pending else "complete"

    by_fact: dict[str, list[FactAssertion]] = defaultdict(list)
    for row in assertions:
        by_fact[row.fact_key].append(row)

    return OverviewFactsSummary(
        fact_group_count=len(by_fact),
        assertion_count=len(assertions),
        approved_assertion_count=sum(
            1 for row in assertions if row.review_status == ReviewStatus.APPROVED
        ),
        pending_review_count=sum(
            1 for row in assertions if row.review_status == ReviewStatus.PENDING
        ),
        rejected_count=sum(1 for row in assertions if row.review_status == ReviewStatus.REJECTED),
        historical_count=sum(
            1 for row in assertions if row.review_status == ReviewStatus.HISTORICAL
        ),
        low_quality_count=sum(
            1
            for row in assertions
            if row.quality_category in {QualityCategory.LOW, QualityCategory.REVIEW_REQUIRED}
        ),
        invalid_assertion_count=sum(
            1 for row in assertions if row.validation_status == ValidationStatus.INVALID
        ),
        facts_with_multiple_sources=sum(1 for rows in by_fact.values() if len(rows) > 1),
        status=status,
    )


def _conflicts_summary(db: Session, workspace_id) -> OverviewConflictsSummary:
    issues = db.scalars(select(FactIssue).where(FactIssue.workspace_id == workspace_id)).all()
    open_issues = [issue for issue in issues if issue.status in OPEN_ISSUE_STATUSES]
    if not issues and not open_issues:
        # Distinguish never-extracted vs clear after review using assertion presence later.
        status: ReadinessStatus = "not_started"
    elif any(issue.blocking and issue.status in OPEN_ISSUE_STATUSES for issue in open_issues):
        status = "blocking"
    elif open_issues:
        status = "review_required"
    else:
        status = "clear"

    return OverviewConflictsSummary(
        open_issue_count=len(open_issues),
        blocking_issue_count=sum(1 for issue in open_issues if issue.blocking),
        warning_issue_count=sum(1 for issue in open_issues if issue.severity == "warning"),
        awaiting_clarification_count=sum(
            1 for issue in open_issues if issue.status == IssueStatus.AWAITING_CLARIFICATION
        ),
        escalated_count=sum(1 for issue in open_issues if issue.status == IssueStatus.ESCALATED),
        resolved_issue_count=sum(
            1 for issue in issues if issue.status in {IssueStatus.RESOLVED, IssueStatus.DISMISSED}
        ),
        status=status,
    )


def _overall_status(
    *,
    information_status: str,
    documents_status: str,
    facts_status: str,
    conflicts_status: str,
    has_blockers: bool,
) -> str:
    if has_blockers or conflicts_status == "blocking" or documents_status == "failed":
        return "blocking" if has_blockers or conflicts_status == "blocking" else "failed"
    if any(
        status in {"in_progress", "processing"}
        for status in (information_status, documents_status, facts_status)
    ):
        return "in_progress"
    if facts_status == "review_required" or conflicts_status == "review_required":
        return "review_required"
    if information_status == "not_started" and documents_status == "not_started":
        return "not_started"
    if information_status == "complete" and documents_status in {"complete", "review_required"}:
        return "in_progress" if facts_status != "complete" else "complete"
    return "in_progress"
