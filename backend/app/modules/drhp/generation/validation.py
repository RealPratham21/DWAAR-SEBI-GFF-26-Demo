"""Post-generation validation pipeline for DRHP chapters."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpChapterAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.sources.models import ChapterSourceBundle

from app.modules.drhp.generation.structured_narrative import GENERIC_FILLER_PHRASES

PROHIBITED_PHRASES = (
    "no legal risk",
    "fully compliant",
    "regulator approved",
    "guaranteed growth",
    "market leader",
    "valid licence",
    "all relevant provisions of the companies act",
    "have been complied with",
    *GENERIC_FILLER_PHRASES,
)


class ValidationFailure(Exception):
    def __init__(self, failures: list[str]) -> None:
        super().__init__("; ".join(failures))
        self.failures = failures


def validate_chapter_ast(
    chapter_ast: DrhpChapterAST,
    *,
    bundle: ChapterSourceBundle,
    allowed_placeholder_ids: set[str] | None = None,
) -> list[str]:
    failures: list[str] = []
    allowed_refs = {ref.ref_id for ref in bundle.source_refs}
    allowed_placeholders = allowed_placeholder_ids or {
        p.placeholder_id for p in bundle.allowed_placeholders
    }

    for section in chapter_ast.sections:
        for block in section.blocks:
            for ref_id in block.source_ref_ids:
                if ref_id not in allowed_refs:
                    failures.append(f"unknown_source_ref:{ref_id}")

            text = _block_text(block.content)
            if PLACEHOLDER_TOKEN in text:
                if not allowed_placeholders and "placeholder" not in block.support_state:
                    failures.append("unauthorized_placeholder")

            for phrase in PROHIBITED_PHRASES:
                if phrase in text.lower():
                    failures.append(f"prohibited_claim:{phrase}")

            if block.kind in {"table", "key_value_table"}:
                continue
            if block.support_state in {"calculation_backed", "structured_input_backed"}:
                continue

            numeric_failures = _validate_numeric_grounding(text, block.source_ref_ids, bundle)
            failures.extend(numeric_failures)

    return failures


def _block_text(content: dict[str, Any]) -> str:
    if not content:
        return ""
    if "text" in content:
        return str(content["text"])
    if "items" in content:
        return " ".join(str(item) for item in content["items"])
    if "rows" in content:
        return " ".join(" ".join(str(c) for c in row) for row in content["rows"])
    return str(content)


def _validate_numeric_grounding(
    text: str,
    source_ref_ids: list[str],
    bundle: ChapterSourceBundle,
) -> list[str]:
    failures: list[str] = []
    numbers_in_text = set(re.findall(r"\d+(?:\.\d+)?", text))
    if not numbers_in_text:
        return failures

    ref_values: list[str] = []
    ref_ids = source_ref_ids or [ref.ref_id for ref in bundle.source_refs]
    ref_map = {ref.ref_id: ref for ref in bundle.source_refs}
    for ref_id in ref_ids:
        ref = ref_map.get(ref_id)
        if ref and ref.value_preview is not None:
            ref_values.extend(re.findall(r"\d+(?:\.\d+)?", str(ref.value_preview)))

    if not ref_values and numbers_in_text and len(numbers_in_text) > 2:
        failures.append("unsupported_numeric_claim")
        return failures

    for num in numbers_in_text:
        if num in ref_values:
            continue
        if any(num.startswith(v) or v.startswith(num) for v in ref_values if v):
            continue
        if len(num) <= 2:
            continue
        failures.append(f"unsupported_number:{num}")
        break
    return failures


def require_valid_or_raise(
    chapter_ast: DrhpChapterAST,
    *,
    bundle: ChapterSourceBundle,
) -> None:
    failures = validate_chapter_ast(chapter_ast, bundle=bundle)
    if failures:
        raise ValidationFailure(failures)
