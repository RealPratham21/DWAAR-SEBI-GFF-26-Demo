"""Label-proximity extraction over evidence-ready page blocks."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from typing import Any

from app.modules.company_incorporation.structured_extraction.registry import (
    FACT_REGISTRY,
    get_fact,
)

_DEFAULT_SAME_LINE_Y_TOLERANCE = 0.012
_DEFAULT_RIGHT_X_GAP = 0.35
_DEFAULT_BELOW_Y_GAP = 0.045
_DEFAULT_BELOW_X_TOLERANCE = 0.18
_LABEL_SUFFIX_RE = re.compile(r"[:.\-–—]\s*$")
_HEADER_LIKE_RE = re.compile(r"^[A-Z0-9][A-Z0-9\s\-–—/()]{2,60}$")
_SHORT_ALIAS_MAX_LEN = 4


@dataclass(frozen=True, slots=True)
class BlockView:
    block_id: str
    page_number: int
    order_index: int
    text: str
    bbox: dict[str, float]
    block_type: str = "line"


@dataclass(frozen=True, slots=True)
class LabelValueCandidate:
    label_block_id: str
    value_block_id: str
    label_text: str
    value_text: str
    page_number: int
    proximity: str
    score: float
    suggested_fact_keys: tuple[str, ...] = field(default_factory=tuple)


def find_label_value_pairs(
    pages_blocks: list[dict[str, Any]] | dict[int | str, list[dict[str, Any]]],
    *,
    fact_keys: list[str] | None = None,
    label_aliases: dict[str, list[str]] | None = None,
) -> list[LabelValueCandidate]:
    """Find label/value block pairs using aliases and geometric proximity."""

    blocks = _flatten_pages_blocks(pages_blocks)
    if not blocks:
        return []

    alias_map = _build_alias_map(fact_keys=fact_keys, label_aliases=label_aliases)
    if not alias_map:
        return []

    candidates: list[LabelValueCandidate] = []
    for label_block in blocks:
        label_norm = _normalize_label(label_block.text)
        if not label_norm:
            continue
        matched_fact_keys = _match_fact_keys(label_norm, alias_map)
        if not matched_fact_keys:
            continue

        best_by_fact: dict[str, LabelValueCandidate] = {}
        for value_block, proximity, score in _candidate_values_for_label(label_block, blocks):
            value_text = value_block.text.strip()
            if not value_text or value_text == label_block.text.strip():
                continue
            value_norm = _normalize_label(value_text)
            if value_norm in alias_map or _looks_like_label_header(value_text, alias_map):
                continue
            for fact_key in matched_fact_keys:
                candidate = LabelValueCandidate(
                    label_block_id=label_block.block_id,
                    value_block_id=value_block.block_id,
                    label_text=label_block.text.strip(),
                    value_text=value_text,
                    page_number=label_block.page_number,
                    proximity=proximity,
                    score=score,
                    suggested_fact_keys=(fact_key,),
                )
                existing = best_by_fact.get(fact_key)
                if existing is None or candidate.score > existing.score:
                    best_by_fact[fact_key] = candidate
        candidates.extend(best_by_fact.values())

    return _dedupe_candidates(candidates)


def blocks_to_views(
    pages_blocks: list[dict[str, Any]] | dict[int | str, list[dict[str, Any]]],
) -> list[BlockView]:
    return _flatten_pages_blocks(pages_blocks)


def _flatten_pages_blocks(
    pages_blocks: list[dict[str, Any]] | dict[int | str, list[dict[str, Any]]],
) -> list[BlockView]:
    views: list[BlockView] = []

    if isinstance(pages_blocks, dict):
        page_items = sorted(pages_blocks.items(), key=lambda item: int(item[0]))
        for page_number, blocks in page_items:
            views.extend(_blocks_for_page(blocks, int(page_number)))
        return sorted(views, key=lambda block: (block.page_number, block.order_index))

    for page in pages_blocks:
        if not isinstance(page, dict):
            continue
        page_number = int(page.get("page_number") or page.get("pageNumber") or 0)
        blocks = page.get("blocks") or page.get("text_blocks") or page.get("textBlocks") or []
        views.extend(_blocks_for_page(blocks, page_number))

    return sorted(views, key=lambda block: (block.page_number, block.order_index))


def _blocks_for_page(blocks: list[dict[str, Any]], page_number: int) -> list[BlockView]:
    views: list[BlockView] = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        block_id = str(block.get("block_id") or block.get("blockId") or "")
        try:
            uuid.UUID(block_id)
        except (TypeError, ValueError):
            continue
        text = block.get("text")
        if not isinstance(text, str) or not text.strip():
            continue
        bbox = block.get("bbox") or {}
        if not isinstance(bbox, dict):
            continue
        try:
            order_index = int(block.get("order_index", block.get("orderIndex", -1)))
        except (TypeError, ValueError):
            order_index = -1
        views.append(
            BlockView(
                block_id=block_id,
                page_number=page_number,
                order_index=order_index,
                text=text,
                bbox={
                    "x0": float(bbox.get("x0", 0.0)),
                    "y0": float(bbox.get("y0", 0.0)),
                    "x1": float(bbox.get("x1", 0.0)),
                    "y1": float(bbox.get("y1", 0.0)),
                },
                block_type=str(block.get("type") or "line"),
            )
        )
    return views


def _build_alias_map(
    *,
    fact_keys: list[str] | None,
    label_aliases: dict[str, list[str]] | None,
) -> dict[str, tuple[str, ...]]:
    alias_map: dict[str, tuple[str, ...]] = {}

    selected_keys = fact_keys or list(FACT_REGISTRY.keys())
    for fact_key in selected_keys:
        definition = get_fact(fact_key)
        aliases = list(definition.label_aliases)
        if label_aliases and fact_key in label_aliases:
            aliases.extend(label_aliases[fact_key])
        for alias in aliases:
            norm = _normalize_label(alias)
            if not norm:
                continue
            existing = alias_map.get(norm, ())
            if fact_key not in existing:
                alias_map[norm] = (*existing, fact_key)

    return alias_map


def _match_fact_keys(label_norm: str, alias_map: dict[str, tuple[str, ...]]) -> tuple[str, ...]:
    if label_norm in alias_map:
        return alias_map[label_norm]

    # Sentence-length blocks are values/prose, not labels.
    if len(label_norm) > 48 or label_norm.count(" ") > 6:
        return ()

    partial: list[str] = []
    for alias_norm, fact_keys in alias_map.items():
        if len(alias_norm) <= _SHORT_ALIAS_MAX_LEN:
            # Avoid substring traps such as "act"/"cin" matching unrelated labels.
            if re.search(rf"\b{re.escape(alias_norm)}\b", label_norm):
                partial.extend(fact_keys)
            continue
        if alias_norm == label_norm:
            partial.extend(fact_keys)
            continue
        if alias_norm in label_norm and len(label_norm) <= len(alias_norm) + 24:
            partial.extend(fact_keys)
            continue
        if label_norm in alias_norm and len(alias_norm) <= len(label_norm) + 12:
            partial.extend(fact_keys)
    if not partial:
        return ()
    return tuple(dict.fromkeys(partial))


def _looks_like_label_header(value_text: str, alias_map: dict[str, tuple[str, ...]]) -> bool:
    text = value_text.strip()
    if not text:
        return True
    norm = _normalize_label(text)
    if norm in alias_map:
        return True
    if _HEADER_LIKE_RE.match(text) and " " in text and not re.search(r"\d{4}", text):
        return True
    if text.isupper() and len(text.split()) <= 4 and not re.search(r"\d{6,}", text):
        return True
    return False


def _candidate_values_for_label(
    label_block: BlockView,
    blocks: list[BlockView],
) -> list[tuple[BlockView, str, float]]:
    results: list[tuple[BlockView, str, float]] = []
    label_bbox = label_block.bbox

    for block in blocks:
        if block.block_id == label_block.block_id:
            continue
        if block.page_number != label_block.page_number:
            continue

        value_bbox = block.bbox
        same_line = abs(value_bbox["y0"] - label_bbox["y0"]) <= _DEFAULT_SAME_LINE_Y_TOLERANCE
        right_side = (
            value_bbox["x0"] >= label_bbox["x1"] - 0.01
            and (value_bbox["x0"] - label_bbox["x1"]) <= _DEFAULT_RIGHT_X_GAP
            and same_line
        )
        if right_side:
            gap = max(value_bbox["x0"] - label_bbox["x1"], 0.0)
            score = 1.0 - min(gap / _DEFAULT_RIGHT_X_GAP, 1.0)
            results.append((block, "right", score))
            continue

        inline_after = same_line and block.order_index == label_block.order_index + 1
        if inline_after:
            results.append((block, "same_line", 0.95))
            continue

        below = (
            value_bbox["y0"] >= label_bbox["y1"] - 0.005
            and (value_bbox["y0"] - label_bbox["y1"]) <= _DEFAULT_BELOW_Y_GAP
            and abs(value_bbox["x0"] - label_bbox["x0"]) <= _DEFAULT_BELOW_X_TOLERANCE
        )
        if below:
            gap = max(value_bbox["y0"] - label_bbox["y1"], 0.0)
            score = 0.9 - min(gap / _DEFAULT_BELOW_Y_GAP, 1.0) * 0.4
            order_bonus = 0.05 if block.order_index == label_block.order_index + 1 else 0.0
            results.append((block, "below", score + order_bonus))

    results.sort(key=lambda item: (-item[2], item[0].order_index))
    return results


def _dedupe_candidates(candidates: list[LabelValueCandidate]) -> list[LabelValueCandidate]:
    best: dict[tuple[str, str], LabelValueCandidate] = {}
    for candidate in candidates:
        key = (candidate.label_block_id, candidate.value_block_id)
        existing = best.get(key)
        if existing is None or candidate.score > existing.score:
            best[key] = candidate
    ordered = sorted(
        best.values(), key=lambda item: (-item.score, item.page_number, item.label_text)
    )
    return ordered


def _normalize_label(text: str) -> str:
    cleaned = _LABEL_SUFFIX_RE.sub("", text.strip().casefold())
    return re.sub(r"\s+", " ", cleaned)
