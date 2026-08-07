"""Decimal-safe string arithmetic for Industry & Market.

Re-exports the Capital & Ownership helpers so every workstream shares one fixed-point
implementation.
"""

from __future__ import annotations

from app.modules.capital_ownership.decimal_math import (
    DECIMAL_ZERO,
    abs_decimal,
    add,
    compare,
    difference,
    differs_beyond,
    div,
    equals,
    first_filled,
    greater_than,
    is_blank,
    is_filled,
    is_invalid,
    is_negative,
    is_positive,
    is_whole_number,
    is_zero,
    less_than,
    max_decimal,
    min_decimal,
    mul,
    negate,
    parse_decimal,
    pct,
    percentage_of,
    round_decimal,
    sub,
    subtract,
    sum_decimals,
    sum_decimals_strict,
    to_decimal_string,
)

from decimal import Decimal, InvalidOperation


def to_number(raw: str | None) -> float | None:
    """Convert a decimal string to float for fractional exponent steps (CAGR only)."""
    parsed = parse_decimal(raw)
    if parsed is None:
        return None
    try:
        return float(parsed)
    except (InvalidOperation, OverflowError, ValueError):
        return None


__all__ = [
    "DECIMAL_ZERO",
    "abs_decimal",
    "add",
    "compare",
    "difference",
    "differs_beyond",
    "div",
    "equals",
    "first_filled",
    "greater_than",
    "is_blank",
    "is_filled",
    "is_invalid",
    "is_negative",
    "is_positive",
    "is_whole_number",
    "is_zero",
    "less_than",
    "max_decimal",
    "min_decimal",
    "mul",
    "negate",
    "parse_decimal",
    "pct",
    "percentage_of",
    "round_decimal",
    "sub",
    "subtract",
    "sum_decimals",
    "sum_decimals_strict",
    "to_decimal_string",
    "to_number",
]
