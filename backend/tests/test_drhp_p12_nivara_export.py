"""DRHP-P1.2 Nivara end-to-end export regression tests."""

from __future__ import annotations

import re

import fitz
import pytest

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_GENERATION_MODES,
    CHAPTER_TITLES,
    ChapterVersionStatus,
)
from app.modules.drhp.export.content import cell_text, coalesce_list_blocks, normalize_block, normalize_chapter_ast
from app.modules.drhp.export.document import COVER_CHAPTER_KEY, assemble_export_document
from app.modules.drhp.export.fonts import EXPORT_BODY_FONT, register_export_fonts
from app.modules.drhp.export.formatters import format_drhp_value
from app.modules.drhp.export.pdf_renderer import DRHPPdfRenderer, render_pdf
from app.modules.drhp.export.service import build_export_document_for_version
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.orchestrator import _build_chapter_ast
from app.modules.drhp.cohere.provider import FakeDrhpGenerationProvider
from tests.test_drhp_generation_foundation import _nivara_snapshots


class _Row:
    def __init__(self, **kwargs: object) -> None:
        for key, value in kwargs.items():
            setattr(self, key, value)


def _build_nivara_chapter_rows() -> dict[str, _Row]:
    snapshots = _nivara_snapshots()
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    rows: dict[str, _Row] = {}
    chapter_rows: dict[str, object] = {}

    for chapter_key in ALL_CHAPTER_KEYS:
        mode = CHAPTER_GENERATION_MODES[chapter_key]
        bundle = build_chapter_source_bundle("nivara-snap", chapter_key, snapshots)
        ast = _build_chapter_ast(
            chapter_key=chapter_key,
            mode=mode,
            bundle=bundle,
            snapshots=snapshots,
            provider=provider,
            chapter_rows=chapter_rows,
            snapshot_id="nivara-snap",
        )
        chapter_rows[chapter_key] = type("CV", (), {"chapter_digest": {"title": ast.title, "summaryLine": ast.title}})()
        rows[chapter_key] = _Row(
            status=ChapterVersionStatus.GENERATED,
            ast_payload=ast.model_dump(by_alias=True, mode="json"),
            error_message=None,
        )
    return rows


def _find_page_with_text(pdf: fitz.Document, needle: str) -> int | None:
    for index in range(pdf.page_count):
        if needle in pdf[index].get_text():
            return index
    return None


def test_font_registration_prefers_unicode_ttf() -> None:
    fonts = register_export_fonts()
    if not fonts.body_path:
        pytest.skip("DejaVu fonts not installed in this environment")
    assert fonts.body == EXPORT_BODY_FONT
    assert fonts.uses_unicode_ttf


def test_material_contracts_generation_uses_counterparty_name() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "material-contracts-inspection", snapshots)
    ast = build_deterministic_chapter_ast("material-contracts-inspection", bundle, snapshots)
    table = next(b for sec in ast.sections for b in sec.blocks if b.kind == "table")
    parties_cell = table.content["rows"][0][1]
    assert parties_cell == "AutoDrive Components India Private Limited"
    assert "{" not in parties_cell
    assert "counterparty" not in parties_cell.casefold()


def test_material_contracts_title_uses_agreement_title() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "material-contracts-inspection", snapshots)
    ast = build_deterministic_chapter_ast("material-contracts-inspection", bundle, snapshots)
    table = next(b for sec in ast.sections for b in sec.blocks if b.kind == "table")
    title_cell = table.content["rows"][0][0]
    assert "Annual Supply Agreement" in title_cell


def test_year_on_year_not_humanized_as_slug() -> None:
    assert cell_text("year-on-year", semantic_type="plain_text") == "year-on-year"
    assert format_drhp_value("non-executive-director", semantic_type="enum") == "Non-Executive Director"


def test_serialized_dict_guard_recovers_party_name() -> None:
    raw = "{'counterparty': 'AutoDrive Components India Private Limited', 'role': 'customer'}"
    assert cell_text(raw, semantic_type="entity_name") == "AutoDrive Components India Private Limited"
    assert "{" not in cell_text(raw, semantic_type="entity_name")


