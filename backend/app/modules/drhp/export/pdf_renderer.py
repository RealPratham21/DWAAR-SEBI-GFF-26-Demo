"""Render assembled DRHP export documents to PDF (ReportLab)."""

from __future__ import annotations

import io
import xml.sax.saxutils as saxutils
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpSectionAST
from app.modules.drhp.export.document import DRHPExportDocument, ExportChapter
from app.modules.drhp.export.styles import (
    DRAFT_FOOTER_NOTICE,
    DRAFT_HEADER,
    EXPORT_TYPOGRAPHY,
    MARGIN_BOTTOM_MM,
    MARGIN_LEFT_MM,
    MARGIN_RIGHT_MM,
    MARGIN_TOP_MM,
)


def _register_fonts() -> str:
    font_paths = (
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/TTF/DejaVuSerif.ttf",
    )
    for path in font_paths:
        bold_path = path.replace("DejaVuSerif.ttf", "DejaVuSerif-Bold.ttf")
        try:
            pdfmetrics.registerFont(TTFont("ExportSerif", path))
            pdfmetrics.registerFont(TTFont("ExportSerif-Bold", bold_path))
            return "ExportSerif"
        except Exception:  # noqa: BLE001
            continue
    return "Times-Roman"


def _escape(text: str) -> str:
    return saxutils.escape(text or "")


