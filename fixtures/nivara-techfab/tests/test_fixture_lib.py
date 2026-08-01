from __future__ import annotations

from pathlib import Path

import pytest

from fixture_lib import (
    FIXTURE_ROOT,
    build_template_context,
    deep_merge,
    enrich_ground_truth,
    load_document_manifests,
    load_json,
    office_block_from_ground_truth,
    resolve_expected_value,
    validate_identifier_formats,
)


@pytest.fixture
def ground_truth() -> dict:
    return load_json(FIXTURE_ROOT / "ground-truth.json")


def test_ground_truth_identifiers_valid(ground_truth: dict) -> None:
    assert validate_identifier_formats(ground_truth) == []


def test_deep_merge_nested_overrides() -> None:
    base = {"a": {"b": 1, "c": 2}, "d": 3}
    overrides = {"a": {"c": 9}, "e": 4}
    merged = deep_merge(base, overrides)
    assert merged == {"a": {"b": 1, "c": 9}, "d": 3, "e": 4}
    assert base["a"]["c"] == 2


def test_enrich_ground_truth_adds_formatted_offices(ground_truth: dict) -> None:
    enriched = enrich_ground_truth(ground_truth)
    current = enriched["canonicalFacts"]["registeredOffice"]
    original = enriched["historicalFacts"]["registeredOffices"]["original"]
    assert "formattedSingleLine" in current
    assert "Bhosari" in current["formattedSingleLine"]
    assert "Chakan" in original["formattedSingleLine"]


def test_gst_manifest_contexts_differ_by_address(ground_truth: dict) -> None:
    manifests = {m["fixtureDocumentId"]: m for m in load_document_manifests()}
    current_ctx = build_template_context(ground_truth, manifests["09-gst-registration-current"])
    old_ctx = build_template_context(ground_truth, manifests["11-gst-registration-old-address"])
    assert "Bhosari" in current_ctx["principalAddress"]["formattedSingleLine"]
    assert "Chakan" in old_ctx["principalAddress"]["formattedSingleLine"]
    assert current_ctx["doc"]["asOfDate"] != old_ctx["doc"]["asOfDate"]


def test_resolve_expected_office_refs(ground_truth: dict) -> None:
    current = resolve_expected_value(ground_truth, "canonicalCurrentFacts.offices.current")
    assert current["pinCode"] == "411026"
    occupancy = resolve_expected_value(ground_truth, "canonicalCurrentFacts.offices.current.occupancyType")
    assert occupancy == "leased"


def test_all_template_manifests_render(ground_truth: dict) -> None:
    for manifest in load_document_manifests():
        if manifest.get("templateName"):
            context = build_template_context(ground_truth, manifest)
            assert context["watermark"]
            assert context["principalAddress"]["formattedSingleLine"]
