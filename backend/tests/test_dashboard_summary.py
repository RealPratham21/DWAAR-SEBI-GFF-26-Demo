"""Tests for Dashboard summary (G8)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.modules.dashboard.next_actions import DashboardNextAction, build_dashboard_next_actions
from app.modules.drhp.constants import DocumentVersionStatus


def _issue(
    *,
    fingerprint: str,
    title: str,
    severity: str = "high",
    workstream_key: str = "capital-ownership",
    lifecycle_state: str = "open",
    professional_review_required: bool = False,
    open_source_url: str = "",
    description: str = "desc",
    why_it_matters: str = "why",
    suggested_action: str = "fix",
):
    class Stub:
        pass

    issue = Stub()
    issue.fingerprint = fingerprint
    issue.title = title
    issue.severity = severity
    issue.workstream_key = workstream_key
    issue.lifecycle_state = lifecycle_state
    issue.professional_review_required = professional_review_required
    issue.open_source_url = open_source_url
    issue.description = description
    issue.why_it_matters = why_it_matters
    issue.suggested_action = suggested_action
    return issue


def test_next_actions_prioritize_blocking_over_high() -> None:
    actions = build_dashboard_next_actions(
        issues=[
            _issue(fingerprint="high-1", title="High issue", severity="high"),
            _issue(fingerprint="block-1", title="Blocking issue", severity="blocking"),
        ],
        workstreams=[],
        requirements=[],
        drhp_exists=True,
        drhp_stale=False,
        drhp_status=DocumentVersionStatus.GENERATED,
        drhp_affected_chapters=0,
        professional_review_count=0,
    )
    assert actions[0].title == "Blocking issue"
    assert actions[0].priority == 1


def test_next_actions_deduplicate_issue_ids() -> None:
    actions = build_dashboard_next_actions(
        issues=[
            _issue(fingerprint="dup-1", title="Same issue", severity="blocking"),
            _issue(fingerprint="dup-1", title="Same issue duplicate", severity="blocking"),
        ],
        workstreams=[],
        requirements=[],
        drhp_exists=True,
        drhp_stale=False,
        drhp_status=DocumentVersionStatus.GENERATED,
        drhp_affected_chapters=0,
        professional_review_count=0,
    )
    assert len([a for a in actions if a.issue_id == "dup-1"]) == 1


def test_next_actions_stale_drhp_before_generate() -> None:
    actions = build_dashboard_next_actions(
        issues=[],
        workstreams=[{"workstreamKey": "ipo-setup", "workstreamLabel": "IPO Setup", "overallStatus": "complete", "sectionsComplete": 6, "totalSections": 6}],
        requirements=[],
        drhp_exists=True,
        drhp_stale=True,
        drhp_status=DocumentVersionStatus.GENERATED_WITH_WARNINGS,
        drhp_affected_chapters=3,
        professional_review_count=0,
    )
    ids = [a.id for a in actions]
    assert "drhp-stale" in ids
    stale = next(a for a in actions if a.id == "drhp-stale")
    assert stale.priority < 9


def test_next_actions_generate_when_no_drhp() -> None:
    actions = build_dashboard_next_actions(
        issues=[],
        workstreams=[],
        requirements=[],
        drhp_exists=False,
        drhp_stale=False,
        drhp_status=None,
        drhp_affected_chapters=0,
        professional_review_count=0,
    )
    assert any(a.id == "drhp-generate" for a in actions)


@pytest.mark.postgres
async def test_dashboard_summary_api(auth_client: AsyncClient, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g8-dashboard@example.com")
    response = await auth_client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()

    assert body["issuerContext"]["issuerName"]
    assert body["workstreams"]["total"] == 12
    assert len(body["workstreams"]["items"]) == 12
    assert "open" in body["issues"]
    assert "canonicalFacts" in body["factsEvidence"]
    assert "uploadedDocuments" in body["dataRoom"]
    assert "exists" in body["drhp"]
    assert isinstance(body["nextActions"], list)
    assert body["generatedAt"]


@pytest.mark.postgres
async def test_dashboard_summary_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401
