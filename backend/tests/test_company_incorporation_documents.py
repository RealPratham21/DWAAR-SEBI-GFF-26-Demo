import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

SHA256_PLACEHOLDER = "a" * 64


class FakeStorage:
    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}

    def put(self, key: str, *, size: int, content_type: str, data: bytes | None = None) -> None:
        self.objects[key] = {
            "content_length": size,
            "content_type": content_type,
            "data": data if data is not None else b"x" * size,
        }

    def generate_upload_url(self, *, storage_key: str, content_type: str, content_length: int):
        return (
            f"http://storage.test/upload/{storage_key}",
            {"Content-Type": content_type, "Content-Length": str(content_length)},
            900,
        )

    def generate_download_url(self, *, storage_key: str):
        return f"http://storage.test/download/{storage_key}", 900

    def object_exists(self, *, storage_key: str) -> bool:
        return storage_key in self.objects

    def get_object_metadata(self, *, storage_key: str) -> dict:
        if storage_key not in self.objects:
            raise Exception("not found")
        obj = self.objects[storage_key]
        return {
            "content_length": obj["content_length"],
            "content_type": obj["content_type"],
        }

    def delete_object(self, *, storage_key: str) -> None:
        self.objects.pop(storage_key, None)

    def download_object(self, *, storage_key: str, destination) -> None:
        if storage_key not in self.objects:
            raise Exception("not found")
        destination.write_bytes(self.objects[storage_key]["data"])

    def get_object_bytes(self, *, storage_key: str) -> bytes:
        if storage_key not in self.objects:
            raise Exception("not found")
        return self.objects[storage_key]["data"]


@pytest.fixture
def fake_storage(monkeypatch: pytest.MonkeyPatch) -> FakeStorage:
    storage = FakeStorage()
    monkeypatch.setattr(
        "app.modules.company_incorporation.documents.service.get_object_storage",
        lambda: storage,
    )
    return storage


async def _register_submit_and_init_workspace(
    auth_client: AsyncClient, email: str
) -> dict[str, str]:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email=email),
    )
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    onboarding_id = created.json()["id"]

    for route_suffix, _step, payload in _full_onboarding_steps():
        response = await auth_client.patch(
            f"/api/v1/onboarding/sme/{onboarding_id}/{route_suffix}",
            headers=headers,
            json=payload,
        )
        assert response.status_code == 200, response.text

    submit = await auth_client.post(
        f"/api/v1/onboarding/sme/{onboarding_id}/submit",
        headers=headers,
        json={
            "submissionConfirmations": {
                "confirmAccuracy": True,
                "confirmAuthorised": True,
                "confirmVerification": True,
                "agreeTerms": True,
            },
        },
    )
    assert submit.status_code == 200

    workspace = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert workspace.status_code == 200
    return headers


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_list_documents_returns_requirements(auth_client: AsyncClient) -> None:
    headers = await _register_submit_and_init_workspace(auth_client, "docs.list@example.com")

    response = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["storageSummary"]["connected"] is True
    assert len(body["groups"]) == 5
    pan_requirement = next(
        group for group in body["groups"] if group["id"] == "core-registration-documents"
    )
    pan = next(item for item in pan_requirement["requirements"] if item["key"] == "pan-certificate")
    assert pan["allowMultiple"] is False
    assert pan["documents"] == []


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_upload_finalize_replace_and_history(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
) -> None:
    headers = await _register_submit_and_init_workspace(auth_client, "docs.upload@example.com")

    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "pan-certificate",
            "filename": "pan.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
            "checksumSha256": SHA256_PLACEHOLDER,
        },
    )
    assert initiate.status_code == 200, initiate.text
    init_body = initiate.json()
    document_id = init_body["documentId"]
    version_id = init_body["versionId"]
    assert init_body["uploadUrl"].startswith("http://storage.test/upload/")

    finalize_before_upload = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize_before_upload.status_code == 422

    storage_key = init_body["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(storage_key, size=1024, content_type="application/pdf")

    finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200, finalize.text
    final_body = finalize.json()
    assert final_body["document"]["currentVersion"]["status"] == "pending_processing"
    assert final_body["notification"]["notificationType"] == "workstream_document"

    duplicate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "pan-certificate",
            "filename": "pan-duplicate.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
            "checksumSha256": "b" * 64,
        },
    )
    assert duplicate.status_code == 409

    replace_init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "pan-certificate",
            "filename": "pan-v2.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
            "checksumSha256": "b" * 64,
            "documentId": document_id,
        },
    )
    assert replace_init.status_code == 200
    replace_version_id = replace_init.json()["versionId"]
    replace_key = replace_init.json()["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(replace_key, size=2048, content_type="application/pdf")

    replace_finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{replace_version_id}/finalize",
        headers=headers,
    )
    assert replace_finalize.status_code == 200
    assert replace_finalize.json()["document"]["currentVersion"]["versionNumber"] == 2

    history = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/{document_id}/versions",
        headers=headers,
    )
    assert history.status_code == 200
    versions = history.json()["versions"]
    assert len(versions) == 2
    assert versions[0]["versionNumber"] == 2
    assert versions[0]["isCurrent"] is True
    assert versions[1]["isCurrent"] is False

    download = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{replace_version_id}/download-url",
        headers=headers,
    )
    assert download.status_code == 200
    assert download.json()["downloadUrl"].startswith("http://storage.test/download/")


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unauthorized_user_cannot_access_documents(auth_client: AsyncClient) -> None:
    owner_headers = await _register_submit_and_init_workspace(auth_client, "docs.owner@example.com")

    other = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="docs.other@example.com"),
    )
    other_headers = {"Authorization": f"Bearer {other.json()['accessToken']}"}

    owner_list = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents",
        headers=owner_headers,
    )
    assert owner_list.status_code == 200

    other_list = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents",
        headers=other_headers,
    )
    assert other_list.status_code == 404
