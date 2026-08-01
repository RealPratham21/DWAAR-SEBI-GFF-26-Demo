"""Postgres integration for structured extraction with fake provider."""

from __future__ import annotations

from pathlib import Path

import fitz
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.fact_assertion import FactAssertion
from app.models.fact_issue import FactIssue
from app.models.structured_extraction_run import StructuredExtractionRun
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import claim_next_run
from app.modules.company_incorporation.structured_extraction.pipeline import (
    process_structured_run,
)
from app.modules.company_incorporation.structured_extraction.queue import (
    claim_next_structured_run,
)
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


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_page_processing_enqueues_and_structured_extracts(
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
    assert settings.structured_extraction_enabled is True

    headers = await _register_submit_and_init_workspace(
        auth_client,
        "structured.coi@example.com",
    )
    # Seed information tab with Nivara identity for comparison match.
    workspace = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert workspace.status_code == 200
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
    assert save.status_code == 200

    pdf_path = tmp_path / "coi.pdf"
    _make_pdf(
        pdf_path,
        [
            "CERTIFICATE OF INCORPORATION",
            "Company Name Nivara Techfab Private Limited",
            "Corporate Identity Number U29309MH2019PTC328517",
            "Date of Incorporation 12 June 2019",
            "State of Maharashtra",
            "Registrar of Companies, Pune",
            "Company Class Private",
            "Category Company limited by shares",
            "Governing Act Companies Act 2013",
        ],
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
            "checksumSha256": "a" * 64,
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

    processing = claim_next_run(db_session, settings=settings)
    assert processing is not None
    db_session.commit()
    process_run(db_session, processing.id, settings=settings)

    structured = claim_next_structured_run(db_session, settings=settings)
    assert structured is not None
    db_session.commit()
    process_structured_run(db_session, structured.id, settings=settings)
    db_session.expire_all()

    run = db_session.get(StructuredExtractionRun, structured.id)
    assert run is not None
    assert run.status in {"completed", "completed_with_warnings"}
    assertions = list(
        db_session.scalars(
            select(FactAssertion).where(
                FactAssertion.structured_extraction_run_id == run.id
            )
        )
    )
    assert assertions
    keys = {item.fact_key for item in assertions}
    assert "identity.cin" in keys

    status = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/structured-extraction/versions/{version_id}/status",
        headers=headers,
    )
    assert status.status_code == 200
    body = status.json()
    assert body["usable"] is True
    assert body["latestRunStatus"] in {"completed", "completed_with_warnings"}
    assert body["assertionCount"] >= 1

    facts = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/structured-extraction/facts",
        headers=headers,
    )
    assert facts.status_code == 200
    assert facts.json()["groups"]

    # Ownership negative
    other = await _register_submit_and_init_workspace(
        auth_client,
        "structured.other@example.com",
    )
    denied = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/structured-extraction/versions/{version_id}/status",
        headers=other,
    )
    assert denied.status_code in {403, 404}

    get_settings.cache_clear()
