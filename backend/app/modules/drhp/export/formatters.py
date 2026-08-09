"""Display-only formatters for DRHP publication — never mutates source AST values."""

from __future__ import annotations

import ast
import logging
import re
from datetime import date
from decimal import InvalidOperation
from typing import Any

from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.export.publication_theme import INTERNAL_HEADING_PATTERNS
from app.modules.drhp.export.semantic_types import (
    infer_semantic_type_from_header,
    is_identifier,
    is_quantitative,
)

logger = logging.getLogger(__name__)

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ISO_DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]")
NUMERIC_STRING_RE = re.compile(r"^-?\d[\d,]*(?:\.\d+)?%?$")
CURRENCY_PREFIX_RE = re.compile(r"^[₹$]\s*")
SLUG_LIKE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)+$")
FY_PERIOD_RE = re.compile(r"^(?:nivara-)?fy\s*(\d{4})$", re.I)
FY_SLUG_RE = re.compile(r"^[a-z0-9]+-fy(\d{4})$", re.I)

# Conservative detection of serialized Python/JSON blobs in persisted strings.
_SERIALIZED_OBJECT_RE = re.compile(
    r"^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$",
)

MONTH_NAMES = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)

ENUM_OVERRIDES: dict[str, str] = {
    "capital-expenditure": "Capital expenditure",
    "working-capital": "Working capital",
    "general-corporate-purposes": "General corporate purposes",
    "loan-repayment": "Loan repayment",
    "repayment-prepayment-of-borrowings": "Repayment / prepayment of borrowings",
    "managing-director": "Managing Director",
    "non-executive-director": "Non-Executive Director",
    "independent-director": "Independent Director",
    "whole-time-director": "Whole-time Director",
    "executive-director": "Executive Director",
    "company-secretary": "Company Secretary",
    "chief-financial-officer": "Chief Financial Officer",
    "book-built": "Book built",
    "promoter": "Promoter",
    "nil": "Nil",
    "n/a": "Not Applicable",
    "na": "Not Applicable",
    "not-applicable": "Not Applicable",
}

NUMERIC_HEADER_HINTS = (
    "amount",
    "value",
    "number of shares",
    "no. of shares",
    "shares",
    "capital",
    "price",
    "eps",
    "nav",
    "percent",
    "percentage",
    "ratio",
    "₹",
    "rs.",
    "rupee",
    "lakh",
    "crore",
)

TEXT_HEADER_HINTS = (
    "particular",
    "description",
    "name",
    "nature",
    "term",
    "meaning",
    "abbreviation",
    "party",
    "parties",
    "counterparty",
    "address",
    "details",
    "telephone",
    "phone",
    "din",
    "cin",
    "pan",
    "gstin",
)


def format_indian_integer(value: int) -> str:
    negative = value < 0
    digits = str(abs(value))
    if len(digits) <= 3:
        grouped = digits
    else:
        last_three = digits[-3:]
        rest = digits[:-3]
        parts: list[str] = []
        while rest:
            parts.append(rest[-2:])
            rest = rest[:-2]
        parts.reverse()
        grouped = ",".join(parts + [last_three])
    return f"-{grouped}" if negative else grouped


def format_indian_decimal(value: float, *, decimals: int = 2) -> str:
    if value.is_integer():
        return format_indian_integer(int(value))
    whole, fractional = f"{abs(value):.{decimals}f}".split(".")
    sign = "-" if value < 0 else ""
    return f"{sign}{format_indian_integer(int(whole))}.{fractional}"


def format_inr_amount(value: int | float, *, include_symbol: bool = True) -> str:
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, int):
        formatted = format_indian_integer(value)
    else:
        formatted = format_indian_decimal(value)
    return f"₹{formatted}" if include_symbol else formatted


def format_percentage(value: int | float | str) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.endswith("%"):
            return stripped
        try:
            numeric = float(stripped.replace(",", ""))
        except ValueError:
            return humanize_enum(stripped)
        text = f"{numeric:.2f}".rstrip("0").rstrip(".")
        return f"{text}%"
    if isinstance(value, float):
        text = f"{value:.2f}".rstrip("0").rstrip(".")
        return f"{text}%"
    return f"{value}%"


def format_financial_period(value: str) -> str:
    cleaned = value.strip()
    match = FY_PERIOD_RE.match(cleaned)
    if match:
        return f"FY {match.group(1)}"
    match = FY_SLUG_RE.match(cleaned)
    if match:
        return f"FY {match.group(1)}"
    if cleaned.upper().startswith("FY") and cleaned[2:].strip().isdigit():
        return f"FY {cleaned[2:].strip()}"
    return cleaned


