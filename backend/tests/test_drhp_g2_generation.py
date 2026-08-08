"""G2 DRHP generation tests — fake Cohere provider, no live API."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest

from app.modules.drhp.ast.schemas import DrhpChapterAST
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_GENERATION_MODES,
    ChapterGenerationMode,
    ChapterVersionStatus,
)
from app.modules.drhp.generation.composer import compose_chapter_ast
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.orchestrator import run_document_generation
from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry
from app.modules.drhp.generation.source_refs import stable_ref_id
from app.modules.drhp.generation.validation import validate_chapter_ast
from app.modules.drhp.bundles.builders import build_all_chapter_bundles, build_chapter_source_bundle
from app.modules.drhp.cohere.config import CohereKeyPool, GenerationConcurrencyConfig
from app.modules.drhp.cohere.provider import FakeDrhpGenerationProvider
from tests.test_drhp_generation_foundation import _nivara_snapshots
from tests.conftest import make_user


def test_stable_source_ref_ids_are_deterministic() -> None:
    a = stable_ref_id(workstream="business-operations", section="products", field_path="products[0].revenueContribution", record_id="p1")
    b = stable_ref_id(workstream="business-operations", section="products", field_path="products[0].revenueContribution", record_id="p1")
    assert a == b
    assert a.startswith("src:")


def test_chapter_generation_modes_cover_all_eighteen() -> None:
    assert len(CHAPTER_GENERATION_MODES) == 18
    assert CHAPTER_GENERATION_MODES["cover-page-front-matter"] == ChapterGenerationMode.DETERMINISTIC
    assert CHAPTER_GENERATION_MODES["business-operations"] == ChapterGenerationMode.HYBRID
    assert CHAPTER_GENERATION_MODES["risk-factors"] == ChapterGenerationMode.DERIVED


def test_deterministic_cover_chapter_has_source_refs() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "cover-page-front-matter", snapshots)
    ast = build_deterministic_chapter_ast("cover-page-front-matter", bundle, snapshots)
    assert ast.sections
    assert any(block.source_ref_ids for section in ast.sections for block in section.blocks)


def test_fake_cohere_hybrid_compose_merges_tables_and_narrative() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "business-operations", snapshots)
    provider = FakeDrhpGenerationProvider()
    provider.set_snapshots(snapshots)
    cohere = provider.generate_chapter_narrative(
        chapter_key="business-operations",
        bundle=bundle.model_dump(by_alias=True, mode="json"),
    )
    ast = compose_chapter_ast(
        chapter_key="business-operations",
        bundle=bundle,
        snapshots=snapshots,
        cohere_output=cohere,
    )
    kinds = [block.kind for section in ast.sections for block in section.blocks]
    assert "paragraph" in kinds


def test_risk_candidates_not_empty_for_nivara() -> None:
    snapshots = _nivara_snapshots()
    candidates, refs = build_risk_candidate_registry(snapshots)
    assert candidates
    assert refs
    assert all(c.get("sourceRefIds") for c in candidates)


def test_validation_rejects_unknown_source_ref() -> None:
    snapshots = _nivara_snapshots()
    bundle = build_chapter_source_bundle("snap", "cover-page-front-matter", snapshots)
    ast = build_deterministic_chapter_ast("cover-page-front-matter", bundle, snapshots)
    if ast.sections and ast.sections[0].blocks:
        ast.sections[0].blocks[0].source_ref_ids = ["src:does-not-exist"]
    failures = validate_chapter_ast(ast, bundle=bundle)
    assert any("unknown_source_ref" in item for item in failures)


def test_cohere_key_pool_respects_concurrency() -> None:
    pool = CohereKeyPool(["a", "b"], GenerationConcurrencyConfig(max_global_concurrency=1))
    first = pool.acquire_key()
    second = pool.acquire_key()
    assert first is not None
    assert second is None
    pool.release_key(first)


def test_uncommitted_document_version_is_invisible_to_generation(db_session) -> None:
    """Background generation must start only after the HTTP transaction commits."""
    from app.db.session import SessionLocal
    from app.models.drhp_document import DrhpDocumentVersion
    from app.modules.drhp.service import start_drhp_generation

    user = make_user(email="g2-race@example.com")
    db_session.add(user)
    db_session.flush()

    with patch("app.modules.drhp.service.create_generation_snapshot") as mock_snapshot:
        from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot

        snap = DrhpGenerationSnapshot(
            user_id=user.id,
            registry_version="test",
            rules_version="test",
            prompt_version="test",
            workstream_snapshots={},
            chapter_readiness={},
            global_context={},
        )
        db_session.add(snap)
        db_session.flush()
        mock_snapshot.return_value = snap

        response = start_drhp_generation(db_session, user, create_snapshot=True)

    other = SessionLocal()
    try:
        run_document_generation(other, response.document_version_id)
        assert other.get(DrhpDocumentVersion, response.document_version_id) is None
    finally:
        other.close()

    db_session.commit()

    other = SessionLocal()
    try:
        run_document_generation(other, response.document_version_id)
        doc_version = other.get(DrhpDocumentVersion, response.document_version_id)
        assert doc_version is not None
        assert doc_version.completed_chapters >= 1
    finally:
        other.close()


@pytest.mark.postgres
def test_g2_generation_end_to_end(db_session) -> None:
    """Requires all 12 workstreams seeded for the user."""
    import json
    from pathlib import Path

    from app.core.config import clear_settings_cache, get_settings
    from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
    from app.modules.drhp.hashing import compute_source_hash
    from app.modules.drhp.service import start_drhp_generation
    from app.modules.drhp.workstreams import WORKSPACE_MODELS, load_all_workstreams, missing_workstream_slugs

    user = make_user(email="g2-gen@example.com")
    db_session.add(user)
    db_session.flush()

    payloads = json.loads(
        (Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json").read_text(
            encoding="utf-8"
        )
    )
    for slug, model in WORKSPACE_MODELS.items():
        payload = payloads.get(slug) or {}
        db_session.add(
            model(
                user_id=user.id,
                payload=payload,
                version=1,
                schema_version=1,
                payload_hash=compute_source_hash({"slug": slug, "payload": payload}),
            )
        )
    db_session.flush()

    snapshots = load_all_workstreams(db_session, user.id)
    assert not missing_workstream_slugs(snapshots)

    clear_settings_cache()
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("DRHP_USE_FAKE_COHERE", "true")
    clear_settings_cache()

    response = start_drhp_generation(db_session, user, create_snapshot=True)
    db_session.commit()
    run_document_generation(db_session, response.document_version_id)
    db_session.commit()

    doc_version = db_session.get(DrhpDocumentVersion, response.document_version_id)
    assert doc_version is not None
    assert doc_version.completed_chapters >= 10

    rows = db_session.query(DrhpChapterVersion).filter_by(document_version_id=response.document_version_id).all()
    generated = [
        r
        for r in rows
        if r.status in {ChapterVersionStatus.GENERATED, ChapterVersionStatus.GENERATED_WITH_WARNINGS}
    ]
    assert len(generated) >= 10
    cover = next(r for r in rows if r.chapter_key == "cover-page-front-matter")
    assert cover.ast_payload is not None
    monkeypatch.undo()
