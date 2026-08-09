"""Reports & Export service layer (G7)."""

from __future__ import annotations

from app.models.drhp_document import DrhpDocumentVersion
from app.models.user import User
from app.modules.reports_exports.context import build_reports_context, drhp_export_available
from app.modules.reports_exports.schemas import (
    DrhpExportCardResponse,
    ReportCardResponse,
    ReportsExportSummaryResponse,
    WorkstreamProgressItem,
    WorkstreamTotalsResponse,
)
from sqlalchemy.orm import Session


def build_summary(db: Session, user: User) -> ReportsExportSummaryResponse:
    ctx = build_reports_context(db, user)

    doc_version = None
    if ctx.latest_drhp_version_id:
        doc_version = db.get(DrhpDocumentVersion, ctx.latest_drhp_version_id)
    export_ready = drhp_export_available(doc_version)

    drhp_card = DrhpExportCardResponse(
        available=export_ready,
        version_number=ctx.latest_drhp_version_number,
        version_id=ctx.latest_drhp_version_id,
        status=ctx.latest_drhp_status,
        status_label=ctx.latest_drhp_status_label,
        generated_at=ctx.latest_drhp_generated_at,
        stale=ctx.drhp_stale,
        affected_chapter_count=ctx.affected_chapter_count,
    )

    totals = ctx.workstream_totals
    ws_complete = totals.get("complete", 0)
    ws_total = totals.get("total", 12)
    open_issues = ctx.issues_summary.get("totalOpen", ctx.issues_summary.get("total_open", 0))
    high_issues = ctx.issues_summary.get("high", 0)
    blocking = ctx.issues_summary.get("blocking", 0)
    facts_count = ctx.facts_summary.get("canonicalFacts", ctx.facts_summary.get("canonical_facts", 0))
    evidence_count = ctx.evidence_summary.get("evidenceItems", ctx.evidence_summary.get("evidence_items", 0))
    uploaded_docs = ctx.data_room_summary.get("totalDocuments", ctx.data_room_summary.get("total_documents", 0))
    missing_docs = ctx.data_room_summary.get(
        "missingRequirements",
        ctx.data_room_summary.get("missing_requirements", 0),
    )

    provided_reqs = ctx.data_room_summary.get(
        "providedRequirements",
        ctx.data_room_summary.get("provided_requirements", 0),
    )
    applicable_reqs = ctx.data_room_summary.get(
        "applicableRequirements",
        ctx.data_room_summary.get("applicable_requirements", 0),
    )
    doc_ratio = (provided_reqs / applicable_reqs) if applicable_reqs else None
    prof_review = ctx.issues_summary.get(
        "professionalReview",
        ctx.issues_summary.get("professional_review", 0),
    )

    cards = [
        ReportCardResponse(
            card_id="drhp-docx",
            title="DRHP Working Draft",
            description="Editable Word export of the latest generated DRHP draft.",
            format_label="Word (.docx)",
            status_label=ctx.latest_drhp_status_label if export_ready else "Not generated",
            detail_label=(
                f"Draft v{ctx.latest_drhp_version_number}"
                if ctx.latest_drhp_version_number
                else "Generate a DRHP draft first."
            ),
            available=export_ready,
            disabled_reason="" if export_ready else "Generate a DRHP draft first.",
            download_kind="drhp-docx",
        ),
        ReportCardResponse(
            card_id="drhp-pdf",
            title="DRHP Draft PDF",
            description="PDF export of the latest generated DRHP draft.",
            format_label="PDF",
            status_label=ctx.latest_drhp_status_label if export_ready else "Not generated",
            detail_label=(
                f"Draft v{ctx.latest_drhp_version_number}"
                if ctx.latest_drhp_version_number
                else "Generate a DRHP draft first."
            ),
            available=export_ready,
            disabled_reason="" if export_ready else "Generate a DRHP draft first.",
            download_kind="drhp-pdf",
        ),
        ReportCardResponse(
            card_id="readiness",
            title="Readiness Report",
            description="Executive summary of IPO preparation status using live project state.",
            format_label="PDF",
            status_label=f"{ws_complete} of {ws_total} workstreams complete",
            detail_label=(
                f"{open_issues} open issues"
                + (f" · {blocking} blocking" if blocking else "")
                + (f" · {high_issues} high priority" if high_issues else "")
            ),
            available=True,
            download_kind="readiness-pdf",
            progress_ratio=ws_complete / ws_total if ws_total else None,
            progress_caption=f"{ws_complete} of {ws_total} workstreams complete",
        ),
        ReportCardResponse(
            card_id="issues",
            title="Issues & Gaps Report",
            description="Export the global Issues & Gaps register for review and tracking.",
            format_label="Excel (.xlsx)",
            status_label=f"{open_issues} open issues",
            detail_label=f"{prof_review} professional-review items",
            available=True,
            download_kind="issues-xlsx",
        ),
        ReportCardResponse(
            card_id="facts-evidence",
            title="Facts & Evidence Register",
            description="Canonical facts, documentary evidence, and DRHP usage in a structured workbook.",
            format_label="Excel (.xlsx)",
            status_label=f"{facts_count} canonical facts",
            detail_label=f"{evidence_count} evidence items",
            available=True,
            download_kind="facts-evidence-xlsx",
        ),
        ReportCardResponse(
            card_id="data-room",
            title="Data Room Index",
            description="Uploaded documents and expected document requirements across all workstreams.",
            format_label="Excel (.xlsx)",
            status_label=f"{uploaded_docs} uploaded documents",
            detail_label=f"{missing_docs} missing applicable requirements",
            available=True,
            download_kind="data-room-xlsx",
            progress_ratio=doc_ratio,
            progress_caption=(
                f"{provided_reqs} of {applicable_reqs} applicable requirements provided"
                if applicable_reqs
                else ""
            ),
        ),
        ReportCardResponse(
            card_id="workbook",
            title="IPO Preparation Workbook",
            description="Consolidated workbook for merchant bankers, lawyers, and internal review teams.",
            format_label="Excel (.xlsx)",
            status_label="Consolidated export",
            detail_label=f"{ws_complete}/{ws_total} workstreams · {open_issues} issues · {uploaded_docs} documents",
            available=True,
            download_kind="preparation-workbook-xlsx",
        ),
    ]

    return ReportsExportSummaryResponse(
        issuer=ctx.issuer_name,
        generated_at=ctx.generated_at,
        workstreams=WorkstreamTotalsResponse(
            complete=ws_complete,
            in_progress=totals.get("inProgress", 0),
            not_started=totals.get("notStarted", 0),
            total=ws_total,
        ),
        workstream_items=[WorkstreamProgressItem.model_validate(item) for item in ctx.workstreams],
        drhp_docx=drhp_card,
        drhp_pdf=drhp_card,
        issues_summary=ctx.issues_summary,
        facts_evidence_summary={**ctx.facts_summary, **ctx.evidence_summary},
        data_room_summary=ctx.data_room_summary,
        cards=cards,
        next_actions=ctx.next_actions,
    )
