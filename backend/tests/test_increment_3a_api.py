"""API tests for Increment 3A pipeline/overview summaries and issue detail."""

from __future__ import annotations

from pathlib import Path

import fitz
import pytest
from app.models.fact_issue import FactIssue
from app.models.user_notification import UserNotification
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import claim_next_run
from app.modules.company_incorporation.structured_extraction.pipeline import (
    process_structured_run,
)
from app.modules.company_incorporation.structured_extraction.queue import (
    claim_next_structured_run,
)
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from tests.test_company_incorporation_documents import (
    FakeStorage,
    _register_submit_and_init_workspace,
)


def _make_pdf(path: Path, lines: list[str]) -> None:
    doc = fitz.open()
    page = doc.new_page()
    y = 72
    for line in lines:
        page.insert_text((72, y), line, fontsize=11)
        y += 18
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


async def _upload_coi(
    auth_client: AsyncClient,
    headers: dict[str, str],
    fake_storage: FakeStorage,
    tmp_path: Path,
    *,
    email_tag: str,
) -> str:
    pdf_path = tmp_path / f"{email_tag}.pdf"
    _make_pdf(
        pdf_path,
        [
            "CERTIFICATE OF INCORPORATION",
            "Company Name Nivara Techfab Private Limited",
            "Corporate Identity Number U29309MH2019PTC328517",
            "Date of Incorporation 12 June 2019",
            "Company Class Private",
        ],
    )
    pdf_bytes = pdf_path.read_bytes()
    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "original-certificate-of-incorporation",
            "filename": f"{email_tag}-coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(pdf_bytes),
            "checksumSha256": "a" * 64,
        },
    )
    assert initiate.status_code == 200, initiate.text
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
    assert finalize.status_code == 200, finalize.text
    return version_id


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pipeline_and_overview_empty_workspace(auth_client: AsyncClient) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.empty@example.com",
    )
    pipeline = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents/pipeline-summary",
        headers=headers,
    )
    assert pipeline.status_code == 200, pipeline.text
    body = pipeline.json()
    assert body["documents"] == []
    assert body["aggregation"]["totalCurrentDocuments"] == 0
    assert body["aggregation"]["hasAnyActivePipeline"] is False

    overview = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/overview-summary",
        headers=headers,
    )
    assert overview.status_code == 200, overview.text
    ov = overview.json()
    assert ov["documents"]["status"] == "not_started"
    assert ov["facts"]["status"] == "not_started"
    assert ov["disclosures"]["status"] == "not_assessed"
    assert ov["professionalReview"]["status"] == "not_assessed"
    assert ov["readyForDisclosureGeneration"] is False


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pipeline_summary_uploaded_pending_and_ownership(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    tmp_path: Path,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.pending@example.com",
    )
    version_id = await _upload_coi(
        auth_client,
        headers,
        fake_storage,
        tmp_path,
        email_tag="pending",
    )

    pipeline = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents/pipeline-summary",
        headers=headers,
    )
    assert pipeline.status_code == 200, pipeline.text
    body = pipeline.json()
    assert body["aggregation"]["totalCurrentDocuments"] == 1
    assert len(body["documents"]) == 1
    item = body["documents"][0]
    assert item["documentVersionId"] == version_id
    assert item["requirementKey"] == "original-certificate-of-incorporation"
    assert item["pageProcessing"]["latestAttemptStatus"] in {
        "queued",
        "running",
        None,
    } or item["documentVersionStatus"] in {"uploaded", "processing"}
    assert "storageKey" not in item
    assert "storageKey" not in item["pageProcessing"]

    other = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.other@example.com",
    )
    denied = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents/pipeline-summary",
        headers=other,
    )
    assert denied.status_code == 200
    assert denied.json()["aggregation"]["totalCurrentDocuments"] == 0

    overview_denied = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/overview-summary",
        headers=other,
    )
    assert overview_denied.status_code == 200
    assert overview_denied.json()["documents"]["mandatoryUploaded"] == 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pipeline_overview_after_structured_extraction(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("STRUCTURED_EXTRACTION_ENABLED", "true")
    monkeypatch.setenv("STRUCTURED_EXTRACTION_PROVIDER", "fake")
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()

    headers = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.complete@example.com",
    )
    workspace = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    version = workspace.json()["version"]
    save = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={
            "version": version,
            "data": {
                "legalName": "Nivara Techfab Private Limited",
                "shortName": "Nivara Techfab",
                "cin": "U29309MH2019PTC328517",
                "registrationNumber": "",
                "incorporationDate": "2019-06-12",
                "incorporationCity": "Pune",
                "incorporationState": "Maharashtra",
                "registrarOfCompanies": "Registrar of Companies, Pune",
                "companyClass": "private",
                "companyCategory": "company-limited-by-shares",
                "companySubCategory": "non-government-company",
                "specialCompanyType": "none",
                "companyStatus": "active",
                "listedStatus": "unlisted",
                "commencementDate": "",
                "governingAct": "companies-act-2013",
                "website": "",
                "email": "",
                "telephone": "",
                "issuerContactPersonId": "",
            },
        },
    )
    assert save.status_code == 200, save.text

    version_id = await _upload_coi(
        auth_client,
        headers,
        fake_storage,
        tmp_path,
        email_tag="complete",
    )

    processing = claim_next_run(db_session, settings=settings)
    assert processing is not None
    db_session.commit()
    process_run(db_session, processing.id, settings=settings)

    structured = claim_next_structured_run(db_session, settings=settings)
    assert structured is not None
    db_session.commit()
    process_structured_run(db_session, structured.id, settings=settings)
    db_session.expire_all()

    pipeline = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/documents/pipeline-summary",
        headers=headers,
    )
    assert pipeline.status_code == 200, pipeline.text
    body = pipeline.json()
    assert body["aggregation"]["hasAnyActivePipeline"] is False
    assert body["aggregation"]["totalCurrentDocuments"] == 1
    item = body["documents"][0]
    assert item["documentVersionId"] == version_id
    assert item["pageProcessing"]["evidenceReady"] is True
    assert item["pageProcessing"]["pageCount"] >= 1
    assert item["structuredExtraction"]["latestUsableRunId"] is not None
    assert item["structuredExtraction"]["assertionCount"] >= 1

    overview = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/overview-summary",
        headers=headers,
    )
    assert overview.status_code == 200, overview.text
    ov = overview.json()
    assert ov["readyForDisclosureGeneration"] is False
    assert ov["disclosures"]["status"] == "not_assessed"
    assert ov["professionalReview"]["status"] == "not_assessed"
    assert ov["facts"]["assertionCount"] >= 1
    assert ov["documents"]["mandatoryUploaded"] >= 1

    issues = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/structured-extraction/issues",
        headers=headers,
    )
    assert issues.status_code == 200
    issue_rows = issues.json()["issues"]
    if issue_rows:
        issue_id = issue_rows[0]["id"]
        detail = await auth_client.get(
            f"/api/v1/workstreams/company-incorporation/structured-extraction/issues/{issue_id}",
            headers=headers,
        )
        assert detail.status_code == 200, detail.text
        detail_body = detail.json()
        assert "resolutionHistory" in detail_body
        assert isinstance(detail_body["resolutionHistory"], list)
        assert "linkedAssertions" in detail_body
        for link in detail_body["linkedAssertions"]:
            assert "originalFilename" in link
            assert "versionNumber" in link
            assert "requirementKey" in link
            assert "pageNumbers" in link

        resolve = await auth_client.post(
            f"/api/v1/workstreams/company-incorporation/structured-extraction/issues/{issue_id}/resolve",
            headers=headers,
            json={
                "decision": "keep_information",
                "rationale": "Information tab is authoritative for this demo assertion.",
            },
        )
        if resolve.status_code == 200:
            detail2 = await auth_client.get(
                f"/api/v1/workstreams/company-incorporation/structured-extraction/issues/{issue_id}",
                headers=headers,
            )
            assert detail2.status_code == 200
            history = detail2.json()["resolutionHistory"]
            assert history
            assert history[0]["decision"] == "keep_information"
            assert history[0]["resolverDisplayName"]

    # Notification routes for structured issues use tab=questions / tab=facts
    notifs = list(
        db_session.scalars(
            select(UserNotification).where(UserNotification.target_route.is_not(None))
        ).all()
    )
    structured_routes = [
        row.target_route
        for row in notifs
        if row.target_route and "company-incorporation" in row.target_route
    ]
    for route in structured_routes:
        assert "facts-evidence" not in route
        assert "questions-conflicts" not in route
        if "issueId=" in route:
            assert "tab=questions" in route
        if "assertionId=" in route or "documentVersionId=" in route:
            assert "tab=facts" in route

    get_settings.cache_clear()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_issue_detail_ownership_negative(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("STRUCTURED_EXTRACTION_ENABLED", "true")
    monkeypatch.setenv("STRUCTURED_EXTRACTION_PROVIDER", "fake")
    from app.core.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()

    headers = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.issue.owner@example.com",
    )
    await _upload_coi(
        auth_client,
        headers,
        fake_storage,
        tmp_path,
        email_tag="issue-owner",
    )
    processing = claim_next_run(db_session, settings=settings)
    assert processing is not None
    db_session.commit()
    process_run(db_session, processing.id, settings=settings)
    structured = claim_next_structured_run(db_session, settings=settings)
    assert structured is not None
    db_session.commit()
    process_structured_run(db_session, structured.id, settings=settings)
    db_session.expire_all()

    issue = db_session.scalars(select(FactIssue).limit(1)).first()
    if issue is None:
        get_settings.cache_clear()
        pytest.skip("No issue created for ownership negative case")

    other = await _register_submit_and_init_workspace(
        auth_client,
        "inc3a.issue.other@example.com",
    )
    denied = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/structured-extraction/issues/{issue.id}",
        headers=other,
    )
    assert denied.status_code in {403, 404}
    get_settings.cache_clear()
