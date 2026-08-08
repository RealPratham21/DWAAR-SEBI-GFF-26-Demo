"""Normalize persisted AST values for export-safe rendering."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import CHAPTER_TITLES, PLACEHOLDER_TOKEN

INTERNAL_TEXT_PATTERNS = (
    re.compile(r"\bsrc:[a-f0-9:]+\b", re.I),
    re.compile(r"\bblk-[a-f0-9-]+\b", re.I),
    re.compile(r"\bunsupported_number:\d+\b", re.I),
    re.compile(r"\bunknown_source_ref:\S+\b", re.I),
)


def sanitize_visible_text(text: str) -> str:
    cleaned = text.strip()
    for pattern in INTERNAL_TEXT_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return " ".join(cleaned.split())


def cell_text(value: Any) -> str:
    """Convert an AST cell value to export-safe plain text — never raw JSON."""
    if value is None:
        return ""
    if isinstance(value, str):
        return sanitize_visible_text(value)
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, int):
        return f"{value:,}"
    if isinstance(value, float):
        if value.is_integer():
            return f"{int(value):,}"
        return str(value)
    if isinstance(value, list):
        parts = [cell_text(item) for item in value]
        parts = [part for part in parts if part]
        return "; ".join(parts)
    if isinstance(value, dict):
        label = value.get("label") or value.get("name") or value.get("title")
        nested = value.get("value") or value.get("text") or value.get("amount")
        if label and nested is not None:
            nested_text = cell_text(nested)
            if nested_text:
                return f"{cell_text(label)}: {nested_text}"
        parts: list[str] = []
        for key, nested_value in value.items():
            if key in {"refId", "ref_id", "sourceRefIds", "evidenceRefIds", "blockId"}:
                continue
            nested_text = cell_text(nested_value)
            if nested_text:
                parts.append(nested_text)
        if parts:
            return "; ".join(parts)
        return PLACEHOLDER_TOKEN
    return PLACEHOLDER_TOKEN


def normalize_table_content(content: dict[str, Any]) -> dict[str, Any]:
    headers = [cell_text(item) for item in content.get("headers") or []]
    rows: list[list[str]] = []
    for row in content.get("rows") or []:
        if isinstance(row, dict):
            rows.append([cell_text(row.get(header, "")) for header in headers] or list(row.values()))
        elif isinstance(row, list):
            rows.append([cell_text(cell) for cell in row])
        else:
            rows.append([cell_text(row)])
    return {
        "headers": headers,
        "rows": rows,
        "caption": cell_text(content.get("caption") or ""),
    }


def normalize_block(block: DrhpBlockAST) -> DrhpBlockAST:
    content = dict(block.content or {})
    kind = block.kind

    if kind in {"table", "key_value_table"}:
        normalized = normalize_table_content(content)
        if kind == "key_value_table" and not normalized["headers"]:
            normalized["headers"] = ["Particulars", "Details"]
        return block.model_copy(update={"content": normalized})

    if kind in {"paragraph", "heading", "legal_notice"}:
        return block.model_copy(update={"content": {"text": cell_text(content.get("text") or "")}})

    if kind in {"bullet_list", "numbered_list"}:
        items = [cell_text(item) for item in content.get("items") or []]
        return block.model_copy(update={"content": {"items": [item for item in items if item]}})

    if kind == "placeholder":
        text = cell_text(content.get("text") or content.get("reason") or PLACEHOLDER_TOKEN)
        if PLACEHOLDER_TOKEN not in text:
            text = PLACEHOLDER_TOKEN
        return block.model_copy(update={"content": {"text": text}})

    if kind == "cross_reference":
        display = cell_text(
            content.get("displayText")
            or content.get("display_text")
            or ""
        )
        if not display:
            target = str(content.get("targetChapterKey") or content.get("target_chapter_key") or "")
            title = CHAPTER_TITLES.get(target, target.replace("-", " ").title())
            display = f'For further details, see "{title}".'
        return block.model_copy(
            update={
                "kind": "paragraph",
                "content": {"text": display},
            }
        )

    if kind == "page_break":
        return block

    if kind == "image_reference":
        caption = cell_text(content.get("caption") or content.get("alt") or "Image reference")
        return block.model_copy(update={"kind": "paragraph", "content": {"text": caption}})

    fallback = cell_text(content.get("text") or content)
    return block.model_copy(update={"kind": "paragraph", "content": {"text": fallback or PLACEHOLDER_TOKEN}})


def normalize_chapter_ast(chapter: DrhpChapterAST) -> DrhpChapterAST:
    sections: list[DrhpSectionAST] = []
    for section in chapter.sections:
        blocks = [normalize_block(block) for block in section.blocks]
        sections.append(section.model_copy(update={"blocks": blocks}))
    return chapter.model_copy(update={"sections": sections})