class DRHPPdfRenderer:
    def __init__(self) -> None:
        self.body_font = _register_fonts()
        self.bold_font = "ExportSerif-Bold" if self.body_font == "ExportSerif" else "Times-Bold"
        self.styles = self._build_styles()
        self._issuer_name: str | None = None
        self._is_cover_chapter = False

    def _build_styles(self) -> dict[str, ParagraphStyle]:
        base = getSampleStyleSheet()
        typo = EXPORT_TYPOGRAPHY
        return {
            "body": ParagraphStyle(
                "ExportBody",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * typo.line_spacing,
                alignment=TA_JUSTIFY,
                textColor=colors.HexColor(typo.text_color),
                spaceAfter=6,
            ),
            "chapter": ParagraphStyle(
                "ExportChapter",
                parent=base["Heading1"],
                fontName=self.bold_font,
                fontSize=typo.chapter_title_size_pt,
                leading=typo.chapter_title_size_pt * 1.2,
                spaceBefore=12,
                spaceAfter=10,
                textColor=colors.HexColor(typo.text_color),
            ),
            "section": ParagraphStyle(
                "ExportSection",
                parent=base["Heading2"],
                fontName=self.bold_font,
                fontSize=typo.section_heading_size_pt,
                leading=typo.section_heading_size_pt * 1.2,
                spaceBefore=8,
                spaceAfter=6,
                textColor=colors.HexColor(typo.text_color),
            ),
            "heading": ParagraphStyle(
                "ExportHeading",
                parent=base["Heading3"],
                fontName=self.bold_font,
                fontSize=typo.subsection_heading_size_pt,
                leading=typo.subsection_heading_size_pt * 1.2,
                spaceBefore=6,
                spaceAfter=4,
                textColor=colors.HexColor(typo.text_color),
            ),
            "legal": ParagraphStyle(
                "ExportLegal",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.legal_notice_size_pt,
                leading=typo.legal_notice_size_pt * 1.3,
                alignment=TA_JUSTIFY,
                textColor=colors.HexColor(typo.muted_color),
                spaceAfter=6,
            ),
            "toc_title": ParagraphStyle(
                "ExportTocTitle",
                parent=base["Heading1"],
                fontName=self.bold_font,
                fontSize=typo.toc_title_size_pt,
                spaceAfter=12,
                textColor=colors.HexColor(typo.text_color),
            ),
            "toc_item": ParagraphStyle(
                "ExportTocItem",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.35,
                leftIndent=12,
                spaceAfter=2,
                textColor=colors.HexColor(typo.text_color),
            ),
            "unavailable": ParagraphStyle(
                "ExportUnavailable",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.3,
                textColor=colors.HexColor(typo.muted_color),
                spaceAfter=8,
            ),
            "cover_center": ParagraphStyle(
                "ExportCoverCenter",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.35,
                alignment=TA_CENTER,
                textColor=colors.HexColor(typo.text_color),
                spaceAfter=6,
            ),
        }

    def render(self, document: DRHPExportDocument) -> bytes:
        buffer = io.BytesIO()
        self._issuer_name = document.issuer_name
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN_LEFT_MM * mm,
            rightMargin=MARGIN_RIGHT_MM * mm,
            topMargin=MARGIN_TOP_MM * mm,
            bottomMargin=MARGIN_BOTTOM_MM * mm,
            title=document.document_title,
            author=document.issuer_name or "DRHP Draft",
        )
        story: list[Any] = []
        story.extend(self._build_toc(document))
        story.append(PageBreak())

        for index, chapter in enumerate(document.chapters):
            self._is_cover_chapter = chapter.chapter_key == "cover-page-front-matter"
            story.extend(self._build_chapter(chapter))
            if index < len(document.chapters) - 1:
                story.append(PageBreak())

        doc.build(story, onFirstPage=self._draw_page_frame, onLaterPages=self._draw_page_frame)
        return buffer.getvalue()

    def _draw_page_frame(self, canvas, doc) -> None:  # noqa: ANN001
        canvas.saveState()
        typo = EXPORT_TYPOGRAPHY
        page_width, page_height = A4
        canvas.setFont(self.body_font if self.body_font != "Times-Roman" else "Times-Roman", typo.header_size_pt)
        canvas.setFillColor(colors.HexColor(typo.muted_color))
        canvas.drawCentredString(page_width / 2, page_height - (12 * mm), DRAFT_HEADER)
        if self._issuer_name:
            canvas.setFont(
                self.body_font if self.body_font != "Times-Roman" else "Times-Roman",
                typo.header_size_pt - 1,
            )
            canvas.drawCentredString(page_width / 2, page_height - (16 * mm), self._issuer_name)
        canvas.setFont(self.body_font if self.body_font != "Times-Roman" else "Times-Roman", typo.footer_size_pt)
        canvas.drawCentredString(page_width / 2, 10 * mm, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()

    def _build_toc(self, document: DRHPExportDocument) -> list[Any]:
        flowables: list[Any] = [
            Paragraph(_escape("TABLE OF CONTENTS"), self.styles["toc_title"]),
        ]
        if document.partial_label:
            flowables.append(
                Paragraph(_escape(f"({document.partial_label})"), self.styles["unavailable"])
            )
        for order, title in document.table_of_contents:
            flowables.append(
                Paragraph(_escape(f"{order}. {title}"), self.styles["toc_item"])
            )
        flowables.append(Spacer(1, 8))
        flowables.append(Paragraph(_escape(document.draft_notice), self.styles["legal"]))
        return flowables

    def _build_chapter(self, chapter: ExportChapter) -> list[Any]:
        flowables: list[Any] = [Paragraph(_escape(chapter.title), self.styles["chapter"])]
        if not chapter.available or chapter.chapter_ast is None:
            reason = chapter.unavailable_reason or "This chapter is unavailable in this draft."
            flowables.append(Paragraph(_escape(reason), self.styles["unavailable"]))
            return flowables

        for section in chapter.chapter_ast.sections:
            flowables.extend(self._build_section(section, is_cover=chapter.chapter_key == "cover-page-front-matter"))
        return flowables

    def _build_section(self, section: DrhpSectionAST, *, is_cover: bool) -> list[Any]:
        flowables: list[Any] = []
        if section.heading:
            flowables.append(Paragraph(_escape(section.heading), self.styles["section"]))
        for block in section.blocks:
            flowables.extend(self._build_block(block, is_cover=is_cover))
        return flowables

    def _build_block(self, block: DrhpBlockAST, *, is_cover: bool) -> list[Any]:
        if block.kind == "page_break":
            return [PageBreak()]

        content = block.content or {}
        if block.kind == "heading":
            level = int(content.get("level") or 2)
            style = self.styles["section"] if level <= 2 else self.styles["heading"]
            return [Paragraph(_escape(str(content.get("text") or "")), style)]

        if block.kind == "paragraph":
            style = self.styles["cover_center"] if is_cover else self.styles["body"]
            return [Paragraph(_escape(str(content.get("text") or "")), style)]

        if block.kind == "legal_notice":
            return [Paragraph(_escape(str(content.get("text") or "")), self.styles["legal"])]

        if block.kind == "placeholder":
            return [Paragraph(_escape(str(content.get("text") or "[●]")), self.styles["body"])]

        if block.kind in {"bullet_list", "numbered_list"}:
            items = content.get("items") or []
            list_items = [
                ListItem(Paragraph(_escape(str(item)), self.styles["body"]), leftIndent=12)
                for item in items
            ]
            return [
                ListFlowable(
                    list_items,
                    bulletType="1" if block.kind == "numbered_list" else "bullet",
                    start="1",
                ),
                Spacer(1, 4),
            ]

        if block.kind in {"table", "key_value_table"}:
            return self._build_table(content)

        return [Paragraph(_escape(str(content.get("text") or "")), self.styles["body"])]

    def _build_table(self, content: dict[str, Any]) -> list[Any]:
        headers = [str(item) for item in content.get("headers") or []]
        rows = content.get("rows") or []
        caption = str(content.get("caption") or "").strip()

        table_data: list[list[Any]] = []
        if headers:
            table_data.append([Paragraph(_escape(header), self.styles["body"]) for header in headers])
        for row in rows:
            if not isinstance(row, list):
                continue
            table_data.append([Paragraph(_escape(str(cell)), self.styles["body"]) for cell in row])

        if not table_data:
            return []

        col_count = max(len(row) for row in table_data)
        col_width = (A4[0] - (MARGIN_LEFT_MM + MARGIN_RIGHT_MM) * mm) / max(col_count, 1)
        table = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1 if headers else 0)
        table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), self.body_font),
                    ("FONTSIZE", (0, 0), (-1, -1), EXPORT_TYPOGRAPHY.table_size_pt),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor(EXPORT_TYPOGRAPHY.table_border)),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(EXPORT_TYPOGRAPHY.table_header_bg)),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        flowables: list[Any] = []
        if caption:
            flowables.append(Paragraph(_escape(caption), self.styles["heading"]))
        flowables.extend([table, Spacer(1, 8)])
        return flowables


def render_pdf(document: DRHPExportDocument) -> bytes:
    return DRHPPdfRenderer().render(document)
