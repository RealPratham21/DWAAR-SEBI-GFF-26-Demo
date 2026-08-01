"""Deterministic merge of semantic and rule-based extraction candidates."""

from __future__ import annotations

import re
from typing import Any

from app.modules.company_incorporation.structured_extraction.constants import (
    ExtractorKind,
    FactValueType,
)
from app.modules.company_incorporation.structured_extraction.normalize import (
    fingerprint_value,
    normalize_identifier,
    normalize_legal_name,
)
from app.modules.company_incorporation.structured_extraction.registry import get_fact
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    EvidenceCite,
    PageBlockIndex,
)


def merge_candidates(
    deterministic: list[CandidateFact],
    semantic: list[CandidateFact],
    block_index: PageBlockIndex,
) -> tuple[list[CandidateFact], list[dict[str, Any]]]:
    """Merge deterministic and semantic candidates with evidence validation."""

    audit_events: list[dict[str, Any]] = []
    verified_semantic = [
        candidate
        for candidate in semantic
        if _semantic_candidate_is_verified(candidate, block_index, audit_events)
    ]

    deterministic_by_key = {candidate.fact_key: candidate for candidate in deterministic}
    semantic_by_key = {candidate.fact_key: candidate for candidate in verified_semantic}
    merged: dict[str, CandidateFact] = {}

    all_keys = set(deterministic_by_key) | set(semantic_by_key)
    for fact_key in all_keys:
        det = deterministic_by_key.get(fact_key)
        sem = semantic_by_key.get(fact_key)
        if det and sem:
            if _values_agree(det, sem):
                merged[fact_key] = _to_hybrid(det, sem)
            elif get_fact(fact_key).value_type == FactValueType.IDENTIFIER:
                merged[fact_key] = det
                audit_events.append(
                    {
                        "event": "extractor_disagreement",
                        "fact_key": fact_key,
                        "kept": ExtractorKind.DETERMINISTIC,
                        "deterministic_value": det.normalized_value,
                        "semantic_value": sem.normalized_value,
                    }
                )
            else:
                merged[fact_key] = _prefer_richer_candidate(det, sem)
                audit_events.append(
                    {
                        "event": "extractor_disagreement",
                        "fact_key": fact_key,
                        "kept": merged[fact_key].extractor_kind,
                        "deterministic_value": det.normalized_value,
                        "semantic_value": sem.normalized_value,
                    }
                )
        elif det:
            merged[fact_key] = det
        elif sem:
            merged[fact_key] = sem

    return list(merged.values()), audit_events


def _semantic_candidate_is_verified(
    candidate: CandidateFact,
    block_index: PageBlockIndex,
    audit_events: list[dict[str, Any]],
) -> bool:
    if not candidate.evidence:
        audit_events.append(
            {
                "event": "semantic_rejected",
                "fact_key": candidate.fact_key,
                "reason": "missing_evidence",
            }
        )
        return False

    block_ids = [cite.block_id for cite in candidate.evidence]
    if any(not block_index.block_exists(block_id) for block_id in block_ids):
        audit_events.append(
            {
                "event": "semantic_rejected",
                "fact_key": candidate.fact_key,
                "reason": "unknown_evidence_block",
                "block_ids": block_ids,
            }
        )
        return False

    if not _evidence_supports_value(candidate, block_index):
        audit_events.append(
            {
                "event": "semantic_rejected",
                "fact_key": candidate.fact_key,
                "reason": "evidence_text_mismatch",
                "block_ids": block_ids,
            }
        )
        return False
    return True


def _evidence_supports_value(candidate: CandidateFact, block_index: PageBlockIndex) -> bool:
    evidence_text = block_index.evidence_text([cite.block_id for cite in candidate.evidence])
    if not evidence_text.strip():
        return False

    needles = _value_needles(candidate)
    haystack = evidence_text.casefold()
    return any(needle and needle in haystack for needle in needles)


def _value_needles(candidate: CandidateFact) -> list[str]:
    value_type = candidate.value_type
    if value_type == FactValueType.IDENTIFIER:
        normalized = normalize_identifier(str(candidate.normalized_value or ""))
        return [normalized.casefold()] if normalized else []
    if value_type == FactValueType.DATE:
        text = str(candidate.normalized_value or candidate.display_value or "")
        return [text.casefold()] if text else []
    if value_type == FactValueType.ADDRESS and isinstance(candidate.normalized_value, dict):
        needles: list[str] = []
        for key in ("pinCode", "city", "locality", "fullAddress", "addressLine1"):
            component = candidate.normalized_value.get(key)
            if component:
                needles.append(str(component).casefold())
        return needles
    if value_type == FactValueType.STRING and candidate.fact_key.endswith("legalName"):
        normalized = normalize_legal_name(candidate.normalized_value)
        return [normalized] if normalized else []
    text = str(candidate.display_value or candidate.normalized_value or "")
    collapsed = re.sub(r"\s+", " ", text.strip()).casefold()
    if len(collapsed) >= 12:
        return [collapsed[:80], collapsed]
    return [collapsed] if collapsed else []


def _values_agree(left: CandidateFact, right: CandidateFact) -> bool:
    return fingerprint_value(left.normalized_value) == fingerprint_value(right.normalized_value)


def _to_hybrid(det: CandidateFact, sem: CandidateFact) -> CandidateFact:
    evidence = _merge_evidence(det.evidence, sem.evidence)
    return CandidateFact(
        fact_key=det.fact_key,
        value_type=det.value_type,
        raw_value=det.raw_value,
        normalized_value=det.normalized_value,
        display_value=det.display_value or sem.display_value,
        extractor_kind=ExtractorKind.HYBRID,
        validation_status=det.validation_status,
        evidence=evidence,
        support=sem.support or det.support,
        quality_signals={**det.quality_signals, **sem.quality_signals, "agreement": True},
        ambiguity=sem.ambiguity or det.ambiguity,
    )


def _prefer_richer_candidate(det: CandidateFact, sem: CandidateFact) -> CandidateFact:
    det_score = len(det.evidence) + (1 if det.validation_status == "valid" else 0)
    sem_score = len(sem.evidence) + (1 if sem.validation_status == "valid" else 0)
    chosen = sem if sem_score > det_score else det
    return CandidateFact(
        fact_key=chosen.fact_key,
        value_type=chosen.value_type,
        raw_value=chosen.raw_value,
        normalized_value=chosen.normalized_value,
        display_value=chosen.display_value,
        extractor_kind=chosen.extractor_kind,
        validation_status=chosen.validation_status,
        evidence=chosen.evidence,
        support=chosen.support,
        quality_signals=chosen.quality_signals,
        ambiguity=chosen.ambiguity,
    )


def _merge_evidence(
    left: list[EvidenceCite],
    right: list[EvidenceCite],
) -> list[EvidenceCite]:
    merged: dict[tuple[str, str, str], EvidenceCite] = {}
    for cite in [*left, *right]:
        merged[(cite.page_id, cite.block_id, cite.role)] = cite
    return list(merged.values())
