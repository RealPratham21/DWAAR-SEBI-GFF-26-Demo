"""Human-facing publication formatting helpers (P2.3)."""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from app.modules.drhp.generation.fact_locking import format_locked_display


def format_share_count(raw: str | None) -> str:
    if not raw or not str(raw).strip():
        return ""
    return format_locked_display(str(raw).strip(), semantic_type="share_count")


def format_currency_inr(raw: str | None) -> str:
    if not raw or not str(raw).strip():
        return ""
    return format_locked_display(str(raw).strip(), semantic_type="currency_inr")


def humanize_enum(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"\s+", " ", text)
    if text.lower() in {"yes", "no", "na", "nil"}:
        return text.title() if text.lower() != "na" else "NA"
    return text[0].upper() + text[1:] if len(text) == 1 else " ".join(
        w.capitalize() if w.lower() not in {"and", "or", "of", "to", "the", "in", "for"} else w.lower()
        for w in text.split(" ")
    )


def humanize_designation(value: str) -> str:
    return humanize_enum(value.replace("-", " "))


def format_percentage(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    return f"{text}%" if not text.endswith("%") else text


def format_fy_label(value: str) -> str:
    text = str(value or "").strip()
    if text.upper().startswith("FY"):
        return text.upper().replace("FY ", "FY ").replace("FY", "FY ")
    return text


def derive_approval_status(
    *,
    stored_status: str,
    expiry: str,
    renewal: dict[str, Any] | None = None,
    reference: date | None = None,
) -> str:
    """Derive publication-facing approval status from stored fields."""
    ref = reference or date.today()
    renewal = renewal or {}
    expiry_text = str(expiry or "").strip()
    renewal_due = str(renewal.get("renewalDueDate") or expiry_text).strip()
    submitted = str(renewal.get("renewalApplicationDate") or "").strip()
    continuation = str(renewal.get("continuationPendingRenewal") or "").lower()

    expiry_date = _parse_date(expiry_text or renewal_due)
    if expiry_date and expiry_date < ref:
        if submitted:
            return f"Expired — renewal application submitted on {submitted}"
        if "management-believes" in continuation or continuation == "yes":
            return f"Expired — issuer indicates operations may continue pending renewal (expired {expiry_text})"
        return f"Expired (expiry: {expiry_text})"

    if submitted and expiry_date and expiry_date >= ref:
        return f"Valid — renewal application submitted ({submitted})"

    status = humanize_enum(stored_status)
    if status and expiry_text:
        return f"{status} (expires {expiry_text})"
    return status or "As disclosed"


def _parse_date(text: str) -> date | None:
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            from datetime import datetime

            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            continue
    return None


def prose_join(parts: list[str], *, separator: str = " ") -> str:
    return separator.join(p.strip() for p in parts if p and p.strip())
