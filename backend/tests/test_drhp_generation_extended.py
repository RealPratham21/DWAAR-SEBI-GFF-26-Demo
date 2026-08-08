"""Additional DRHP generation foundation tests."""

from __future__ import annotations

import uuid
from unittest.mock import MagicMock

from app.modules.drhp.bundles.builders import build_all_chapter_bundles
from app.modules.drhp.cohere.config import CohereKeyPool, GenerationConcurrencyConfig
from app.modules.drhp.generation.placeholders import (
    build_document_placeholder_registry,
    is_allowed_placeholder_token,
)
from app.modules.drhp.generation.snapshot_service import build_normalized_snapshot_payload
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.drhp.hashing import compute_source_hash
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream
from app.modules.drhp.workstreams import WorkstreamSnapshot
from tests.test_drhp_generation_foundation import _nivara_snapshots


def test_normalized_snapshot_payload_is_stable_for_same_inputs() -> None:
    snapshots = _nivara_snapshots()
    first = build_normalized_snapshot_payload(snapshots)
    second = build_normalized_snapshot_payload(snapshots)
    assert compute_source_hash(first) == compute_source_hash(second)
    assert first["canonicalContext"]["issuerLegalName"]


def test_normalized_snapshot_payload_changes_when_workstream_mutates() -> None:
    snapshots = _nivara_snapshots()
    baseline_hash = compute_source_hash(build_normalized_snapshot_payload(snapshots))
    capital = snapshots["capital-ownership"]
    snapshots["capital-ownership"] = WorkstreamSnapshot(
        slug=capital.slug,
        workspace_id=capital.workspace_id,
        version=capital.version + 1,
        schema_version=capital.schema_version,
        payload=capital.payload,
        payload_hash="changed-hash",
        last_saved_at=capital.last_saved_at,
    )
    mutated_hash = compute_source_hash(build_normalized_snapshot_payload(snapshots))
    assert mutated_hash != baseline_hash


def test_staleness_marks_affected_chapters() -> None:
    snapshots = _nivara_snapshots()
    normalized = build_normalized_snapshot_payload(snapshots)
    snapshot = MagicMock()
    snapshot.id = uuid.uuid4()
    snapshot.source_workstream_versions = normalized["workstreamVersions"]

    live = dict(snapshots)
    capital = live["capital-ownership"]
    live["capital-ownership"] = WorkstreamSnapshot(
        slug=capital.slug,
        workspace_id=capital.workspace_id,
        version=capital.version + 1,
        schema_version=capital.schema_version,
        payload=capital.payload,
        payload_hash="live-changed",
        last_saved_at=capital.last_saved_at,
    )

    db = MagicMock()

    def _load(_db, _user_id):
        return live

    from app.modules.drhp.generation import staleness as staleness_module

    original = staleness_module.load_all_workstreams
    staleness_module.load_all_workstreams = _load
    try:
        result = compare_snapshot_staleness(db, uuid.uuid4(), snapshot)
    finally:
        staleness_module.load_all_workstreams = original

    assert result["isStale"] is True
    assert "capital-ownership" in {item["slug"] for item in result["staleWorkstreams"]}
    assert "capital-structure-ownership" in result["affectedChapters"]


def test_cohere_key_pool_round_robin_and_cooldown() -> None:
    pool = CohereKeyPool(
        ["key-a", "key-b"],
        GenerationConcurrencyConfig(max_global_concurrency=2, cooldown_seconds_on_429=60.0),
    )
    first = pool.acquire_key()
    second = pool.acquire_key()
    assert first in {"key-a", "key-b"}
    assert second in {"key-a", "key-b"}
    assert first != second
    pool.release_key(first, rate_limited=True)
    third = pool.acquire_key()
    assert third == second


def test_document_placeholder_registry_collects_from_bundles() -> None:
    bundles = build_all_chapter_bundles("snapshot-test", _nivara_snapshots())
    registry = build_document_placeholder_registry(bundles)
    assert isinstance(registry, list)
    assert is_allowed_placeholder_token("[●] issue price") is True


def test_capital_changes_impact_expected_chapters() -> None:
    affected = get_affected_chapters_for_workstream("capital-ownership")
    assert "capital-structure-ownership" in affected
    assert "basis-for-issue-price" in affected
