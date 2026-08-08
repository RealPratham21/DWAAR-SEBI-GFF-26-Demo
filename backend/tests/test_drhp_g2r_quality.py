"""G2R Nivara quality gate tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.structured_narrative import GENERIC_FILLER_PHRASES, build_structured_chapter_narrative
from app.modules.drhp.generation.source_extractors import (
    extract_identity,
    extract_ipo_offer,
    extract_lead_manager,
    extract_registered_office,
    pivot_pl_table,
)
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.workstreams import WORKSPACE_MODELS, WorkstreamSnapshot
from app.modules.drhp.hashing import compute_source_hash


def _full_nivara_snapshots() -> dict[str, WorkstreamSnapshot]:
    payloads = json.loads(
        (Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json").read_text(
            encoding="utf-8"
        )
    )
    snapshots: dict[str, WorkstreamSnapshot] = {}
    for slug in WORKSPACE_MODELS:
        payload = payloads.get(slug) or {}
        snapshots[slug] = WorkstreamSnapshot(
            slug=slug,
            payload=payload,
            version=1,
            schema_version=1,
            payload_hash=compute_source_hash({"slug": slug}),
            workspace_id=f"ws-{slug}",
            last_saved_at="2024-03-31T00:00:00Z",
        )
    return snapshots


def _ast_text(ast) -> str:
    parts: list[str] = []
    for section in ast.sections:
        for block in section.blocks:
            c = block.content
            if c.get("text"):
                parts.append(str(c["text"]))
            for row in c.get("rows") or []:
                parts.extend(str(cell) for cell in row)
    return " ".join(parts).lower()


@pytest.fixture
def nivara_snapshots() -> dict[str, WorkstreamSnapshot]:
    return _full_nivara_snapshots()


def test_cover_resolves_nivara_identity_fields(nivara_snapshots) -> None:
    identity = extract_identity(nivara_snapshots)
    assert "Nivara Techfab" in identity["legalName"]
    assert identity["cin"].startswith("U")
    assert "Pune" in extract_registered_office(nivara_snapshots)
    offer = extract_ipo_offer(nivara_snapshots)
    assert offer["faceValue"] == "10"
    assert offer["freshIssueShares"] == "1500000"
    assert offer["issueMethod"]
    assert "Demo Capital" in extract_lead_manager(nivara_snapshots)


def test_cover_ast_has_real_data(nivara_snapshots) -> None:
    bundle = build_chapter_source_bundle("snap", "cover-page-front-matter", nivara_snapshots)
    ast = build_deterministic_chapter_ast("cover-page-front-matter", bundle, nivara_snapshots)
    text = _ast_text(ast)
    assert "pune" in text.lower()
    assert "demo capital" in text.lower()
    assert len(ast.sections[0].blocks) >= 5


def test_capital_ast_has_shareholders(nivara_snapshots) -> None:
    bundle = build_chapter_source_bundle("snap", "capital-structure-ownership", nivara_snapshots)
    ast = build_deterministic_chapter_ast("capital-structure-ownership", bundle, nivara_snapshots)
    text = _ast_text(ast)
    assert "80000000" in text or "authorised" in text
    assert "mehta" in text.lower()


def test_financial_pl_has_multiple_periods(nivara_snapshots) -> None:
    headers, rows = pivot_pl_table(nivara_snapshots)
    assert len(headers) >= 3
    assert len(rows) >= 5
    assert any("4200" in cell for row in rows for cell in row)


def test_business_has_multiple_sections_not_generic(nivara_snapshots) -> None:
    bundle = build_chapter_source_bundle("snap", "business-operations", nivara_snapshots)
    output = build_structured_chapter_narrative(
        chapter_key="business-operations",
        bundle=bundle,
        snapshots=nivara_snapshots,
    )
    assert len(output.sections) >= 2
    text = " ".join(
        str(getattr(b, "content", {}).get("text", ""))
        for s in output.sections
        for b in s.blocks
    ).lower()
    for phrase in GENERIC_FILLER_PHRASES:
        assert phrase not in text
    assert "precision" in text or "manufactur" in text


def test_declarations_no_unsupported_compliance_conclusion(nivara_snapshots) -> None:
    bundle = build_chapter_source_bundle("snap", "declarations-aoa-miscellaneous", nivara_snapshots)
    ast = build_deterministic_chapter_ast("declarations-aoa-miscellaneous", bundle, nivara_snapshots)
    text = _ast_text(ast)
    assert "have been complied with" not in text


def test_objects_register_populated(nivara_snapshots) -> None:
    bundle = build_chapter_source_bundle("snap", "objects-of-the-issue", nivara_snapshots)
    output = build_structured_chapter_narrative(
        chapter_key="objects-of-the-issue",
        bundle=bundle,
        snapshots=nivara_snapshots,
    )
    text = _ast_text(output)
    assert "bhosari" in text.lower() or "expansion" in text.lower()
