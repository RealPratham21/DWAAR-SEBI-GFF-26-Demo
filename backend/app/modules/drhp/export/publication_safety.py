"""Pre-export publication safety scan for prohibited visible artifacts."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpChapterAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN

PROHIBITED_VISIBLE_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\brefId\b", re.I), "refId"),
    (re.compile(r"\bsourceRef\b", re.I), "sourceRef"),
    (re.compile(r"\bevidenceRef\b", re.I), "evidenceRef"),
    (re.compile(r"\bperson:nivara-", re.I), "internal_person_id"),
    (re.compile(r"\bentity:nivara-", re.I), "internal_entity_id"),
    (re.compile(r"\{'[^']+':", re.I), "python_dict_repr"),
    (re.compile(r'\{"[^"]+":', re.I), "json_object_repr"),
    (re.compile(r"\[object Object\]", re.I), "object_object"),
    (re.compile(r'see\s+["\'][\s]*["\']', re.I), "empty_cross_reference"),
    (re.compile(r"\b(undefined|null)\b"), "nullish_string"),
    (re.compile(r"\b(NaN|Infinity)\b"), "invalid_number"),
)


def _collect_visible_strings(chapter: DrhpChapterAST) -> list[str]:
    texts: list[str] = []
    for section in chapter.sections:
        if section.heading:
            texts.append(section.heading)
        for block in section.blocks:
            content = block.content or {}
            if block.kind in {"paragraph", "heading", "legal_notice", "placeholder"}:
                texts.append(str(content.get("text") or content.get("reason") or ""))
            elif block.kind in {"bullet_list", "numbered_list", "list"}:
                texts.extend(str(item) for item in (content.get("items") or []))
            elif block.kind in {"table", "key_value_table"}:
                texts.extend(str(cell) for row in (content.get("rows") or []) for cell in row)
            elif block.kind == "cross_reference":
                texts.append(str(content.get("displayText") or content.get("display_text") or ""))
    return texts


def scan_chapter_for_publication_issues(chapter: DrhpChapterAST) -> list[str]:
    warnings: list[str] = []
    for text in _collect_visible_strings(chapter):
        if not text or text.strip() == PLACEHOLDER_TOKEN:
            continue
        for pattern, code in PROHIBITED_VISIBLE_PATTERNS:
            if pattern.search(text):
                warnings.append(f"{chapter.chapter_key}:{code}")
                break
    return warnings


def scan_document_chapters(chapters: list[DrhpChapterAST]) -> list[str]:
    warnings: list[str] = []
    for chapter in chapters:
        warnings.extend(scan_chapter_for_publication_issues(chapter))
    return warnings