def test_coalesce_consecutive_numbered_lists() -> None:
    blocks = [
        DrhpBlockAST(block_id="b1", kind="numbered_list", order=1, content={"items": ["A"]}),
        DrhpBlockAST(block_id="b2", kind="numbered_list", order=2, content={"items": ["B"]}),
        DrhpBlockAST(block_id="b3", kind="paragraph", order=3, content={"text": "Break"}),
        DrhpBlockAST(block_id="b4", kind="numbered_list", order=4, content={"items": ["C"]}),
    ]
    normalized = [normalize_block(block) for block in blocks]
    merged = coalesce_list_blocks(normalized)
    assert len(merged) == 3
    assert merged[0].content["items"] == ["A", "B"]
    assert merged[2].content["items"] == ["C"]


def test_legacy_list_kind_maps_to_bullet_list() -> None:
    block = DrhpBlockAST.model_construct(
        block_id="b1",
        kind="list",
        order=1,
        content={"items": ["One", "Two"], "ordered": False},
    )
    normalized = normalize_block(block)
    assert normalized.kind == "bullet_list"
    assert normalized.content["items"] == ["One", "Two"]


def test_nivara_full_export_pdf_integrity() -> None:
    rows = _build_nivara_chapter_rows()
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key=rows,
    )
    pdf_bytes = render_pdf(document)
    assert pdf_bytes.startswith(b"%PDF")

    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = "".join(page.get_text() for page in pdf)

    cover_page = _find_page_with_text(pdf, "Particulars of the Issuer")
    toc_page = _find_page_with_text(pdf, "TABLE OF CONTENTS")
    assert cover_page is not None
    assert toc_page is not None
    assert cover_page < toc_page

    assert "1. Cover Page & Front Matter" not in full_text
    assert document.table_of_contents[0].title == CHAPTER_TITLES["definitions-abbreviations"]
    assert document.table_of_contents[0].chapter_key == "definitions-abbreviations"

    cover_text = pdf[cover_page].get_text()
    assert not re.search(r"Page\s+\d+", cover_text)

    assert "AutoDrive Components India" in full_text.replace("\n", " ")
    assert "Private Limited" in full_text
    assert "{'role':" not in full_text
    assert "'counterparty':" not in full_text
    assert "[object Object]" not in full_text

    fonts = register_export_fonts()
    if fonts.uses_unicode_ttf:
        assert "\u20b9" in full_text or "₹" in full_text
    assert "year-on-year" in full_text or "Year On Year" not in full_text.split("Industry")[0]

    toc_text = pdf[toc_page].get_text()
    defs_page = _find_page_with_text(pdf, "Definitions & Abbreviations")
    assert defs_page is not None
    defs_footer_page = None
    for index in range(pdf.page_count):
        if "Definitions & Abbreviations" in pdf[index].get_text():
            defs_footer_page = index
            break
    assert defs_footer_page is not None
    toc_match = re.search(
        r"1\.\s+Definitions & Abbreviations\s+[.\s]+(\d+)",
        toc_text,
    )
    assert toc_match is not None
    assert int(toc_match.group(1)) >= 1

    numbered_list_ast = DrhpChapterAST(
        chapter_key="test-list",
        title="List Test",
        order=99,
        sections=[
            DrhpSectionAST(
                section_key="sec",
                heading="Items",
                order=1,
                blocks=[
                    DrhpBlockAST(block_id="n1", kind="numbered_list", order=1, content={"items": ["Alpha"]}),
                    DrhpBlockAST(block_id="n2", kind="numbered_list", order=2, content={"items": ["Beta"]}),
                    DrhpBlockAST(block_id="n3", kind="numbered_list", order=3, content={"items": ["Gamma"]}),
                ],
            )
        ],
    )
    list_doc = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key={
            "cover-page-front-matter": rows["cover-page-front-matter"],
            "definitions-abbreviations": _Row(
                status=ChapterVersionStatus.GENERATED,
                ast_payload=normalize_chapter_ast(numbered_list_ast).model_dump(by_alias=True, mode="json"),
            ),
            **{
                key: _Row(status=ChapterVersionStatus.FAILED, ast_payload=None, error_message="skip")
                for key in ALL_CHAPTER_KEYS
                if key not in {"cover-page-front-matter", "definitions-abbreviations"}
            },
        },
    )
    list_pdf = fitz.open(stream=render_pdf(list_doc), filetype="pdf")
    list_text = list_pdf[list_pdf.page_count - 1].get_text()
    assert list_text.count("\n1\n") <= 1 or ("1\nAlpha" in list_text and "2\nBeta" in list_text)


