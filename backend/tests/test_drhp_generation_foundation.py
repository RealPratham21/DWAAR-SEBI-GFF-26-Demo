"""DRHP Generation Foundation tests."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from app.modules.drhp.bundles.builders import BUNDLE_BUILDERS, build_all_chapter_bundles
from app.modules.drhp.constants import ALL_CHAPTER_KEYS, CHAPTER_KEY_ALIASES, resolve_chapter_key
from app.modules.drhp.mapping.chapters import CHAPTER_MAPPINGS, iter_chapter_mappings
from app.modules.drhp.mapping.dependencies import validate_dependency_graph
from app.modules.drhp.mapping.impact import WORKSTREAM_IMPACT_MAP
from app.modules.drhp.ownership import detect_share_count_conflict
from app.modules.drhp.workstreams import WorkstreamSnapshot

PAYLOADS_FILE = Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json"


def _nivara_snapshots() -> dict[str, WorkstreamSnapshot]:
    payloads = json.loads(PAYLOADS_FILE.read_text(encoding="utf-8"))
    snapshots: dict[str, WorkstreamSnapshot] = {}
    for slug, payload in payloads.items():
        snapshots[slug] = WorkstreamSnapshot(
            slug=slug,
            workspace_id=uuid.uuid4(),
            version=1,
            schema_version=1,
            payload=payload,
            payload_hash=f"hash-{slug}",
            last_saved_at="2024-03-31T00:00:00+00:00",
        )
    return snapshots


def test_registry_has_eighteen_chapters() -> None:
    assert len(ALL_CHAPTER_KEYS) == 18
    assert len(CHAPTER_MAPPINGS) == 18
    assert len(list(iter_chapter_mappings())) == 18
    assert len(BUNDLE_BUILDERS) == 18


def test_chapter_keys_are_unique_and_ordered() -> None:
    assert len(set(ALL_CHAPTER_KEYS)) == 18
    orders = [CHAPTER_MAPPINGS[key].order for key in ALL_CHAPTER_KEYS]
    assert orders == list(range(1, 19))


def test_legacy_aliases_resolve() -> None:
    assert resolve_chapter_key("company-history-incorporation") == "company-history-promoters-structure"
    assert resolve_chapter_key("financial-information-kpis") == "financial-information-mda"
    for legacy, canonical in CHAPTER_KEY_ALIASES.items():
        assert resolve_chapter_key(legacy) == canonical


def test_dependency_graph_has_no_cycles() -> None:
    assert validate_dependency_graph() == []


def test_share_count_conflict_surfaces_disagreement() -> None:
    conflict = detect_share_count_conflict(
        capital_value="1500000",
        ipo_value="1600000",
        field_path="freshIssueShares",
    )
    assert conflict is not None
    assert conflict.authoritative_workstream == "capital-ownership"
    assert conflict.severity == "blocker"


def test_nivara_all_chapter_bundles_build() -> None:
    snapshots = _nivara_snapshots()
    bundles = build_all_chapter_bundles("test-snapshot", snapshots)
    assert len(bundles) == 18
    for key, bundle in bundles.items():
        assert bundle.chapter_key == key
        assert bundle.global_context.get("issuerLegalName")
        assert bundle.readiness.connection_status in {
            "connected",
            "partially_connected",
            "not_connected",
        }


def test_capital_bundle_includes_conflict_detection_when_values_differ() -> None:
    snapshots = _nivara_snapshots()
    ipo = snapshots["ipo-setup-eligibility"]
    snapshots["ipo-setup-eligibility"] = WorkstreamSnapshot(
        slug=ipo.slug,
        workspace_id=ipo.workspace_id,
        version=ipo.version,
        schema_version=ipo.schema_version,
        payload={
            **ipo.payload,
            "offerStructure": {
                **(ipo.payload.get("offerStructure") or {}),
                "freshIssueShares": "9999999",
            },
        },
        payload_hash="mutated",
        last_saved_at=ipo.last_saved_at,
    )
    bundle = build_all_chapter_bundles("test-snapshot", snapshots)["capital-structure-ownership"]
    assert len(bundle.conflicts) >= 1


def test_workstream_impact_map_covers_all_slugs() -> None:
    assert len(WORKSTREAM_IMPACT_MAP) == 12
    assert "capital-structure-ownership" in WORKSTREAM_IMPACT_MAP["capital-ownership"]
