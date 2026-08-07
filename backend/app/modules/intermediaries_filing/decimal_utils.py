"""Decimal-safe helpers for Intermediaries & Filing."""

from __future__ import annotations

from datetime import UTC, datetime

from app.modules.capital_ownership.decimal_math import (
    is_filled as is_filled_decimal,
    is_invalid,
    parse_decimal,
    subtract,
    sum_decimals,
    to_decimal_string,
)


def add_decimals(*values: str) -> str:
    return sum_decimals(list(values))


def subtract_decimals(minuend: str, subtrahend: str) -> str:
    return subtract(minuend, subtrahend)


def divide_decimals(numerator: str, denominator: str) -> str | None:
    num = parse_decimal(numerator)
    den = parse_decimal(denominator)
    if num is None or den is None or den == 0:
        return None
    return to_decimal_string((num / den) * 100)


def parse_iso_date(value: str) -> datetime | None:
    trimmed = str(value or "").strip()
    if not trimmed:
        return None
    try:
        if len(trimmed) == 10 and trimmed[4] == "-" and trimmed[7] == "-":
            return datetime.strptime(trimmed, "%Y-%m-%d").replace(tzinfo=UTC)
        parsed = datetime.fromisoformat(trimmed.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed
    except ValueError:
        return None


def format_iso_date(date: datetime) -> str:
    return date.astimezone(UTC).strftime("%Y-%m-%d")


__all__ = [
    "add_decimals",
    "divide_decimals",
    "format_iso_date",
    "is_filled_decimal",
    "is_invalid",
    "parse_decimal",
    "parse_iso_date",
    "subtract_decimals",
    "to_decimal_string",
]
