"""Decimal-safe helpers for Litigation, Approvals & Compliance."""

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


def parse_iso_date(value: str) -> datetime | None:
    trimmed = str(value or "").strip()
    if not trimmed:
        return None
    try:
        if len(trimmed) == 10 and trimmed[4] == "-" and trimmed[7] == "-":
            parsed = datetime.strptime(trimmed, "%Y-%m-%d").replace(tzinfo=UTC)
            return parsed
        parsed = datetime.fromisoformat(trimmed.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed
    except ValueError:
        return None


def days_between_dates(from_date: str, to_date: str) -> int | None:
    start = parse_iso_date(from_date)
    end = parse_iso_date(to_date)
    if start is None or end is None:
        return None
    return int((end - start).total_seconds() // (60 * 60 * 24))


__all__ = [
    "add_decimals",
    "days_between_dates",
    "is_filled_decimal",
    "is_invalid",
    "parse_decimal",
    "parse_iso_date",
    "subtract_decimals",
    "to_decimal_string",
]
