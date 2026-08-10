"""Normalize persisted AST values for export-safe rendering."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import CHAPTER_TITLES, PLACEHOLDER_TOKEN
from app.modules.drhp.export.formatters import (
    chapter_title_duplicates_section,
    format_drhp_value,
    headings_are_duplicate,
    infer_column_alignments,
    infer_column_semantic_types,
    is_internal_heading,
    normalize_heading_text,
    should_suppress_section_heading,
)
from app.modules.drhp.export.semantic_types import (
    infer_semantic_type_from_header,
    infer_semantic_type_from_row_label,
)

INTERNAL_TEXT_PATTERNS = (
    re.compile(r"\bsrc:[a-f0-9:]+\b", re.I),
    re.compile(r"\bblk-[a-f0-9-]+\b", re.I),
    re.compile(r"\bunsupported_number:\d+\b", re.I),
    re.compile(r"\bunknown_source_ref:\S+\b", re.I),
    re.compile(r"\bnivara-fy\d{4}\b", re.I),
    re.compile(r"\(\s*refId\b[^)]*\)", re.I),
    re.compile(r"\brefId\s*[:=]\s*\S+", re.I),
    re.compile(r"\bsourceRef\s*[:=]\s*\S+", re.I),
    re.compile(r"\bevidenceRef\s*[:=]\s*\S+", re.I),
    re.compile(r"\bperson:nivara-[a-z0-9-]+\b", re.I),
    re.compile(r"\bentity:nivara-[a-z0-9-]+\b", re.I),
    re.compile(r"\b(person|entity):[a-z0-9-]+\b", re.I),
)


def sanitize_visible_text(text: str) -> str:
    cleaned = text.strip()
    for pattern in INTERNAL_TEXT_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return " ".join(cleaned.split())


def cell_text(value: Any, *, semantic_type: str | None = None, unit: str | None = None) -> str:
    """Convert an AST cell value to export-safe plain text — never raw JSON."""
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("₹") and "," in stripped:
            return sanitize_visible_text(stripped)
        if stripped.endswith(" lakh") and stripped.startswith("₹"):
            return sanitize_visible_text(stripped)
    formatted = format_drhp_value(value, semantic_type=semantic_type, unit=unit)
    if isinstance(value, str):
        return sanitize_visible_text(formatted)
    if formatted and formatted != PLACEHOLDER_TOKEN:
        return sanitize_visible_text(formatted)
    return formatted


def normalize_table_content(content: dict[str, Any]) -> dict[str, Any]:
    raw_headers = content.get("headers") or []
    column_types = infer_column_semantic_types([str(item) for item in raw_headers])
    unit = str(content.get("unit") or "").strip() or None
    headers = [cell_text(item, semantic_type="plain_text") for item in raw_headers]
    rows: list[list[str]] = []
    for row in content.get("rows") or []:
        row_label = ""
        if isinstance(row, list) and row:
            row_label = str(row[0])
        row_semantic = infer_semantic_type_from_row_label(row_label)
        if isinstance(row, dict):
            rows.append(
                [
                    cell_text(
                        row.get(str(raw_headers[i]), ""),
                        semantic_type=column_types[i] if i < len(column_types) else None,
                        unit=unit,
                    )
                    for i in range(len(raw_headers))
                ]
            )
        elif isinstance(row, list):
            formatted_row: list[str] = []
            for i, cell in enumerate(row):
                semantic = column_types[i] if i < len(column_types) else None
                if i > 0 and row_semantic:
                    semantic = row_semantic
                formatted_row.append(cell_text(cell, semantic_type=semantic, unit=unit))
            rows.append(formatted_row)
        else:
            rows.append([cell_text(row)])
    notes_raw = content.get("notes") or content.get("footnotes") or []
    notes = [cell_text(note) for note in notes_raw if note]
    alignments = infer_column_alignments(headers, rows)
    variant = str(content.get("variant") or content.get("tableVariant") or "").strip() or None
    return {
        "headers": headers,
        "rows": rows,
        "caption": cell_text(content.get("caption") or ""),
        "notes": notes,
        "columnAlignments": alignments,
        "columnSemanticTypes": column_types,
        "variant": variant,
        "unit": unit,
    }


def _block_visible_text(block: DrhpBlockAST) -> str:
    content = block.content or {}
    if block.kind in {"paragraph", "heading", "legal_notice", "placeholder"}:
        return cell_text(content.get("text") or content.get("reason") or "")
    return ""


def _normalize_list_kind(block: DrhpBlockAST) -> DrhpBlockAST:
    """Map legacy/internal list kinds to canonical publication list blocks."""
    content = dict(block.content or {})
    if block.kind == "list":
        ordered = bool(content.get("ordered"))
        kind = "numbered_list" if ordered else "bullet_list"
        return block.model_copy(update={"kind": kind})
    return block


def coalesce_list_blocks(blocks: list[DrhpBlockAST]) -> list[DrhpBlockAST]:
    """Merge consecutive compatible one-item list blocks into a single list."""
    merged: list[DrhpBlockAST] = []
    index = 0
    while index < len(blocks):
        block = blocks[index]
        if block.kind not in {"bullet_list", "numbered_list"}:
            merged.append(block)
            index += 1
            continue

        items = [str(item) for item in (block.content or {}).get("items") or [] if str(item).strip()]
        kind = block.kind
        index += 1
        while index < len(blocks) and blocks[index].kind == kind:
            next_items = [str(item) for item in (blocks[index].content or {}).get("items") or [] if str(item).strip()]
            items.extend(next_items)
            index += 1

        merged.append(
            block.model_copy(
                update={"content": {"items": items}},
            )
        )
    return merged


def _dedupe_section_blocks(section: DrhpSectionAST, *, chapter_title: str = "") -> list[DrhpBlockAST]:
    blocks = [_normalize_list_kind(block) for block in section.blocks]
    blocks = [normalize_block(block) for block in blocks]
    blocks = coalesce_list_blocks(blocks)
    deduped: list[DrhpBlockAST] = []
    previous_text = normalize_heading_text(section.heading or "") or chapter_title

    for block in blocks:
        if block.kind == "heading":
            heading_text = normalize_heading_text(str((block.content or {}).get("text") or ""))
            if is_internal_heading(heading_text):
                continue
            if chapter_title_duplicates_section(chapter_title, heading_text):
                continue
            if headings_are_duplicate(previous_text, heading_text):
                continue
            previous_text = heading_text
            deduped.append(block)
            continue

        if block.kind in {"paragraph", "legal_notice"}:
            text = str((block.content or {}).get("text") or "")
            if is_internal_heading(normalize_heading_text(text)):
                continue
            if block.kind == "paragraph" and headings_are_duplicate(previous_text, text):
                continue

        deduped.append(block)
        visible = _block_visible_text(block)
        if visible:
            previous_text = visible

    return deduped


def normalize_block(block: DrhpBlockAST) -> DrhpBlockAST:
    content = dict(block.content or {})
    kind = block.kind

    if kind in {"table", "key_value_table"}:
        normalized = normalize_table_content(content)
        if kind == "key_value_table" and not normalized["headers"]:
            normalized["headers"] = ["Particulars", "Details"]
            normalized["columnSemanticTypes"] = ["plain_text", "plain_text"]
        return block.model_copy(update={"content": normalized})

    if kind in {"paragraph", "heading", "legal_notice"}:
        text = cell_text(content.get("text") or "", semantic_type="plain_text")
        if kind == "heading":
            text = normalize_heading_text(text)
        return block.model_copy(
            update={"content": {"text": text, **({"level": content.get("level")} if kind == "heading" else {})}}
        )

    if kind in {"bullet_list", "numbered_list"}:
        items = [cell_text(item, semantic_type="plain_text") for item in content.get("items") or []]
        return block.model_copy(update={"content": {"items": [item for item in items if item]}})

    if kind == "list":
        ordered = bool(content.get("ordered"))
        mapped_kind = "numbered_list" if ordered else "bullet_list"
        items = [cell_text(item, semantic_type="plain_text") for item in content.get("items") or []]
        return block.model_copy(
            update={"kind": mapped_kind, "content": {"items": [item for item in items if item]}}
        )

    if kind == "placeholder":
        text = cell_text(content.get("text") or content.get("reason") or PLACEHOLDER_TOKEN)
        if PLACEHOLDER_TOKEN not in text:
            text = PLACEHOLDER_TOKEN
        return block.model_copy(update={"content": {"text": text}})

    if kind == "cross_reference":
        display = cell_text(
            content.get("displayText") or content.get("display_text") or "",
            semantic_type="plain_text",
        )
        target = str(content.get("targetChapterKey") or content.get("target_chapter_key") or "").strip()
        if not display and not target:
            return block.model_copy(update={"kind": "paragraph", "content": {"text": ""}})
        if not display and target:
            title = CHAPTER_TITLES.get(target, target.replace("-", " ").title())
            display = f'For further details, see "{title}".'
        if re.search(r'see\s+["\'][\s]*["\']', display, re.I):
            return block.model_copy(update={"kind": "paragraph", "content": {"text": ""}})
        return block.model_copy(update={"kind": "paragraph", "content": {"text": display}})

    if kind == "page_break":
        return block

    if kind == "image_reference":
        caption = cell_text(content.get("caption") or content.get("alt") or "Image reference")
        return block.model_copy(update={"kind": "paragraph", "content": {"text": caption}})

    fallback = cell_text(content.get("text") or content, semantic_type="plain_text")
    return block.model_copy(update={"kind": "paragraph", "content": {"text": fallback or PLACEHOLDER_TOKEN}})


def ast_has_renderable_content(ast_payload: dict[str, Any] | None) -> bool:
    if not ast_payload:
        return False
    sections = ast_payload.get("sections") or []
    if not sections:
        return False
    for section in sections:
        blocks = section.get("blocks") or []
        if blocks:
            return True
    return False


def normalize_chapter_ast(chapter: DrhpChapterAST) -> DrhpChapterAST:
    chapter_title = chapter.title or CHAPTER_TITLES.get(chapter.chapter_key, chapter.chapter_key)
    sections: list[DrhpSectionAST] = []
    for index, section in enumerate(chapter.sections):
        heading = normalize_heading_text(section.heading or "")
        if should_suppress_section_heading(section.heading or ""):
            heading = ""
        if index == 0 and chapter_title_duplicates_section(chapter_title, heading):
            heading = ""
        blocks = _dedupe_section_blocks(section, chapter_title=chapter_title)
        sections.append(section.model_copy(update={"heading": heading, "blocks": blocks}))
    return chapter.model_copy(update={"sections": sections})
