"""Market-series growth and segmentation reconciliation (NOT persisted)."""

from __future__ import annotations

import math
from typing import Any

from app.modules.industry_market import decimal_utils as dm


def calculate_yoy_growth(
    current_value: str,
    prior_value: str,
    decimal_places: int = 2,
) -> str:
    if not dm.is_filled(current_value) or not dm.is_filled(prior_value):
        return ""
    prior_cmp = dm.compare(prior_value, "0")
    if prior_cmp is None or prior_cmp == 0:
        return ""
    return dm.pct(dm.difference(current_value, prior_value), dm.abs_decimal(prior_value), decimal_places)


def calculate_cagr(
    start_value: str,
    end_value: str,
    period_count: int,
    decimal_places: int = 2,
) -> str:
    if not dm.is_filled(start_value) or not dm.is_filled(end_value):
        return ""
    if period_count <= 0:
        return ""
    start_cmp = dm.compare(start_value, "0")
    if start_cmp is None or start_cmp <= 0:
        return ""

    ratio = dm.div(end_value, start_value, 12)
    if ratio == "":
        return ""

    ratio_num = dm.to_number(ratio)
    if ratio_num is None or ratio_num <= 0:
        return ""

    cagr = (math.pow(ratio_num, 1 / period_count) - 1) * 100
    if not math.isfinite(cagr):
        return ""
    parsed = dm.parse_decimal(str(cagr))
    if parsed is None:
        return ""
    from decimal import ROUND_HALF_UP, Decimal

    quant = Decimal(1).scaleb(-decimal_places)
    return format(parsed.quantize(quant, rounding=ROUND_HALF_UP), f".{decimal_places}f")


def reconcile_reported_vs_calculated_cagr(
    reported: str,
    calculated: str,
    tolerance: str = "0.5",
) -> dict[str, Any]:
    has_reported = dm.is_filled(reported)
    has_calculated = dm.is_filled(calculated)

    if not has_reported and not has_calculated:
        return {
            "reported": "",
            "calculated": "",
            "difference": "",
            "reconciles": False,
            "message": "Neither reported nor calculated CAGR is available.",
        }

    if not has_reported:
        return {
            "reported": "",
            "calculated": calculated,
            "difference": "",
            "reconciles": False,
            "message": "Reported CAGR not entered — calculated value shown for reference only.",
        }

    if not has_calculated:
        return {
            "reported": reported,
            "calculated": "",
            "difference": "",
            "reconciles": False,
            "message": "Calculated CAGR cannot be computed from available period values.",
        }

    delta = dm.round_decimal(dm.difference(reported, calculated), 2)
    reconciles = not dm.differs_beyond(reported, calculated, tolerance)

    return {
        "reported": reported,
        "calculated": calculated,
        "difference": delta,
        "reconciles": reconciles,
        "message": (
            "Reported and calculated CAGR reconcile within tolerance."
            if reconciles
            else f"Reported CAGR differs from calculated by {delta} percentage points."
        ),
    }


def reconcile_segment_percentages(
    segments: list[dict[str, Any]],
    tolerance: str = "2",
) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}

    for segment in segments:
        if not isinstance(segment, dict):
            continue
        parent = str(segment.get("parentMarketSeriesId") or "").strip()
        if not parent:
            continue
        period = str(segment.get("period") or "").strip()
        key = f"{parent}::{period}"
        groups.setdefault(key, []).append(segment)

    results: list[dict[str, Any]] = []

    for key, group in groups.items():
        parent_market_series_id, period = key.split("::", 1)
        percentages = [
            str(s.get("marketSharePercentage") or "")
            for s in group
            if dm.is_filled(s.get("marketSharePercentage"))
        ]
        total_percentage = dm.sum_decimals(percentages) if percentages else ""

        flags: list[str] = []
        if any(not str(s.get("parentMarketSeriesId") or "").strip() for s in group):
            flags.append("Segment missing parent market series.")
        if any(not dm.is_filled(s.get("marketSharePercentage")) for s in group):
            flags.append("One or more segments lack a market-share percentage.")
        if dm.is_filled(total_percentage):
            total_vs_100 = dm.compare(total_percentage, "100")
            if total_vs_100 is not None:
                if total_vs_100 > 0 and not dm.differs_beyond(total_percentage, "100", tolerance):
                    flags.append(
                        f"Segment percentages sum to {total_percentage}% — exceeds 100%.",
                    )
                elif total_vs_100 > 0:
                    flags.append(
                        f"Segment percentages sum to {total_percentage}% — materially above 100%.",
                    )
                lower_bound = dm.subtract("100", tolerance)
                total_vs_lower = dm.compare(total_percentage, lower_bound)
                if total_vs_lower is not None and total_vs_lower < 0:
                    flags.append(
                        f"Segment percentages sum to {total_percentage}% — materially below 100%.",
                    )

        reconciles = (
            len(flags) == 0
            and dm.is_filled(total_percentage)
            and not dm.differs_beyond(total_percentage, "100", tolerance)
        )

        results.append(
            {
                "parentMarketSeriesId": parent_market_series_id,
                "period": period,
                "totalPercentage": total_percentage,
                "reconciles": reconciles,
                "flags": flags,
            },
        )

    return results
