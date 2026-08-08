"""Build DRHP usage index from persisted AST blocks (G5)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpChapterVersion, DrhpDocument, DrhpDocumentVersion
from app.models.user import User
from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.facts_evidence.labels import chapter_label, drhp_block_url


@dataclass
class DrhpUsageEntry:
    ref_id: str
    document_version_id: str
    document_version_number: int
    chapter_key: str
    chapter_label: str
    section_key: str
    section_heading: str
    block_id: str
    block_kind: str
    draft_value_preview: Any = None
    is_stale: bool = False


@dataclass
class DrhpUsageIndex:
    by_ref_id: dict[str, list[DrhpUsageEntry]] = field(default_factory=dict)
    document_version_id: str | None = None
    document_version_number: int | None = None
    is_stale: bool = False


def _preview_from_block(content: dict[str, Any]) -> str:
    if not content:
        return ""
    if "text" in content:
        return str(content["text"])[:200]
    if "rows" in content and content["rows"]:
        first = content["rows"][0]
        return " | ".join(str(c) for c in first)[:200]
    return ""


def build_drhp_usage_index(db: Session, user: User) -> DrhpUsageIndex:
    index = DrhpUsageIndex()
    document = db.scalar(select(DrhpDocument).where(DrhpDocument.user_id == user.id))
    if document is None:
        return index

    doc_version = db.scalar(
        select(DrhpDocumentVersion)
        .where(DrhpDocumentVersion.document_id == document.id)
        .order_by(DrhpDocumentVersion.version_number.desc())
    )
    if doc_version is None:
        return index

    index.document_version_id = str(doc_version.id)
    index.document_version_number = doc_version.version_number

    stale = False
    from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot

    snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
    if snapshot:
        stale_result = compare_snapshot_staleness(db, user.id, snapshot)
        stale = bool(stale_result.get("isStale"))
    index.is_stale = stale

    ref_values: dict[str, Any] = {}
    for row in db.scalars(
        select(DrhpChapterVersion).where(DrhpChapterVersion.document_version_id == doc_version.id)
    ).all():
        for ref in row.source_refs_summary or []:
            ref_id = ref.get("refId") or ref.get("ref_id")
            if ref_id:
                ref_values[str(ref_id)] = ref.get("valuePreview") or ref.get("value_preview")

        ast = row.ast_payload or {}
        for section in ast.get("sections") or []:
            section_key = section.get("sectionKey") or section.get("section_key") or ""
            section_heading = section.get("heading") or ""
            for block in section.get("blocks") or []:
                block_id = block.get("blockId") or block.get("block_id") or ""
                block_kind = block.get("kind") or "paragraph"
                preview = _preview_from_block(block.get("content") or {})
                for ref_id in block.get("sourceRefIds") or block.get("source_ref_ids") or []:
                    entry = DrhpUsageEntry(
                        ref_id=str(ref_id),
                        document_version_id=str(doc_version.id),
                        document_version_number=doc_version.version_number,
                        chapter_key=row.chapter_key,
                        chapter_label=CHAPTER_TITLES.get(row.chapter_key, row.chapter_key),
                        section_key=section_key,
                        section_heading=section_heading,
                        block_id=block_id,
                        block_kind=block_kind,
                        draft_value_preview=ref_values.get(str(ref_id)) or preview,
                        is_stale=stale,
                    )
                    index.by_ref_id.setdefault(str(ref_id), []).append(entry)

    return index
