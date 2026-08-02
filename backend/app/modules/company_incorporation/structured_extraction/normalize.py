"""Normalisation, validation helpers, and display formatting for extracted facts."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import UTC, datetime
from typing import Any

from app.modules.company_incorporation.validation import (
    CIN_RE,
    COMPANY_CATEGORY_VALUES,
    COMPANY_CLASS_VALUES,
    COMPANY_SUB_CATEGORY_VALUES,
    GOVERNING_ACT_VALUES,
    GSTIN_RE,
    ISO_DATE_RE,
    OCCUPANCY_TYPE_VALUES,
    PAN_RE,
    PIN_RE,
    UDYAM_RE,
)

# Stricter MCA CIN shape used for extraction (validation.py keeps the broader API check).
_MCA_CIN_RE = re.compile(r"^[A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$")
_CERTIFY_NAME_RE = re.compile(
    r"\bthis is to certify that\s+(.+?)\s+is incorporated\b",
    re.IGNORECASE,
)
_ENUM_PHRASE_MAP: dict[str, str] = {
    "private": "private",
    "public": "public",
    "company limited by shares": "company-limited-by-shares",
    "company limited by guarantee": "company-limited-by-guarantee",
    "unlimited company": "unlimited-company",
    "non government company": "non-government-company",
    "non-government company": "non-government-company",
    "companies act 2013": "companies-act-2013",
    "companies act, 2013": "companies-act-2013",
    "the companies act 2013": "companies-act-2013",
    "the companies act, 2013": "companies-act-2013",
    "companies act 1956": "companies-act-1956",
    "companies act, 1956": "companies-act-1956",
    "leased": "leased",
    "lease": "leased",
    "on lease": "leased",
    "rented": "leased",
    "owned": "owned",
    "own": "owned",
    "ownership": "owned",
    "licensed": "licensed",
    "licence": "licensed",
    "license": "licensed",
    "other": "other",
}

_IGNORED_DOCUMENT_NOISE_RE = re.compile(
    r"synthetic\s+demo\s+document|not\s+valid\s+for\s+official\s+use|"
    r"fixture\s+id\s*:|synthetic\s+filing\s+record|"
    r"not\s+an\s+official\s+registrar",
    re.IGNORECASE,
)
_LABEL_FRAGMENT_VALUES = frozenset(
    {
        "type",
        "occupancy",
        "nature",
        "class",
        "category",
        "status",
        "address",
        "date",
        "name",
        "form",
        "number",
        "value",
        "details",
        "ms",
        "of",
        "the",
        "and",
        "or",
    }
)

_WHITESPACE_RE = re.compile(r"\s+")
_PVT_RE = re.compile(r"\b(pvt\.?|private)\b", re.IGNORECASE)
_LTD_RE = re.compile(r"\b(ltd\.?|limited)\b", re.IGNORECASE)
_PUNCTUATION_RE = re.compile(r"[^\w\s]", re.UNICODE)

_DATE_FORMATS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"^(\d{4})-(\d{2})-(\d{2})$"), "%Y-%m-%d"),
    (re.compile(r"^(\d{2})[/-](\d{2})[/-](\d{4})$"), "%d/%m/%Y"),
    (re.compile(r"^(\d{2})[/-](\d{2})[/-](\d{4})$"), "%d-%m-%Y"),
    (re.compile(r"^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$"), "%d %b %Y"),
    (re.compile(r"^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$"), "%d %B %Y"),
)

_ADDRESS_COMPONENT_KEYS: tuple[str, ...] = (
    "addressLine1",
    "addressLine2",
    "locality",
    "city",
    "district",
    "state",
    "pinCode",
    "country",
    "fullAddress",
)


def normalize_legal_name(value: Any) -> str:
    """Case-fold, collapse whitespace, and expand common corporate suffixes."""

    text = _WHITESPACE_RE.sub(" ", str(value or "").strip())
    if not text:
        return ""
    text = text.casefold()
    text = _PVT_RE.sub("private", text)
    text = _LTD_RE.sub("limited", text)
    text = _PUNCTUATION_RE.sub(" ", text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def is_legal_name_fact(fact_key: str) -> bool:
    """True for identity.legalName and *.legalNameOnRegistration facts."""

    key = str(fact_key or "")
    return key.endswith("legalName") or key.endswith("legalNameOnRegistration")


_FILING_FORM_RE = re.compile(
    r"\b(?:e[-\s]?form|form(?:\s+no\.?)?)?\s*(INC[\s-]?22|MGT[\s-]?14|SPICe[\s+]?(?:\+)?)\b",
    re.IGNORECASE,
)


def normalize_filing_form(value: Any) -> str:
    """Normalize supported MCA form identifiers to canonical values such as INC-22."""

    text = str(value or "").strip()
    if not text:
        return ""
    match = _FILING_FORM_RE.search(text)
    raw = match.group(1) if match else text
    compact = re.sub(r"[\s\-]+", "", raw.upper())
    if compact.startswith("INC") and "22" in compact:
        return "INC-22"
    if compact.startswith("MGT") and "14" in compact:
        return "MGT-14"
    if "SPICE" in compact:
        return "SPICe+"
    return ""


def is_likely_truncated_legal_name(doc_value: Any, info_value: Any) -> bool:
    """Detect OCR/prefix truncations of a longer Information legal name."""

    doc_norm = normalize_legal_name(doc_value)
    info_norm = normalize_legal_name(info_value)
    if not doc_norm or not info_norm or doc_norm == info_norm:
        return False
    doc_tokens = [token for token in doc_norm.split() if token]
    info_tokens = [token for token in info_norm.split() if token]
    if len(doc_tokens) >= len(info_tokens):
        return False
    # Require a strict leading-token prefix so "Navira …" never downgrades.
    if info_tokens[: len(doc_tokens)] != doc_tokens:
        return False
    return True


def normalize_identifier(value: Any, *, identifier_type: str | None = None) -> str:
    """Uppercase, strip separators, and apply type-specific canonicalisation."""

    text = str(value or "").strip().upper()
    if not text:
        return ""
    text = re.sub(r"[\s\-_/]+", "", text)
    if identifier_type == "gstin":
        return text[:15] if len(text) >= 15 else text
    if identifier_type == "udyam":
        if not text.startswith("UDYAM"):
            return text
        match = re.match(r"^UDYAM([A-Z]{2})(\d{2})(\d{7})$", text)
        if match:
            return f"UDYAM-{match.group(1)}-{match.group(2)}-{match.group(3)}"
    return text


def validate_cin(value: str) -> bool:
    normalized = normalize_identifier(value)
    return bool(normalized and _MCA_CIN_RE.match(normalized) and CIN_RE.match(normalized))


def extract_legal_name_candidate(value: Any) -> str:
    """Strip certification boilerplate and keep a plausible company legal name."""

    text = _WHITESPACE_RE.sub(" ", str(value or "").strip())
    if not text:
        return ""
    certify = _CERTIFY_NAME_RE.search(text)
    if certify:
        text = certify.group(1).strip(" .,;:")
    # Prefer the corporate-suffix span when the line contains surrounding prose.
    suffix_match = re.search(
        r"([A-Z][A-Za-z0-9&.,'()/\- ]{1,120}?\b(?:Private|Pvt\.?)\s+(?:Limited|Ltd\.?))\b",
        text,
        re.IGNORECASE,
    )
    if suffix_match:
        return suffix_match.group(1).strip(" .,;:")
    return text.strip(" .,;:")


def is_ignored_document_noise(value: Any) -> bool:
    """True for synthetic watermarks/disclaimers that must not become fact values."""

    text = str(value or "").strip()
    if not text:
        return False
    return bool(_IGNORED_DOCUMENT_NOISE_RE.search(text))


def is_label_fragment_value(value: Any) -> bool:
    """Reject generic label fragments such as 'type' or 'occupancy' as values."""

    text = _WHITESPACE_RE.sub(" ", str(value or "").strip()).casefold()
    if not text:
        return True
    if text in _LABEL_FRAGMENT_VALUES:
        return True
    if len(text) <= 2 and not text.isdigit():
        return True
    return False


def normalize_enum_like(value: Any, *, allowed: set[str] | None = None) -> str:
    """Map document phrases onto Information-tab enum codes when possible."""

    text = _WHITESPACE_RE.sub(" ", str(value or "").strip())
    if not text or is_label_fragment_value(text) or is_ignored_document_noise(text):
        return ""
    folded = text.casefold().replace("_", " ").replace("-", " ")
    folded = re.sub(r"[^\w\s]", " ", folded)
    folded = _WHITESPACE_RE.sub(" ", folded).strip()
    mapped = _ENUM_PHRASE_MAP.get(folded)
    if mapped and (allowed is None or mapped in allowed):
        return mapped
    slug = folded.replace(" ", "-")
    if allowed and slug in allowed:
        return slug
    if allowed and text.casefold() in allowed:
        return text.casefold()
    # Strict mode: when an allowed set is provided, never return raw OCR junk.
    if allowed is not None:
        return ""
    return text.strip()


def normalize_company_class(value: Any) -> str:
    return normalize_enum_like(value, allowed=COMPANY_CLASS_VALUES)


def normalize_company_category(value: Any) -> str:
    return normalize_enum_like(value, allowed=COMPANY_CATEGORY_VALUES)


def normalize_company_sub_category(value: Any) -> str:
    return normalize_enum_like(value, allowed=COMPANY_SUB_CATEGORY_VALUES)


def normalize_governing_act(value: Any) -> str:
    return normalize_enum_like(value, allowed=GOVERNING_ACT_VALUES)


def normalize_occupancy_type(value: Any) -> str:
    return normalize_enum_like(value, allowed=OCCUPANCY_TYPE_VALUES)


def validate_pan(value: str) -> bool:
    normalized = normalize_identifier(value)
    return bool(normalized and PAN_RE.match(normalized))


def validate_gstin(value: str, *, expected_pan: str | None = None) -> bool:
    normalized = normalize_identifier(value, identifier_type="gstin")
    if not normalized or not GSTIN_RE.match(normalized):
        return False
    embedded_pan = normalized[2:12]
    if expected_pan:
        return embedded_pan == normalize_identifier(expected_pan)
    return validate_pan(embedded_pan)


def validate_udyam(value: str) -> bool:
    normalized = normalize_identifier(value, identifier_type="udyam")
    return bool(normalized and UDYAM_RE.match(normalized))


def validate_pin_code(value: str) -> bool:
    text = str(value or "").strip()
    return bool(text and PIN_RE.match(text))


def extract_pan_from_gstin(gstin: str) -> str | None:
    normalized = normalize_identifier(gstin, identifier_type="gstin")
    if len(normalized) < 12:
        return None
    pan = normalized[2:12]
    return pan if validate_pan(pan) else None


def parse_date_to_iso(value: Any) -> str | None:
    """Parse common Indian document date formats to YYYY-MM-DD."""

    text = _WHITESPACE_RE.sub(" ", str(value or "").strip())
    if not text:
        return None
    if ISO_DATE_RE.match(text):
        return text

    for pattern, fmt in _DATE_FORMATS:
        if not pattern.match(text):
            continue
        try:
            if fmt == "%d/%m/%Y":
                day, month, year = re.split(r"[/-]", text)
                parsed = datetime(int(year), int(month), int(day), tzinfo=UTC)
            elif fmt == "%d-%m-%Y":
                day, month, year = text.split("-")
                parsed = datetime(int(year), int(month), int(day), tzinfo=UTC)
            else:
                parsed = datetime.strptime(text, fmt).replace(tzinfo=UTC)
        except ValueError:
            continue
        return parsed.date().isoformat()

    return None


def normalize_address_dict(value: Any) -> dict[str, str]:
    """Normalise address components for comparison and display."""

    if isinstance(value, str):
        text = _WHITESPACE_RE.sub(" ", value.strip())
        if not text:
            return {}
        result = {"fullAddress": text}
        pin_match = re.search(r"\b(\d{6})\b", text)
        if pin_match:
            result["pinCode"] = pin_match.group(1)
        return result

    if not isinstance(value, dict):
        return {}

    result: dict[str, str] = {}
    for key in _ADDRESS_COMPONENT_KEYS:
        component = value.get(key)
        if component is None:
            continue
        text = _WHITESPACE_RE.sub(" ", str(component).strip())
        if text:
            result[key] = text.casefold() if key != "pinCode" else text

    if "fullAddress" not in result:
        parts = [
            result.get(key, "")
            for key in (
                "addressLine1",
                "addressLine2",
                "locality",
                "city",
                "district",
                "state",
                "pinCode",
                "country",
            )
            if result.get(key)
        ]
        if parts:
            result["fullAddress"] = ", ".join(parts).casefold()

    return result


def display_legal_name(value: Any) -> str:
    return _WHITESPACE_RE.sub(" ", str(value or "").strip())


def display_identifier(value: Any, *, identifier_type: str | None = None) -> str:
    normalized = normalize_identifier(value, identifier_type=identifier_type)
    if identifier_type == "udyam" and normalized.startswith("UDYAM") and "-" not in normalized:
        match = re.match(r"^UDYAM([A-Z]{2})(\d{2})(\d{7})$", normalized)
        if match:
            return f"UDYAM-{match.group(1)}-{match.group(2)}-{match.group(3)}"
    return normalized


def display_date(value: Any) -> str:
    iso = parse_date_to_iso(value)
    return iso or _WHITESPACE_RE.sub(" ", str(value or "").strip())


def display_address(value: Any) -> str:
    if isinstance(value, str):
        return _WHITESPACE_RE.sub(" ", value.strip())
    if isinstance(value, dict):
        normalized = normalize_address_dict(value)
        if normalized.get("fullAddress"):
            return normalized["fullAddress"]
        parts = [
            value.get(key, "")
            for key in (
                "addressLine1",
                "addressLine2",
                "locality",
                "city",
                "district",
                "state",
                "pinCode",
                "country",
            )
            if _clean_component(value.get(key))
        ]
        return ", ".join(str(part).strip() for part in parts if str(part).strip())
    return ""


def display_string_list(value: Any) -> str:
    if isinstance(value, list):
        items = [_WHITESPACE_RE.sub(" ", str(item).strip()) for item in value if str(item).strip()]
        return ", ".join(items)
    text = _WHITESPACE_RE.sub(" ", str(value or "").strip())
    return text


def display_text(value: Any) -> str:
    return _WHITESPACE_RE.sub(" ", str(value or "").strip())


def fingerprint_value(value: Any) -> str:
    """Stable SHA-256 fingerprint for deduplication and idempotency checks."""

    payload = _fingerprint_payload(value)
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _fingerprint_payload(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, list):
        return [_fingerprint_payload(item) for item in value]
    if isinstance(value, dict):
        return {key: _fingerprint_payload(value[key]) for key in sorted(value)}
    return str(value)


def _clean_component(value: Any) -> bool:
    return bool(str(value or "").strip())