def format_date(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        return cleaned
    if ISO_DATETIME_RE.match(cleaned):
        cleaned = cleaned[:10]
    if not ISO_DATE_RE.match(cleaned):
        return cleaned
    try:
        parsed = date.fromisoformat(cleaned)
    except ValueError:
        return value
    return f"{MONTH_NAMES[parsed.month - 1]} {parsed.day}, {parsed.year}"


def humanize_enum(value: str) -> str:
    lowered = value.strip().casefold()
    if lowered in ENUM_OVERRIDES:
        return ENUM_OVERRIDES[lowered]
    if SLUG_LIKE_RE.match(value.strip()):
        if FY_SLUG_RE.match(value.strip()):
            return format_financial_period(value.strip())
        words = value.strip().replace("_", "-").split("-")
        return " ".join(word.capitalize() if word not in {"md", "cfo", "ceo"} else word.upper() for word in words)
    return value.strip()


def _try_recover_serialized_structure(value: str) -> Any | None:
    """Safely parse literal dict/list strings — never eval."""
    stripped = value.strip()
    if not stripped or "[object Object]" in stripped:
        return None
    if not _SERIALIZED_OBJECT_RE.match(stripped):
        return None
    if not (stripped.startswith("{") or stripped.startswith("[")):
        return None
    try:
        parsed = ast.literal_eval(stripped)
    except (ValueError, SyntaxError):
        return None
    if isinstance(parsed, (dict, list)):
        return parsed
    return None


def _guard_serialized_publication_text(value: str) -> str:
    """Second-layer safety for persisted Python/JSON repr strings."""
    recovered = _try_recover_serialized_structure(value)
    if recovered is None:
        return value
    formatted = format_drhp_value(recovered)
    if formatted and formatted != PLACEHOLDER_TOKEN and "{" not in formatted:
        return formatted
    logger.warning(
        "DRHP export replaced serialized structured value with placeholder: %.120s",
        value,
    )
    return PLACEHOLDER_TOKEN


def _format_address(value: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in ("line1", "line2", "line3", "city", "state", "pincode", "country"):
        part = value.get(key)
        if part:
            parts.append(str(part).strip())
    if parts:
        return ", ".join(parts)
    return ""


def _format_party(value: dict[str, Any]) -> str:
    for key in (
        "counterparty",
        "counterpartyName",
        "partyName",
        "relatedPartyName",
        "entityName",
        "companyName",
        "name",
        "label",
        "title",
    ):
        if value.get(key):
            text = str(value[key]).strip()
            if text and text != PLACEHOLDER_TOKEN:
                return text if not SLUG_LIKE_RE.match(text) else humanize_enum(text)
    return ""


def _format_quantitative(value: int | float, *, semantic_type: str | None, unit: str | None) -> str:
    st = (semantic_type or "").casefold()
    u = (unit or "").casefold()
    if st in {"currency_inr", "currency", "inr", "rupee"} or u in {"inr", "rupee", "₹"}:
        return format_inr_amount(value)
    if st in {"currency_lakh", "lakh"} or u == "lakh":
        return format_indian_decimal(float(value))
    if st in {"currency_crore", "crore"} or u == "crore":
        return format_indian_decimal(float(value))
    if st in {"share_count", "shares"}:
        return format_indian_integer(int(value))
    if st == "percentage":
        return format_percentage(value)
    if st in {"decimal", "ratio", "financial_value"}:
        if isinstance(value, float) and not value.is_integer():
            return format_indian_decimal(value)
        return format_indian_integer(int(value))
    if isinstance(value, float) and not value.is_integer():
        return format_indian_decimal(value)
    return format_indian_integer(int(value))


def format_drhp_value(
    value: Any,
    *,
    semantic_type: str | None = None,
    unit: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Convert an AST cell value to publication-safe display text."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, int):
        if is_identifier(semantic_type):
            return str(value)
        if is_quantitative(semantic_type):
            return _format_quantitative(value, semantic_type=semantic_type, unit=unit)
        return str(value)
    if isinstance(value, float):
        if is_identifier(semantic_type):
            return str(value)
        if is_quantitative(semantic_type):
            return _format_quantitative(value, semantic_type=semantic_type, unit=unit)
        return str(value)
    if isinstance(value, str):
        return _format_string_value(value, semantic_type=semantic_type, unit=unit)
    if isinstance(value, list):
        parts = [
            format_drhp_value(item, semantic_type=semantic_type, unit=unit, metadata=metadata)
            for item in value
        ]
        parts = [part for part in parts if part and part != PLACEHOLDER_TOKEN]
        return ", ".join(parts) if parts else PLACEHOLDER_TOKEN
    if isinstance(value, dict):
        return _format_dict_value(value, metadata=metadata)
    return PLACEHOLDER_TOKEN


def _format_string_value(value: str, *, semantic_type: str | None, unit: str | None) -> str:
    cleaned = value.strip()
    if not cleaned:
        return ""
    lowered = cleaned.casefold()
    if lowered in {"nil", "n/a", "na", "not applicable"}:
        return ENUM_OVERRIDES.get(lowered, cleaned)
    if cleaned == PLACEHOLDER_TOKEN:
        return PLACEHOLDER_TOKEN
    if semantic_type == "financial_period" or FY_PERIOD_RE.match(cleaned) or FY_SLUG_RE.match(cleaned):
        return format_financial_period(cleaned)
    if is_identifier(semantic_type):
        return cleaned
    if ISO_DATE_RE.match(cleaned) or ISO_DATETIME_RE.match(cleaned):
        return format_date(cleaned)
    if CURRENCY_PREFIX_RE.match(cleaned):
        numeric = cleaned.lstrip("₹$").strip().replace(",", "")
        try:
            if "." in numeric:
                return format_inr_amount(float(numeric))
            return format_inr_amount(int(numeric))
        except ValueError:
            return cleaned
    if is_quantitative(semantic_type) and NUMERIC_STRING_RE.match(cleaned.replace(",", "")):
        numeric_text = cleaned.replace(",", "").rstrip("%")
        try:
            if cleaned.endswith("%"):
                return format_percentage(float(numeric_text))
            if "." in numeric_text:
                return _format_quantitative(float(numeric_text), semantic_type=semantic_type, unit=unit)
            return _format_quantitative(int(numeric_text), semantic_type=semantic_type, unit=unit)
        except ValueError:
            return cleaned
    if semantic_type == "enum" or lowered in ENUM_OVERRIDES:
        if SLUG_LIKE_RE.match(cleaned) or lowered in ENUM_OVERRIDES:
            return humanize_enum(cleaned)
    guarded = _guard_serialized_publication_text(cleaned)
    if guarded != cleaned:
        return guarded
    return cleaned


def _format_dict_value(value: dict[str, Any], *, metadata: dict[str, Any] | None = None) -> str:
    skip_keys = {
        "refId",
        "ref_id",
        "sourceRefIds",
        "evidenceRefIds",
        "blockId",
        "id",
        "recordId",
        "record_id",
        "fieldPath",
        "field_path",
        "identifierType",
        "identifierValue",
        "role",
        "relationship",
        "designation",
        "jurisdiction",
        "relatedParty",
        "isRelatedParty",
    }
    if any(key in value for key in ("line1", "city", "pincode", "state")):
        address = _format_address(value)
        if address:
            return address
    party = _format_party(value)
    if party:
        return party
    label = value.get("label") or value.get("name") or value.get("title")
    nested = value.get("value") or value.get("text") or value.get("amount")
    if label and nested is not None:
        nested_text = format_drhp_value(nested, metadata=metadata)
        if nested_text and nested_text != PLACEHOLDER_TOKEN:
            return f"{format_drhp_value(label)}: {nested_text}"
    if value.get("identifierValue") is not None:
        return str(value["identifierValue"]).strip()
    if value.get("amount") is not None:
        return format_drhp_value(value["amount"], semantic_type="currency_inr")
    return PLACEHOLDER_TOKEN


def infer_column_semantic_types(headers: list[str]) -> list[str | None]:
    return [infer_semantic_type_from_header(header) for header in headers]


def infer_column_alignments(headers: list[str], rows: list[list[str]]) -> list[str]:
    if not headers:
        return []
    alignments: list[str] = []
    for col_index, header in enumerate(headers):
        semantic = infer_semantic_type_from_header(header)
        if semantic and is_quantitative(semantic):
            alignments.append("right")
            continue
        header_lower = header.casefold()
        if any(hint in header_lower for hint in TEXT_HEADER_HINTS):
            alignments.append("left")
            continue
        if any(hint in header_lower for hint in NUMERIC_HEADER_HINTS):
            alignments.append("right")
            continue
        sample_cells = [
            rows[row_index][col_index]
            for row_index in range(min(len(rows), 12))
            if col_index < len(rows[row_index])
        ]
        numeric_hits = sum(1 for cell in sample_cells if _looks_numeric(cell))
        if sample_cells and numeric_hits >= max(1, len(sample_cells) // 2):
            alignments.append("right")
        else:
            alignments.append("left")
    return alignments


def _looks_numeric(text: str) -> bool:
    stripped = text.strip()
    if not stripped or stripped == PLACEHOLDER_TOKEN:
        return False
    if stripped.casefold() in {"nil", "not applicable", "n/a"}:
        return False
    if CURRENCY_PREFIX_RE.match(stripped):
        return True
    if stripped.endswith("%"):
        return True
    cleaned = stripped.replace(",", "").replace("₹", "").strip()
    try:
        float(cleaned)
        return True
    except (ValueError, InvalidOperation):
        return False


def is_internal_heading(text: str) -> bool:
    lowered = text.strip().casefold()
    if not lowered:
        return True
    return any(pattern in lowered for pattern in INTERNAL_HEADING_PATTERNS)


def should_suppress_section_heading(text: str) -> bool:
    lowered = text.strip().casefold()
    if not lowered:
        return True
    if is_internal_heading(text):
        return True
    return "structured disclosure" in lowered


def normalize_heading_text(text: str) -> str:
    cleaned = text.strip()
    for suffix in (" — Structured Disclosures", " - Structured Disclosures", " — Structured Disclosure"):
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
    return cleaned


def headings_are_duplicate(left: str, right: str) -> bool:
    if not left or not right:
        return False
    return left.strip().casefold() == right.strip().casefold()


def chapter_title_duplicates_section(chapter_title: str, section_heading: str) -> bool:
    if headings_are_duplicate(chapter_title, section_heading):
        return True
    title = chapter_title.strip().casefold()
    heading = section_heading.strip().casefold()
    if not title or not heading:
        return False
    if title in heading or heading in title:
        return True
    return False
