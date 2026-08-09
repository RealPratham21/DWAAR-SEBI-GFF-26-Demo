"""Tests for DRHP-P1 publication formatters and normalization."""

from __future__ import annotations

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.export.content import cell_text, normalize_chapter_ast
from app.modules.drhp.export.formatters import (
    format_date,
    format_drhp_value,
    format_indian_integer,
    format_inr_amount,
    headings_are_duplicate,
    humanize_enum,
    infer_column_alignments,
    is_internal_heading,
    normalize_heading_text,
)


def test_format_indian_integer_grouping() -> None:
    assert format_indian_integer(4500000) == "45,00,000"
    assert format_indian_integer(1500000) == "15,00,000"
    assert format_indian_integer(58000000) == "5,80,00,000"


def test_format_inr_amount() -> None:
    assert format_inr_amount(58000000) == "₹5,80,00,000"


def test_format_date_from_iso() -> None:
    assert format_date("2019-06-12") == "June 12, 2019"


def test_humanize_enum_values() -> None:
    assert humanize_enum("capital-expenditure") == "Capital expenditure"
    assert humanize_enum("managing-director") == "Managing Director"


def test_format_drhp_value_never_leaks_raw_dict() -> None:
    assert "{" not in format_drhp_value({"counterparty": "ABC Industries Pvt. Ltd.", "role": "customer"})
    assert format_drhp_value({"counterparty": "ABC Industries Pvt. Ltd.", "role": "customer"}) == (
        "ABC Industries Pvt. Ltd."
    )
    assert format_drhp_value([{"name": "Party A"}, {"name": "Party B"}]) == "Party A, Party B"


def test_cell_text_formats_share_counts_with_semantic_type() -> None:
    assert cell_text("45000000", semantic_type="share_count") == "4,50,00,000"
    assert cell_text(45000000, semantic_type="share_count") == "4,50,00,000"


def test_cell_text_preserves_untyped_numeric_strings() -> None:
    assert cell_text("45000000") == "45000000"
    assert cell_text("01234567") == "01234567"


def test_infer_column_alignments() -> None:
    headers = ["Particulars", "Number of shares", "Amount (₹)"]
    rows = [["Paid-up capital", "45000000", "58000000"]]
    assert infer_column_alignments(headers, rows) == ["left", "right", "right"]


def test_internal_heading_suppression() -> None:
    assert is_internal_heading("Business & Operations — Structured Disclosures")
    assert normalize_heading_text("Industry Overview — Structured Disclosures") == "Industry Overview"


def test_heading_deduplication() -> None:
    assert headings_are_duplicate("Industry definition", "Industry definition")


def test_normalize_chapter_ast_suppresses_duplicate_and_internal_headings() -> None:
    chapter = DrhpChapterAST(
        chapter_key="industry-overview",
        title="Industry Overview",
        order=9,
        sections=[
            DrhpSectionAST(
                section_key="industry",
                heading="Industry definition",
                order=1,
                blocks=[
                    DrhpBlockAST(
                        block_id="blk-h",
                        kind="heading",
                        order=1,
                        content={"text": "Industry definition"},
                    ),
                    DrhpBlockAST(
                        block_id="blk-p",
                        kind="paragraph",
                        order=2,
                        content={"text": "The market comprises domestic and export segments."},
                    ),
                ],
            ),
            DrhpSectionAST(
                section_key="structured",
                heading="Business & Operations — Structured Disclosures",
                order=2,
                blocks=[
                    DrhpBlockAST(
                        block_id="blk-x",
                        kind="paragraph",
                        order=1,
                        content={"text": "Operational disclosure paragraph."},
                    ),
                ],
            ),
        ],
    )
    normalized = normalize_chapter_ast(chapter)
    first_blocks = normalized.sections[0].blocks
    assert len(first_blocks) == 1
    assert first_blocks[0].kind == "paragraph"
    assert normalized.sections[1].heading == ""
    assert len(normalized.sections[1].blocks) == 1
