"""Preliminary working-day helpers for issue programme T+3 scheduling (IF2)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.modules.intermediaries_filing.decimal_utils import format_iso_date, parse_iso_date

T_PLUS3_DISCLAIMER = (
    "Preliminary working-day schedule based on Saturday/Sunday exclusion only. "
    "Exchange holidays and authoritative listing calendars require professional "
    "and exchange confirmation."
)


def add_working_days(date_input: str | datetime, days: int) -> str:
    if isinstance(date_input, str):
        start = parse_iso_date(date_input)
        if start is None:
            try:
                start = datetime.fromisoformat(date_input).replace(tzinfo=UTC)
            except ValueError:
                return ""
    else:
        start = date_input if date_input.tzinfo else date_input.replace(tzinfo=UTC)

    result = start
    remaining = days
    while remaining > 0:
        result = result + timedelta(days=1)
        if result.weekday() < 5:
            remaining -= 1
    return format_iso_date(result)


def compute_preliminary_t_plus3(issue_closing_date: str) -> dict[str, str]:
    trimmed = str(issue_closing_date or "").strip()
    if not trimmed or parse_iso_date(trimmed) is None:
        return {
            "t": "",
            "tPlus1": "",
            "tPlus2": "",
            "tPlus3": "",
            "disclaimer": T_PLUS3_DISCLAIMER,
        }
    return {
        "t": trimmed,
        "tPlus1": add_working_days(trimmed, 1),
        "tPlus2": add_working_days(trimmed, 2),
        "tPlus3": add_working_days(trimmed, 3),
        "disclaimer": T_PLUS3_DISCLAIMER,
    }
