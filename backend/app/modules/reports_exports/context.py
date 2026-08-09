"""Shared context for Reports & Export (G7)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.models.drhp_document import DrhpDocumentVersion
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.models.user import User
from app.modules.dashboard.service import get_submitted_sme_application
from app.modules.data_room.aggregator import aggregate_data_room
from app.modules.data_room.service import build_summary as build_data_room_summary
from app.modules.drhp.constants import DocumentVersionStatus
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.drhp.service import get_document_generation_status, get_latest_drhp_document
from app.modules.facts_evidence.aggregator import aggregate_evidence, aggregate_facts_context
from app.modules.facts_evidence.service import (
    _usage_for_fact,
    build_evidence_summary,
    build_fact_summary,
)
from app.modules.issues_gaps.service import build_summary as build_issues_summary, list_issues
from app.modules.reports_exports.workstreams import build_workstream_progress, summarize_workstreams
from sqlalchemy.orm import Session


DRHP_STATUS_LABELS: dict[str, str] = {
    DocumentVersionStatus.GENERATED: "Generated",
    DocumentVersionStatus.GENERATED_WITH_WARNINGS: "Generated with warnings",
    DocumentVersionStatus.PARTIALLY_GENERATED: "Partial",
    DocumentVersionStatus.GENERATING: "Generating",
    DocumentVersionStatus.QUEUED: "Not generated",
    DocumentVersionStatus.FAILED: "Failed",
}


def drhp_status_label(status: str | None) -> str:
    if not status:
        return "Not generated"
    return DRHP_STATUS_LABELS.get(status, status.replace("_", " ").title())


def drhp_export_available(doc_version: DrhpDocumentVersion | None) -> bool:
    if doc_version is None:
        return False
    if doc_version.status in {DocumentVersionStatus.QUEUED}:
        return False
    if doc_version.status == DocumentVersionStatus.GENERATING and doc_version.completed_chapters <= 0:
        return False
    return doc_version.completed_chapters > 0


@dataclass
class ReportsExportContext:
    issuer_name: str
    generated_at: datetime
    workstreams: list[dict[str, Any]] = field(default_factory=list)
    workstream_totals: dict[str, int] = field(default_factory=dict)
    issues_summary: dict[str, Any] = field(default_factory=dict)
    issues: list[Any] = field(default_factory=list)
    facts_summary: dict[str, Any] = field(default_factory=dict)
    evidence_summary: dict[str, Any] = field(default_factory=dict)
    facts: list[Any] = field(default_factory=list)
    evidence: list[Any] = field(default_factory=list)
    data_room_summary: dict[str, Any] = field(default_factory=dict)
    data_room_documents: list[Any] = field(default_factory=list)
    data_room_requirements: list[Any] = field(default_factory=list)
    latest_drhp_version_id: str | None = None
    latest_drhp_version_number: int | None = None
    latest_drhp_status: str | None = None
    latest_drhp_status_label: str = "Not generated"
    latest_drhp_generated_at: datetime | None = None
    drhp_stale: bool = False
    affected_chapter_count: int = 0
    drhp_chapters: list[Any] = field(default_factory=list)
    next_actions: list[str] = field(default_factory=list)


def _issuer_name(db: Session, user: User) -> str:
    try:
        application = get_submitted_sme_application(db, user.id)
        company = (application.draft_data or {}).get("companyIdentity") or {}
        if isinstance(company, dict):
            name = str(company.get("legalName") or "").strip()
            if name:
                return name
    except Exception:
        pass
    return user.full_name or "Issuer"


def _build_next_actions(ctx: ReportsExportContext) -> list[str]:
    actions: list[str] = []
    if ctx.latest_drhp_version_id is None:
        actions.append("Generate a DRHP draft from the DRHP workspace.")
    elif ctx.drhp_stale:
        actions.append("Review source updates and consider regenerating the DRHP draft.")
    if ctx.issues_summary.get("blocking", 0) > 0:
        actions.append("Resolve blocking Issues & Gaps items before filing preparation.")
    if ctx.issues_summary.get("high", 0) > 0:
        actions.append("Review high-priority Issues & Gaps.")
    if ctx.data_room_summary.get("missingRequirements", 0) > 0:
        actions.append("Upload or review missing applicable Data Room document requirements.")
    complete = ctx.workstream_totals.get("complete", 0)
    total = ctx.workstream_totals.get("total", 12)
    if complete < total:
        actions.append(f"Continue completing workstream information ({complete} of {total} complete).")
    if ctx.issues_summary.get("professionalReview", 0) > 0:
        actions.append("Obtain professional confirmations flagged in Issues & Gaps.")
    return actions[:8]


def build_reports_context(db: Session, user: User) -> ReportsExportContext:
    workstreams = build_workstream_progress(db, user.id)
    totals = summarize_workstreams(workstreams)

    issues_summary = build_issues_summary(db, user).model_dump(by_alias=True)
    issues_listing = list_issues(db, user)
    open_issues = [issue for issue in issues_listing.issues if issue.lifecycle_state != "cleared"]

    facts_ctx = aggregate_facts_context(db, user)
    facts_summary = build_fact_summary(db, user).model_dump(by_alias=True)
    evidence_summary = build_evidence_summary(db, user).model_dump(by_alias=True)
    evidence_rows = aggregate_evidence(db, user)

    dr_summary = build_data_room_summary(db, user).model_dump(by_alias=True)
    dr_ctx = aggregate_data_room(db, user)

    latest = get_latest_drhp_document(db, user)
    doc_version: DrhpDocumentVersion | None = None
    chapters: list[Any] = []
    stale = False
    affected = 0
    generated_at: datetime | None = None

    if latest and latest.latest_version_id:
        doc_version = db.get(DrhpDocumentVersion, latest.latest_version_id)
        if doc_version:
            generated_at = doc_version.completed_at or doc_version.created_at
            status_resp = get_document_generation_status(db, user, doc_version.id)
            chapters = [ch.model_dump(by_alias=True) for ch in status_resp.chapters]
            stale = status_resp.is_stale
            snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
            if snapshot:
                stale_result = compare_snapshot_staleness(db, user.id, snapshot)
                affected = len(stale_result.get("affectedChapters") or [])

    ctx = ReportsExportContext(
        issuer_name=_issuer_name(db, user),
        generated_at=datetime.now(tz=UTC),
        workstreams=workstreams,
        workstream_totals=totals,
        issues_summary=issues_summary,
        issues=open_issues,
        facts_summary=facts_summary,
        evidence_summary=evidence_summary,
        facts=facts_ctx.facts,
        evidence=evidence_rows,
        data_room_summary=dr_summary,
        data_room_documents=dr_ctx.documents,
        data_room_requirements=dr_ctx.requirements,
        latest_drhp_version_id=str(latest.latest_version_id) if latest and latest.latest_version_id else None,
        latest_drhp_version_number=latest.latest_version_number if latest else None,
        latest_drhp_status=latest.latest_status if latest else None,
        latest_drhp_status_label=drhp_status_label(latest.latest_status if latest else None),
        latest_drhp_generated_at=generated_at,
        drhp_stale=stale,
        affected_chapter_count=affected,
        drhp_chapters=chapters,
    )
    ctx.next_actions = _build_next_actions(ctx)
    return ctx


def facts_with_usage(ctx: ReportsExportContext, facts_ctx) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for fact in ctx.facts:
        usage = _usage_for_fact(fact, facts_ctx.drhp_usage)
        chapters = ", ".join({u.chapter_label for u in usage if u.chapter_label})
        rows.append(
            {
                "label": fact.label,
                "value": fact.display_value,
                "workstream": fact.workstream_label,
                "section": fact.section_label,
                "record": fact.record_label,
                "supportType": fact.support_type,
                "supportState": fact.support_state,
                "period": fact.reporting_period or fact.as_of_date,
                "evidenceCount": len(fact.evidence_refs or []),
                "drhpUsageCount": len(usage),
                "affectedChapters": chapters,
                "relatedIssues": len(facts_ctx.issue_links.get(fact.fingerprint, [])),
            }
        )
    return rows
