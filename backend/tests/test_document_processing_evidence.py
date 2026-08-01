"""Increment 2A.1: evidence-ready page extraction hardening."""

from __future__ import annotations

import uuid
from pathlib import Path

import fitz
import pytest
from httpx import AsyncClient
from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.user_notification import UserNotification
from app.modules.company_incorporation.defaults import SCHEMA_VERSION, empty_payload
from app.modules.company_incorporation.document_processing.blocks import (
    validate_schema_v2_blocks,
)
from app.modules.company_incorporation.document_processing.coordinates import (
    BBox,
    ImageTransformMetadata,
    native_pdf_bbox_to_canonical,
    ocr_pixel_bbox_to_canonical,
    validate_normalized_bbox,
)
from app.modules.company_incorporation.document_processing.extractor import extract_document
from app.modules.company_incorporation.document_processing.pipeline import process_run
from app.modules.company_incorporation.document_processing.queue import (
    cancel_active_runs_for_version,
    claim_next_run,
    enqueue_processing_run,
)
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from tests.conftest import make_onboarding_application, make_user
from tests.test_company_incorporation_documents import (
    FakeStorage,
    _register_submit_and_init_workspace,
)


def _make_pdf(path: Path, text: str, *, rotation: int = 0) -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 120), text, fontsize=14)
    if rotation:
        page.set_rotation(rotation)
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


def test_native_pdf_coordinates_normalize_and_rotate() -> None:
    page_w, page_h = 595.0, 842.0
    source = BBox(72.0, 120.0, 300.0, 140.0)
    canonical = native_pdf_bbox_to_canonical(
        source,
        page_width=page_w,
        page_height=page_h,
        rotation=0,
    )
    assert validate_normalized_bbox(canonical.as_dict())
    assert canonical.x0 == pytest.approx(72.0 / page_w, rel=1e-6)

    rotated = native_pdf_bbox_to_canonical(
        source,
        page_width=page_w,
        page_height=page_h,
        rotation=90,
    )
    assert validate_normalized_bbox(rotated.as_dict())
    # After CW 90, upright width becomes page_h.
    assert rotated.x0 == pytest.approx((page_h - 140.0) / page_h, rel=1e-5)


def test_ocr_coordinates_normalize_with_deskew_metadata() -> None:
    transform = ImageTransformMetadata(
        source_width=595.0,
        source_height=842.0,
        source_coordinate_space="ocr_image_pixels",
        render_dpi=200.0,
        render_scale=200 / 72,
        rendered_width=1650.0,
        rendered_height=2339.0,
        deskew_angle=2.5,
        osd_rotation=0,
        pre_osd_width=1650.0,
        pre_osd_height=2339.0,
        processed_width=1650.0,
        processed_height=2339.0,
    )
    source = BBox(100.0, 200.0, 400.0, 240.0)
    canonical = ocr_pixel_bbox_to_canonical(source, transform=transform)
    assert validate_normalized_bbox(canonical.as_dict())
    metadata = transform.to_coordinate_metadata()
    assert metadata["deskew_angle"] == 2.5
    assert metadata["coordinate_space"] == "normalized_canonical_page"


def test_extract_document_persists_schema_v2_block_contract(tmp_path: Path) -> None:
    pdf_path = tmp_path / "native.pdf"
    rich = (
        "GOVERNMENT OF INDIA MINISTRY OF CORPORATE AFFAIRS "
        "Certificate of Incorporation "
        "Corporate Identity Number U29309MH2019PTC328517 "
        "Nivara Techfab Private Limited is hereby incorporated "
        "under the Companies Act 2013 as a private limited company "
        "with effect from the fourteenth day of June two thousand nineteen."
    )
    _make_pdf(pdf_path, rich)
    pages = extract_document(pdf_path, content_type="application/pdf")
    assert len(pages) == 1
    assert pages[0].extraction_method == "native_text"
    blocks = pages[0].text_blocks
    assert validate_schema_v2_blocks(blocks)
    assert pages[0].coordinate_metadata["coordinate_space"] == "normalized_canonical_page"
    for block in blocks:
        assert block["source_coordinate_space"] == "pdf_points"
        assert validate_normalized_bbox(block["bbox"])
        # Source units remain in PDF points (not normalized).
        assert block["source_bbox"]["x1"] > 1.0 or block["source_bbox"]["y1"] > 1.0


