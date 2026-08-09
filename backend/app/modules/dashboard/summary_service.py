"""Dashboard summary aggregation (G8)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpDocumentVersion
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.models.user import User
from app.modules.dashboard.next_actions import build_dashboard_next_actions
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.dashboard.summary_schemas import (
    DashboardDataRoomResponse,
    DashboardDrhpResponse,
    DashboardFactsEvidenceResponse,
    DashboardIssuesResponse,
    DashboardNextActionResponse,
    DashboardSummaryResponse,
    DashboardTopIssueResponse,
    DashboardWorkstreamItemResponse,
    DashboardWorkstreamsResponse,
    IssuerContextResponse,
)
from app.modules.data_room.aggregator import aggregate_data_room
from app.modules.data_room.constants import REQUIREMENT_NOT_APPLICABLE
from app.modules.data_room.service import build_summary as build_data_room_summary
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.drhp.service import get_document_generation_status, get_latest_drhp_document
from app.modules.facts_evidence.aggregator import aggregate_facts_context
from app.modules.facts_evidence.service import _usage_for_fact, build_evidence_summary, build_fact_summary
from app.modules.issues_gaps.service import build_summary as build_issues_summary, list_issues
from app.modules.reports_exports.context import drhp_export_available, drhp_status_label
from app.modules.reports_exports.workstreams import build_workstream_progress, summarize_workstreams

PROGRESS_STATE_LABELS = {
    "not_started": "Not started",
    "in_progress": "In progress",
    "complete": "Complete",
}

SEVERITY_LABELS = {
    "blocking": "Blocking",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
}


def _section(draft_data: dict[str, Any], key: str) -> dict[str, Any]:
    value = draft_data.get(key)
    return value if isinstance(value, dict) else {}


def _workstream_href(workstream_key: str) -> str:
    if workstream_key == "company-incorporation":
        return "/projects/demo/workstreams/company-incorporation?tab=information"
    return f"/projects/demo/workstreams/{workstream_key}?tab=information"


def _issuer_context(db: Session, user: User) -> IssuerContextResponse:
    application = get_submitted_sme_application(db, user.id)
    draft = dict(application.draft_data or {})
    company = _section(draft, "companyIdentity")
    ipo = _section(draft, "ipoIntent")
    return IssuerContextResponse(
        issuer_name=str(company.get("legalName") or user.full_name or "Issuer"),
        company_class=str(company.get("companyClass") or ""),
        target_exchange=str(ipo.get("intendedExchange") or ""),
        issue_type=str(ipo.get("proposedIssueType") or ""),
        target_timeline=str(ipo.get("targetTimeline") or ""),
        preparation_stage=str(ipo.get("preparationStage") or ""),
    )


def _document_counts(requirements: list[Any], workstream_key: str) -> tuple[int, int]:
    applicable = [
        req
        for req in requirements
        if req.workstream_key == workstream_key and req.applicability_state != REQUIREMENT_NOT_APPLICABLE
    ]
    provided = sum(1 for req in applicable if req.status in {"provided", "partially_provided"})
    return provided, len(applicable)


def _top_issues(issues: list[Any], *, limit: int = 5) -> list[DashboardTopIssueResponse]:
    open_issues = [issue for issue in issues if issue.lifecycle_state != "cleared"]
    ranked = sorted(
        open_issues,
        key=lambda issue: (
            {"blocking": 0, "high": 1, "medium": 2, "low": 3}.get(issue.severity, 9),
            0 if issue.professional_review_required else 1,
        ),
    )
    items: list[DashboardTopIssueResponse] = []
    for issue in ranked[:limit]:
        items.append(
            DashboardTopIssueResponse(
                issue_id=issue.fingerprint,
                title=issue.title,
                severity=issue.severity,
                severity_label=SEVERITY_LABELS.get(issue.severity, issue.severity.title()),
                workstream_key=issue.workstream_key,
                workstream_label=issue.workstream_label,
                reason=issue.why_it_matters or issue.description,
                href=issue.open_source_url or f"/projects/demo/issues-gaps?issue={issue.fingerprint}",
            )
        )
    return items


def build_dashboard_summary(db: Session, user: User) -> DashboardSummaryResponse:
    warnings: list[str] = []
    generated_at = datetime.now(tz=UTC)

    try:
        issuer_context = _issuer_context(db, user)
    except Exception:
        issuer_context = IssuerContextResponse(issuer_name=user.full_name or "Issuer")
        warnings.append("Issuer context could not be loaded.")

    progress_rows = build_workstream_progress(db, user.id)
    totals = summarize_workstreams(progress_rows)

    try:
        dr_ctx = aggregate_data_room(db, user)
    except Exception:
        dr_ctx = None
        warnings.append("Data Room summary unavailable.")

    requirements = dr_ctx.requirements if dr_ctx else []
    issues_listing = list_issues(db, user)
    open_issues = [issue for issue in issues_listing.issues if issue.lifecycle_state != "cleared"]
    issues_summary = build_issues_summary(db, user)

    try:
        facts_ctx = aggregate_facts_context(db, user)
        facts_summary = build_fact_summary(db, user)
        evidence_summary = build_evidence_summary(db, user)
        facts_used_in_drhp = sum(1 for fact in facts_ctx.facts if _usage_for_fact(fact, facts_ctx.drhp_usage))
    except Exception:
        facts_ctx = None
        facts_summary = None
        evidence_summary = None
        facts_used_in_drhp = 0
        warnings.append("Facts & Evidence summary unavailable.")

    try:
        dr_summary = build_data_room_summary(db, user)
    except Exception:
        dr_summary = None
        warnings.append("Data Room counts unavailable.")

    ws_items: list[DashboardWorkstreamItemResponse] = []
    issues_by_ws = issues_summary.by_workstream or {}
    for index, row in enumerate(progress_rows, start=1):
        key = row["workstreamKey"]
        doc_provided, doc_expected = _document_counts(requirements, key)
        state = row["overallStatus"]
        ws_items.append(
            DashboardWorkstreamItemResponse(
                key=key,
                label=row["workstreamLabel"],
                order=index,
                completed_sections=row["sectionsComplete"],
                total_sections=row["totalSections"],
                progress_state=state,
                progress_state_label=PROGRESS_STATE_LABELS.get(state, state.replace("_", " ").title()),
                open_issues=int(issues_by_ws.get(key, 0)),
                document_provided=doc_provided,
                document_expected=doc_expected,
                primary_review_state=PROGRESS_STATE_LABELS.get(state, state),
                href=_workstream_href(key),
            )
        )

    latest = get_latest_drhp_document(db, user)
    doc_version: DrhpDocumentVersion | None = None
    drhp_payload = DashboardDrhpResponse()
    if latest and latest.latest_version_id:
        doc_version = db.get(DrhpDocumentVersion, latest.latest_version_id)
        if doc_version:
            status_resp = get_document_generation_status(db, user, doc_version.id)
            generated = sum(1 for ch in status_resp.chapters if ch.status == "generated")
            with_warnings = sum(1 for ch in status_resp.chapters if ch.status == "generated_with_warnings")
            blocked = sum(1 for ch in status_resp.chapters if ch.status == "blocked")
            failed = sum(1 for ch in status_resp.chapters if ch.status == "failed")
            affected = 0
            if status_resp.is_stale:
                snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
                if snapshot:
                    stale_result = compare_snapshot_staleness(db, user.id, snapshot)
                    affected = len(stale_result.get("affectedChapters") or [])

            drhp_payload = DashboardDrhpResponse(
                exists=True,
                version_id=str(doc_version.id),
                version_number=doc_version.version_number,
                status=doc_version.status,
                status_label=drhp_status_label(doc_version.status),
                generated_at=doc_version.completed_at or doc_version.created_at,
                chapter_total=doc_version.total_chapters,
                generated=generated,
                generated_with_warnings=with_warnings,
                blocked=blocked,
                failed=failed,
                stale=status_resp.is_stale,
                affected_chapter_count=affected,
                export_available=drhp_export_available(doc_version),
            )

    raw_actions = build_dashboard_next_actions(
        issues=open_issues,
        workstreams=progress_rows,
        requirements=requirements,
        drhp_exists=drhp_payload.exists,
        drhp_stale=drhp_payload.stale,
        drhp_status=drhp_payload.status,
        drhp_affected_chapters=drhp_payload.affected_chapter_count,
        professional_review_count=issues_summary.professional_review,
    )

    return DashboardSummaryResponse(
        issuer_context=issuer_context,
        workstreams=DashboardWorkstreamsResponse(
            total=totals.get("total", 12),
            complete=totals.get("complete", 0),
            in_progress=totals.get("inProgress", 0),
            not_started=totals.get("notStarted", 0),
            total_sections=sum(item.total_sections for item in ws_items),
            completed_sections=sum(item.completed_sections for item in ws_items),
            items=ws_items,
        ),
        issues=DashboardIssuesResponse(
            open=issues_summary.total_open,
            blocking=issues_summary.blocking,
            high=issues_summary.high,
            medium=issues_summary.medium,
            low=issues_summary.low,
            professional_review=issues_summary.professional_review,
            top_issues=_top_issues(open_issues),
        ),
        facts_evidence=DashboardFactsEvidenceResponse(
            canonical_facts=facts_summary.canonical_facts if facts_summary else 0,
            document_backed_facts=facts_summary.document_backed if facts_summary else 0,
            structured_input_facts=facts_summary.structured_input if facts_summary else 0,
            calculated_facts=facts_summary.calculated if facts_summary else 0,
            professional_confirmation_facts=facts_summary.professional_confirmation if facts_summary else 0,
            facts_used_in_latest_drhp=facts_used_in_drhp,
            evidence_documents=evidence_summary.documents if evidence_summary else 0,
            evidence_items=evidence_summary.evidence_items if evidence_summary else 0,
        ),
        data_room=DashboardDataRoomResponse(
            uploaded_documents=dr_summary.total_documents if dr_summary else 0,
            expected_applicable=dr_summary.applicable_requirements if dr_summary else 0,
            provided_requirements=dr_summary.provided_requirements if dr_summary else 0,
            missing_requirements=dr_summary.missing_requirements if dr_summary else 0,
            review_applicability=dr_summary.review_applicability_requirements if dr_summary else 0,
            processed_documents=dr_summary.document_backed_documents if dr_summary else 0,
            stored_only_documents=dr_summary.stored_only_documents if dr_summary else 0,
        ),
        drhp=drhp_payload,
        next_actions=[
            DashboardNextActionResponse(
                id=action.id,
                priority=action.priority,
                title=action.title,
                description=action.description,
                source_type=action.source_type,
                workstream_key=action.workstream_key,
                issue_id=action.issue_id,
                action_label=action.action_label,
                href=action.href,
            )
            for action in raw_actions
        ],
        generated_at=generated_at,
        warnings=warnings,
    )
