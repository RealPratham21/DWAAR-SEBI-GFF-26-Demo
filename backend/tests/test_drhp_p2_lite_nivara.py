"""DRHP-P2-Lite Nivara grounding and publication regression tests."""

from __future__ import annotations

import fitz

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import ALL_CHAPTER_KEYS, CHAPTER_GENERATION_MODES, ChapterVersionStatus
from app.modules.drhp.export.content import normalize_chapter_ast
from app.modules.drhp.export.document import assemble_export_document
from app.modules.drhp.export.docx_renderer import render_docx
from app.modules.drhp.export.pdf_renderer import render_pdf
from app.modules.drhp.export.publication_safety import scan_document_chapters
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.fact_locking import build_global_locked_facts, format_locked_display
from app.modules.drhp.generation.orchestrator import _build_chapter_ast
from app.modules.drhp.generation.source_extractors import extract_balance_sheet_summary, extract_rpt_transactions
from app.modules.drhp.cohere.provider import FakeDrhpGenerationProvider
from tests.test_drhp_generation_foundation import _nivara_snapshots


class _Row:
    def __init__(self, **kwargs: object) -> None:
        for key, value in kwargs.items():
            setattr(self, key, value)


def _build_nivara_chapter_rows() -> dict[str, _Row]:
    snapshots = _nivara_snapshots()
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    rows: dict[str, _Row] = {}
    chapter_rows: dict[str, object] = {}

    for chapter_key in ALL_CHAPTER_KEYS:
        mode = CHAPTER_GENERATION_MODES[chapter_key]
        bundle = build_chapter_source_bundle("nivara-snap", chapter_key, snapshots)
        ast, _ = _build_chapter_ast(
            chapter_key=chapter_key,
            mode=mode,
            bundle=bundle,
            snapshots=snapshots,
            provider=provider,
            chapter_rows=chapter_rows,
            snapshot_id="nivara-snap",
        )
        chapter_rows[chapter_key] = type("CV", (), {"chapter_digest": {"title": ast.title, "summaryLine": ast.title}})()
        rows[chapter_key] = _Row(
            status=ChapterVersionStatus.GENERATED,
            ast_payload=ast.model_dump(by_alias=True, mode="json"),
            error_message=None,
        )
    return rows


def test_share_counts_never_formatted_as_currency() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "capital-structure-ownership", snapshots)
    ast = build_deterministic_chapter_ast("capital-structure-ownership", bundle, snapshots)
    full_text = " ".join(
        str((block.content or {}).get("text") or "")
        + " ".join(" ".join(str(c) for c in row) for row in (block.content or {}).get("rows") or [])
        for section in ast.sections
        for block in section.blocks
    )
    assert "80,00,000" in full_text
    assert "₹80,00,000" not in full_text.replace("₹8,00,00,000", "")
    assert format_locked_display("8000000", semantic_type="share_count") == "80,00,000"


def test_locked_object_amounts_match_table() -> None:
    snapshots = _nivara_snapshots()
    facts = build_global_locked_facts(snapshots)
    object_facts = [f for f in facts if f["factKey"].startswith("objects.")]
    displays = {f["displayValue"] for f in object_facts}
    assert "₹5,80,00,000" in displays
    assert "₹3,20,00,000" in displays
    assert "₹1,80,00,000" in displays
    assert "₹58,00,000" not in displays


def test_balance_sheet_populates_from_financials() -> None:
    snapshots = _nivara_snapshots()
    headers, rows = extract_balance_sheet_summary(snapshots)
    assert headers
    assert rows
    assert any("Total assets" in row[0] for row in rows)
    assert any("₹4,100 lakh" in " ".join(row) for row in rows)


def test_rpt_table_uses_structured_records() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "group-companies-rpt", snapshots)
    entity_registry = bundle.global_context.get("entityRegistry") or {}
    rows = extract_rpt_transactions(snapshots, entity_registry=entity_registry)
    assert rows
    assert "Nivara Precision Tools Private Limited" in rows[0]["party"]
    assert "₹45 lakh" in rows[0]["amount"]
    assert rows[0]["nature"] != "[●]"


def test_summary_uses_canonical_director_names() -> None:
    rows = _build_nivara_chapter_rows()
    summary = rows["summary-of-drhp"].ast_payload
    text = str(summary)
    assert "Priya Deshmukh" in text
    assert "Arjun Mehta" in text
    assert "Priya Desai" not in text
    assert "Ramesh Kumar" not in text
    assert "refId" not in text


def test_no_internal_metadata_in_export_text() -> None:
    rows = _build_nivara_chapter_rows()
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key=rows,
    )
    chapters = [chapter.chapter_ast for chapter in document.chapters if chapter.chapter_ast]
    warnings = scan_document_chapters(chapters)
    assert not [w for w in warnings if "refId" in w or "internal_person_id" in w]

    pdf_bytes = render_pdf(document)
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = "".join(page.get_text() for page in pdf)
    assert "refId" not in full_text
    assert "person:nivara-" not in full_text
    assert "entity:nivara-" not in full_text
    assert 'see ""' not in full_text
    assert "{'counterparty':" not in full_text


def test_nivara_pdf_and_docx_export_successfully() -> None:
    rows = _build_nivara_chapter_rows()
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key=rows,
    )
    pdf_bytes = render_pdf(document)
    docx_bytes = render_docx(document)
    assert pdf_bytes.startswith(b"%PDF")
    assert docx_bytes[:2] == b"PK"

    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = "".join(page.get_text() for page in pdf)
    assert "5,80,00,000" in full_text
    assert pdf.page_count >= 15


def test_publication_safety_strips_refid_from_visible_text() -> None:
    chapter = DrhpChapterAST(
        chapter_key="test",
        title="Test",
        order=1,
        sections=[
            DrhpSectionAST(
                section_key="s1",
                heading="Section",
                order=1,
                blocks=[
                    DrhpBlockAST(
                        block_id="b1",
                        kind="paragraph",
                        order=1,
                        content={"text": "Director (refId person:nivara-director-001) signed."},
                        source_ref_ids=[],
                        support_state="structured_input_backed",
                    )
                ],
            )
        ],
    )
    normalized = normalize_chapter_ast(chapter)
    text = normalized.sections[0].blocks[0].content["text"]
    assert "refId" not in text
    assert "person:nivara-" not in text
