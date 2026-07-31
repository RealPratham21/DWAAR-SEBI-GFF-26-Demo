"""Integration checks for document storage against MinIO."""

import hashlib

import httpx
import pytest
from app.core.config import get_settings
from app.storage.s3 import get_object_storage
from httpx import AsyncClient

from tests.test_company_incorporation_documents import _register_submit_and_init_workspace

PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n"
    b"trailer\n<< /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"
)
PDF_SHA256 = hashlib.sha256(PDF_BYTES).hexdigest()


@pytest.fixture
def minio_internal_public_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("S3_PUBLIC_ENDPOINT", "http://minio:9000")
    get_settings.cache_clear()
    get_object_storage.cache_clear()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_real_minio_upload_finalize_and_download(
    auth_client: AsyncClient,
    minio_internal_public_endpoint: None,
) -> None:
    headers = await _register_submit_and_init_workspace(auth_client, "docs.minio@example.com")

    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "pan-certificate",
            "filename": "pan.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(PDF_BYTES),
            "checksumSha256": PDF_SHA256,
        },
    )
    assert initiate.status_code == 200, initiate.text
    body = initiate.json()
    version_id = body["versionId"]

    upload_response = await httpx.AsyncClient().put(
        body["uploadUrl"],
        headers=body["requiredHeaders"],
        content=PDF_BYTES,
    )
    assert upload_response.status_code in {200, 204}, upload_response.text

    finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200, finalize.text
    assert finalize.json()["document"]["currentVersion"]["status"] == "uploaded"

    listed = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents",
        headers=headers,
    )
    assert listed.status_code == 200
    pan_docs = next(
        requirement
        for group in listed.json()["groups"]
        if group["id"] == "core-registration-documents"
        for requirement in group["requirements"]
        if requirement["key"] == "pan-certificate"
    )
    assert len(pan_docs["documents"]) == 1

    download = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/download-url",
        headers=headers,
    )
    assert download.status_code == 200
    file_response = await httpx.AsyncClient().get(download.json()["downloadUrl"])
    assert file_response.status_code == 200
    assert file_response.content == PDF_BYTES
