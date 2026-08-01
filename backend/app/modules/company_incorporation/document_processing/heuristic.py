"""Native PDF text sufficiency heuristics."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.core.config import Settings, get_settings

_WORD_RE = re.compile(r"[A-Za-z0-9]{2,}")
_ALNUM_RE = re.compile(r"[A-Za-z0-9]")
_NOISE_RE = re.compile(r"[^\x09\x0A\x0D\x20-\x7E]")


@dataclass(frozen=True)
class NativeTextAssessment:
    is_sufficient: bool
    alphanumeric_count: int
    word_count: int
    printable_ratio: float
    character_count: int
    has_large_image_signal: bool
    reason: str


def assess_native_text(
    text: str,
    *,
    image_count: int = 0,
    image_coverage_ratio: float = 0.0,
    settings: Settings | None = None,
) -> NativeTextAssessment:
    cfg = settings or get_settings()
    cleaned = text or ""
    character_count = len(cleaned)
    alphanumeric_count = len(_ALNUM_RE.findall(cleaned))
    word_count = len(_WORD_RE.findall(cleaned))
    if character_count == 0:
        printable_ratio = 0.0
    else:
        printable_chars = sum(1 for ch in cleaned if ch.isprintable() or ch in "\n\r\t")
        printable_ratio = printable_chars / character_count

    noise_ratio = (
        len(_NOISE_RE.findall(cleaned)) / character_count if character_count else 1.0
    )
    has_large_image_signal = image_count >= 1 and image_coverage_ratio >= 0.45

    if character_count == 0:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=0,
            word_count=0,
            printable_ratio=0.0,
            character_count=0,
            has_large_image_signal=has_large_image_signal,
            reason="empty",
        )

    if noise_ratio > 0.35 and alphanumeric_count < cfg.doc_processing_native_min_alnum * 2:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=alphanumeric_count,
            word_count=word_count,
            printable_ratio=printable_ratio,
            character_count=character_count,
            has_large_image_signal=has_large_image_signal,
            reason="mostly_noise",
        )

    if printable_ratio < cfg.doc_processing_native_min_printable_ratio:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=alphanumeric_count,
            word_count=word_count,
            printable_ratio=printable_ratio,
            character_count=character_count,
            has_large_image_signal=has_large_image_signal,
            reason="low_printable_ratio",
        )

    if alphanumeric_count < cfg.doc_processing_native_min_alnum:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=alphanumeric_count,
            word_count=word_count,
            printable_ratio=printable_ratio,
            character_count=character_count,
            has_large_image_signal=has_large_image_signal,
            reason="low_alphanumeric",
        )

    if word_count < cfg.doc_processing_native_min_words:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=alphanumeric_count,
            word_count=word_count,
            printable_ratio=printable_ratio,
            character_count=character_count,
            has_large_image_signal=has_large_image_signal,
            reason="low_word_count",
        )

    if has_large_image_signal and alphanumeric_count < cfg.doc_processing_native_min_alnum * 3:
        return NativeTextAssessment(
            is_sufficient=False,
            alphanumeric_count=alphanumeric_count,
            word_count=word_count,
            printable_ratio=printable_ratio,
            character_count=character_count,
            has_large_image_signal=True,
            reason="large_image_dominant",
        )

    return NativeTextAssessment(
        is_sufficient=True,
        alphanumeric_count=alphanumeric_count,
        word_count=word_count,
        printable_ratio=printable_ratio,
        character_count=character_count,
        has_large_image_signal=has_large_image_signal,
        reason="sufficient",
    )
