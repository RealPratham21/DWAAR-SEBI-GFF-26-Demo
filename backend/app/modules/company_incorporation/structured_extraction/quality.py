"""Quality scoring for structured extraction candidates."""

from __future__ import annotations

from typing import Any

from app.modules.company_incorporation.structured_extraction.constants import (
    ExtractorKind,
    QualityCategory,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    PageBlockIndex,
)


def score_candidate(
    candidate: CandidateFact,
    block_index: PageBlockIndex,
) -> tuple[float, str, dict[str, Any]]:
    """Score extraction quality for a candidate fact.

    Formula:
    - Start at 0.4 base score
    - +0.25 when any evidence block comes from native_text extraction
    - +0.15 when average OCR confidence for OCR evidence blocks is >= 80
    - +0.20 when extractor is deterministic/hybrid and validation_status is valid
    - +0.10 when more than one evidence block is attached
    - -0.20 when support is ambiguous/uncertain or ambiguity is set
    - Clamp final score to [0.0, 1.0]

    Categories:
    - high >= 0.8
    - medium >= 0.6
    - low >= 0.4
    - otherwise review_required
    """

    score = 0.4
    signals: dict[str, Any] = {}

    evidence_blocks = [block_index.get_block(cite.block_id) for cite in candidate.evidence]
    evidence_blocks = [block for block in evidence_blocks if block is not None]

    if any(block.extraction_method == "native_text" for block in evidence_blocks):
        score += 0.25
        signals["native_text_evidence"] = True

    ocr_confidences = [
        block.average_ocr_confidence
        for block in evidence_blocks
        if block.extraction_method == "ocr" and block.average_ocr_confidence is not None
    ]
    if ocr_confidences:
        avg_conf = sum(ocr_confidences) / len(ocr_confidences)
        signals["average_ocr_confidence"] = avg_conf
        if avg_conf >= 80:
            score += 0.15

    if candidate.extractor_kind in {ExtractorKind.DETERMINISTIC, ExtractorKind.HYBRID}:
        if candidate.validation_status == ValidationStatus.VALID:
            score += 0.20
            signals["deterministic_valid"] = True

    if len(candidate.evidence) > 1:
        score += 0.10
        signals["multiple_evidence_blocks"] = len(candidate.evidence)

    if candidate.support in {"ambiguous", "uncertain"} or candidate.ambiguity:
        score -= 0.20
        signals["ambiguous"] = True

    score = max(0.0, min(1.0, score))
    category = _category_for_score(score)
    return score, category, signals


def _category_for_score(score: float) -> str:
    if score >= 0.8:
        return QualityCategory.HIGH
    if score >= 0.6:
        return QualityCategory.MEDIUM
    if score >= 0.4:
        return QualityCategory.LOW
    return QualityCategory.REVIEW_REQUIRED
