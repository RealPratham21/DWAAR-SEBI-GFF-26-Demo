"""DRHP-P1.1 export fidelity and semantic formatter regression tests."""

from __future__ import annotations

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.drhp.export.content import ast_has_renderable_content, cell_text, normalize_chapter_ast
from app.modules.drhp.export.formatters import (
    format_drhp_value,
    format_financial_period,
    format_inr_amount,
    infer_semantic_type_from_header,
)
from app.modules.drhp.export.pdf_renderer import DRHPPdfRenderer
from app.modules.drhp.export.document import ExportChapter, DRHPExportDocument


def test_telephone_not_grouped() -> None:
    assert cell_text("2045678901", semantic_type="telephone") == "2045678901"
    assert format_drhp_value("2045678901", semantic_type="telephone") == "2045678901"


def test_din_preserves_leading_zeroes() -> None:
    assert cell_text("01234567", semantic_type="din") == "01234567"
    assert format_drhp_value("01234567", semantic_type="din") == "01234567"


def test_cin_unchanged() -> None:
    assert cell_text("U74999MH2015PTC123456", semantic_type="cin") == "U74999MH2015PTC123456"


def test_share_count_uses_indian_grouping() -> None:
    assert cell_text("45000000", semantic_type="share_count") == "4,50,00,000"


def test_bare_numeric_string_not_auto_grouped() -> None:
    assert cell_text("45000000") == "45000000"
    assert cell_text("01234567") == "01234567"


def test_inr_and_rupee_symbol() -> None:
    assert format_inr_amount(58000000) == "₹5,80,00,000"
    assert "₹" in cell_text("₹58000000", semantic_type="currency_inr")


def test_financial_period_labels() -> None:
    assert format_financial_period("nivara-fy2024") == "FY 2024"
    assert format_financial_period("FY2023") == "FY 2023"
    assert cell_text("nivara-fy2022", semantic_type="financial_period") == "FY 2022"


def test_material_contracts_party_name_only() -> None:
    value = {
        "role": "customer",
        "counterparty": "AutoDrive Components India Private Limited",
        "jurisdiction": "India",
    }
    assert format_drhp_value(value) == "AutoDrive Components India Private Limited"
    assert "{" not in format_drhp_value(value)
    assert "role" not in format_drhp_value(value).casefold()


def test_raw_object_array_renders_names() -> None:
    parties = [{"counterparty": "Party A Ltd."}, {"partyName": "Party B Ltd."}]
    assert format_drhp_value(parties) == "Party A Ltd., Party B Ltd."


def test_ast_has_renderable_content() -> None:
    assert ast_has_renderable_content({"sections": [{"blocks": [{"kind": "paragraph"}]}]})
    assert not ast_has_renderable_content({"sections": []})
    assert not ast_has_renderable_content(None)


def test_infer_semantic_type_from_headers() -> None:
    assert infer_semantic_type_from_header("DIN") == "din"
    assert infer_semantic_type_from_header("Number of shares") == "share_count"
    assert infer_semantic_type_from_header("Parties") == "entity_name"


def test_chapter_title_not_duplicated_in_normalization() -> None:
    chapter = DrhpChapterAST(
        chapter_key="capital-structure-ownership",
        title=CHAPTER_TITLES["capital-structure-ownership"],
        order=6,
        sections=[
            DrhpSectionAST(
                section_key="intro",
                heading="Capital Structure & Ownership",
                order=1,
                blocks=[
                    DrhpBlockAST(
                        block_id="blk-p",
                        kind="paragraph",
                        order=1,
                        content={"text": "Share capital details follow."},
                    ),
                ],
            ),
        ],
    )
    normalized = normalize_chapter_ast(chapter)
    assert normalized.sections[0].heading == ""


def test_pdf_many_subsections_do_not_force_page_per_section() -> None:
    """Many short sections should not each consume a full page."""
    sections = []
    for index in range(12):
        sections.append(
            DrhpSectionAST(
                section_key=f"sec-{index}",
                heading=f"Subsection {index}",
                order=index,
                blocks=[
                    DrhpBlockAST(
                        block_id=f"blk-{index}",
                        kind="paragraph",
                        order=1,
                        content={"text": "Short disclosure paragraph for density testing."},
                    ),
                ],
            )
        )
    chapter_ast = DrhpChapterAST(
        chapter_key="industry-overview",
        title="Industry Overview",
        order=9,
        sections=sections,
    )
    document = DRHPExportDocument(
        chapters=[
            ExportChapter(
                chapter_key="industry-overview",
                title="Industry Overview",
                order=9,
                available=True,
                chapter_ast=normalize_chapter_ast(chapter_ast),
            )
        ],
    )
    pdf_bytes = DRHPPdfRenderer().render(document)
    assert pdf_bytes.startswith(b"%PDF")
    try:
        import fitz

        pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
        # 12 subsections on separate pages would exceed ~13 pages; natural flow should be fewer.
        assert pdf.page_count <= 8
    except ImportError:
        pass
