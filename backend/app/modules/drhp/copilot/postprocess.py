"""Normalize and enrich Copilot blocks before returning to the client."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.copilot.schemas import normalize_block
from app.modules.drhp.generation.source_extractors import WORKSTREAM_TITLES
from app.modules.facts_evidence.constants import SUPPORT_STATE_LABELS

_BLOCK_ID_RE = re.compile(r"blk-[0-9a-f-]{8,}", re.I)


def _block_plain_text(block: dict[str, Any]) -> str:
    block_type = block.get("type")
    if block_type in {"heading", "callout"}:
        return str(block.get("text") or "")
    if block_type == "paragraph":
        return "".join(str(span.get("text") or "") for span in block.get("spans") or [])
    if block_type == "bullets":
        return " ".join(str(item) for item in block.get("items") or [])
    return ""


def _is_renderable(block: dict[str, Any]) -> bool:
    block_type = block.get("type")
    if block_type == "paragraph":
        spans = block.get("spans") or []
        return bool(spans) and bool(_block_plain_text(block).strip())
    if block_type == "bullets":
        return bool(block.get("items"))
    return bool(_block_plain_text(block).strip())


def _looks_garbled(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < 20:
        return False
    if _BLOCK_ID_RE.search(stripped):
        return True
    slug_chunks = re.findall(r"[a-z]+(?:-[a-z]+)+", stripped.lower())
    if len(slug_chunks) >= 2 and not any(char in stripped for char in ".!?"):
        return True
    if stripped.count("-") >= 4 and stripped.count(" ") <= 3 and len(stripped) > 50:
        return True
    return False


def _format_source_ref_line(ref: dict[str, Any]) -> str:
    workstream_key = str(ref.get("workstreamKey") or ref.get("workstream_key") or "")
    workstream_title = WORKSTREAM_TITLES.get(
        workstream_key,
        workstream_key.replace("-", " ").title() if workstream_key else "Workstream",
    )
    label = str(ref.get("fieldLabel") or ref.get("field_label") or ref.get("fieldPath") or ref.get("field_path") or "Source field")
    preview = ref.get("valuePreview") or ref.get("value_preview")
    line = f"{label} — {workstream_title}"
    if preview:
        line += f" (preview: {str(preview)[:120]})"
    return line


def _has_section(final: list[dict[str, Any]], keyword: str) -> bool:
    keyword_lower = keyword.lower()
    for index, block in enumerate(final):
        if block.get("type") != "heading":
            continue
        heading = _block_plain_text(block).lower()
        if keyword_lower not in heading:
            continue
        next_block = final[index + 1] if index + 1 < len(final) else None
        if next_block and next_block.get("type") != "heading" and _is_renderable(next_block):
            return True
    return False


def _strip_source_headings_without_content(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    index = 0
    while index < len(blocks):
        block = blocks[index]
        if block.get("type") == "heading" and "source" in _block_plain_text(block).lower():
            next_block = blocks[index + 1] if index + 1 < len(blocks) else None
            if not next_block or next_block.get("type") == "heading" or not _is_renderable(next_block):
                index += 1
                continue
            if next_block.get("type") == "paragraph" and _looks_garbled(_block_plain_text(next_block)):
                index += 2
                continue
        cleaned.append(block)
        index += 1
    return cleaned


def _remove_orphan_headings(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    final: list[dict[str, Any]] = []
    for index, block in enumerate(blocks):
        if block.get("type") == "heading":
            next_block = blocks[index + 1] if index + 1 < len(blocks) else None
            if not next_block or next_block.get("type") == "heading":
                continue
        final.append(block)
    return final


def _completeness_note(support_state: str) -> str:
    if support_state == "structured_input_backed":
        return (
            "This disclosure is linked to structured workstream inputs. "
            "Review the linked fields for missing amounts, dates, or approvals before filing."
        )
    if support_state in {"missing", "unsupported"}:
        return "This block is flagged as lacking adequate source backing — treat it as a preparation gap."
    if support_state == "placeholder":
        return "This block still contains placeholder content and is not filing-ready."
    return "Cross-check linked sources in the Evidence panel before relying on this text in the DRHP."


def finalize_copilot_blocks(
    blocks: list[dict[str, Any]],
    *,
    context: dict[str, Any],
    message: str,
) -> list[dict[str, Any]]:
    """Drop broken model output and inject deterministic traceability sections."""
    del message  # reserved for future intent-specific enrichment

    selection = context.get("selection") or {}
    source_refs = selection.get("sourceRefs") or selection.get("source_refs") or []
    support_state = str(selection.get("supportState") or selection.get("support_state") or "")

    cleaned: list[dict[str, Any]] = []
    for block in blocks:
        normalized = normalize_block(block) if isinstance(block, dict) else normalize_block({"type": "paragraph", "text": str(block)})
        if not _is_renderable(normalized):
            continue
        if normalized.get("type") == "paragraph" and _looks_garbled(_block_plain_text(normalized)):
            continue
        cleaned.append(normalized)

    cleaned = _strip_source_headings_without_content(cleaned)
    final = _remove_orphan_headings(cleaned)

    if source_refs and not _has_section(final, "source"):
        final.extend(
            [
                normalize_block({"type": "heading", "level": 2, "text": "Source traceability"}),
                normalize_block(
                    {
                        "type": "bullets",
                        "items": [_format_source_ref_line(ref) for ref in source_refs if isinstance(ref, dict)],
                    },
                ),
            ],
        )

    if support_state and not _has_section(final, "completeness"):
        support_label = SUPPORT_STATE_LABELS.get(support_state, support_state.replace("_", " "))
        final.extend(
            [
                normalize_block({"type": "heading", "level": 2, "text": "Completeness assessment"}),
                normalize_block(
                    {
                        "type": "paragraph",
                        "spans": [
                            {"text": "Support status: ", "style": "plain"},
                            {"text": support_label, "style": "bold"},
                            {"text": ".", "style": "plain"},
                        ],
                    },
                ),
                normalize_block({"type": "callout", "variant": "note", "text": _completeness_note(support_state)}),
            ],
        )

    if not any("not legal" in _block_plain_text(block).lower() for block in final):
        final.append(
            normalize_block(
                {
                    "type": "callout",
                    "variant": "note",
                    "text": "Preparation guidance only — not legal or filing advice.",
                },
            ),
        )

    if final:
        return final

    return [
        normalize_block(
            {
                "type": "callout",
                "variant": "note",
                "text": "Copilot could not produce a readable answer for this selection.",
            },
        ),
    ]
