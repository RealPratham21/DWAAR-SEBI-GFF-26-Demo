"""DRHP-P2.2 deterministic disclosure assembly — Nivara acceptance tests."""

from __future__ import annotations

import fitz

from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import ALL_CHAPTER_KEYS, CHAPTER_GENERATION_MODES, PLACEHOLDER_TOKEN
from app.modules.drhp.export.document import assemble_export_document
from app.modules.drhp.export.pdf_renderer import render_pdf
from app.modules.drhp.generation.content_plan import build_chapter_content_plan
from app.modules.drhp.generation.disclosure_assembly import assemble_chapter_with_plan
from app.modules.drhp.generation.field_coverage import workstream_coverage_report
from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry
from app.modules.drhp.generation.source_extractors import extract_approvals, extract_mda_facts
from app.modules.drhp.cohere.provider import FakeDrhpGenerationProvider
from tests.test_drhp_generation_foundation import _nivara_snapshots


def _build_all_chapters() -> dict[str, object]:
    snapshots = _nivara_snapshots()
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    rows: dict[str, object] = {}
    chapter_rows: dict[str, object] = {}

    for chapter_key in ALL_CHAPTER_KEYS:
        mode = CHAPTER_GENERATION_MODES[chapter_key]
        bundle = build_chapter_source_bundle("nivara-snap", chapter_key, snapshots)
        ast, metrics = assemble_chapter_with_plan(
            chapter_key=chapter_key,
            mode=mode,
            bundle=bundle,
            snapshots=snapshots,
            provider=provider,
            chapter_rows=chapter_rows,
            snapshot_id="nivara-snap",
        )
        chapter_rows[chapter_key] = type("CV", (), {"chapter_digest": {"title": ast.title, "summaryLine": ast.title}})()
        rows[chapter_key] = type(
            "Row",
            (),
            {"status": "generated", "ast_payload": ast.model_dump(by_alias=True, mode="json"), "metrics": metrics},
        )()
    return rows


def test_definitions_deterministic_table() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "definitions-abbreviations", snapshots)
    ast, _ = assemble_chapter_with_plan(
        chapter_key="definitions-abbreviations",
        mode=CHAPTER_GENERATION_MODES["definitions-abbreviations"],
        bundle=bundle,
        snapshots=snapshots,
        provider=FakeDrhpGenerationProvider(),
    )
    text = str(ast.model_dump())
    assert "Corporate Identification Number" in text
    assert PLACEHOLDER_TOKEN not in text


def test_risk_factors_not_empty() -> None:
    snapshots = _nivara_snapshots()
    candidates, _ = build_risk_candidate_registry(snapshots)
    assert len(candidates) >= 3
    bundle = build_chapter_source_bundle("snap", "risk-factors", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    ast, metrics = assemble_chapter_with_plan(
        chapter_key="risk-factors",
        mode=CHAPTER_GENERATION_MODES["risk-factors"],
        bundle=bundle,
        snapshots=snapshots,
        provider=provider,
    )
    assert len(ast.sections) >= 3
    assert metrics["deterministicBlocks"] >= 3 or metrics["deterministicFallbackBlocks"] >= 3


def test_business_major_sections_populated() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "business-operations", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    ast, _ = assemble_chapter_with_plan(
        chapter_key="business-operations",
        mode=CHAPTER_GENERATION_MODES["business-operations"],
        bundle=bundle,
        snapshots=snapshots,
        provider=provider,
    )
    keys = {s.section_key for s in ast.sections}
    assert "operating-model" in keys
    assert "customers" in keys
    assert "products-services" in keys
    full = str(ast.model_dump())
    assert PLACEHOLDER_TOKEN not in full
    assert "Automotive Tier-1 account" in full


def test_financial_mda_from_performance_factors() -> None:
    snapshots = _nivara_snapshots()
    mda = extract_mda_facts(snapshots)
    assert mda["hasContent"]
    assert "automotive" in mda["narrative"].lower() or "revenue" in mda["narrative"].lower()


def test_legal_approvals_nested_fields() -> None:
    snapshots = _nivara_snapshots()
    approvals = extract_approvals(snapshots)
    assert approvals
    assert "Factory Licence" in approvals[0]["name"]
    assert approvals[0]["authority"]


def test_material_contracts_materiality_mapping() -> None:
    rows = _build_all_chapters()
    contracts = rows["material-contracts-inspection"].ast_payload
    text = str(contracts)
    assert "28% of revenue/cost" in text or "AutoDrive" in text


def test_no_supported_section_becomes_placeholder_in_pdf() -> None:
    rows = _build_all_chapters()
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key=rows,
    )
    pdf_bytes = render_pdf(document)
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = "".join(page.get_text() for page in pdf)
    # Business and risk should not be placeholder-only
    assert full_text.count(PLACEHOLDER_TOKEN) <= 3
    assert pdf.page_count >= 15


def test_chapter_content_plan_metrics() -> None:
    snapshots = _nivara_snapshots()
    plan = build_chapter_content_plan("business-operations", snapshots)
    metrics = plan.metrics()
    assert metrics["disclosureItemsSupported"] >= 5
    coverage = workstream_coverage_report(snapshots)
    assert "business-operations" in coverage["byWorkstream"]
