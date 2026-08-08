"""Presentation formatting for global facts (G5)."""

from __future__ import annotations

import re
from typing import Any


def _indian_group_integer(digits: str) -> str:
    if len(digits) <= 3:
        return digits
    last_three = digits[-3:]
    rest = digits[:-3]
    parts: list[str] = []
    while len(rest) > 2:
        parts.insert(0, rest[-2:])
        rest = rest[:-2]
    if rest:
        parts.insert(0, rest)
    return ",".join(parts) + "," + last_three


def format_shares(value: Any) -> str:
    text = str(value or "").strip().replace(",", "")
    if not text or text in {"[●]", "—", "-"}:
        return text
    if text.replace(".", "", 1).isdigit():
        if "." in text:
            whole, frac = text.split(".", 1)
            return f"{_indian_group_integer(whole)}.{frac} shares"
        return f"{_indian_group_integer(text)} shares"
    return f"{text} shares"


def format_money_lakh(value: Any, *, currency: str = "INR") -> str:
    text = str(value or "").strip().replace(",", "")
    if not text or text in {"[●]", "—", "-"}:
        return text
    symbol = "₹" if currency.upper() == "INR" else currency
    if text.replace(".", "", 1).isdigit():
        if "." in text:
            whole, frac = text.split(".", 1)
            return f"{symbol}{_indian_group_integer(whole)}.{frac} lakh"
        return f"{symbol}{_indian_group_integer(text)} lakh"
    if text.lower().endswith("lakh"):
        return f"{symbol}{text.replace('lakh', '').strip()} lakh"
    return f"{symbol}{text}"


def format_rupees(value: Any) -> str:
    text = str(value or "").strip().replace(",", "").replace("₹", "")
    if not text or text in {"[●]", "—", "-"}:
        return text
    if text.replace(".", "", 1).isdigit():
        if "." in text:
            whole, frac = text.split(".", 1)
            return f"₹{_indian_group_integer(whole)}.{frac}"
        return f"₹{_indian_group_integer(text)}"
    return f"₹{text}"


def format_percent(value: Any) -> str:
    text = str(value or "").strip().replace("%", "")
    if not text or text in {"[●]", "—", "-"}:
        return text
    try:
        num = float(text)
        if num <= 1 and "." in text:
            return f"{num * 100:.2f}%"
        return f"{num:.2f}%"
    except ValueError:
        return text if text.endswith("%") else f"{text}%"


def format_money_crore(value: Any, *, currency: str = "INR") -> str:
    text = str(value or "").strip().replace(",", "")
    if not text or text in {"[●]", "—", "-"}:
        return text
    symbol = "₹" if currency.upper() == "INR" else currency
    if text.replace(".", "", 1).isdigit():
        if "." in text:
            whole, frac = text.split(".", 1)
            return f"{symbol}{_indian_group_integer(whole)}.{frac} crore"
        return f"{symbol}{_indian_group_integer(text)} crore"
    if text.lower().endswith("crore"):
        return f"{symbol}{text.replace('crore', '').strip()} crore"
    return f"{symbol}{text}"


def format_display_value(value: Any, *, semantic_type: str, unit: str = "", currency: str = "") -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    if semantic_type == "shares":
        return format_shares(text)
    if semantic_type in {"money", "money_lakh"}:
        return format_money_lakh(text, currency=currency or "INR")
    if semantic_type == "money_crore":
        return format_money_crore(text, currency=currency or "INR")
    if semantic_type in {"currency", "money_rupees"}:
        return format_rupees(text)
    if semantic_type in {"ratio", "percent", "percentage"}:
        return format_percent(text)
    if unit and unit not in text:
        return f"{text} {unit}"
    return text
