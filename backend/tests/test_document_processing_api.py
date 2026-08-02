from pathlib import Path

import fitz
import pytest
from app.models.document_processing_run import DocumentProcessingRun
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import claim_next_run
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from tests.test_company_incorporation_documents import (
    SHA256_PLACEHOLDER,
    FakeStorage,
    _register_submit_and_init_workspace,
)


def _make_simple_pdf(path: Path, text: str) -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text, fontsize=12)
    doc.save(path)
    doc.close()


@pytest.fixture
def fake_storage(monkeypatch: pytest.MonkeyPatch) -> FakeStorage:
    storage = FakeStorage()
    monkeypatch.setattr(
        "app.modules.company_incorporation.documents.service.get_object_storage",
        lambda: storage,
    )
    monkeypatch.setattr(
        "app.modules.company_incorporation.document_processing.pipeline.get_object_storage",
        lambda: storage,
    )
    return storage


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_finalize_queues_processing_run(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "proc.queue@example.com",
    )
    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "original-certificate-of-incorporation",
            "filename": "coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert initiate.status_code == 200
    version_id = initiate.json()["versionId"]
    storage_key = initiate.json()["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(storage_key, size=2048, content_type="application/pdf")

    finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200
    assert finalize.json()["document"]["currentVersion"]["status"] == "pending_processing"

    status = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing",
        headers=headers,
    )
    assert status.status_code == 200
    body = status.json()
    assert body["latestRunStatus"] == "queued"
    assert body["attemptNumber"] == 1
    assert body["retryAvailable"] is False

    runs = db_session.scalars(select(DocumentProcessingRun)).all()
    assert len(runs) == 1
    assert runs[0].status == "queued"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_worker_processes_native_pdf_and_exposes_pages(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "proc.native@example.com",
    )
    pdf_path = tmp_path / "coi.pdf"
    _make_simple_pdf(
        pdf_path,
        "Nivara Techfab Private Limited CIN U29309MH2019PTC328517 Certificate of Incorporation",
    )
    pdf_bytes = pdf_path.read_bytes()

    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "original-certificate-of-incorporation",
            "filename": "coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(pdf_bytes),
            "checksumSha256": "c" * 64,
        },
    )
    version_id = initiate.json()["versionId"]
    storage_key = initiate.json()["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(
        storage_key,
        size=len(pdf_bytes),
        content_type="application/pdf",
        data=pdf_bytes,
    )
    finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200

    run = claim_next_run(db_session)
    assert run is not None
    db_session.commit()
    process_run(db_session, run.id)

    status = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing",
        headers=headers,
    )
    assert status.status_code == 200
    status_body = status.json()
    assert status_body["documentStatus"] == "processed"
    assert status_body["latestRunStatus"] == "completed"
    assert status_body["pageCount"] == 1
    assert status_body["extractionMethodCounts"].get("native_text") == 1
    assert status_body["retryAvailable"] is True

    pages_meta = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
    )
    assert pages_meta.status_code == 200
    assert pages_meta.json()["includeContent"] is False
    assert pages_meta.json()["pages"][0]["text"] is None

    pages = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
        params={"include_content": "true"},
    )
    assert pages.status_code == 200
    page_text = pages.json()["pages"][0]["text"]
    assert "Nivara Techfab Private Limited" in page_text
    assert "U29309MH2019PTC328517" in page_text
    assert pages.json()["evidenceReady"] is True
    assert pages.json()["outputSchemaVersion"] == 2

    retry = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/retry",
        headers=headers,
    )
    assert retry.status_code == 200
    assert retry.json()["status"] == "queued"

    history = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/history",
        headers=headers,
    )
    assert history.status_code == 200
    assert len(history.json()["runs"]) == 2
