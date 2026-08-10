"""Assemble compact Copilot context from workspace bootstrap and DRHP selection."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.constants import CHAPTER_TITLES, resolve_chapter_key
from app.modules.drhp.copilot.schemas import CopilotGroundedIn


def _block_id(raw: dict[str, Any]) -> str:
    return str(raw.get("blockId") or raw.get("block_id") or "")


def _preview_block_content(content: dict[str, Any], kind: str) -> str:
    if not content:
        return ""
    if kind in {"paragraph", "legal_notice", "heading"}:
        return str(content.get("text") or "")[:1200]
    if kind in {"bullet_list", "numbered_list", "list"}:
        items = content.get("items") or []
        return "; ".join(str(item) for item in items[:8])[:1200]
    if kind in {"table", "key_value_table"}:
        rows = content.get("rows") or []
        if rows and isinstance(rows[0], list):
            return " | ".join(str(cell) for cell in rows[0])[:400]
    return str(content)[:400]


def find_block_in_ast(
    ast_payload: dict[str, Any] | None,
    block_id: str,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if not ast_payload or not block_id:
        return None, None
    for section in ast_payload.get("sections") or []:
        if not isinstance(section, dict):
            continue
        for block in section.get("blocks") or []:
            if not isinstance(block, dict):
                continue
            if _block_id(block) == block_id:
                return section, block
    return None, None


def _resolve_source_refs(
    block: dict[str, Any],
    source_refs_summary: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    ref_map = {
        str(item.get("refId") or item.get("ref_id")): item
        for item in source_refs_summary
        if isinstance(item, dict)
    }
    ref_ids = block.get("sourceRefIds") or block.get("source_ref_ids") or []
    resolved: list[dict[str, Any]] = []
    for ref_id in ref_ids:
        row = ref_map.get(str(ref_id))
        if not row:
            continue
        resolved.append(
            {
                "workstreamKey": row.get("workstreamKey") or row.get("workstream_key"),
                "sectionKey": row.get("sectionKey") or row.get("section_key"),
                "fieldPath": row.get("fieldPath") or row.get("field_path"),
                "fieldLabel": row.get("fieldLabel") or row.get("field_label"),
                "valuePreview": row.get("valuePreview") or row.get("value_preview"),
            }
        )
    return resolved[:6]


def build_copilot_context(
    db: Session,
    user: User,
    *,
    document_version_id: UUID | None,
    chapter_key: str | None,
    block_id: str | None,
    route: str,
) -> tuple[dict[str, Any], CopilotGroundedIn]:
    from app.modules.dashboard.service import build_dashboard_bootstrap

    bootstrap = build_dashboard_bootstrap(db, user)
    workspace = {
        "route": route,
        "issuerName": bootstrap.company.legal_name,
        "cin": bootstrap.company.cin,
        "primaryIndustry": bootstrap.business.primary_industry,
        "businessSector": bootstrap.business.business_sector,
        "registeredCity": bootstrap.company.registered_office.city,
        "registeredState": bootstrap.company.registered_office.state,
        "ipoIntent": {
            "intendedExchange": bootstrap.ipo_intent.intended_exchange,
            "proposedIssueType": bootstrap.ipo_intent.proposed_issue_type,
            "targetTimeline": bootstrap.ipo_intent.target_timeline,
            "preparationStage": bootstrap.ipo_intent.preparation_stage,
        },
        "platform": {
            "name": "Dwaar",
            "purpose": "IPO preparation workspace for promoter-prepared DRHP drafts",
            "modules": [
                "DRHP Preparation workstreams",
                "Data Room",
                "Facts & Evidence",
                "Issues & Gaps",
                "DRHP Draft Workspace",
                "Reports & Export",
            ],
        },
    }

    grounded = CopilotGroundedIn()
    selection: dict[str, Any] | None = None

    resolved_chapter = resolve_chapter_key(chapter_key) if chapter_key else None
    chapter_key_resolved = resolved_chapter or chapter_key or ""
    if chapter_key_resolved:
        grounded.chapter_key = chapter_key_resolved
        grounded.chapter_title = CHAPTER_TITLES.get(chapter_key_resolved, chapter_key_resolved)

    if document_version_id and chapter_key_resolved:
        from app.models.drhp_document import DrhpChapterVersion
        from sqlalchemy import select

        row = db.scalar(
            select(DrhpChapterVersion).where(
                DrhpChapterVersion.document_version_id == document_version_id,
                DrhpChapterVersion.chapter_key == chapter_key_resolved,
            )
        )
        if row and row.ast_payload:
            chapter_ctx: dict[str, Any] = {
                "chapterKey": chapter_key_resolved,
                "chapterTitle": grounded.chapter_title,
                "status": row.status,
            }
            if block_id:
                grounded.block_id = block_id
                section, block = find_block_in_ast(row.ast_payload, block_id)
                if block:
                    kind = str(block.get("kind") or "paragraph")
                    content = block.get("content") if isinstance(block.get("content"), dict) else {}
                    selection = {
                        "blockId": block_id,
                        "kind": kind,
                        "supportState": block.get("supportState") or block.get("support_state"),
                        "sectionHeading": (section or {}).get("heading") if section else "",
                        "textPreview": _preview_block_content(content, kind),
                        "sourceRefs": _resolve_source_refs(
                            block,
                            list(row.source_refs_summary or []),
                        ),
                    }
            workspace["drhpChapter"] = chapter_ctx
            if selection:
                workspace["selection"] = selection

    return workspace, grounded
