"""Schema-v2 text block construction, ordering, and validation."""

from __future__ import annotations

import uuid
from typing import Any

from app.modules.company_incorporation.document_processing.coordinates import (
    COORDINATE_SPACE_NORMALIZED,
    BBox,
    validate_normalized_bbox,
)


def _bbox_dict(bbox: BBox | dict[str, float]) -> dict[str, float]:
    if isinstance(bbox, BBox):
        return bbox.as_dict()
    return {
        "x0": float(bbox["x0"]),
        "y0": float(bbox["y0"]),
        "x1": float(bbox["x1"]),
        "y1": float(bbox["y1"]),
    }


def make_block(
    *,
    block_type: str,
    text: str,
    bbox: BBox | dict[str, float],
    source_bbox: BBox | dict[str, float],
    source_coordinate_space: str,
    confidence: float | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "block_id": str(uuid.uuid4()),
        "order_index": -1,
        "type": block_type,
        "text": text,
        "bbox": _bbox_dict(bbox),
        "source_bbox": _bbox_dict(source_bbox),
        "source_coordinate_space": source_coordinate_space,
        "confidence": confidence,
    }
    if extra:
        for key, value in extra.items():
            if key not in payload:
                payload[key] = value
    return payload


def order_native_line_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Stable reading-ish order: top-to-bottom, then left-to-right."""

    def sort_key(block: dict[str, Any]) -> tuple[float, float, str]:
        bbox = block.get("bbox") or {}
        return (
            round(float(bbox.get("y0", 0.0)), 6),
            round(float(bbox.get("x0", 0.0)), 6),
            str(block.get("text") or ""),
        )

    ordered = sorted(blocks, key=sort_key)
    for index, block in enumerate(ordered):
        block["order_index"] = index
    return ordered


def order_ocr_word_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Prefer Tesseract hierarchy; fall back to vertical-then-horizontal."""

    def has_hierarchy(block: dict[str, Any]) -> bool:
        return all(
            key in block for key in ("page_num", "block_num", "par_num", "line_num", "word_num")
        )

    if blocks and all(has_hierarchy(block) for block in blocks):

        def hierarchy_key(block: dict[str, Any]) -> tuple[int, int, int, int, int]:
            return (
                int(block["page_num"]),
                int(block["block_num"]),
                int(block["par_num"]),
                int(block["line_num"]),
                int(block["word_num"]),
            )

        ordered = sorted(blocks, key=hierarchy_key)
    else:

        def geometry_key(block: dict[str, Any]) -> tuple[float, float, str]:
            bbox = block.get("bbox") or {}
            # Bucket by approximate line using y0 so words on a line stay together.
            return (
                round(float(bbox.get("y0", 0.0)) * 1000) / 1000,
                round(float(bbox.get("x0", 0.0)), 6),
                str(block.get("text") or ""),
            )

        ordered = sorted(blocks, key=geometry_key)

    for index, block in enumerate(ordered):
        block["order_index"] = index
    return ordered


def validate_schema_v2_blocks(blocks: list[Any] | None) -> bool:
    if blocks is None:
        return False
    if not isinstance(blocks, list):
        return False
    seen_ids: set[str] = set()
    indexes: list[int] = []
    for block in blocks:
        if not isinstance(block, dict):
            return False
        block_id = block.get("block_id")
        try:
            uuid.UUID(str(block_id))
        except (TypeError, ValueError):
            return False
        if block_id in seen_ids:
            return False
        seen_ids.add(str(block_id))
        try:
            order_index = int(block["order_index"])
        except (KeyError, TypeError, ValueError):
            return False
        indexes.append(order_index)
        if block.get("type") not in {"line", "word"}:
            return False
        if not isinstance(block.get("text"), str):
            return False
        if not validate_normalized_bbox(block.get("bbox") or {}):
            return False
        source_bbox = block.get("source_bbox")
        if not isinstance(source_bbox, dict):
            return False
        for key in ("x0", "y0", "x1", "y1"):
            if key not in source_bbox:
                return False
        if not block.get("source_coordinate_space"):
            return False
    if indexes != list(range(len(blocks))):
        return False
    return True


def page_is_evidence_contract_ready(
    *,
    output_schema_version: int,
    text_blocks: list[Any] | None,
    coordinate_metadata: dict[str, Any] | None,
) -> bool:
    if output_schema_version < 2:
        return False
    metadata = coordinate_metadata or {}
    if metadata.get("coordinate_space") != COORDINATE_SPACE_NORMALIZED:
        return False
    if metadata.get("canonical_orientation") != "upright":
        return False
    return validate_schema_v2_blocks(text_blocks)
