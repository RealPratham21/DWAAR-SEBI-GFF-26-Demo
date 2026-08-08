"""Tests for Global Facts & Evidence (G5)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.modules.drhp.constants import SourceRefType
from app.modules.drhp.generation.source_refs import stable_ref_id
from app.modules.drhp.workstreams import WorkstreamSnapshot
from app.modules.facts_evidence.builders import build_workstream_facts
from app.modules.facts_evidence.fingerprints import build_fact_fingerprint
from app.modules.facts_evidence.formatting import format_shares
from app.modules.facts_evidence.support import map_support_type


def _nivara_snapshots() -> dict[str, WorkstreamSnapshot]:
    payloads_file = Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json"
    if not payloads_file.exists():
        pytest.skip("Nivara payloads not available")
    payloads = json.loads(payloads_file.read_text(encoding="utf-8"))
    return {
        slug: WorkstreamSnapshot(
            slug=slug,
            workspace_id=uuid.uuid4(),
            version=1,
            schema_version=1,
            payload=payload,
            payload_hash="hash",
            last_saved_at=datetime.now(tz=UTC).isoformat(),
        )
        for slug, payload in payloads.items()
    }


def test_fact_fingerprint_is_stable() -> None:
    a = build_fact_fingerprint(
        workstream_key="financials-kpis",
        section_key="restated-statement-of-profit-and-loss",
        field_path="plLineValues.revenueFromOperations",
        reporting_period="FY2024",
    )
    b = build_fact_fingerprint(
        workstream_key="financials-kpis",
        section_key="restated-statement-of-profit-and-loss",
        field_path="plLineValues.revenueFromOperations",
        reporting_period="FY2024",
    )
    assert a == b


def test_support_type_mapping() -> None:
    assert map_support_type(SourceRefType.STRUCTURED_USER_INPUT) == "structured_issuer_input"
    assert map_support_type(SourceRefType.DOCUMENT_BACKED_FACT) == "document_backed"
    assert map_support_type(SourceRefType.DETERMINISTIC_CALCULATION) == "deterministic_calculation"


def test_format_shares_indian_grouping() -> None:
    assert "45,00,000" in format_shares("4500000")


def test_nivara_builds_facts_from_all_workstreams() -> None:
    snapshots = _nivara_snapshots()
    facts = build_workstream_facts(snapshots)
    assert len(facts) > 20
    workstreams = {fact.canonical_workstream_key for fact in facts}
    assert "company-incorporation" in workstreams
    assert "financials-kpis" in workstreams
    assert "capital-ownership" in workstreams
    assert "management-governance" in workstreams
    assert "intermediaries-filing" in workstreams
    assert "borrowings-assets-contracts" in workstreams
    assert "industry-market" in workstreams

    legal = next((f for f in facts if f.label == "Legal company name"), None)
    assert legal is not None
    assert legal.canonical_workstream_key == "company-incorporation"
    assert legal.support_type == "structured_issuer_input"

    revenue_facts = [f for f in facts if "Revenue from operations" in f.label]
    assert revenue_facts
    assert any(f.reporting_period for f in revenue_facts)

    calculated = [f for f in facts if f.support_type == "deterministic_calculation"]
    assert calculated


def test_drhp_ref_id_aligns_with_fact_source_ref() -> None:
    snapshots = _nivara_snapshots()
    facts = build_workstream_facts(snapshots)
    fact = next(f for f in facts if f.field_path == "identity.legalName")
    ref_id = fact.source_ref.get("refId") or fact.source_ref.get("ref_id")
    expected = stable_ref_id(
        workstream="company-incorporation",
        section="legal-identity",
        field_path="identity.legalName",
    )
    assert ref_id == expected


@pytest.mark.postgres
async def test_facts_evidence_api(auth_client, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g5-facts@example.com")
    listing = await auth_client.get("/api/v1/facts-evidence/facts", headers=headers)
    assert listing.status_code == 200
    body = listing.json()
    assert body["total"] > 0

    summary = await auth_client.get("/api/v1/facts-evidence/facts/summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["canonicalFacts"] > 0

    fact_id = body["facts"][0]["factId"]
    detail = await auth_client.get(f"/api/v1/facts-evidence/facts/{fact_id}", headers=headers)
    assert detail.status_code == 200

    evidence = await auth_client.get("/api/v1/facts-evidence/evidence", headers=headers)
    assert evidence.status_code == 200
