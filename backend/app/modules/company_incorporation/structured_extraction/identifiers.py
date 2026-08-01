"""Regex-based identifier discovery in document text."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from app.modules.company_incorporation.structured_extraction.normalize import (
    extract_pan_from_gstin,
    normalize_identifier,
    validate_cin,
    validate_gstin,
    validate_pan,
    validate_pin_code,
    validate_udyam,
)

IdentifierType = Literal[
    "cin",
    "pan",
    "gstin",
    "udyam",
    "srn",
    "pin",
    "email",
    "telephone",
    "form",
]

# MCA CIN: listing + industry + state + year + ownership + registration number.
_CIN_PATTERN = re.compile(r"\b([A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b")
_PAN_PATTERN = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")
_GSTIN_PATTERN = re.compile(r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b")
_UDYAM_PATTERN = re.compile(r"\b(UDYAM[\s\-]?[A-Z]{2}[\s\-]?\d{2}[\s\-]?\d{7})\b", re.IGNORECASE)
_SRN_PATTERN = re.compile(r"\b([A-Z]\d{7,12})\b")
_PIN_PATTERN = re.compile(r"\b([1-9][0-9]{5})\b")
_EMAIL_PATTERN = re.compile(r"\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b")
_TELEPHONE_PATTERN = re.compile(r"\b((?:\+91[\s-]?)?[0-9]{10})\b")
_FORM_PATTERN = re.compile(r"\b(INC[\s-]?22|MGT[\s-]?14|SPICe[\s+]?(?:\+)?)\b", re.IGNORECASE)

_IDENTIFIER_PATTERNS: tuple[tuple[IdentifierType, re.Pattern[str]], ...] = (
    ("gstin", _GSTIN_PATTERN),
    ("udyam", _UDYAM_PATTERN),
    ("cin", _CIN_PATTERN),
    ("pan", _PAN_PATTERN),
    ("srn", _SRN_PATTERN),
    ("form", _FORM_PATTERN),
    ("email", _EMAIL_PATTERN),
    ("telephone", _TELEPHONE_PATTERN),
    ("pin", _PIN_PATTERN),
)


@dataclass(frozen=True, slots=True)
class IdentifierMatch:
    identifier_type: IdentifierType
    raw: str
    normalized: str
    start: int
    end: int
    valid: bool


def find_identifiers_in_text(text: str) -> list[IdentifierMatch]:
    """Return ordered, non-overlapping identifier matches with validation."""

    if not text:
        return []

    candidates: list[tuple[int, int, IdentifierMatch]] = []
    for identifier_type, pattern in _IDENTIFIER_PATTERNS:
        for match in pattern.finditer(text):
            raw = match.group(1)
            normalized = _normalize_match(identifier_type, raw)
            valid = _validate_match(identifier_type, normalized, raw)
            candidates.append(
                (
                    match.start(1),
                    match.end(1),
                    IdentifierMatch(
                        identifier_type=identifier_type,
                        raw=raw,
                        normalized=normalized,
                        start=match.start(1),
                        end=match.end(1),
                        valid=valid,
                    ),
                )
            )

    candidates.sort(key=lambda item: (item[0], -(item[1] - item[0])))
    selected: list[IdentifierMatch] = []
    occupied: list[tuple[int, int]] = []
    for start, end, candidate in candidates:
        if _overlaps(start, end, occupied):
            continue
        occupied.append((start, end))
        selected.append(candidate)

    selected.sort(key=lambda item: item.start)
    return selected


def _normalize_match(identifier_type: IdentifierType, raw: str) -> str:
    if identifier_type == "form":
        compact = re.sub(r"[\s\-]+", "", raw.upper())
        if compact.startswith("INC"):
            return "INC-22"
        if compact.startswith("MGT"):
            return "MGT-14"
        return raw.strip().upper()
    if identifier_type == "email":
        return raw.strip().casefold()
    if identifier_type == "telephone":
        digits = re.sub(r"\D", "", raw)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        return digits[-10:] if len(digits) >= 10 else digits
    return normalize_identifier(raw, identifier_type=identifier_type)


def _validate_match(identifier_type: IdentifierType, normalized: str, raw: str) -> bool:
    if identifier_type == "cin":
        return validate_cin(normalized)
    if identifier_type == "pan":
        return validate_pan(normalized)
    if identifier_type == "gstin":
        return validate_gstin(normalized)
    if identifier_type == "udyam":
        return validate_udyam(normalized)
    if identifier_type == "pin":
        return validate_pin_code(normalized)
    if identifier_type == "srn":
        return bool(re.match(r"^[A-Z]\d{7,12}$", normalized))
    if identifier_type == "email":
        return "@" in raw and "." in raw.split("@", 1)[-1]
    if identifier_type == "telephone":
        return len(normalized) == 10 and normalized.isdigit()
    if identifier_type == "form":
        return normalized in {"INC-22", "MGT-14"} or "SPICE" in normalized.upper()
    return bool(normalized)


def _overlaps(start: int, end: int, occupied: list[tuple[int, int]]) -> bool:
    for other_start, other_end in occupied:
        if start < other_end and end > other_start:
            return True
    return False


def validate_identifier_match(match: IdentifierMatch) -> bool:
    """Re-validate a discovered identifier, including GSTIN embedded PAN."""

    if match.identifier_type != "gstin":
        return match.valid
    if not validate_gstin(match.normalized):
        return False
    embedded_pan = extract_pan_from_gstin(match.normalized)
    return embedded_pan is not None
