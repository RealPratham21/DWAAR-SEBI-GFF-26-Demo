"""Tests for Global Data Room (G6)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.modules.data_room.applicability import derive_applicability
from app.modules.data_room.global_ids import encode_ci_document_id, encode_dr_document_id, parse_global_document_id
from app.modules.data_room.requirements_registry import REQUIREMENT_REGISTRY, all_requirement_definitions
from app.modules.drhp.workstreams import WorkstreamSnapshot
from tests.test_company_incorporation_documents import FakeStorage, SHA256_PLACEHOLDER


def test_requirement_registry_covers_all_workstreams() -> None:
    definitions = all_requirement_definitions()
    workstreams = {item.workstream_key for item in definitions}
    assert "company-incorporation" in workstreams
    assert "financials-kpis" in workstreams
    assert "intermediaries-filing" in workstreams
    assert len(workstreams) == 12
    assert len(definitions) >= 40


def test_global_document_id_routing() -> None:
    import uuid

    doc_id = uuid.uuid4()
    global_ci = encode_ci_document_id(doc_id)
    global_dr = encode_dr_document_id(doc_id)
    assert parse_global_document_id(global_ci)[0] == "company_incorporation"
    assert parse_global_document_id(global_dr)[0] == "data_room"


def test_acquisition_requirement_not_applicable_without_acquisition_object() -> None:
    import uuid

    requirement = REQUIREMENT_REGISTRY["objects-of-issue:acquisition-documents"]
    snapshots = {
        "objects-of-issue": WorkstreamSnapshot(
            slug="objects-of-issue",
            workspace_id=uuid.uuid4(),
            version=1,
            schema_version=1,
            payload={"objectsRegisterAndAllocation": {"objects": [{"category": "capex"}]}},
            payload_hash="hash",
            last_saved_at="2026-01-01T00:00:00Z",
        )
    }
    assert derive_applicability(requirement, snapshots) == "not_applicable"


@pytest.fixture
def fake_data_room_storage(monkeypatch: pytest.MonkeyPatch) -> FakeStorage:
    storage = FakeStorage()
    monkeypatch.setattr(
        "app.modules.data_room.generic_service.get_object_storage",
        lambda: storage,
    )
    return storage


@pytest.mark.postgres
async def test_data_room_api_lists_requirements_and_documents(
    auth_client: AsyncClient,
    db_session: Session,
) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g6-list@example.com")

    summary = await auth_client.get("/api/v1/data-room/summary", headers=headers)
    assert summary.status_code == 200
    summary_body = summary.json()
    assert summary_body["applicableRequirements"] > 0

    requirements = await auth_client.get("/api/v1/data-room/requirements", headers=headers)
    assert requirements.status_code == 200
    req_body = requirements.json()
    assert req_body["total"] >= 40
    workstreams = {item["workstreamKey"] for item in req_body["requirements"]}
    assert len(workstreams) == 12

    documents = await auth_client.get("/api/v1/data-room/documents", headers=headers)
    assert documents.status_code == 200


@pytest.mark.postgres
async def test_generic_upload_and_versioning(
    auth_client: AsyncClient,
    db_session: Session,
    fake_data_room_storage: FakeStorage,
) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g6-upload@example.com")

    initiate = await auth_client.post(
        "/api/v1/data-room/documents",
        headers=headers,
        json={
            "workstreamKey": "financials-kpis",
            "requirementKey": "financials-kpis:audited-financial-statements",
            "title": "FY2024 Audited Financial Statements",
            "category": "Financial Statements",
            "filename": "audited_financials_2024.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert initiate.status_code == 200, initiate.text
    body = initiate.json()
    storage_key = body["storageKey"]
    fake_data_room_storage.put(storage_key, size=1024, content_type="application/pdf")

    finalize = await auth_client.post(
        f"/api/v1/data-room/documents/versions/{body['versionId']}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200
    assert finalize.json()["currentVersion"] == 1

    listing = await auth_client.get("/api/v1/data-room/documents", headers=headers)
    assert listing.status_code == 200
    docs = listing.json()["documents"]
    uploaded = next((d for d in docs if d["title"] == "FY2024 Audited Financial Statements"), None)
    assert uploaded is not None
    assert uploaded["processingCapability"] == "stored_only"
    assert uploaded["factCount"] == 0
    assert uploaded["evidenceCount"] == 0

    reqs = await auth_client.get(
        "/api/v1/data-room/requirements?workstream=financials-kpis",
        headers=headers,
    )
    audited = next(
        item
        for item in reqs.json()["requirements"]
        if item["requirementKey"] == "financials-kpis:audited-financial-statements"
    )
    assert audited["status"] == "provided"

    global_id = uploaded["globalDocumentId"]
    v2 = await auth_client.post(
        f"/api/v1/data-room/documents/{global_id}/versions",
        headers=headers,
        json={
            "filename": "audited_financials_2024_v2.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert v2.status_code == 200
    fake_data_room_storage.put(v2.json()["storageKey"], size=2048, content_type="application/pdf")
    finalize_v2 = await auth_client.post(
        f"/api/v1/data-room/documents/versions/{v2.json()['versionId']}/finalize",
        headers=headers,
    )
    assert finalize_v2.status_code == 200
    assert finalize_v2.json()["currentVersion"] == 2

    detail = await auth_client.get(f"/api/v1/data-room/documents/{global_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["currentVersion"] == 2
    assert len(detail.json()["versions"]) == 2

    download = await auth_client.get(f"/api/v1/data-room/documents/{global_id}/download", headers=headers)
    assert download.status_code == 200
    assert download.json()["downloadUrl"]


@pytest.mark.postgres
async def test_data_room_isolation(
    auth_client: AsyncClient,
    db_session: Session,
    fake_data_room_storage: FakeStorage,
) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers_a = await _seed_nivara_workspace(auth_client, db_session, "g6-owner-a@example.com")
    initiate = await auth_client.post(
        "/api/v1/data-room/documents",
        headers=headers_a,
        json={
            "workstreamKey": "financials-kpis",
            "requirementKey": "financials-kpis:audited-financial-statements",
            "title": "Private financials",
            "filename": "private.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 512,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    global_id = initiate.json()["globalDocumentId"]
    fake_data_room_storage.put(initiate.json()["storageKey"], size=512, content_type="application/pdf")
    await auth_client.post(
        f"/api/v1/data-room/documents/versions/{initiate.json()['versionId']}/finalize",
        headers=headers_a,
    )

    headers_b = await _seed_nivara_workspace(auth_client, db_session, "g6-owner-b@example.com")
    forbidden = await auth_client.get(f"/api/v1/data-room/documents/{global_id}", headers=headers_b)
    assert forbidden.status_code == 404

    bad_type = await auth_client.post(
        "/api/v1/data-room/documents",
        headers=headers_b,
        json={
            "workstreamKey": "financials-kpis",
            "requirementKey": "financials-kpis:audited-financial-statements",
            "title": "Bad file",
            "filename": "bad.exe",
            "contentType": "application/octet-stream",
            "sizeBytes": 100,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert bad_type.status_code == 422

    ci_blocked = await auth_client.post(
        "/api/v1/data-room/documents",
        headers=headers_b,
        json={
            "workstreamKey": "company-incorporation",
            "requirementKey": "company-incorporation:original-certificate-of-incorporation",
            "title": "CoI",
            "filename": "coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 100,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert ci_blocked.status_code == 422
