"""Shared export style specification for PDF and DOCX renderers."""

from __future__ import annotations

from dataclasses import dataclass

EXPORTER_VERSION = "drhp-export-v1"

# A4 portrait, millimetres
PAGE_WIDTH_MM = 210.0
PAGE_HEIGHT_MM = 297.0
MARGIN_LEFT_MM = 20.0
MARGIN_RIGHT_MM = 20.0
MARGIN_TOP_MM = 25.0
MARGIN_BOTTOM_MM = 20.0

DRAFT_HEADER = "DRAFT RED HERRING PROSPECTUS"
DRAFT_FOOTER_NOTICE = (
    "Promoter-prepared draft for discussion purposes only. "
    "Not filed with SEBI or any stock exchange."
)


@dataclass(frozen=True)
class ExportTypography:
    body_font: str = "DejaVuSerif"
    body_size_pt: float = 10.0
    line_spacing: float = 1.25
    chapter_title_size_pt: float = 16.0
    section_heading_size_pt: float = 12.0
    subsection_heading_size_pt: float = 11.0
    table_size_pt: float = 9.0
    legal_notice_size_pt: float = 9.0
    toc_title_size_pt: float = 14.0
    header_size_pt: float = 8.0
    footer_size_pt: float = 8.0
    text_color: str = "#000000"
    muted_color: str = "#444444"
    table_header_bg: str = "#F3F3F3"
    table_border: str = "#666666"


EXPORT_TYPOGRAPHY = ExportTypography()
