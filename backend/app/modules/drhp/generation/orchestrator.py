"""DRHP generation orchestrator — chapter scheduling and execution."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    PROMPT_VERSION,
    RULES_VERSION,
    ChapterGenerationMode,
    ChapterVersionStatus,
    CHAPTER_GENERATION_MODES,
    DocumentVersionStatus,
    GenerationStatus,
)
from app.modules.drhp.generation.composer import (
    ast_source_refs_summary,
    build_chapter_digest,
    compose_chapter_ast,
)
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry
from app.modules.drhp.generation.source_refs import bundle_source_hash, load_snapshots_from_generation_snapshot
from app.modules.drhp.generation.validation import ValidationFailure, validate_chapter_ast
from app.modules.drhp.cohere.provider import build_drhp_generation_provider
from app.modules.drhp.mapping.dependencies import get_dependency_chapters
from app.modules.drhp.generation.terms import build_term_registry

logger = logging.getLogger(__name__)

MAX_CORRECTIVE_RETRIES = 2


def _utcnow() -> datetime:
    return datetime.now(tz=UTC)


def _chapter_rows(db: Session, document_version_id: UUID) -> dict[str, DrhpChapterVersion]:
    rows = db.scalars(
        select(DrhpChapterVersion).where(DrhpChapterVersion.document_version_id == document_version_id)
    ).all()
    return {row.chapter_key: row for row in rows}


def _dependencies_met(chapter_key: str, statuses: dict[str, str]) -> bool:
    for dep in get_dependency_chapters(chapter_key):
        dep_status = statuses.get(dep)
        if dep_status not in {
            ChapterVersionStatus.GENERATED,
            ChapterVersionStatus.GENERATED_WITH_WARNINGS,
        }:
            return False
    return True


def _finalize_stuck_chapters(chapter_rows: dict[str, DrhpChapterVersion]) -> None:
    """Mark chapters left queued/waiting when generation cannot proceed further."""
    changed = True
    while changed:
        changed = False
        statuses = {key: row.status for key, row in chapter_rows.items()}
        for chapter_key, row in chapter_rows.items():
            if row.status not in {
                ChapterVersionStatus.QUEUED,
                ChapterVersionStatus.WAITING_FOR_DEPENDENCY,
            }:
                continue
            deps = get_dependency_chapters(chapter_key)
            failed_deps = [
                dep
                for dep in deps
                if statuses.get(dep)
                in {ChapterVersionStatus.FAILED, ChapterVersionStatus.BLOCKED}
            ]
            if failed_deps:
                row.status = ChapterVersionStatus.FAILED
                row.error_code = "DEPENDENCY_FAILED"
                row.error_message = (
                    f"Blocked by failed dependencies: {', '.join(failed_deps)}"
                )
                row.completed_at = _utcnow()
                changed = True

    for row in chapter_rows.values():
        if row.status not in {
            ChapterVersionStatus.QUEUED,
            ChapterVersionStatus.WAITING_FOR_DEPENDENCY,
        }:
            continue
        row.status = ChapterVersionStatus.FAILED
        row.error_code = "GENERATION_STALLED"
        row.error_message = "Chapter could not be scheduled before generation ended."
        row.completed_at = _utcnow()


def _refresh_document_counts(db: Session, doc_version: DrhpDocumentVersion) -> None:
    rows = db.scalars(
        select(DrhpChapterVersion).where(DrhpChapterVersion.document_version_id == doc_version.id)
    ).all()
    completed = warning = failed = blocked = 0
    for row in rows:
        if row.status == ChapterVersionStatus.GENERATED:
            completed += 1
        elif row.status == ChapterVersionStatus.GENERATED_WITH_WARNINGS:
            completed += 1
            warning += 1
        elif row.status == ChapterVersionStatus.FAILED:
            failed += 1
        elif row.status == ChapterVersionStatus.BLOCKED:
            blocked += 1
    doc_version.completed_chapters = completed
    doc_version.warning_chapters = warning
    doc_version.failed_chapters = failed
    doc_version.blocked_chapters = blocked

    terminal = completed + failed + blocked
    if terminal >= doc_version.total_chapters:
        if failed > 0 and completed > 0:
            doc_version.status = DocumentVersionStatus.PARTIALLY_GENERATED
        elif failed == doc_version.total_chapters:
            doc_version.status = DocumentVersionStatus.FAILED
            doc_version.failed_at = _utcnow()
        elif warning > 0:
            doc_version.status = DocumentVersionStatus.GENERATED_WITH_WARNINGS
            doc_version.completed_at = _utcnow()
        else:
            doc_version.status = DocumentVersionStatus.GENERATED
            doc_version.completed_at = _utcnow()
    else:
        doc_version.status = DocumentVersionStatus.GENERATING


def run_document_generation(db: Session, document_version_id: UUID) -> None:
    """Process all chapters for a document version. Caller owns session lifecycle."""
    doc_version = db.get(DrhpDocumentVersion, document_version_id)
    if doc_version is None:
        logger.warning(
            "DRHP document version not found (generation not started yet?) document_version_id=%s",
            document_version_id,
        )
        return

    snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
    if snapshot is None:
        doc_version.status = DocumentVersionStatus.FAILED
        doc_version.error_summary = "Generation snapshot missing."
        doc_version.failed_at = _utcnow()
        db.commit()
        return

    if doc_version.generation_started_at is None:
        doc_version.generation_started_at = _utcnow()
        doc_version.status = DocumentVersionStatus.GENERATING
        db.commit()

    snapshots = load_snapshots_from_generation_snapshot(snapshot)
    settings = get_settings()
    provider = build_drhp_generation_provider(settings)
    if hasattr(provider, "set_snapshots"):
        provider.set_snapshots(snapshots)
    model_name = settings.cohere_drhp_model or settings.cohere_model or "fake"

    chapter_rows = _chapter_rows(db, document_version_id)
    progress = True
    while progress:
        progress = False
        statuses = {key: row.status for key, row in chapter_rows.items()}
        for chapter_key in ALL_CHAPTER_KEYS:
            row = chapter_rows[chapter_key]
            if row.status not in {ChapterVersionStatus.QUEUED, ChapterVersionStatus.WAITING_FOR_DEPENDENCY}:
                continue
            if not _dependencies_met(chapter_key, statuses):
                if row.status != ChapterVersionStatus.WAITING_FOR_DEPENDENCY:
                    row.status = ChapterVersionStatus.WAITING_FOR_DEPENDENCY
                    db.commit()
                continue

            progress = True
            _generate_single_chapter(
                db,
                row=row,
                doc_version=doc_version,
                snapshot=snapshot,
                snapshots=snapshots,
                provider=provider,
                model_name=model_name,
                chapter_rows=chapter_rows,
            )
            _refresh_document_counts(db, doc_version)
            db.commit()

    _finalize_stuck_chapters(chapter_rows)
    _refresh_document_counts(db, doc_version)
    db.commit()


def _generate_single_chapter(
    db: Session,
    *,
    row: DrhpChapterVersion,
    doc_version: DrhpDocumentVersion,
    snapshot: DrhpGenerationSnapshot,
    snapshots: dict[str, Any],
    provider: Any,
    model_name: str,
    chapter_rows: dict[str, DrhpChapterVersion],
) -> None:
    chapter_key = row.chapter_key
    mode = CHAPTER_GENERATION_MODES.get(chapter_key, ChapterGenerationMode.HYBRID)
    row.generation_mode = mode
    row.generation_started_at = _utcnow()
    row.status = ChapterVersionStatus.GENERATING
    row.model = model_name
    row.prompt_version = PROMPT_VERSION
    db.flush()

    bundle = build_chapter_source_bundle(str(snapshot.id), chapter_key, snapshots)
    row.source_bundle_hash = bundle_source_hash(bundle.model_dump(mode="json"))

    readiness = bundle.readiness
    if readiness.generation_status == GenerationStatus.BLOCKED or readiness.blocker_count > 0:
        row.status = ChapterVersionStatus.BLOCKED
        row.error_code = "READINESS_BLOCKED"
        row.error_message = "; ".join(bundle.unresolved_required_inputs[:5]) or "Chapter readiness blocked."
        row.completed_at = _utcnow()
        return

    try:
        chapter_ast = _build_chapter_ast(
            chapter_key=chapter_key,
            mode=mode,
            bundle=bundle,
            snapshots=snapshots,
            provider=provider,
            chapter_rows=chapter_rows,
            snapshot_id=str(snapshot.id),
        )
        validation_warnings = list(dict.fromkeys(validate_chapter_ast(chapter_ast, bundle=bundle)))
        if validation_warnings and row.retry_count < MAX_CORRECTIVE_RETRIES:
            row.retry_count += 1
            chapter_ast = _build_chapter_ast(
                chapter_key=chapter_key,
                mode=mode,
                bundle=bundle,
                snapshots=snapshots,
                provider=provider,
                chapter_rows=chapter_rows,
                snapshot_id=str(snapshot.id),
                validation_failures=validation_warnings,
            )
            validation_warnings = list(dict.fromkeys(validate_chapter_ast(chapter_ast, bundle=bundle)))

        row.ast_payload = chapter_ast.model_dump(by_alias=True, mode="json")
        row.chapter_digest = build_chapter_digest(chapter_ast)
        row.source_refs_summary = ast_source_refs_summary(chapter_ast, bundle)
        row.validation_warnings = validation_warnings
        row.completed_at = _utcnow()
        if validation_warnings:
            row.status = ChapterVersionStatus.GENERATED_WITH_WARNINGS
            row.generation_warnings = validation_warnings
        else:
            row.status = ChapterVersionStatus.GENERATED
    except ValidationFailure as exc:
        row.status = ChapterVersionStatus.FAILED
        row.error_code = "VALIDATION_FAILED"
        row.error_message = "; ".join(exc.failures[:5])
        row.validation_warnings = exc.failures
        row.completed_at = _utcnow()
    except Exception as exc:  # noqa: BLE001
        from app.modules.drhp.generation.structured_narrative import InsufficientSourceError

        if isinstance(exc, InsufficientSourceError):
            logger.warning("Chapter insufficient source chapter=%s reason=%s", chapter_key, exc)
            row.status = ChapterVersionStatus.FAILED
            row.error_code = "INSUFFICIENT_SOURCE"
            row.error_message = str(exc)[:500]
            row.completed_at = _utcnow()
            return
        logger.exception("Chapter generation failed chapter=%s", chapter_key)
        row.status = ChapterVersionStatus.FAILED
        row.error_code = "GENERATION_ERROR"
        row.error_message = str(exc)[:500]
        row.completed_at = _utcnow()


def _build_chapter_ast(
    *,
    chapter_key: str,
    mode: str,
    bundle: Any,
    snapshots: dict[str, Any],
    provider: Any,
    chapter_rows: dict[str, DrhpChapterVersion],
    snapshot_id: str,
    validation_failures: list[str] | None = None,
):
    from app.modules.drhp.ast.schemas import DrhpChapterAST

    bundle_dict = bundle.model_dump(by_alias=True, mode="json")

    if mode == ChapterGenerationMode.DETERMINISTIC:
        return build_deterministic_chapter_ast(chapter_key, bundle, snapshots)

    if chapter_key == "risk-factors":
        candidates, extra_refs = build_risk_candidate_registry(snapshots)
        bundle_dict["riskCandidates"] = candidates
        bundle.source_refs.extend(extra_refs)
        bundle.risk_candidates = candidates
        cohere = provider.generate_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle_dict,
            validation_failures=validation_failures,
        )
        return compose_chapter_ast(
            chapter_key=chapter_key,
            bundle=bundle,
            snapshots=snapshots,
            cohere_output=cohere,
        )

    if chapter_key == "definitions-abbreviations":
        terms = build_term_registry(bundle.global_context, snapshots)
        used_terms: list[dict[str, Any]] = []
        for row in chapter_rows.values():
            digest = row.chapter_digest or {}
            if digest:
                used_terms.append({"term": digest.get("title"), "definition": digest.get("summaryLine")})
        bundle_dict["termRegistry"] = {"terms": terms.get("terms") or used_terms}
        cohere = provider.generate_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle_dict,
            validation_failures=validation_failures,
        )
        return compose_chapter_ast(
            chapter_key=chapter_key,
            bundle=bundle,
            snapshots=snapshots,
            cohere_output=cohere,
        )

    if chapter_key == "summary-of-drhp":
        digests = []
        for key, row in chapter_rows.items():
            if key in ("summary-of-drhp", "definitions-abbreviations", "declarations-aoa-miscellaneous"):
                continue
            if row.chapter_digest:
                digests.append(row.chapter_digest)
        bundle_dict["chapterDigests"] = digests
        cohere = provider.generate_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle_dict,
            validation_failures=validation_failures,
        )
        return compose_chapter_ast(
            chapter_key=chapter_key,
            bundle=bundle,
            snapshots=snapshots,
            cohere_output=cohere,
        )

    if mode == ChapterGenerationMode.HYBRID:
        cohere = provider.generate_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle_dict,
            validation_failures=validation_failures,
        )
        return compose_chapter_ast(
            chapter_key=chapter_key,
            bundle=bundle,
            snapshots=snapshots,
            cohere_output=cohere,
        )

    return DrhpChapterAST(
        chapter_key=chapter_key,
        title=bundle.chapter_title,
        order=0,
        sections=[],
    )
