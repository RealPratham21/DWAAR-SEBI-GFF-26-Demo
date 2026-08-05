"""Decimal-safe offer structure calculations (not persisted as editable fields)."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any


def _to_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _dec_to_json(value: Decimal | None) -> str | None:
    """Serialize Decimal as string for JSON-safe API responses."""
    if value is None:
        return None
    normalized = value.normalize() if value == value.to_integral() else value
    text = format(normalized, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text


def offer_type_flags(offer_type: str) -> tuple[bool, bool]:
    includes_fresh = offer_type in {"fresh-issue", "fresh-and-ofs"}
    includes_ofs = offer_type in {"offer-for-sale", "fresh-and-ofs"}
    return includes_fresh, includes_ofs


def compute_offer_structure(offer: dict[str, Any], offer_type: str) -> dict[str, Any]:
    includes_fresh, includes_ofs = offer_type_flags(offer_type)

    fresh_shares = (
        _to_decimal(offer.get("proposedFreshIssueShares")) if includes_fresh else Decimal("0")
    )
    ofs_shares = _to_decimal(offer.get("proposedOfsShares")) if includes_ofs else Decimal("0")
    fresh_amount = (
        _to_decimal(offer.get("proposedFreshIssueAmount")) if includes_fresh else Decimal("0")
    )
    ofs_amount = _to_decimal(offer.get("proposedOfsAmount")) if includes_ofs else Decimal("0")
    existing_shares = _to_decimal(offer.get("existingIssuedEquityShares"))
    existing_paid_up = _to_decimal(offer.get("existingPaidUpEquityShareCapital"))
    face_value = _to_decimal(offer.get("faceValuePerEquityShare"))

    total_shares = (
        None if fresh_shares is None or ofs_shares is None else fresh_shares + ofs_shares
    )
    total_amount = (
        None if fresh_amount is None or ofs_amount is None else fresh_amount + ofs_amount
    )

    fresh_pct: Decimal | None = None
    ofs_pct: Decimal | None = None
    if total_shares is not None and total_shares > 0 and fresh_shares is not None:
        fresh_pct = (fresh_shares / total_shares) * Decimal("100")
    if total_shares is not None and total_shares > 0 and ofs_shares is not None:
        ofs_pct = (ofs_shares / total_shares) * Decimal("100")

    post_issue_shares = (
        None
        if existing_shares is None or fresh_shares is None
        else existing_shares + fresh_shares
    )

    # OFS must not increase paid-up capital — only fresh issue does.
    if not includes_fresh:
        paid_up_increase: Decimal | None = Decimal("0")
    elif face_value is not None and fresh_shares is not None:
        paid_up_increase = face_value * fresh_shares
    else:
        paid_up_increase = None

    post_issue_paid_up = (
        None
        if existing_paid_up is None or paid_up_increase is None
        else existing_paid_up + paid_up_increase
    )

    offer_pct_post: Decimal | None = None
    if (
        post_issue_shares is not None
        and post_issue_shares > 0
        and total_shares is not None
    ):
        offer_pct_post = (total_shares / post_issue_shares) * Decimal("100")

    return {
        "includesFreshIssue": includes_fresh,
        "includesOfs": includes_ofs,
        "amountDisplayUnit": offer.get("amountDisplayUnit") or "crore",
        "totalSharesOffered": _dec_to_json(total_shares),
        "totalOfferAmount": _dec_to_json(total_amount),
        "freshIssuePercentageOfOffer": _dec_to_json(fresh_pct),
        "ofsPercentageOfOffer": _dec_to_json(ofs_pct),
        "proposedPostIssueShares": _dec_to_json(post_issue_shares),
        "proposedPostIssuePaidUpCapital": _dec_to_json(post_issue_paid_up),
        "offerAsPercentageOfPostIssueCapital": _dec_to_json(offer_pct_post),
        "paidUpCapitalIncreaseFromOffer": _dec_to_json(paid_up_increase),
        # Internal Decimal values for assessment (not in API schema directly).
        "_decimals": {
            "totalSharesOffered": total_shares,
            "totalOfferAmount": total_amount,
            "freshIssuePercentageOfOffer": fresh_pct,
            "ofsPercentageOfOffer": ofs_pct,
            "proposedPostIssueShares": post_issue_shares,
            "proposedPostIssuePaidUpCapital": post_issue_paid_up,
            "offerAsPercentageOfPostIssueCapital": offer_pct_post,
            "paidUpCapitalIncreaseFromOffer": paid_up_increase,
        },
    }


def compute_offer_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    direction = payload.get("ipoDirection") or {}
    offer = payload.get("offerStructure") or {}
    return compute_offer_structure(offer, str(direction.get("proposedOfferType") or ""))


def offer_computations_for_api(payload: dict[str, Any]) -> dict[str, Any]:
    computed = compute_offer_from_payload(payload)
    computed.pop("_decimals", None)
    return computed
