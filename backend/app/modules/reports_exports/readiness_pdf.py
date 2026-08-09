"""Readiness Report PDF generation (G7)."""

from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.modules.reports_exports.context import ReportsExportContext
from app.modules.reports_exports.filenames import dated_suffix, issuer_prefix

DISCLAIMER = (
    "Dwaar assists with information organisation and IPO/DRHP preparation. "
    "This report does not constitute legal advice, merchant banker certification, "
    "auditor certification, regulatory approval, or SEBI/exchange approval. "
    "Professional due diligence remains required."
)


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle",
            parent=base["Heading1"],
            fontSize=16,
            spaceAfter=8,
        ),
        "heading": ParagraphStyle(
            "ReportHeading",
            parent=base["Heading2"],
            fontSize=12,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "ReportBody",
            parent=base["BodyText"],
            fontSize=10,
            leading=14,
        ),
        "small": ParagraphStyle(
            "ReportSmall",
            parent=base["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.grey,
        ),
    }


def render_readiness_pdf(ctx: ReportsExportContext) -> tuple[bytes, str]:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"{ctx.issuer_name} — IPO Preparation Readiness Report",
    )
    styles = _styles()
    story: list = []

    story.append(Paragraph("IPO Preparation Readiness Report", styles["title"]))
    story.append(Paragraph(ctx.issuer_name, styles["heading"]))
    story.append(Paragraph(f"Generated: {ctx.generated_at.strftime('%Y-%m-%d %H:%M %Z')}", styles["body"]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Executive preparation summary", styles["heading"]))
    totals = ctx.workstream_totals
    story.append(
        Paragraph(
            f"{totals.get('complete', 0)} of {totals.get('total', 12)} workstreams complete · "
            f"{ctx.issues_summary.get('totalOpen', 0)} open issues · "
            f"{ctx.issues_summary.get('blocking', 0)} blocking · "
            f"{ctx.issues_summary.get('high', 0)} high priority · "
            f"{ctx.facts_summary.get('canonicalFacts', 0)} canonical facts · "
            f"{ctx.data_room_summary.get('totalDocuments', 0)} uploaded documents · "
            f"{ctx.data_room_summary.get('missingRequirements', 0)} missing applicable document requirements",
            styles["body"],
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph("Workstream status", styles["heading"]))
    ws_rows = [["Workstream", "Status", "Sections complete", "Total sections"]]
    for row in ctx.workstreams:
        ws_rows.append(
            [
                row["workstreamLabel"],
                str(row["overallStatus"]).replace("_", " ").title(),
                row["sectionsComplete"],
                row["totalSections"],
            ]
        )
    table = Table(ws_rows, repeatRows=1, colWidths=[170, 90, 80, 80])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF4")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Issues &amp; Gaps summary", styles["heading"]))
    story.append(
        Paragraph(
            f"Open: {ctx.issues_summary.get('totalOpen', 0)} · "
            f"Blocking: {ctx.issues_summary.get('blocking', 0)} · "
            f"High: {ctx.issues_summary.get('high', 0)} · "
            f"Professional review: {ctx.issues_summary.get('professionalReview', 0)}",
            styles["body"],
        )
    )

    story.append(Paragraph("Facts &amp; Evidence summary", styles["heading"]))
    story.append(
        Paragraph(
            f"Canonical facts: {ctx.facts_summary.get('canonicalFacts', 0)} · "
            f"Document-backed: {ctx.facts_summary.get('documentBacked', 0)} · "
            f"Structured input: {ctx.facts_summary.get('structuredInput', 0)} · "
            f"Used in DRHP: {ctx.facts_summary.get('usedInDrhp', 0)} · "
            f"Evidence items: {ctx.evidence_summary.get('evidenceItems', 0)}",
            styles["body"],
        )
    )

    story.append(Paragraph("Data Room summary", styles["heading"]))
    story.append(
        Paragraph(
            f"Uploaded documents: {ctx.data_room_summary.get('totalDocuments', 0)} · "
            f"Provided requirements: {ctx.data_room_summary.get('providedRequirements', 0)} · "
            f"Missing applicable requirements: {ctx.data_room_summary.get('missingRequirements', 0)}",
            styles["body"],
        )
    )

    story.append(Paragraph("DRHP status", styles["heading"]))
    if ctx.latest_drhp_version_number:
        stale_note = (
            f" Source information has changed since Draft v{ctx.latest_drhp_version_number} was generated."
            if ctx.drhp_stale
            else ""
        )
        story.append(
            Paragraph(
                f"Latest draft: v{ctx.latest_drhp_version_number} · "
                f"Status: {ctx.latest_drhp_status_label} · "
                f"Generated: {ctx.latest_drhp_generated_at.strftime('%Y-%m-%d %H:%M') if ctx.latest_drhp_generated_at else '—'}"
                f"{stale_note}",
                styles["body"],
            )
        )
    else:
        story.append(Paragraph("No DRHP draft has been generated yet.", styles["body"]))

    story.append(Paragraph("Recommended next actions", styles["heading"]))
    if ctx.next_actions:
        for action in ctx.next_actions:
            story.append(Paragraph(f"• {action}", styles["body"]))
    else:
        story.append(Paragraph("Continue structured preparation and professional review.", styles["body"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Disclaimer", styles["heading"]))
    story.append(Paragraph(DISCLAIMER, styles["small"]))

    doc.build(story)
    filename = f"{issuer_prefix(ctx.issuer_name)}_IPO_Readiness_Report_{dated_suffix()}.pdf"
    return buffer.getvalue(), filename
