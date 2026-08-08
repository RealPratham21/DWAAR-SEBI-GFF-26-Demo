"""Forensic generation audit for DRHP chapters (G2R development diagnostic)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import ALL_CHAPTER_KEYS, CHAPTER_GENERATION_MODES, CHAPTER_TITLES
from app.modules.drhp.generation.coverage_manifest import chapter_coverage_report
from app.modules.drhp.generation.source_refs import load_snapshots_from_generation_snapshot
from app.modules.drhp.generation.structured_narrative import GENERIC_FILLER_PHRASES


def _count_blocks(ast_payload: dict[str, Any] | None) -> tuple[int, int, int]:
    if not ast_payload:
        return 0, 0, 0
    det = nar = ph = 0
    for section in ast_payload.get("sections") or []:
        for block in section.get("blocks") or []:
            kind = block.get("kind")
            support = block.get("supportState") or block.get("support_state") or ""
            if kind == "placeholder" or support == "placeholder":
                ph += 1
            elif kind == "table":
                det += 1
            elif kind in {"paragraph", "list", "legal_notice", "notice"}:
                nar += 1
            else:
                det += 1
    return det, nar, ph


def _detect_filler(ast_payload: dict[str, Any] | None) -> list[str]:
    if not ast_payload:
        return []
    hits: list[str] = []
    for section in ast_payload.get("sections") or []:
        for block in section.get("blocks") or []:
            content = block.get("content") or {}
            text = str(content.get("text") or "")
            for item in content.get("items") or []:
                text += " " + str(item)
            lowered = text.lower()
            for phrase in GENERIC_FILLER_PHRASES:
                if phrase in lowered:
                    hits.append(phrase)
    return hits


def audit_document_generation(
    db: Session,
    document_version_id: UUID,
) -> dict[str, Any]:
    doc_version = db.get(DrhpDocumentVersion, document_version_id)
    if doc_version is None:
        return {"error": "document_version_not_found"}

    snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
    snapshots = load_snapshots_from_generation_snapshot(snapshot) if snapshot else {}

    chapter_rows = {
        row.chapter_key: row
        for row in db.query(DrhpChapterVersion)
        .filter(DrhpChapterVersion.document_version_id == document_version_id)
        .all()
    }

    chapters: list[dict[str, Any]] = []
    for chapter_key in ALL_CHAPTER_KEYS:
        row = chapter_rows.get(chapter_key)
        bundle = build_chapter_source_bundle(str(snapshot.id if snapshot else ""), chapter_key, snapshots)
        ast = row.ast_payload if row else None
        det, nar, ph = _count_blocks(ast)
        filler = _detect_filler(ast)
        coverage = chapter_coverage_report(
            chapter_key,
            snapshots,
            source_ref_count=len(bundle.source_refs),
            deterministic_blocks=det,
            narrative_blocks=nar,
            placeholder_count=ph,
        )
        chapters.append(
            {
                "chapterKey": chapter_key,
                "title": CHAPTER_TITLES.get(chapter_key, chapter_key),
                "generationMode": CHAPTER_GENERATION_MODES.get(chapter_key),
                "status": row.status if row else "missing",
                "expectedWorkstreams": list({ref.workstream_key for ref in bundle.source_refs}),
                "sourceRefCount": len(bundle.source_refs),
                "narrativeFactCount": len(bundle.narrative_facts),
                "deterministicFactCount": len(bundle.deterministic_facts),
                "structuredTableCount": len(bundle.structured_tables),
                "placeholderCount": ph,
                "conflictCount": len(bundle.conflicts),
                "cohereCalled": CHAPTER_GENERATION_MODES.get(chapter_key) in {"hybrid", "derived"},
                "model": row.model if row else None,
                "generatedNarrativeBlocks": nar,
                "deterministicBlockCount": det,
                "finalAstBlockCount": det + nar + ph,
                "validationWarnings": list(row.validation_warnings or []) if row else [],
                "correctiveRetries": row.retry_count if row else 0,
                "errorCode": row.error_code if row else None,
                "errorMessage": row.error_message if row else None,
                "genericFillerDetected": filler,
                "coverage": coverage,
                "unresolvedInputs": list(bundle.unresolved_required_inputs),
            }
        )

    return {
        "documentVersionId": str(document_version_id),
        "documentStatus": doc_version.status,
        "completedChapters": doc_version.completed_chapters,
        "totalChapters": doc_version.total_chapters,
        "generationModel": doc_version.generation_model,
        "chapters": chapters,
    }
