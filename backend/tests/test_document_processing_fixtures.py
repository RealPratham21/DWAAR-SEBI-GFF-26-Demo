"""Process Nivara synthetic fixtures through the extraction pipeline."""

from __future__ import annotations

from pathlib import Path

import pytest
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.modules.company_incorporation.defaults import SCHEMA_VERSION, empty_payload
from app.modules.company_incorporation.document_processing.constants import ExtractionMethod
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import (
    claim_next_run,
    enqueue_processing_run,
)
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from sqlalchemy import select
from sqlalchemy.orm import Session

from tests.conftest import make_onboarding_application, make_user
from tests.test_company_incorporation_documents import FakeStorage


def _fixture_root() -> Path:
    candidates = [
        Path("/fixtures/nivara-techfab/generated"),
        Path(__file__).resolve().parents[2] / "fixtures" / "nivara-techfab" / "generated",
        Path(__file__).resolve().parents[1].parent / "fixtures" / "nivara-techfab" / "generated",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def _require_fixture(*parts: str) -> Path:
    path = _fixture_root().joinpath(*parts)
    if not path.exists():
        pytest.skip(f"Fixture artifact missing: {path}")
    return path


@pytest.fixture
def storage(monkeypatch: pytest.MonkeyPatch) -> FakeStorage:
    fake = FakeStorage()
    monkeypatch.setattr(
        "app.modules.company_incorporation.document_processing.pipeline.get_object_storage",
        lambda: fake,
    )
    return fake


def _seed_version(
    db: Session,
    storage: FakeStorage,
    *,
    email: str,
    requirement_key: str,
    path: Path,
    content_type: str,
) -> DocumentVersion:
    user = make_user(email=email)
    db.add(user)
    db.flush()
    onboarding = make_onboarding_application(user.id)
    db.add(onboarding)
    db.flush()
    workspace = CompanyIncorporationWorkspace(
        user_id=user.id,
        source_onboarding_application_id=onboarding.id,
        version=1,
        schema_version=SCHEMA_VERSION,
        initialized_from_onboarding=False,
        payload=empty_payload(),
    )
    db.add(workspace)
    db.flush()
    data = path.read_bytes()
    document = Document(
        company_incorporation_workspace_id=workspace.id,
        requirement_key=requirement_key,
        created_by_user_id=user.id,
    )
    db.add(document)
    db.flush()
    version = DocumentVersion(
        document_id=document.id,
        version_number=1,
        original_filename=path.name,
        content_type=content_type,
        size_bytes=len(data),
        checksum_sha256="d" * 64,
        storage_key=f"ci/{workspace.id}/{document.id}/fixture",
        status=DocumentVersionStatus.PENDING_PROCESSING,
        uploaded_by_user_id=user.id,
    )
    db.add(version)
    db.flush()
    storage.put(
        version.storage_key,
        size=len(data),
        content_type=content_type,
        data=data,
    )
    enqueue_processing_run(db, document_version=version)
    db.commit()
    return version


def _process(
    db: Session, version: DocumentVersion
) -> tuple[DocumentProcessingRun, list[DocumentPage]]:
    run = claim_next_run(db)
    assert run is not None
    db.commit()
    process_run(db, run.id)
    db.expire_all()
    refreshed = db.get(DocumentProcessingRun, run.id)
    assert refreshed is not None
    pages = list(
        db.scalars(
            select(DocumentPage)
            .where(DocumentPage.processing_run_id == refreshed.id)
            .order_by(DocumentPage.page_number.asc())
        ).all()
    )
    return refreshed, pages


@pytest.mark.postgres
def test_fixture_clean_coi_native(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture("clean", "01-nivara-certificate-of-incorporation.pdf")
    version = _seed_version(
        db_session,
        storage,
        email="fixture.coi@example.com",
        requirement_key="original-certificate-of-incorporation",
        path=path,
        content_type="application/pdf",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    assert run.output_schema_version == 2
    assert len(pages) == 1
    assert pages[0].extraction_method == ExtractionMethod.NATIVE_TEXT
    assert "Nivara Techfab Private Limited" in pages[0].text
    assert "U29309MH2019PTC328517" in pages[0].text
    assert pages[0].coordinate_metadata.get("coordinate_space") == "normalized_canonical_page"
    assert all("block_id" in block for block in (pages[0].text_blocks or []))


@pytest.mark.postgres
def test_fixture_scanned_coi_ocr(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture(
        "quality-stress",
        "12-nivara-certificate-of-incorporation-scanned.pdf",
    )
    version = _seed_version(
        db_session,
        storage,
        email="fixture.scan@example.com",
        requirement_key="original-certificate-of-incorporation",
        path=path,
        content_type="application/pdf",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    assert len(pages) == 1
    assert pages[0].extraction_method in {
        ExtractionMethod.OCR,
        ExtractionMethod.NATIVE_TEXT_WITH_OCR_FALLBACK,
    }
    combined = pages[0].text.upper()
    assert "NIVARA" in combined or "TECHFAB" in combined
    assert "U29309MH2019PTC328517" in combined.replace(" ", "")
    assert pages[0].average_ocr_confidence is not None


@pytest.mark.postgres
def test_fixture_inc22_native_two_pages(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture("clean", "05-nivara-inc22-registered-office.pdf")
    version = _seed_version(
        db_session,
        storage,
        email="fixture.inc22@example.com",
        requirement_key="current-registered-office-filing",
        path=path,
        content_type="application/pdf",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    assert len(pages) == 2
    text = "\n".join(page.text for page in pages)
    assert "R12345678" in text
    assert "Chakan" in text
    assert "Bhosari" in text
    assert all(page.extraction_method == ExtractionMethod.NATIVE_TEXT for page in pages)


@pytest.mark.postgres
def test_fixture_current_gst_bhosari(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture("clean", "09-nivara-gst-registration-current.pdf")
    version = _seed_version(
        db_session,
        storage,
        email="fixture.gst.current@example.com",
        requirement_key="gst-registration-certificates",
        path=path,
        content_type="application/pdf",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    text = "\n".join(page.text for page in pages)
    assert "27AABCN1234Q1Z9" in text
    assert "Bhosari" in text
    assert "Chakan" not in text


@pytest.mark.postgres
def test_fixture_old_gst_chakan(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture("conflicts", "11-nivara-gst-registration-old-address.pdf")
    version = _seed_version(
        db_session,
        storage,
        email="fixture.gst.old@example.com",
        requirement_key="gst-registration-certificates",
        path=path,
        content_type="application/pdf",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    text = "\n".join(page.text for page in pages)
    assert "27AABCN1234Q1Z9" in text
    assert "Chakan" in text
    assert "Bhosari" not in text


@pytest.mark.postgres
def test_fixture_pan_mobile_photo_ocr(db_session: Session, storage: FakeStorage) -> None:
    path = _require_fixture("quality-stress", "13-nivara-pan-mobile-photo.jpg")
    version = _seed_version(
        db_session,
        storage,
        email="fixture.pan.photo@example.com",
        requirement_key="pan-certificate",
        path=path,
        content_type="image/jpeg",
    )
    run, pages = _process(db_session, version)
    assert run.status == "completed"
    assert len(pages) == 1
    assert pages[0].extraction_method == ExtractionMethod.OCR
    text = pages[0].text.upper()
    assert "AABCN1234Q" in text.replace(" ", "")
    assert "NIVARA" in text or "TECHFAB" in text
    assert pages[0].average_ocr_confidence is not None
    assert pages[0].native_text_length == 0
    assert pages[0].coordinate_metadata.get("coordinate_space") == "normalized_canonical_page"
    assert "deskew_angle" in (pages[0].coordinate_metadata or {})
    assert all("block_id" in block for block in (pages[0].text_blocks or []))
