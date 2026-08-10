"""Render assembled DRHP export documents to PDF (ReportLab)."""

from __future__ import annotations

import io
import xml.sax.saxutils as saxutils
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from app.modules.drhp.export.document import COVER_CHAPTER_KEY, DRHPExportDocument, ExportChapter, TocEntry
from app.modules.drhp.export.fonts import ExportFontRegistration, register_export_fonts
from app.modules.drhp.export.formatters import chapter_title_duplicates_section, normalize_heading_text
from app.modules.drhp.export.publication_theme import (
    DRAFT_FOOTER_NOTICE,
    DRAFT_HEADER,
    PUBLICATION_THEME,
    MARGIN_BOTTOM_MM,
    MARGIN_LEFT_MM,
    MARGIN_RIGHT_MM,
    MARGIN_TOP_MM,
)

BULLET_CHAR = "\u2022"
MAX_TOC_BUILD_PASSES = 3


class _DRHPPublicationTemplate(SimpleDocTemplate):
    """SimpleDocTemplate that draws running headers/footers after page content."""

    def __init__(self, *args: Any, frame_renderer: Any = None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.frame_renderer = frame_renderer
        self._logical_page = 0
        self._chapter_pages: dict[str, int] = {}

    def handle_pageEnd(self) -> None:
        if self.frame_renderer is not None:
            self.frame_renderer._draw_page_frame(self.canv, self)  # noqa: SLF001
        super().handle_pageEnd()


from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpSectionAST


class _SetFrameModeFlowable(Flowable):
    """Set publication frame mode for the current page: cover | toc | body."""

    def __init__(self, mode: str) -> None:
        super().__init__()
        self.mode = mode
        self.width = 0
        self.height = 0

    def draw(self) -> None:
        self.canv._drhp_frame_mode = self.mode  # noqa: SLF001


class _ChapterStartMarker(Flowable):
    """Record logical starting page for a body chapter (used for page-aware TOC)."""

    def __init__(self, chapter_key: str) -> None:
        super().__init__()
        self.chapter_key = chapter_key
        self.width = 0
        self.height = 0

    def draw(self) -> None:
        pending = getattr(self.canv, "_drhp_pending_chapter_markers", None)  # noqa: SLF001
        if pending is None:
            pending = []
            self.canv._drhp_pending_chapter_markers = pending  # noqa: SLF001
        pending.append(self.chapter_key)


def _escape(text: str) -> str:
    return saxutils.escape(text or "")


def _alignment(code: str):
    if code == "right":
        return TA_RIGHT
    if code == "center":
        return TA_CENTER
    return TA_LEFT


class DRHPPdfRenderer:
    def __init__(self, *, fonts: ExportFontRegistration | None = None) -> None:
        self.fonts = fonts or register_export_fonts()
        self.body_font = self.fonts.body
        self.bold_font = self.fonts.bold
        self.italic_font = self.fonts.italic
        self.theme = PUBLICATION_THEME
        self.styles = self._build_styles()
        self._issuer_name: str | None = None
        self._is_risk_chapter = False

    def _build_styles(self) -> dict[str, ParagraphStyle]:
        base = getSampleStyleSheet()
        typo = self.theme
        return {
            "body": ParagraphStyle(
                "ExportBody",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * typo.line_spacing,
                alignment=TA_JUSTIFY,
                textColor=colors.HexColor(typo.text_color),
                spaceAfter=typo.body_space_after_pt,
            ),
            "chapter": ParagraphStyle(
                "ExportChapter",
                parent=base["Heading1"],
                fontName=self.bold_font,
                fontSize=typo.chapter_title_size_pt,
                leading=typo.chapter_title_size_pt * 1.15,
                spaceBefore=typo.chapter_space_before_pt,
                spaceAfter=typo.chapter_space_after_pt,
                textColor=colors.HexColor(typo.text_color),
                keepWithNext=1,
            ),
            "section": ParagraphStyle(
                "ExportSection",
                parent=base["Heading2"],
                fontName=self.bold_font,
                fontSize=typo.section_heading_size_pt,
                leading=typo.section_heading_size_pt * 1.15,
                spaceBefore=typo.section_space_before_pt,
                spaceAfter=typo.section_space_after_pt,
                textColor=colors.HexColor(typo.text_color),
                keepWithNext=1,
            ),
            "heading": ParagraphStyle(
                "ExportHeading",
                parent=base["Heading3"],
                fontName=self.bold_font,
                fontSize=typo.subsection_heading_size_pt,
                leading=typo.subsection_heading_size_pt * 1.15,
                spaceBefore=4,
                spaceAfter=3,
                textColor=colors.HexColor(typo.text_color),
                keepWithNext=1,
            ),
            "risk_title": ParagraphStyle(
                "ExportRiskTitle",
                parent=base["Heading3"],
                fontName=self.bold_font,
                fontSize=typo.risk_title_size_pt,
                leading=typo.risk_title_size_pt * 1.15,
                spaceBefore=5,
                spaceAfter=3,
                textColor=colors.HexColor(typo.text_color),
                keepWithNext=1,
            ),
            "legal": ParagraphStyle(
                "ExportLegal",
                parent=base["Normal"],
                fontName=self.italic_font,
                fontSize=typo.legal_notice_size_pt,
                leading=typo.legal_notice_size_pt * 1.2,
                alignment=TA_JUSTIFY,
                textColor=colors.HexColor(typo.muted_color),
                spaceAfter=5,
            ),
            "toc_title": ParagraphStyle(
                "ExportTocTitle",
                parent=base["Heading1"],
                fontName=self.bold_font,
                fontSize=typo.toc_title_size_pt,
                spaceAfter=8,
                textColor=colors.HexColor(typo.text_color),
            ),
            "toc_item": ParagraphStyle(
                "ExportTocItem",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.2,
                leftIndent=10,
                spaceAfter=1,
                textColor=colors.HexColor(typo.text_color),
            ),
            "unavailable": ParagraphStyle(
                "ExportUnavailable",
                parent=base["Normal"],
                fontName=self.italic_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.2,
                textColor=colors.HexColor(typo.muted_color),
                spaceAfter=6,
            ),
            "cover_center": ParagraphStyle(
                "ExportCoverCenter",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * 1.2,
                alignment=TA_CENTER,
                textColor=colors.HexColor(typo.text_color),
                spaceAfter=5,
            ),
            "cover_label": ParagraphStyle(
                "ExportCoverLabel",
                parent=base["Normal"],
                fontName=self.bold_font,
                fontSize=typo.cover_label_size_pt,
                leading=typo.cover_label_size_pt * 1.2,
                alignment=TA_CENTER,
                textColor=colors.HexColor(typo.text_color),
                spaceAfter=8,
            ),
            "table_caption": ParagraphStyle(
                "ExportTableCaption",
                parent=base["Normal"],
                fontName=self.bold_font,
                fontSize=typo.table_caption_size_pt,
                leading=typo.table_caption_size_pt * 1.15,
                spaceBefore=4,
                spaceAfter=3,
                textColor=colors.HexColor(typo.text_color),
                keepWithNext=1,
            ),
            "table_cell": ParagraphStyle(
                "ExportTableCell",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.table_size_pt,
                leading=typo.table_size_pt * 1.15,
                textColor=colors.HexColor(typo.text_color),
            ),
            "table_note": ParagraphStyle(
                "ExportTableNote",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.table_note_size_pt,
                leading=typo.table_note_size_pt * 1.2,
                textColor=colors.HexColor(typo.muted_color),
                spaceAfter=4,
            ),
            "bullet_item": ParagraphStyle(
                "ExportBulletItem",
                parent=base["Normal"],
                fontName=self.body_font,
                fontSize=typo.body_size_pt,
                leading=typo.body_size_pt * typo.line_spacing,
                leftIndent=14,
                bulletIndent=6,
                spaceAfter=typo.list_item_spacing_pt,
                textColor=colors.HexColor(typo.text_color),
            ),
        }

    def render(self, document: DRHPExportDocument) -> bytes:
        self._issuer_name = document.issuer_name
        chapter_pages: dict[str, int] = {}
        previous_pages: dict[str, int] | None = None
        buffer = io.BytesIO()

        for _pass in range(MAX_TOC_BUILD_PASSES):
            buffer.seek(0)
            buffer.truncate(0)
            chapter_pages = self._build_once(buffer, document, chapter_pages)
            if previous_pages is not None and previous_pages == chapter_pages:
                break
            previous_pages = dict(chapter_pages)

        return buffer.getvalue()

    def _build_once(
        self,
        buffer: io.BytesIO,
        document: DRHPExportDocument,
        chapter_pages: dict[str, int],
    ) -> dict[str, int]:
        doc = _DRHPPublicationTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN_LEFT_MM * mm,
            rightMargin=MARGIN_RIGHT_MM * mm,
            topMargin=MARGIN_TOP_MM * mm,
            bottomMargin=MARGIN_BOTTOM_MM * mm,
            title=document.document_title,
            author=document.issuer_name or "DRHP Draft",
            subject="Draft Red Herring Prospectus",
            frame_renderer=self,
        )

        story: list[Any] = []
        cover = document.cover_chapter()
        body = document.body_chapters()

        if cover is not None:
            story.append(_SetFrameModeFlowable("cover"))
            story.extend(self._build_chapter(cover, is_cover=True))
            story.append(PageBreak())

        story.append(_SetFrameModeFlowable("toc"))
        story.extend(self._build_toc(document, chapter_pages))
        story.append(PageBreak())

        for index, chapter in enumerate(body):
            if index > 0:
                story.append(PageBreak())
            story.append(_SetFrameModeFlowable("body"))
            story.append(_ChapterStartMarker(chapter.chapter_key))
            self._is_risk_chapter = chapter.chapter_key == "risk-factors"
            story.extend(self._build_chapter(chapter, is_cover=False))

        doc.build(story)
        return dict(doc._chapter_pages)

    def _draw_page_frame(self, canvas, doc) -> None:  # noqa: ANN001
        mode = getattr(canvas, "_drhp_frame_mode", "body")  # noqa: SLF001
        if mode == "cover":
            canvas._drhp_pending_chapter_markers = []  # noqa: SLF001
            return

        doc._logical_page = getattr(doc, "_logical_page", 0) + 1  # noqa: SLF001
        logical = doc._logical_page  # noqa: SLF001

        pending = getattr(canvas, "_drhp_pending_chapter_markers", [])  # noqa: SLF001
        for chapter_key in pending:
            doc._chapter_pages[chapter_key] = logical  # noqa: SLF001
        canvas._drhp_pending_chapter_markers = []  # noqa: SLF001

        canvas.saveState()
        typo = self.theme
        page_width, page_height = A4

        canvas.setFont(self.body_font, typo.header_size_pt)
        canvas.setFillColor(colors.HexColor(typo.muted_color))
        canvas.drawCentredString(page_width / 2, page_height - (11 * mm), DRAFT_HEADER.upper())
        if self._issuer_name:
            canvas.drawCentredString(page_width / 2, page_height - (14.5 * mm), self._issuer_name)
        canvas.setFont(self.body_font, typo.footer_size_pt)
        canvas.drawCentredString(page_width / 2, 10 * mm, f"Page {logical}")
        canvas.restoreState()

    def _build_toc(self, document: DRHPExportDocument, chapter_pages: dict[str, int]) -> list[Any]:
        flowables: list[Any] = [
            Paragraph(_escape("TABLE OF CONTENTS"), self.styles["toc_title"]),
        ]
        if document.partial_label:
            flowables.append(
                Paragraph(_escape(f"({document.partial_label})"), self.styles["unavailable"])
            )
        for entry in document.table_of_contents:
            page = chapter_pages.get(entry.chapter_key)
            page_text = str(page) if page is not None else ""
            leader = "." * max(2, 40 - len(entry.title) - len(page_text))
            line = f"{entry.display_number}. {entry.title} {leader} {page_text}".rstrip()
            flowables.append(Paragraph(_escape(line), self.styles["toc_item"]))
        flowables.append(Spacer(1, 6))
        flowables.append(Paragraph(_escape(document.draft_notice), self.styles["legal"]))
        return flowables

    def _should_emit_chapter_title(self, chapter: ExportChapter) -> bool:
        if not chapter.available or chapter.chapter_ast is None:
            return True
        if chapter.chapter_key == COVER_CHAPTER_KEY:
            return False
        first_section = chapter.chapter_ast.sections[0] if chapter.chapter_ast.sections else None
        if first_section and first_section.heading:
            if chapter_title_duplicates_section(chapter.title, normalize_heading_text(first_section.heading)):
                return False
        return True

    def _build_chapter(self, chapter: ExportChapter, *, is_cover: bool) -> list[Any]:
        flowables: list[Any] = []
        if self._should_emit_chapter_title(chapter):
            flowables.append(Paragraph(_escape(chapter.title), self.styles["chapter"]))
        if not chapter.available or chapter.chapter_ast is None:
            reason = chapter.unavailable_reason or "This chapter is unavailable in this draft."
            flowables.append(Paragraph(_escape(reason), self.styles["unavailable"]))
            return flowables

        for section in chapter.chapter_ast.sections:
            flowables.extend(self._build_section(section, is_cover=is_cover))
        return flowables

    def _build_section(self, section: DrhpSectionAST, *, is_cover: bool) -> list[Any]:
        flowables: list[Any] = []
        if section.heading:
            flowables.append(Paragraph(_escape(section.heading), self.styles["section"]))
        for block in section.blocks:
            if block.kind == "page_break":
                flowables.append(PageBreak())
                continue
            flowables.extend(self._build_block(block, is_cover=is_cover))
        return flowables

    def _build_block(self, block: DrhpBlockAST, *, is_cover: bool) -> list[Any]:
        content = block.content or {}
        if block.kind == "heading":
            level = int(content.get("level") or 2)
            style = self.styles["section"] if level <= 2 else self.styles["heading"]
            if self._is_risk_chapter:
                style = self.styles["risk_title"]
            return [Paragraph(_escape(str(content.get("text") or "")), style)]

        if block.kind == "paragraph":
            style = self.styles["cover_center"] if is_cover else self.styles["body"]
            text = str(content.get("text") or "")
            if is_cover and text.upper() == DRAFT_HEADER:
                return [Paragraph(_escape(text), self.styles["cover_label"])]
            return [Paragraph(_escape(text), style)]

        if block.kind == "legal_notice":
            text = f"<i>{_escape(str(content.get('text') or ''))}</i>"
            return [Paragraph(text, self.styles["legal"])]

        if block.kind == "placeholder":
            return [Paragraph(_escape(str(content.get("text") or "[●]")), self.styles["body"])]

        if block.kind == "bullet_list":
            items = content.get("items") or []
            flowables: list[Any] = []
            for item in items:
                text = str(item).strip()
                if not text:
                    continue
                flowables.append(
                    Paragraph(f"{BULLET_CHAR} {_escape(text)}", self.styles["bullet_item"])
                )
            flowables.append(Spacer(1, 3))
            return flowables

        if block.kind == "numbered_list":
            items = [str(item) for item in content.get("items") or [] if str(item).strip()]
            if not items:
                return []
            list_items = [
                ListItem(
                    Paragraph(_escape(item), self.styles["body"]),
                    leftIndent=10,
                    spaceAfter=self.theme.list_item_spacing_pt,
                )
                for item in items
            ]
            return [
                ListFlowable(
                    list_items,
                    bulletType="1",
                    start="1",
                    bulletFontName=self.body_font,
                ),
                Spacer(1, 3),
            ]

        if block.kind in {"table", "key_value_table"}:
            return self._build_table(content)

        return [Paragraph(_escape(str(content.get("text") or "")), self.styles["body"])]

    def _build_table(self, content: dict[str, Any]) -> list[Any]:
        headers = [str(item) for item in content.get("headers") or []]
        rows = content.get("rows") or []
        caption = str(content.get("caption") or "").strip()
        notes = content.get("notes") or []
        alignments = content.get("columnAlignments") or []
        unit = str(content.get("unit") or "").strip()

        table_data: list[list[Any]] = []
        if headers:
            table_data.append(
                [
                    Paragraph(_escape(header), self._table_cell_style("left", bold=True))
                    for header in headers
                ]
            )
        for row in rows:
            if not isinstance(row, list):
                continue
            cells: list[Any] = []
            for col_index, cell in enumerate(row):
                alignment = alignments[col_index] if col_index < len(alignments) else "left"
                cells.append(
                    Paragraph(_escape(str(cell)), self._table_cell_style(alignment))
                )
            table_data.append(cells)

        if not table_data:
            return []

        col_count = max(len(row) for row in table_data)
        usable_width = A4[0] - (MARGIN_LEFT_MM + MARGIN_RIGHT_MM) * mm
        col_width = usable_width / max(col_count, 1)
        table = Table(
            table_data,
            colWidths=[col_width] * col_count,
            repeatRows=1 if headers else 0,
        )
        padding = self.theme.table_cell_padding_pt
        table_style_commands: list[tuple[Any, ...]] = [
            ("FONTNAME", (0, 0), (-1, -1), self.body_font),
            ("FONTSIZE", (0, 0), (-1, -1), self.theme.table_size_pt),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor(self.theme.table_border)),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(self.theme.table_header_bg)),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), padding),
            ("RIGHTPADDING", (0, 0), (-1, -1), padding),
            ("TOPPADDING", (0, 0), (-1, -1), padding),
            ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
        ]
        for col_index, alignment in enumerate(alignments[:col_count]):
            if alignment == "right":
                table_style_commands.append(("ALIGN", (col_index, 0), (col_index, -1), "RIGHT"))
        table.setStyle(TableStyle(table_style_commands))

        flowables: list[Any] = []
        caption_flow: list[Any] = []
        if caption:
            caption_flow.append(Paragraph(_escape(caption), self.styles["table_caption"]))
        if unit and unit.casefold() not in caption.casefold():
            caption_flow.append(
                Paragraph(_escape(f"(₹ in {unit}, unless otherwise stated)"), self.styles["table_note"])
            )
        if caption_flow:
            flowables.extend(caption_flow)

        body_row_count = len(table_data)
        if body_row_count <= 3:
            flowables.append(KeepTogether([table]))
        else:
            flowables.append(table)

        if notes:
            note_flow = [Paragraph(_escape("Notes:"), self.styles["table_note"])]
            for index, note in enumerate(notes, start=1):
                note_flow.append(Paragraph(_escape(f"{index}. {note}"), self.styles["table_note"]))
            flowables.append(KeepTogether(note_flow))
        flowables.append(Spacer(1, 4))
        return flowables

    def _table_cell_style(self, alignment: str, *, bold: bool = False) -> ParagraphStyle:
        font = self.bold_font if bold else self.body_font
        return ParagraphStyle(
            name=f"TableCell-{alignment}-{'bold' if bold else 'regular'}-{id(self)}",
            parent=self.styles["table_cell"],
            fontName=font,
            alignment=_alignment(alignment),
        )


def render_pdf(document: DRHPExportDocument) -> bytes:
    return DRHPPdfRenderer().render(document)
