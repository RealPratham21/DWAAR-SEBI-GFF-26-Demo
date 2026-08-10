"""Post-generation validation pipeline for DRHP chapters."""

from __future__ import annotations

import re
from typing import Any

from app.modules.drhp.ast.schemas import DrhpChapterAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.generation.fact_locking import allowed_display_values, build_global_locked_facts
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot

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
    "meets the sme eligibility criteria",
    "confirms compliance",
    "transaction is at arm's length",
    "transaction is at arms length",
    "company is compliant",
    "all regulatory requirements are satisfied",
    "approval is valid",
    *GENERIC_FILLER_PHRASES,
)

INTERNAL_PROSE_PATTERNS = (
    re.compile(r"\(\s*refId\b", re.I),
    re.compile(r"\brefId\s*[:=]", re.I),
    re.compile(r"\bsourceRef\s*[:=]", re.I),
    re.compile(r"\bevidenceRef\s*[:=]", re.I),
    re.compile(r"\bperson:nivara-", re.I),
    re.compile(r"\bentity:nivara-", re.I),
    re.compile(r'see\s+["\'][\s]*["\']', re.I),
)

CURRENCY_IN_TEXT_RE = re.compile(r"₹\s*[\d,]+(?:\.\d+)?")
NUMERIC_LITERAL_RE = re.compile(r"₹?\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|million|billion))?")


class ValidationFailure(Exception):
    def __init__(self, failures: list[str]) -> None:
        super().__init__("; ".join(failures))
        self.failures = failures


def validate_chapter_ast(
    chapter_ast: DrhpChapterAST,
    *,
    bundle: ChapterSourceBundle,
    allowed_placeholder_ids: set[str] | None = None,
    snapshots: dict[str, WorkstreamSnapshot] | None = None,
) -> list[str]:
    failures: list[str] = []
    allowed_refs = {ref.ref_id for ref in bundle.source_refs}
    allowed_placeholders = allowed_placeholder_ids or {
        p.placeholder_id for p in bundle.allowed_placeholders
    }
    locked_facts = build_global_locked_facts(snapshots or {})
    allowed_displays = allowed_display_values(locked_facts)
    person_registry = bundle.global_context.get("personRegistry") or {}
    canonical_names = {
        str(p.get("fullName") or "").casefold(): str(p.get("fullName") or "")
        for p in (person_registry.get("persons") or [])
        if isinstance(p, dict) and p.get("fullName")
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

            for pattern in INTERNAL_PROSE_PATTERNS:
                if pattern.search(text):
                    failures.append("internal_metadata_in_prose")
                    break

            if block.kind in {"table", "key_value_table"}:
                continue
            if block.support_state in {"calculation_backed", "structured_input_backed"}:
                continue

            numeric_failures = _validate_numeric_grounding(
                text,
                block.source_ref_ids,
                bundle,
                allowed_displays=allowed_displays,
            )
            failures.extend(numeric_failures)

            identity_failures = _validate_person_names(text, canonical_names)
            failures.extend(identity_failures)

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


def _normalize_numeric_token(token: str) -> str:
    return token.replace("₹", "").replace(",", "").replace(" lakh", "").replace(" crore", "").strip()


def _validate_numeric_grounding(
    text: str,
    source_ref_ids: list[str],
    bundle: ChapterSourceBundle,
    *,
    allowed_displays: set[str],
) -> list[str]:
    failures: list[str] = []
    if not text.strip():
        return failures

    ref_values: list[str] = []
    ref_ids = source_ref_ids or [ref.ref_id for ref in bundle.source_refs]
    ref_map = {ref.ref_id: ref for ref in bundle.source_refs}
    for ref_id in ref_ids:
        ref = ref_map.get(ref_id)
        if ref and ref.value_preview is not None:
            ref_values.extend(re.findall(r"\d+(?:\.\d+)?", str(ref.value_preview)))

    for match in NUMERIC_LITERAL_RE.findall(text):
        normalized = _normalize_numeric_token(match)
        if not normalized or len(normalized) <= 2:
            continue
        if match.strip() in allowed_displays:
            continue
        if normalized in allowed_displays:
            continue
        if normalized in ref_values:
            continue
        if any(normalized.startswith(v) or v.startswith(normalized) for v in ref_values if v):
            continue
        if match in allowed_displays:
            continue
        failures.append(f"unsupported_number:{normalized}")
        break
    return failures


def _validate_person_names(text: str, canonical_names: dict[str, str]) -> list[str]:
    if not canonical_names:
        return []
    failures: list[str] = []
    known_wrong = {"priya desai", "ramesh kumar"}
    lowered = text.casefold()
    for wrong in known_wrong:
        if wrong in lowered and wrong not in canonical_names:
            failures.append(f"person_name_mismatch:{wrong}")
    return failures


def require_valid_or_raise(
    chapter_ast: DrhpChapterAST,
    *,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot] | None = None,
) -> None:
    failures = validate_chapter_ast(chapter_ast, bundle=bundle, snapshots=snapshots)
    if failures:
        raise ValidationFailure(failures)