def test_extract_image_ocr_schema_v2(tmp_path: Path) -> None:
    pytesseract = pytest.importorskip("pytesseract")
    try:
        pytesseract.get_tesseract_version()
    except Exception:  # noqa: BLE001
        pytest.skip("Tesseract not available")

    path = tmp_path / "pan.png"
    image = Image.new("RGB", (800, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.text((40, 80), "Permanent Account Number AABCN1234Q", fill=(0, 0, 0))
    draw.text((40, 140), "Nivara Techfab Private Limited", fill=(0, 0, 0))
    image.save(path)
    pages = extract_document(path, content_type="image/png")
    assert len(pages) == 1
    assert pages[0].extraction_method == "ocr"
    assert validate_schema_v2_blocks(pages[0].text_blocks)
    assert pages[0].coordinate_metadata.get("coordinate_space") == "normalized_canonical_page"
    assert "deskew_angle" in pages[0].coordinate_metadata
    for block in pages[0].text_blocks:
        assert block["source_coordinate_space"] == "ocr_image_pixels"
        assert validate_normalized_bbox(block["bbox"])


@pytest.mark.postgres
def test_page_cannot_reference_run_from_other_version(
    db_session: Session,
) -> None:
    user = make_user(email="fk.integrity@example.com")
    db_session.add(user)
    db_session.flush()
    onboarding = make_onboarding_application(user.id)
    db_session.add(onboarding)
    db_session.flush()
    workspace = CompanyIncorporationWorkspace(
        user_id=user.id,
        source_onboarding_application_id=onboarding.id,
        version=1,
        schema_version=SCHEMA_VERSION,
        initialized_from_onboarding=False,
        payload=empty_payload(),
    )
    db_session.add(workspace)
    db_session.flush()

    def _version(number: int) -> DocumentVersion:
        document = Document(
            company_incorporation_workspace_id=workspace.id,
            requirement_key="original-certificate-of-incorporation",
            created_by_user_id=user.id,
        )
        db_session.add(document)
        db_session.flush()
        version = DocumentVersion(
            document_id=document.id,
            version_number=number,
            original_filename=f"v{number}.pdf",
            content_type="application/pdf",
            size_bytes=100,
            checksum_sha256="a" * 64,
            storage_key=f"ci/{workspace.id}/{document.id}/v{number}",
            status=DocumentVersionStatus.PENDING_PROCESSING,
            uploaded_by_user_id=user.id,
        )
        db_session.add(version)
        db_session.flush()
        return version

    version_a = _version(1)
    version_b = _version(1)
    run_a = enqueue_processing_run(db_session, document_version=version_a)
    db_session.flush()

    db_session.add(
        DocumentPage(
            processing_run_id=run_a.id,
            document_version_id=version_b.id,
            page_number=1,
            extraction_method="native_text",
            text="mismatch",
            text_blocks=[],
            coordinate_metadata={},
        )
    )
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_archive_cancels_active_runs_without_failure_notification(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "archive.cancel@example.com",
    )
    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "original-certificate-of-incorporation",
            "filename": "coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
            "checksumSha256": "b" * 64,
        },
    )
    version_id = initiate.json()["versionId"]
    document_id = initiate.json()["documentId"]
    storage_key = initiate.json()["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(storage_key, size=2048, content_type="application/pdf")
    finalize = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    assert finalize.status_code == 200

    archive = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/{document_id}/archive",
        headers=headers,
    )
    assert archive.status_code == 200

    runs = list(db_session.scalars(select(DocumentProcessingRun)).all())
    assert len(runs) == 1
    assert runs[0].status == "cancelled"
    assert runs[0].error_code == "DOCUMENT_PROCESSING_CANCELLED"
    assert "archived" in (runs[0].error_message or "").lower()

    notifications = list(db_session.scalars(select(UserNotification)).all())
    titles = " ".join(item.title for item in notifications).lower()
    assert "could not be processed" not in titles
    assert "processed successfully" not in titles


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_worker_aborts_when_cancelled_before_completion(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "cancel.midway@example.com",
    )
    pdf_path = tmp_path / "multi.pdf"
    doc = fitz.open()
    for index in range(2):
        page = doc.new_page()
        page.insert_text((72, 72), f"Page {index + 1} Nivara Techfab", fontsize=12)
    doc.save(pdf_path)
    doc.close()
    pdf_bytes = pdf_path.read_bytes()

    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "current-registered-office-filing",
            "filename": "multi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(pdf_bytes),
            "checksumSha256": "c" * 64,
        },
    )
    version_id = uuid.UUID(initiate.json()["versionId"])
    storage_key = initiate.json()["uploadUrl"].split("/upload/", 1)[1]
    fake_storage.put(
        storage_key,
        size=len(pdf_bytes),
        content_type="application/pdf",
        data=pdf_bytes,
    )
    await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )

    run = claim_next_run(db_session)
    assert run is not None
    db_session.commit()

    original_extract = (
        "app.modules.company_incorporation.document_processing.pipeline.extract_document"
    )
    from app.modules.company_incorporation.document_processing import extractor as extractor_mod

    real_extract = extractor_mod.extract_document

    def _extract_and_cancel(*args, **kwargs):
        pages = real_extract(*args, **kwargs)
        cancel_active_runs_for_version(
            db_session,
            document_version_id=version_id,
            reason="Cancelled in test after extraction.",
        )
        db_session.commit()
        return pages

    monkeypatch.setattr(original_extract, _extract_and_cancel)

    process_run(db_session, run.id)
    db_session.expire_all()
    refreshed = db_session.get(DocumentProcessingRun, run.id)
    assert refreshed is not None
    assert refreshed.status == "cancelled"
    version = db_session.get(DocumentVersion, version_id)
    assert version is not None
    assert version.status != DocumentVersionStatus.PROCESSED

    notifications = list(db_session.scalars(select(UserNotification)).all())
    titles = " ".join(item.title for item in notifications).lower()
    assert "processed successfully" not in titles
    assert "could not be processed" not in titles


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pages_api_defaults_to_metadata_and_preserves_block_ids(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "pages.meta@example.com",
    )
    pdf_path = tmp_path / "coi.pdf"
    _make_pdf(pdf_path, "Nivara Techfab Private Limited CIN U29309MH2019PTC328517")
    pdf_bytes = pdf_path.read_bytes()
    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "original-certificate-of-incorporation",
            "filename": "coi.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(pdf_bytes),
            "checksumSha256": "d" * 64,
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
    await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    run = claim_next_run(db_session)
    assert run is not None
    db_session.commit()
    process_run(db_session, run.id)

    meta = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
    )
    assert meta.status_code == 200
    meta_body = meta.json()
    assert meta_body["includeContent"] is False
    assert meta_body["evidenceReady"] is True
    assert meta_body["outputSchemaVersion"] == 2
    assert meta_body["pages"][0]["text"] is None
    assert meta_body["pages"][0]["textBlocks"] is None
    assert meta_body["pages"][0]["blockCount"] >= 1
    assert "storageKey" not in meta_body["pages"][0]

    full = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
        params={"include_content": "true"},
    )
    assert full.status_code == 200
    blocks = full.json()["pages"][0]["textBlocks"]
    assert validate_schema_v2_blocks(
        [
            {
                "block_id": block["blockId"],
                "order_index": block["orderIndex"],
                "type": block["type"],
                "text": block["text"],
                "bbox": block["bbox"],
                "source_bbox": block["sourceBbox"],
                "source_coordinate_space": block["sourceCoordinateSpace"],
                "confidence": block.get("confidence"),
            }
            for block in blocks
        ]
    )
    first_ids = [block["blockId"] for block in blocks]

    again = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
        params={"include_content": "true"},
    )
    again_ids = [block["blockId"] for block in again.json()["pages"][0]["textBlocks"]]
    assert again_ids == first_ids

    status = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing",
        headers=headers,
    )
    assert status.json()["evidenceReady"] is True
    assert status.json()["processorVersion"]
    assert status.json()["outputSchemaVersion"] == 2

    # Ownership negative
    other = await _register_submit_and_init_workspace(
        auth_client,
        "pages.other@example.com",
    )
    denied = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=other,
    )
    assert denied.status_code in {403, 404}


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_schema_v1_not_evidence_ready_retry_produces_v2(
    auth_client: AsyncClient,
    fake_storage: FakeStorage,
    db_session: Session,
    tmp_path: Path,
) -> None:
    headers = await _register_submit_and_init_workspace(
        auth_client,
        "schema.v1@example.com",
    )
    pdf_path = tmp_path / "legacy.pdf"
    _make_pdf(pdf_path, "Legacy schema run Nivara")
    pdf_bytes = pdf_path.read_bytes()
    initiate = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json={
            "requirementKey": "pan-certificate",
            "filename": "legacy.pdf",
            "contentType": "application/pdf",
            "sizeBytes": len(pdf_bytes),
            "checksumSha256": "e" * 64,
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
    await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    run = claim_next_run(db_session)
    assert run is not None
    # Simulate historical schema v1 completed run.
    run.output_schema_version = 1
    db_session.commit()
    process_run(db_session, run.id)
    db_session.expire_all()
    # Force schema version back to 1 after processing (worker sets current schema).
    completed = db_session.get(DocumentProcessingRun, run.id)
    assert completed is not None
    completed.output_schema_version = 1
    for page in db_session.scalars(
        select(DocumentPage).where(DocumentPage.processing_run_id == run.id)
    ):
        # Legacy-shaped blocks without ids.
        page.text_blocks = [
            {"type": "line", "text": "legacy", "bbox": {"x0": 1, "y0": 2, "x1": 3, "y1": 4}}
        ]
        page.coordinate_metadata = {}
    db_session.commit()

    status = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing",
        headers=headers,
    )
    assert status.json()["evidenceReady"] is False
    assert status.json()["outputSchemaVersion"] == 1

    retry = await auth_client.post(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/retry",
        headers=headers,
    )
    assert retry.status_code == 200
    assert retry.json()["outputSchemaVersion"] == 2

    run2 = claim_next_run(db_session)
    assert run2 is not None
    db_session.commit()
    process_run(db_session, run2.id)

    status2 = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing",
        headers=headers,
    )
    body = status2.json()
    assert body["evidenceReady"] is True
    assert body["outputSchemaVersion"] == 2

    # Historical run preserved.
    history = await auth_client.get(
        f"/api/v1/workstreams/company-incorporation/documents/versions/{version_id}/processing/history",
        headers=headers,
    )
    runs = history.json()["runs"]
    assert len(runs) == 2
    assert any(item["outputSchemaVersion"] == 1 and item["evidenceReady"] is False for item in runs)
