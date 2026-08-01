"""Shared datatypes for structured fact extraction."""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(frozen=True, slots=True)
class EvidenceCite:
    page_id: str
    block_id: str
    role: str


@dataclass(slots=True)
class CandidateFact:
    fact_key: str
    value_type: str
    raw_value: Any
    normalized_value: Any
    display_value: str
    extractor_kind: str
    validation_status: str
    evidence: list[EvidenceCite] = field(default_factory=list)
    support: str | None = None
    quality_signals: dict[str, Any] = field(default_factory=dict)
    ambiguity: str | None = None


class DocumentPageLike(Protocol):
    id: uuid.UUID
    page_number: int
    extraction_method: str
    average_ocr_confidence: float | None
    text: str
    text_blocks: list[Any]


@dataclass(slots=True)
class IndexedBlock:
    block_id: str
    page_id: str
    page_number: int
    order_index: int
    text: str
    bbox: dict[str, float]
    confidence: float | None
    extraction_method: str
    average_ocr_confidence: float | None


@dataclass(slots=True)
class IndexedPage:
    page_id: str
    page_number: int
    extraction_method: str
    average_ocr_confidence: float | None
    text: str
    blocks: list[IndexedBlock]


class PageBlockIndex:
    """Index evidence-ready pages and blocks by stable identifiers."""

    def __init__(self, pages: list[IndexedPage]) -> None:
        self.pages = sorted(pages, key=lambda page: page.page_number)
        self._pages_by_id = {page.page_id: page for page in self.pages}
        self._blocks_by_id: dict[str, IndexedBlock] = {}
        for page in self.pages:
            for block in page.blocks:
                self._blocks_by_id[block.block_id] = block

    @classmethod
    def from_pages(cls, pages: list[DocumentPageLike]) -> PageBlockIndex:
        indexed_pages: list[IndexedPage] = []
        for page in pages:
            page_id = str(page.id)
            blocks: list[IndexedBlock] = []
            for raw_block in page.text_blocks or []:
                if not isinstance(raw_block, dict):
                    continue
                block_id = str(raw_block.get("block_id") or raw_block.get("blockId") or "")
                try:
                    uuid.UUID(block_id)
                except (TypeError, ValueError):
                    continue
                text = raw_block.get("text")
                if not isinstance(text, str):
                    continue
                bbox = raw_block.get("bbox") or {}
                if not isinstance(bbox, dict):
                    bbox = {}
                try:
                    order_index = int(raw_block.get("order_index", raw_block.get("orderIndex", -1)))
                except (TypeError, ValueError):
                    order_index = -1
                confidence_raw = raw_block.get("confidence")
                confidence = float(confidence_raw) if confidence_raw is not None else None
                blocks.append(
                    IndexedBlock(
                        block_id=block_id,
                        page_id=page_id,
                        page_number=int(page.page_number),
                        order_index=order_index,
                        text=text,
                        bbox={
                            "x0": float(bbox.get("x0", 0.0)),
                            "y0": float(bbox.get("y0", 0.0)),
                            "x1": float(bbox.get("x1", 0.0)),
                            "y1": float(bbox.get("y1", 0.0)),
                        },
                        confidence=confidence,
                        extraction_method=str(page.extraction_method),
                        average_ocr_confidence=page.average_ocr_confidence,
                    )
                )
            indexed_pages.append(
                IndexedPage(
                    page_id=page_id,
                    page_number=int(page.page_number),
                    extraction_method=str(page.extraction_method),
                    average_ocr_confidence=page.average_ocr_confidence,
                    text=str(page.text or ""),
                    blocks=sorted(blocks, key=lambda block: block.order_index),
                )
            )
        return cls(indexed_pages)

    @property
    def combined_text(self) -> str:
        return "\n".join(page.text for page in self.pages if page.text)

    def get_page(self, page_id: str) -> IndexedPage | None:
        return self._pages_by_id.get(page_id)

    def get_block(self, block_id: str) -> IndexedBlock | None:
        return self._blocks_by_id.get(block_id)

    def block_exists(self, block_id: str) -> bool:
        return block_id in self._blocks_by_id

    def block_text(self, block_id: str) -> str:
        block = self.get_block(block_id)
        return block.text if block else ""

    def evidence_text(self, block_ids: list[str]) -> str:
        return " ".join(self.block_text(block_id) for block_id in block_ids if block_id)

    def page_text_hash(self, page: IndexedPage) -> str:
        return hashlib.sha256(page.text.encode("utf-8")).hexdigest()

    def block_text_hash(self, block: IndexedBlock) -> str:
        payload = f"{block.block_id}:{block.text.strip()}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
