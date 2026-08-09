"""Semantic display types for DRHP publication formatting."""

from __future__ import annotations

QUANTITATIVE_TYPES = frozenset(
    {
        "currency_inr",
        "currency",
        "inr",
        "rupee",
        "currency_lakh",
        "lakh",
        "currency_crore",
        "crore",
        "share_count",
        "shares",
        "integer",
        "decimal",
        "percentage",
        "ratio",
        "financial_value",
    }
)

IDENTIFIER_TYPES = frozenset(
    {
        "telephone",
        "phone",
        "cin",
        "din",
        "pan",
        "srn",
        "gstin",
        "registration_number",
        "licence_number",
        "license_number",
        "application_number",
        "filing_reference",
        "case_number",
        "contract_reference",
        "identifier",
        "plain_text",
    }
)

HEADER_SEMANTIC_RULES: tuple[tuple[tuple[str, ...], str], ...] = (
    (("share", "no. of shares", "number of shares", "equity shares"), "share_count"),
    (("amount", "₹", "rupee", "value (₹)", "in lakhs", "in crore"), "currency_inr"),
    (("percentage", "percent", "%"), "percentage"),
    (("telephone", "phone", "mobile", "contact no"), "telephone"),
    (("din",), "din"),
    (("cin",), "cin"),
    (("pan",), "pan"),
    (("gstin",), "gstin"),
    (("srn",), "srn"),
    (("registration", "reg. no", "reg no"), "registration_number"),
    (("party", "parties", "counterparty", "name of"), "entity_name"),
    (("fy ", "financial year", "year ended", "period"), "financial_period"),
)


def is_quantitative(semantic_type: str | None) -> bool:
    if not semantic_type:
        return False
    return semantic_type.casefold() in QUANTITATIVE_TYPES


def is_identifier(semantic_type: str | None) -> bool:
    if not semantic_type:
        return False
    return semantic_type.casefold() in IDENTIFIER_TYPES


def infer_semantic_type_from_header(header: str) -> str | None:
    lowered = header.strip().casefold()
    if not lowered:
        return None
    for hints, semantic_type in HEADER_SEMANTIC_RULES:
        if any(hint in lowered for hint in hints):
            return semantic_type
    if any(
        hint in lowered
        for hint in (
            "particular",
            "description",
            "nature",
            "term",
            "meaning",
            "abbreviation",
            "address",
            "details",
        )
    ):
        return "plain_text"
    return None
