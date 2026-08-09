"""G3 DRHP PDF/DOCX export tests."""

from __future__ import annotations

import io
import json
import uuid
import zipfile
from pathlib import Path
from unittest.mock import patch

import fitz
import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpChapterVersion, DrhpDocument, DrhpDocumentVersion
from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_TITLES,
    ChapterVersionStatus,
    DocumentVersionStatus,
)
from app.modules.drhp.export.content import cell_text, normalize_block
from app.modules.drhp.export.document import assemble_export_document
from app.modules.drhp.export.docx_renderer import render_docx
from app.modules.drhp.export.filenames import build_export_filename
from app.modules.drhp.export.pdf_renderer import render_pdf
from app.modules.drhp.export.service import build_export_document_for_version
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.orchestrator import run_document_generation
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.hashing import compute_source_hash
from app.modules.drhp.service import start_drhp_generation
from app.modules.drhp.workstreams import WORKSPACE_MODELS, WorkstreamSnapshot
from tests.conftest import make_user, register_payload
from tests.test_drhp_generation_foundation import _nivara_snapshots


class _Row:
    def __init__(self, **kwargs: object) -> None:
        for key, value in kwargs.items():
            setattr(self, key, value)


def _sample_chapter_ast() -> DrhpChapterAST:
    return DrhpChapterAST(
        chapter_key="capital-structure-ownership",
        title=CHAPTER_TITLES["capital-structure-ownership"],
        order=6,
        sections=[
            DrhpSectionAST(
                section_key="capital",
                heading="Capital Structure",
                order=1,
                blocks=[
                    DrhpBlockAST(
                        block_id="blk-1",
                        kind="paragraph",
                        order=1,
                        content={"text": "Nivara Techfab Limited has authorised share capital of 80,000,000 equity shares."},
                    ),
                    DrhpBlockAST(
                        block_id="blk-2",
                        kind="table",
                        order=2,
                        content={
                            "headers": ["Particulars", "Number of shares"],
                            "rows": [["Paid-up capital", "45000000"]],
                            "caption": "Share capital of our Company",
                        },
                    ),
                    DrhpBlockAST(
                        block_id="blk-3",
                        kind="placeholder",
                        order=3,
                        content={"text": "[●]"},
                    ),
                ],
            )
        ],
    )


def test_cell_text_never_emits_raw_json() -> None:
    assert cell_text({"name": "Nivara Techfab Limited", "refId": "src:abc"}) == "Nivara Techfab Limited"
    assert "{" not in cell_text({"nested": {"a": 1}})
    assert cell_text([{"amount": "₹100"}]) == "₹100"


def test_normalize_block_strips_internal_ids_from_visible_text() -> None:
    block = DrhpBlockAST(
        block_id="blk-x",
        kind="paragraph",
        order=1,
        content={"text": "Value src:deadbeef unsupported_number:123"},
    )
    normalized = normalize_block(block)
    assert "src:" not in normalized.content["text"]
    assert "unsupported_number" not in normalized.content["text"]


def test_assemble_export_document_orders_eighteen_chapters() -> None:
    rows = {
        "cover-page-front-matter": _Row(
            status=ChapterVersionStatus.GENERATED,
            ast_payload=_sample_chapter_ast().model_dump(by_alias=True, mode="json"),
            error_message=None,
        )
    }
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=True,
        chapter_rows_by_key=rows,
    )
    assert len(document.chapters) == 18
    assert document.chapters[0].chapter_key == "cover-page-front-matter"
    assert document.chapters[1].available is False
    assert "unavailable" in (document.chapters[1].unavailable_reason or "").lower()


def test_pdf_and_docx_render_from_same_assembly() -> None:
    ast = _sample_chapter_ast()
    rows = {
        key: _Row(
            status=ChapterVersionStatus.GENERATED if key == "capital-structure-ownership" else ChapterVersionStatus.FAILED,
            ast_payload=ast.model_dump(by_alias=True, mode="json") if key == "capital-structure-ownership" else None,
            error_message="Generation error" if key != "capital-structure-ownership" else None,
        )
        for key in ALL_CHAPTER_KEYS
    }
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=True,
        chapter_rows_by_key=rows,
    )
    pdf_bytes = render_pdf(document)
    docx_bytes = render_docx(document)

    assert pdf_bytes.startswith(b"%PDF")
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    assert pdf.page_count >= 3
    pdf_text = "".join(page.get_text() for page in pdf)
    assert "TABLE OF CONTENTS" in pdf_text
    assert "Capital Structure" in pdf_text
    assert "45000000" in pdf_text or "4,50,00,000" in pdf_text or "45,000,000" in pdf_text
    assert "src:" not in pdf_text
    assert "unsupported_number" not in pdf_text
    assert "could not be generated in this draft" in pdf_text.lower()

    assert docx_bytes[:2] == b"PK"
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        xml = archive.read("word/document.xml").decode("utf-8")
    assert "Capital Structure" in xml
    assert "TABLE OF CONTENTS" in xml
    assert "[●]" in xml or "45000000" in xml
    assert "src:" not in xml


def test_build_export_filename_sanitizes_issuer() -> None:
    document = assemble_export_document(
        version_number=2,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key={},
    )
    document.issuer_name = "Nivara Techfab Limited"
    assert build_export_filename(document, extension="pdf") == "Nivara_Techfab_Limited_DRHP_v2.pdf"


