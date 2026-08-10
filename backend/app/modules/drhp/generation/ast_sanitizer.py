"""Post-generation AST sanitization — visible prose hygiene without losing provenance metadata."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.generation.fact_locking import build_entity_name_index, build_person_name_index

INTERNAL_VISIBLE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\(\s*refId\s+[^)]+\)", re.I),
    re.compile(r"\(\s*refId\s*:\s*[^)]+\)", re.I),
    re.compile(r"\brefId\s*[:=]\s*\S+", re.I),
    re.compile(r"\bsourceRef\s*[:=]\s*\S+", re.I),
    re.compile(r"\bevidenceRef\s*[:=]\s*\S+", re.I),
    re.compile(r"\bperson:nivara-[a-z0-9-]+\b", re.I),
    re.compile(r"\bentity:nivara-[a-z0-9-]+\b", re.I),
    re.compile(r"\b(person|entity):[a-z0-9-]+\b", re.I),
    re.compile(r"\bsrc:[a-f0-9:]+\b", re.I),
    re.compile(r"\bblk-[a-f0-9-]+\b", re.I),
    re.compile(r"\[object Object\]", re.I),
    re.compile(r"\b(undefined|null|NaN|Infinity)\b"),
)

EMPTY_CROSS_REF_RE = re.compile(r'see\s+["\'][\s]*["\']', re.I)
UNSUPPORTED_CONCLUSION_REPLACEMENTS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"\bthe issuer meets the sme eligibility criteria\b", re.I),
        "The information provided indicates eligibility-related metrics disclosed in this document",
    ),
    (
        re.compile(r"\bconfirms compliance\b", re.I),
        "Based on the information currently available, the issuer has represented compliance-related matters",
    ),
    (
        re.compile(r"\btransaction is at arm'?s length\b", re.I),
        "The issuer has represented the pricing basis for the transaction",
    ),
    (
        re.compile(r"\bcompany is compliant\b", re.I),
        "The issuer has represented matters relating to compliance",
    ),
    (
        re.compile(r"\ball regulatory requirements are satisfied\b", re.I),
        "Final regulatory requirements will be assessed in accordance with applicable requirements",
    ),
    (
        re.compile(r"\bapproval is valid\b", re.I),
        "The disclosed approval status is as stated by the issuer",
    ),
    (
        re.compile(r"\bno material impact\b", re.I),
        "The issuer has indicated that the matter may not be material based on information currently available",
    ),
)


def sanitize_visible_text(text: str, *, person_index: dict[str, str] | None = None) -> str:
    cleaned = text.strip()
    for pattern in INTERNAL_VISIBLE_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    for pattern, replacement in UNSUPPORTED_CONCLUSION_REPLACEMENTS:
        cleaned = pattern.sub(replacement, cleaned)
    if EMPTY_CROSS_REF_RE.search(cleaned):
        cleaned = EMPTY_CROSS_REF_RE.sub("", cleaned)
    if person_index:
        for alias, canonical in person_index.items():
            if alias.startswith("person:"):
                continue
            if alias and alias != canonical.casefold():
                cleaned = re.sub(rf"\b{re.escape(alias.title())}\b", canonical, cleaned, flags=re.I)
                cleaned = re.sub(rf"\b{re.escape(alias)}\b", canonical, cleaned, flags=re.I)
    return " ".join(cleaned.split())


def _sanitize_block_content(
    block: DrhpBlockAST,
    *,
    person_index: dict[str, str],
    allowed_displays: set[str],
) -> DrhpBlockAST:
    content = dict(block.content or {})
    kind = block.kind

    if kind in {"paragraph", "heading", "legal_notice", "placeholder"}:
        text = sanitize_visible_text(str(content.get("text") or content.get("reason") or ""), person_index=person_index)
        if not text and kind == "cross_reference":
            return block.model_copy(update={"kind": "paragraph", "content": {"text": ""}})
        return block.model_copy(update={"content": {**content, "text": text}})

    if kind in {"bullet_list", "numbered_list", "list"}:
        items = [
            sanitize_visible_text(str(item), person_index=person_index)
            for item in (content.get("items") or [])
        ]
        items = [item for item in items if item]
        return block.model_copy(update={"content": {**content, "items": items}})

    if kind in {"table", "key_value_table"}:
        rows = []
        for row in content.get("rows") or []:
            if isinstance(row, list):
                rows.append([sanitize_visible_text(str(cell), person_index=person_index) for cell in row])
            else:
                rows.append(row)
        return block.model_copy(update={"content": {**content, "rows": rows}})

    if kind == "cross_reference":
        display = sanitize_visible_text(
            str(content.get("displayText") or content.get("display_text") or ""),
            person_index=person_index,
        )
        target = str(content.get("targetChapterKey") or content.get("target_chapter_key") or "").strip()
        if not display and not target:
            return block.model_copy(update={"kind": "paragraph", "content": {"text": ""}})
        if EMPTY_CROSS_REF_RE.search(display):
            display = ""
        if not display and not target:
            return block.model_copy(update={"kind": "paragraph", "content": {"text": ""}})
        return block.model_copy(update={"content": {**content, "displayText": display}})

    return block


def _section_has_content(section: DrhpSectionAST) -> bool:
    for block in section.blocks:
        content = block.content or {}
        if block.kind in {"paragraph", "legal_notice", "placeholder"}:
            text = str(content.get("text") or content.get("reason") or "").strip()
            if text and text != PLACEHOLDER_TOKEN:
                return True
            continue
        if block.kind in {"bullet_list", "numbered_list", "list"}:
            items = [str(i).strip() for i in (content.get("items") or []) if str(i).strip()]
            if items:
                return True
            continue
        if block.kind in {"table", "key_value_table"}:
            rows = content.get("rows") or []
            if rows:
                return True
            continue
        if block.kind == "heading":
            continue
        if block.kind == "page_break":
            continue
        return True
    return False


def sanitize_chapter_ast(
    chapter: DrhpChapterAST,
    *,
    global_context: dict[str, Any] | None = None,
    allowed_displays: set[str] | None = None,
    content_plan: Any = None,
    allow_placeholder_sections: set[str] | None = None,
) -> DrhpChapterAST:
    context = global_context or {}
    person_index = build_person_name_index(context.get("personRegistry") or {})
    entity_index = build_entity_name_index(context.get("entityRegistry") or {})
    person_index.update(entity_index)

    missing_keys: set[str] = set(allow_placeholder_sections or set())
    if content_plan is not None:
        missing_keys.update(item.section_key for item in content_plan.missing_items() if item.required)

    sections: list[DrhpSectionAST] = []
    for section in chapter.sections:
        blocks: list[DrhpBlockAST] = []
        for block in section.blocks:
            sanitized = _sanitize_block_content(
                block,
                person_index=person_index,
                allowed_displays=allowed_displays or set(),
            )
            if sanitized.kind == "paragraph":
                text = str((sanitized.content or {}).get("text") or "").strip()
                if not text:
                    continue
            blocks.append(sanitized)
        if not blocks:
            continue
        if not _section_has_content(section.model_copy(update={"blocks": blocks})):
            if section.section_key in missing_keys and section.heading:
                blocks = [
                    DrhpBlockAST(
                        block_id=f"blk-placeholder-{section.section_key}",
                        kind="placeholder",
                        order=1,
                        content={"text": PLACEHOLDER_TOKEN, "reason": "Pending disclosure"},
                        source_ref_ids=[],
                        support_state="placeholder",
                    )
                ]
            else:
                continue
        sections.append(section.model_copy(update={"blocks": blocks}))
    return chapter.model_copy(update={"sections": sections})
