"""Central DRHP publication specification — shared by PDF, DOCX, and web preview."""

from __future__ import annotations

from dataclasses import dataclass

EXPORTER_VERSION = "drhp-export-p1.2"

# A4 portrait, millimetres
PAGE_WIDTH_MM = 210.0
PAGE_HEIGHT_MM = 297.0
MARGIN_LEFT_MM = 18.0
MARGIN_RIGHT_MM = 18.0
MARGIN_TOP_MM = 22.0
MARGIN_BOTTOM_MM = 18.0

DRAFT_HEADER = "DRAFT RED HERRING PROSPECTUS"
DRAFT_FOOTER_NOTICE = (
    "Promoter-prepared draft for discussion purposes only. "
    "Not filed with SEBI or any stock exchange."
)

# Headings suppressed from publication output (internal scaffolding)
INTERNAL_HEADING_PATTERNS = (
    "structured disclosures",
    "structured disclosure",
)


@dataclass(frozen=True)
class DRHPPublicationTheme:
    """Typography, spacing, and layout tokens for prospectus-style output."""

    body_font: str = "DejaVuSerif"
    body_size_pt: float = 9.5
    line_spacing: float = 1.18
    chapter_title_size_pt: float = 13.0
    section_heading_size_pt: float = 10.5
    subsection_heading_size_pt: float = 9.5
    table_size_pt: float = 8.5
    table_caption_size_pt: float = 9.0
    table_note_size_pt: float = 8.0
    legal_notice_size_pt: float = 8.5
    toc_title_size_pt: float = 12.0
    header_size_pt: float = 7.0
    footer_size_pt: float = 7.5
    cover_label_size_pt: float = 9.0
    risk_title_size_pt: float = 9.5
    text_color: str = "#000000"
    muted_color: str = "#333333"
    table_header_bg: str = "#EEEEEE"
    table_border: str = "#555555"
    body_space_after_pt: float = 4.0
    section_space_before_pt: float = 6.0
    section_space_after_pt: float = 4.0
    chapter_space_before_pt: float = 0.0
    chapter_space_after_pt: float = 6.0
    table_cell_padding_pt: float = 3.0
    list_item_spacing_pt: float = 2.0


PUBLICATION_THEME = DRHPPublicationTheme()

# Backward-compatible alias used by existing renderers
EXPORT_TYPOGRAPHY = PUBLICATION_THEME