@pytest.mark.postgres
async def test_export_api_requires_ownership(auth_client: AsyncClient, db_session: Session) -> None:
    from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot

    owner = make_user(email="export-owner@example.com")
    db_session.add(owner)
    db_session.flush()

    snapshot = DrhpGenerationSnapshot(
        user_id=owner.id,
        registry_version="test",
        rules_version="test",
        prompt_version="test",
        workstream_snapshots={},
        chapter_readiness={},
        global_context={},
    )
    db_session.add(snapshot)
    db_session.flush()

    drhp_doc = DrhpDocument(user_id=owner.id)
    db_session.add(drhp_doc)
    db_session.flush()

    doc_version = DrhpDocumentVersion(
        document_id=drhp_doc.id,
        user_id=owner.id,
        version_number=1,
        generation_snapshot_id=snapshot.id,
        status=DocumentVersionStatus.GENERATED,
        completed_chapters=1,
        total_chapters=18,
    )
    db_session.add(doc_version)
    db_session.flush()
    db_session.add(
        DrhpChapterVersion(
            document_version_id=doc_version.id,
            chapter_key="cover-page-front-matter",
            status=ChapterVersionStatus.GENERATED,
            ast_payload=_sample_chapter_ast().model_dump(by_alias=True, mode="json"),
        )
    )
    db_session.commit()

    register = await auth_client.post("/api/v1/auth/register", json=register_payload(email="export-other@example.com"))
    assert register.status_code == 200
    headers = {"Authorization": f"Bearer {register.json()['accessToken']}"}

    denied = await auth_client.get(
        f"/api/v1/drhp/documents/{doc_version.id}/export/pdf",
        headers=headers,
    )
    assert denied.status_code == 403


@pytest.mark.postgres
async def test_export_api_returns_pdf_and_docx(auth_client: AsyncClient, db_session: Session) -> None:
    from app.core.config import clear_settings_cache
    from app.models.user import User

    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="export-api@example.com"),
    )
    assert register.status_code == 200
    headers = {"Authorization": f"Bearer {register.json()['accessToken']}"}
    me = await auth_client.get("/api/v1/auth/me", headers=headers)
    user_id = uuid.UUID(me.json()["user"]["id"])
    user = db_session.get(User, user_id)
    assert user is not None

    payloads = json.loads(
        (Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json").read_text(
            encoding="utf-8"
        )
    )
    for slug, model in WORKSPACE_MODELS.items():
        db_session.add(
            model(
                user_id=user_id,
                payload=payloads.get(slug) or {},
                version=1,
                schema_version=1,
                payload_hash=compute_source_hash({"slug": slug, "payload": payloads.get(slug) or {}}),
            )
        )
    db_session.commit()

    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("DRHP_USE_FAKE_COHERE", "true")
    clear_settings_cache()

    response = start_drhp_generation(db_session, user, create_snapshot=True)
    db_session.commit()
    run_document_generation(db_session, response.document_version_id)
    db_session.commit()

    with patch("app.modules.drhp.cohere.provider.CohereDrhpGenerationProvider.generate_chapter_narrative") as mock_cohere:
        pdf_response = await auth_client.get(
            f"/api/v1/drhp/documents/{response.document_version_id}/export/pdf",
            headers=headers,
        )
        docx_response = await auth_client.get(
            f"/api/v1/drhp/documents/{response.document_version_id}/export/docx",
            headers=headers,
        )
    mock_cohere.assert_not_called()

    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"].startswith("application/pdf")
    assert pdf_response.content.startswith(b"%PDF")

    assert docx_response.status_code == 200
    assert "wordprocessingml.document" in docx_response.headers["content-type"]
    assert docx_response.content[:2] == b"PK"

    pdf = fitz.open(stream=pdf_response.content, filetype="pdf")
    pdf_text = "".join(page.get_text() for page in pdf)
    for title in [
        "Cover Page & Front Matter",
        "Capital Structure & Ownership",
        "Risk Factors",
        "Business & Operations",
    ]:
        assert title in pdf_text

    monkeypatch.undo()


@pytest.mark.postgres
def test_build_export_document_for_version_uses_persisted_ast_only(db_session: Session) -> None:
    from app.core.config import clear_settings_cache
    from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot

    user = make_user(email="export-service@example.com")
    db_session.add(user)
    db_session.flush()

    snapshot = DrhpGenerationSnapshot(
        user_id=user.id,
        registry_version="test",
        rules_version="test",
        prompt_version="test",
        workstream_snapshots={},
        chapter_readiness={},
        global_context={},
    )
    db_session.add(snapshot)
    db_session.flush()

    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "cover-page-front-matter", snapshots)
    cover_ast = build_deterministic_chapter_ast("cover-page-front-matter", bundle, snapshots)

    drhp_doc = DrhpDocument(user_id=user.id)
    db_session.add(drhp_doc)
    db_session.flush()

    doc_version = DrhpDocumentVersion(
        document_id=drhp_doc.id,
        user_id=user.id,
        version_number=1,
        generation_snapshot_id=snapshot.id,
        status=DocumentVersionStatus.GENERATED,
        completed_chapters=1,
        total_chapters=18,
    )
    db_session.add(doc_version)
    db_session.flush()
    db_session.add(
        DrhpChapterVersion(
            document_version_id=doc_version.id,
            chapter_key="cover-page-front-matter",
            status=ChapterVersionStatus.GENERATED,
            ast_payload=cover_ast.model_dump(by_alias=True, mode="json"),
        )
    )
    db_session.commit()

    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("DRHP_USE_FAKE_COHERE", "true")
    clear_settings_cache()

    with patch("app.modules.drhp.bundles.builders.build_chapter_source_bundle") as mock_bundle:
        document = build_export_document_for_version(db_session, user, doc_version.id)
    mock_bundle.assert_not_called()
    assert document.chapters[0].available is True
    assert document.chapters[0].chapter_ast is not None
    monkeypatch.undo()
