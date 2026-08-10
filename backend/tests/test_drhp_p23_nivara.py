"""DRHP-P2.3 publication density — Nivara acceptance tests."""

from __future__ import annotations

import fitz

from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import ALL_CHAPTER_KEYS, CHAPTER_GENERATION_MODES, PLACEHOLDER_TOKEN
from app.modules.drhp.export.document import assemble_export_document
from app.modules.drhp.export.pdf_renderer import render_pdf
from app.modules.drhp.generation.disclosure_assembly import assemble_chapter_with_plan
from app.modules.drhp.generation.source_extractors import extract_approvals, extract_mda_facts
from app.modules.drhp.generation.terms import build_term_registry
from app.modules.drhp.cohere.provider import FakeDrhpGenerationProvider
from tests.test_drhp_generation_foundation import _nivara_snapshots


def _build_rows() -> dict[str, object]:
    snapshots = _nivara_snapshots()
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    rows: dict[str, object] = {}
    chapter_rows: dict[str, object] = {}
    for chapter_key in ALL_CHAPTER_KEYS:
        mode = CHAPTER_GENERATION_MODES[chapter_key]
        bundle = build_chapter_source_bundle("nivara-snap", chapter_key, snapshots)
        ast, _ = assemble_chapter_with_plan(
            chapter_key=chapter_key,
            mode=mode,
            bundle=bundle,
            snapshots=snapshots,
            provider=provider,
            chapter_rows=chapter_rows,
        )
        chapter_rows[chapter_key] = type("CV", (), {"chapter_digest": {"title": ast.title, "summaryLine": ast.title}})()
        rows[chapter_key] = type("Row", (), {"status": "generated", "ast_payload": ast.model_dump(by_alias=True, mode="json")})()
    return rows


def test_definitions_human_facing() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "definitions-abbreviations", snapshots)
    terms = build_term_registry(bundle.global_context, snapshots)
    text = str(terms)
    assert "Canonical metric label" not in text
    assert any("Profit After Tax" in str(t.get("definition", "")) for t in terms["terms"])


def test_objects_multiple_sections() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "objects-of-the-issue", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    ast, _ = assemble_chapter_with_plan(
        chapter_key="objects-of-the-issue",
        mode=CHAPTER_GENERATION_MODES["objects-of-the-issue"],
        bundle=bundle,
        snapshots=snapshots,
        provider=provider,
    )
    keys = {s.section_key for s in ast.sections}
    assert len(ast.sections) >= 4
    assert "objects-allocation" in keys or "objects-overview" in keys
    assert "means-deployment" in keys or "capex-facilities" in keys


def test_industry_substantive() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "industry-overview", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    ast, _ = assemble_chapter_with_plan(
        chapter_key="industry-overview",
        mode=CHAPTER_GENERATION_MODES["industry-overview"],
        bundle=bundle,
        snapshots=snapshots,
        provider=provider,
    )
    assert len(ast.sections) >= 5


def test_management_expanded() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "management-governance", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    ast, _ = assemble_chapter_with_plan(
        chapter_key="management-governance",
        mode=CHAPTER_GENERATION_MODES["management-governance"],
        bundle=bundle,
        snapshots=snapshots,
        provider=provider,
    )
    keys = {s.section_key for s in ast.sections}
    assert "board" in keys
    assert "kmp" in keys or "director-profiles" in keys


def test_mda_no_export_contradiction() -> None:
    snapshots = _nivara_snapshots()
    mda = extract_mda_facts(snapshots)
    assert mda["hasContent"]
    assert "export orders" not in mda["narrative"].lower()
    assert "automotive" in mda["narrative"].lower() or "revenue" in mda["narrative"].lower()


def test_approval_status_temporal() -> None:
    snapshots = _nivara_snapshots()
    approvals = extract_approvals(snapshots)
    assert approvals
    status = approvals[0]["status"].lower()
    assert "valid" != status or "expir" in status


def test_declarations_no_stray_placeholder() -> None:
    rows = _build_rows()
    decl = rows["declarations-aoa-miscellaneous"].ast_payload
    assert PLACEHOLDER_TOKEN not in str(decl)


def test_share_formatting_in_pdf() -> None:
    rows = _build_rows()
    document = assemble_export_document(version_number=1, generated_at=None, is_partial=False, chapter_rows_by_key=rows)
    pdf_bytes = render_pdf(document)
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "".join(page.get_text() for page in pdf)
    assert "15,00,000" in text
    assert "1500000" not in text.replace("15,00,000", "")
    assert PLACEHOLDER_TOKEN not in text
    assert pdf.page_count >= 18
