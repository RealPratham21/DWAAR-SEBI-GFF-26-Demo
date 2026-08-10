"""Tests for Global Issues & Gaps (G4)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.modules.issues_gaps.deduplication import deduplicate_issues
from app.modules.issues_gaps.detectors.conflicts import detect_cross_workstream_conflicts
from app.modules.issues_gaps.fingerprints import build_fingerprint, build_merge_group
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import (
    severity_from_assessment_state,
    severity_from_drhp_requirement,
)


def _raw(**kwargs) -> RawGlobalIssue:
    defaults = {
        "fingerprint": "fp",
        "title": "Test",
        "description": "Desc",
        "category": "missing_information",
        "severity": "medium",
        "source_kind": "workstream_assessment",
    }
    defaults.update(kwargs)
    return RawGlobalIssue(**defaults)


def test_fingerprint_is_stable() -> None:
    a = build_fingerprint(
        source_kind="cross_workstream_conflict",
        workstream_key="capital-ownership",
        section_key="freshIssueShares",
        record_id="ipo-setup-eligibility",
        issue_code="share_capital_arithmetic",
    )
    b = build_fingerprint(
        source_kind="cross_workstream_conflict",
        workstream_key="capital-ownership",
        section_key="freshIssueShares",
        record_id="ipo-setup-eligibility",
        issue_code="share_capital_arithmetic",
    )
    assert a == b
    assert len(a) == 64


def test_deduplication_merges_same_merge_group() -> None:
    merge_group = build_merge_group("conflict", "share_capital_arithmetic", "freshIssueShares")
    conflict = _raw(
        fingerprint=build_fingerprint(
            source_kind="cross_workstream_conflict",
            workstream_key="capital-ownership",
            section_key="freshIssueShares",
            record_id="ipo-setup-eligibility",
            issue_code="share_capital_arithmetic",
        ),
        title="Fresh Issue share count differs across workstreams",
        source_kind="cross_workstream_conflict",
        severity="blocking",
        merge_group=merge_group,
        metadata={"provenance": [{"sourceKind": "cross_workstream_conflict"}]},
    )
    workstream = _raw(
        fingerprint=build_fingerprint(
            source_kind="workstream_assessment",
            workstream_key="capital-ownership",
            section_key="offer_reconciliation",
            record_id="fresh_issue_shares",
            issue_code="potential_inconsistency",
        ),
        title="Fresh Issue shares reconciliation",
        source_kind="workstream_assessment",
        severity="high",
        merge_group=merge_group,
        metadata={"provenance": [{"sourceKind": "workstream_assessment"}]},
    )

    merged = deduplicate_issues([conflict, workstream])
    assert len(merged) == 1
    assert set(merged[0].source_kinds) == {"cross_workstream_conflict", "workstream_assessment"}
    assert merged[0].severity == "blocking"
    assert len(merged[0].metadata.get("supportingReasons") or []) == 1


def test_severity_professional_confirmation_not_blocking() -> None:
    assert severity_from_assessment_state("professional_confirmation_required") == "medium"
    assert severity_from_assessment_state("pending_professional_confirmation") == "medium"


def test_severity_allowed_placeholder_is_low() -> None:
    assert (
        severity_from_drhp_requirement(
            blocks_generation=False,
            classification="allowed_placeholder",
            placeholder_allowed=True,
            applicability="applicable",
        )
        == "low"
    )


def test_severity_unknown_applicability_is_low() -> None:
    assert (
        severity_from_drhp_requirement(
            blocks_generation=False,
            classification="gap",
            placeholder_allowed=False,
            applicability="unknown",
        )
        == "low"
    )


def test_evidence_ref_response_coerces_uuid_fields() -> None:
    from app.modules.issues_gaps.service import _evidence_ref_from_dict

    doc_id = uuid.uuid4()
    version_id = uuid.uuid4()
    ref = _evidence_ref_from_dict(
        {
            "documentId": doc_id,
            "documentVersionId": version_id,
            "originalFilename": "coi.pdf",
            "pageNumbers": [1, 2],
            "requirementKey": "cin",
            "requirementLabel": "CIN",
        }
    )
    assert ref.document_id == str(doc_id)
    assert ref.document_version_id == str(version_id)
    assert ref.original_filename == "coi.pdf"
    assert ref.page_numbers == [1, 2]


def test_severity_blocker_stays_blocking() -> None:
    assert severity_from_assessment_state("potential_concern", blocking_hint=True) == "blocking"
    assert (
        severity_from_drhp_requirement(
            blocks_generation=True,
            classification="missing",
            placeholder_allowed=False,
            applicability="applicable",
        )
        == "blocking"
    )


def test_cross_workstream_conflict_detector_with_nivara_payloads() -> None:
    from app.modules.drhp.workstreams import WorkstreamSnapshot

    payloads_file = Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json"
    if not payloads_file.exists():
        pytest.skip("Nivara payloads not available")

    payloads = json.loads(payloads_file.read_text(encoding="utf-8"))
    snapshots = {
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
        if slug in {"capital-ownership", "ipo-setup-eligibility"}
    }

    class _Db:
        pass

    class _User:
        id = uuid.uuid4()

    from app.modules.issues_gaps.detectors import conflicts as conflicts_module

    original = conflicts_module.load_all_workstreams
    conflicts_module.load_all_workstreams = lambda _db, _uid: snapshots  # type: ignore[assignment]
    try:
        issues = detect_cross_workstream_conflicts(_Db(), _User())  # type: ignore[arg-type]
    finally:
        conflicts_module.load_all_workstreams = original

    if not issues:
        pytest.skip("Current Nivara payloads have no share-count conflict")

    issue = issues[0]
    assert issue.source_kind == "cross_workstream_conflict"
    assert issue.metadata.get("canonicalSource") == "capital-ownership"
    assert issue.open_source_url.startswith("/projects/demo/workstreams/")
    assert issue.affected_drhp_chapters


@pytest.mark.postgres
async def test_acknowledgement_persists_after_refresh(auth_client, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g4-ack@example.com")
    listing = await auth_client.get("/api/v1/issues-gaps", headers=headers)
    assert listing.status_code == 200
    body = listing.json()
    if body["total"] == 0:
        pytest.skip("No issues emitted for seeded workspace")

    issue_id = body["issues"][0]["id"]
    patch = await auth_client.patch(
        f"/api/v1/issues-gaps/{issue_id}/acknowledgement",
        headers=headers,
        json={"acknowledged": True, "note": "Reviewed pending item."},
    )
    assert patch.status_code == 200
    assert patch.json()["acknowledged"] is True

    refreshed = await auth_client.get("/api/v1/issues-gaps", headers=headers)
    row = next(item for item in refreshed.json()["issues"] if item["id"] == issue_id)
    assert row["lifecycleState"] == "acknowledged"
    assert row["acknowledgementNote"] == "Reviewed pending item."