def test_pdf_glyph_smoke_via_renderer() -> None:
    fonts = register_export_fonts()
    if not fonts.uses_unicode_ttf:
        pytest.skip("Unicode TTF fonts unavailable in this environment")
    block = DrhpBlockAST(
        block_id="b1",
        kind="paragraph",
        order=1,
        content={"text": "Amounts: ₹ ₹10 ₹5,80,00,000 — – • year-on-year"},
    )
    chapter = DrhpChapterAST(
        chapter_key="definitions-abbreviations",
        title="Definitions & Abbreviations",
        order=2,
        sections=[DrhpSectionAST(section_key="s", heading="", order=1, blocks=[block])],
    )
    rows = _build_nivara_chapter_rows()
    rows["definitions-abbreviations"] = _Row(
        status=ChapterVersionStatus.GENERATED,
        ast_payload=normalize_chapter_ast(chapter).model_dump(by_alias=True, mode="json"),
    )
    document = assemble_export_document(
        version_number=1,
        generated_at=None,
        is_partial=False,
        chapter_rows_by_key=rows,
    )
    pdf = fitz.open(stream=DRHPPdfRenderer().render(document), filetype="pdf")
    body_text = "".join(pdf[i].get_text() for i in range(pdf.page_count))
    assert "₹" in body_text or "\u20b9" in body_text
    assert "year-on-year" in body_text
    assert "—" in body_text or "–" in body_text
    assert "•" in body_text


@pytest.mark.postgres
def test_service_level_pdf_export_path(db_session) -> None:
    """Exercise assemble_export_document → render_pdf via service helper."""
    from app.models.drhp_document import DrhpChapterVersion, DrhpDocument, DrhpDocumentVersion
    from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
    from app.modules.drhp.constants import DocumentVersionStatus
    from app.modules.drhp.generation.snapshot_service import GENERATION_SNAPSHOT_SCHEMA_VERSION
    from app.modules.drhp.constants import REGISTRY_VERSION
    from tests.conftest import make_user

    user = make_user(email="p12-export@example.com")
    db_session.add(user)
    db_session.flush()

    snapshot = DrhpGenerationSnapshot(
        user_id=user.id,
        snapshot_version=1,
        registry_version=REGISTRY_VERSION,
        snapshot_schema_version=GENERATION_SNAPSHOT_SCHEMA_VERSION,
        source_workstream_versions={},
        normalized_payload={"workstreamVersions": {}},
        canonical_context={},
        source_registry={},
        aggregate_source_hash="test-hash",
        readiness_summary={},
        created_by=user.id,
    )
    db_session.add(snapshot)
    db_session.flush()

    rows = _build_nivara_chapter_rows()
    drhp_doc = DrhpDocument(user_id=user.id)
    db_session.add(drhp_doc)
    db_session.flush()

    doc_version = DrhpDocumentVersion(
        document_id=drhp_doc.id,
        user_id=user.id,
        version_number=1,
        generation_snapshot_id=snapshot.id,
        status=DocumentVersionStatus.GENERATED,
        completed_chapters=len(ALL_CHAPTER_KEYS),
        total_chapters=len(ALL_CHAPTER_KEYS),
    )
    db_session.add(doc_version)
    db_session.flush()

    for chapter_key, row in rows.items():
        db_session.add(
            DrhpChapterVersion(
                document_version_id=doc_version.id,
                chapter_key=chapter_key,
                status=row.status,
                ast_payload=row.ast_payload,
            )
        )
    db_session.commit()

    document = build_export_document_for_version(db_session, user, doc_version.id)
    pdf_bytes = render_pdf(document)
    assert pdf_bytes.startswith(b"%PDF")
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    assert _find_page_with_text(pdf, "Particulars of the Issuer") is not None
    assert "AutoDrive Components India" in "".join(p.get_text() for p in pdf).replace("\n", " ")
