"""Postgres API tests for DRHP G1 snapshots and ownership."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.drhp_source_snapshot import DrhpSourceSnapshot
from tests.test_company_incorporation_documents import _register_submit_and_init_workspace

FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "fixtures"
    / "nivara-techfab"
    / "ground-truth.json"
)


def _nivara_information_tab() -> dict:
    data = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    return copy.deepcopy(data["informationTab"])


async def _seed_nivara_workspace(
    auth_client: AsyncClient,
    db_session: Session,
    email: str,
) -> dict[str, str]:
    headers = await _register_submit_and_init_workspace(auth_client, email)
    me = await auth_client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    user_id = me.json()["user"]["id"]

    workspace = db_session.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user_id
        )
    )
    assert workspace is not None
    payload = dict(workspace.payload or {})
    info = _nivara_information_tab()
    payload.update(
        {
            "identity": info["identity"],
            "corporateEvents": info["corporateEvents"],
            "offices": info["offices"],
            "constitutionalRecord": info["constitutionalRecord"],
            "constitutionalAmendments": info.get("constitutionalAmendments", []),
            "registrations": info["registrations"],
        }
    )
    workspace.payload = payload
    workspace.version = int(workspace.version) + 1
    db_session.add(workspace)
    db_session.commit()
    return headers


@pytest.mark.postgres
async def test_list_chapters_returns_eighteen_with_mixed_readiness(
    auth_client: AsyncClient,
    db_session: Session,
) -> None:
    headers = await _seed_nivara_workspace(
        auth_client, db_session, "drhp-list@example.com"
    )
    response = await auth_client.get("/api/v1/drhp/chapters", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["chapters"]) == 18
    by_key = {item["key"]: item for item in body["chapters"]}
    assert by_key["cover-page-front-matter"]["generationStatus"] == "ready_with_gaps"
    assert by_key["cover-page-front-matter"]["canGenerate"] is True
    assert by_key["company-history-promoters-structure"]["generationStatus"] == "ready_with_gaps"
    assert by_key["risk-factors"]["connectionStatus"] in {
        "partially_connected",
        "connected",
        "not_connected",
    }


@pytest.mark.postgres
async def test_cover_and_history_readiness_for_nivara(
    auth_client: AsyncClient,
    db_session: Session,
) -> None:
    headers = await _seed_nivara_workspace(
        auth_client, db_session, "drhp-ready@example.com"
    )
    cover = await auth_client.get(
        "/api/v1/drhp/chapters/cover-page-front-matter/readiness",
        headers=headers,
    )
    assert cover.status_code == 200
    cover_body = cover.json()
    assert cover_body["generationStatus"] == "ready_with_gaps"
    assert cover_body["gapCount"] >= 4
    assert any(item["key"] == "cover.promoters" for item in cover_body["gapRequirements"])

    history = await auth_client.get(
        "/api/v1/drhp/chapters/company-history-promoters-structure/readiness",
        headers=headers,
    )
    assert history.status_code == 200
    history_body = history.json()
    assert history_body["generationStatus"] == "ready_with_gaps"
    assert history_body["unknownApplicabilityCount"] >= 4
    unknown_keys = {item["key"] for item in history_body["unknownApplicabilityRequirements"]}
    assert "history.previousNames" in unknown_keys
    assert "history.holdingsSubsidiariesJv" in unknown_keys


@pytest.mark.postgres
async def test_snapshot_idempotent_and_immutable(
    auth_client: AsyncClient,
    db_session: Session,
) -> None:
    headers = await _seed_nivara_workspace(
        auth_client, db_session, "drhp-snap@example.com"
    )
    first = await auth_client.post(
        "/api/v1/drhp/chapters/cover-page-front-matter/source-snapshots",
        headers=headers,
    )
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["sourceHash"]
    assert len(first_body["items"]) >= 10
    # No full page text fields in evidence refs.
    dumped = json.dumps(first_body)
    assert "fullPageText" not in dumped
    assert "pageText" not in dumped

    second = await auth_client.post(
        "/api/v1/drhp/chapters/cover-page-front-matter/source-snapshots",
        headers=headers,
    )
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["sourceHash"] == first_body["sourceHash"]

    fetched = await auth_client.get(
        f"/api/v1/drhp/source-snapshots/{first_body['id']}",
        headers=headers,
    )
    assert fetched.status_code == 200
    assert fetched.json()["id"] == first_body["id"]

    # Change Information → new hash / new snapshot.
    me = await auth_client.get("/api/v1/auth/me", headers=headers)
    workspace = db_session.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == me.json()["user"]["id"]
        )
    )
    assert workspace is not None
    payload = dict(workspace.payload)
    payload["identity"] = {
        **payload["identity"],
        "legalName": "Nivara Techfab Renamed Private Limited",
    }
    workspace.payload = payload
    db_session.add(workspace)
    db_session.commit()

    third = await auth_client.post(
        "/api/v1/drhp/chapters/cover-page-front-matter/source-snapshots",
        headers=headers,
    )
    assert third.status_code == 200
    third_body = third.json()
    assert third_body["created"] is True
    assert third_body["id"] != first_body["id"]
    assert third_body["sourceHash"] != first_body["sourceHash"]

    # Original snapshot unchanged.
    original = db_session.get(DrhpSourceSnapshot, first_body["id"])
    assert original is not None
    assert original.source_hash == first_body["sourceHash"]
    readiness = original.readiness_result
    assert readiness["requirements"][0]["selectedValue"] != (
        "Nivara Techfab Renamed Private Limited"
    ) or any(
        item.get("key") == "cover.legalName"
        and item.get("selectedValue") == "Nivara Techfab Private Limited"
        for item in readiness.get("requirements", [])
    )


@pytest.mark.postgres
async def test_snapshot_ownership_isolation(
    auth_client: AsyncClient,
    db_session: Session,
) -> None:
    headers_a = await _seed_nivara_workspace(
        auth_client, db_session, "drhp-owner-a@example.com"
    )
    created = await auth_client.post(
        "/api/v1/drhp/chapters/cover-page-front-matter/source-snapshots",
        headers=headers_a,
    )
    assert created.status_code == 200
    snapshot_id = created.json()["id"]

    headers_b = await _seed_nivara_workspace(
        auth_client, db_session, "drhp-owner-b@example.com"
    )
    forbidden = await auth_client.get(
        f"/api/v1/drhp/source-snapshots/{snapshot_id}",
        headers=headers_b,
    )
    assert forbidden.status_code == 403
