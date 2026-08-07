"""Market-share calculation and validation (NOT persisted)."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.sources import get_source_by_id


def calculate_market_share(
    numerator: str,
    denominator: str,
    decimal_places: int = 4,
) -> str:
    return dm.pct(numerator, denominator, decimal_places)


def validate_market_share_record(
    record: dict[str, Any],
    payload: dict[str, Any],
) -> dict[str, Any]:
    flags: list[str] = []

    calculated_market_share = calculate_market_share(
        str(record.get("issuerNumerator") or ""),
        str(record.get("totalMarketDenominator") or ""),
    )

    denominator_without_source = not str(record.get("denominatorSourceId") or "").strip()
    if denominator_without_source:
        flags.append("Denominator lacks a supporting source.")

    unsupported_numerator = (
        not str(record.get("numeratorSource") or "").strip()
        and not str(record.get("linkedIssuerRecordId") or "").strip()
        and not dm.is_filled(record.get("issuerNumerator"))
    )
    if unsupported_numerator:
        flags.append("Issuer numerator is not linked to a verified source or workstream record.")

    calculated_vs_reported_difference = (
        dm.is_filled(record.get("reportedMarketShare"))
        and dm.is_filled(calculated_market_share)
        and dm.differs_beyond(
            str(record.get("reportedMarketShare") or ""),
            calculated_market_share,
            "0.5",
        )
    )
    if calculated_vs_reported_difference:
        flags.append("Reported market share differs from calculated share.")

    market_section = payload.get("marketSizeSegmentationAndGrowth") or {}
    market_def = str(record.get("marketDefinition") or "").strip()
    segment_ref = str(record.get("segment") or "").strip()
    linked_series = next(
        (
            s
            for s in (market_section.get("marketSeries") or [])
            if isinstance(s, dict)
            and (
                str(s.get("marketName") or "").strip() == market_def
                or s.get("id") == segment_ref
            )
        ),
        None,
    )

    geography_mismatch = False
    unit_mismatch = False
    period_mismatch = False
    segment_mismatch = False

    if linked_series:
        record_geo = str(record.get("geography") or "").strip()
        series_geo = str(linked_series.get("geography") or "").strip()
        if record_geo and series_geo and record_geo.lower() != series_geo.lower():
            geography_mismatch = True
            flags.append("Record geography differs from linked market series geography.")

        record_period = str(record.get("period") or "").strip()
        period_values = linked_series.get("periodValues") or []
        if record_period and period_values:
            if not any(
                isinstance(pv, dict) and str(pv.get("period") or "").strip() == record_period
                for pv in period_values
            ):
                period_mismatch = True
                flags.append("Record period does not match any period on the linked market series.")

    if segment_ref and market_def:
        segment_record = next(
            (
                s
                for s in (market_section.get("marketSegmentations") or [])
                if isinstance(s, dict)
                and (s.get("id") == segment_ref or s.get("segmentName") == segment_ref)
            ),
            None,
        )
        if segment_record:
            seg_period = str(segment_record.get("period") or "").strip()
            rec_period = str(record.get("period") or "").strip()
            if seg_period and rec_period and seg_period != rec_period:
                period_mismatch = True
                flags.append("Market-share period differs from linked segment period.")
            if (
                linked_series
                and str(segment_record.get("parentMarketSeriesId") or "").strip()
                and segment_record.get("parentMarketSeriesId") != linked_series.get("id")
            ):
                segment_mismatch = True
                flags.append("Segment mapping does not align with the selected market definition.")

    denominator_source = get_source_by_id(payload, str(record.get("denominatorSourceId") or ""))
    metric_basis = str(record.get("metricBasis") or "").strip()
    if denominator_source and str(denominator_source.get("unit") or "").strip() and metric_basis:
        basis_unit_map = {
            "revenue": ["revenue", "value", "inr", "usd"],
            "volume": ["volume", "units", "tonnes", "litres"],
            "units": ["units", "volume"],
            "capacity": ["capacity", "mw", "mtpa"],
        }
        allowed = basis_unit_map.get(metric_basis, [])
        unit_lower = str(denominator_source.get("unit") or "").lower()
        if allowed and not any(token in unit_lower for token in allowed):
            unit_mismatch = True
            flags.append("Denominator source unit may not match the selected metric basis.")

    numerator_source = str(record.get("numeratorSource") or "")
    if numerator_source in ("business-operations", "financials-kpis"):
        if not str(record.get("linkedIssuerRecordId") or "").strip():
            unsupported_numerator = True
            flags.append("Linked workstream numerator selected but no linked record ID provided.")

    return {
        "calculatedMarketShare": dm.round_decimal(calculated_market_share, 4),
        "periodMismatch": period_mismatch,
        "geographyMismatch": geography_mismatch,
        "segmentMismatch": segment_mismatch,
        "unitMismatch": unit_mismatch,
        "unsupportedNumerator": unsupported_numerator,
        "denominatorWithoutSource": denominator_without_source,
        "calculatedVsReportedDifference": calculated_vs_reported_difference,
        "flags": flags,
    }
