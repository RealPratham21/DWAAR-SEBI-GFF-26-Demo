"""Derived Industry & Market computations (NOT persisted)."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.claims import derive_claim_status
from app.modules.industry_market.market_series import calculate_cagr
from app.modules.industry_market.market_share import calculate_market_share, validate_market_share_record
from app.modules.industry_market.sources import get_sources


def _latest_period_value(series: dict[str, Any]) -> dict[str, Any] | None:
    period_values = [
        pv
        for pv in (series.get("periodValues") or [])
        if isinstance(pv, dict) and dm.is_filled(pv.get("value"))
    ]
    if not period_values:
        return None
    return period_values[-1]


def compute_industry_market_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    scope = payload.get("industryScopeAndCompanyMarketMapping") or {}
    classification = scope.get("industryClassification") or {}
    market_definition = scope.get("marketDefinition") or {}
    market_section = payload.get("marketSizeSegmentationAndGrowth") or {}
    competition = payload.get("competitionMarketShareAndIssuerPositioning") or {}
    outlook = payload.get("outlookIndustryRisksAndConfirmations") or {}
    sources = get_sources(payload)

    primary_series = next(
        (s for s in (market_section.get("marketSeries") or []) if isinstance(s, dict)),
        None,
    )
    latest_point = _latest_period_value(primary_series) if primary_series else None

    forecast_market_size = ""
    forecast_period = ""
    forecast_cagr = ""
    if primary_series:
        forecast_meta = primary_series.get("forecastMetadata") or {}
        forecast_market_size = str(forecast_meta.get("forecastValue") or "")
        forecast_period = " – ".join(
            part
            for part in (
                str(forecast_meta.get("forecastStartPeriod") or "").strip(),
                str(forecast_meta.get("forecastEndPeriod") or "").strip(),
            )
            if part
        )
        reported_cagr = str(forecast_meta.get("reportedCagr") or "")
        period_count = max(len(primary_series.get("periodValues") or []) - 1, 1)
        calculated_cagr = calculate_cagr(
            str(latest_point.get("value") if latest_point else ""),
            forecast_market_size,
            period_count,
        )
        forecast_cagr = reported_cagr or calculated_cagr

    primary_share = next(
        (r for r in (competition.get("marketShareRecords") or []) if isinstance(r, dict)),
        None,
    )
    share_validation = (
        validate_market_share_record(primary_share, payload) if primary_share else None
    )

    claims = [
        {"claim": claim, "status": derive_claim_status(claim, payload)}
        for claim in (competition.get("claims") or [])
        if isinstance(claim, dict)
    ]

    issuer_linked_segment_count = sum(
        1
        for mapping in (market_section.get("segmentMappings") or [])
        if isinstance(mapping, dict)
        and (
            str(mapping.get("linkedBusinessOperationsSegmentId") or "").strip()
            or str(mapping.get("linkedFinancialsReportingSegmentId") or "").strip()
        )
    )

    _ = linked_references

    return {
        "primaryIndustry": str(classification.get("primaryIndustry") or ""),
        "relevantMarket": str(market_definition.get("marketName") or ""),
        "geography": str(market_definition.get("geography") or ""),
        "latestMarketSize": str(latest_point.get("value") if latest_point else ""),
        "latestMarketSizePeriod": str(latest_point.get("period") if latest_point else ""),
        "latestMarketSizeUnit": str(primary_series.get("unit") if primary_series else ""),
        "forecastMarketSize": forecast_market_size,
        "forecastPeriod": forecast_period,
        "forecastCagr": forecast_cagr,
        "marketSeriesCount": len(market_section.get("marketSeries") or []),
        "marketSegmentCount": len(market_section.get("marketSegmentations") or []),
        "issuerLinkedSegmentCount": issuer_linked_segment_count,
        "competitorCount": len(competition.get("competitors") or []),
        "calculatedIssuerMarketShare": (
            share_validation.get("calculatedMarketShare", "") if share_validation else ""
        ),
        "marketShareBasis": str(primary_share.get("metricBasis") if primary_share else ""),
        "marketSharePeriod": str(primary_share.get("period") if primary_share else ""),
        "sourceCount": len(sources),
        "currentSourceCount": sum(
            1 for s in sources if s.get("sourceReadinessStatus") == "current"
        ),
        "potentiallyStaleSourceCount": sum(
            1 for s in sources if s.get("sourceReadinessStatus") == "potentially_stale"
        ),
        "pendingVerificationSourceCount": sum(
            1
            for s in sources
            if s.get("sourceReadinessStatus")
            in ("pending_verification", "professional_confirmation_required")
        ),
        "commissionedReportCount": sum(
            1 for s in sources if s.get("sourceType") == "commissioned-industry-report"
        ),
        "claimsProposed": len(claims),
        "claimsSubstantiated": sum(1 for entry in claims if entry["status"] == "substantiated"),
        "claimsNeedingEvidence": sum(
            1
            for entry in claims
            if entry["status"]
            in (
                "insufficient_source",
                "do_not_use",
                "stale_source",
                "contradictory_sources",
            )
        ),
        "conflictingSourceCount": len(outlook.get("conflictingResearch") or []),
    }


def calculate_yoy_growth(current_value: str, prior_value: str, decimal_places: int = 2) -> str:
    from app.modules.industry_market.market_series import calculate_yoy_growth as _yoy

    return _yoy(current_value, prior_value, decimal_places)


__all__ = [
    "calculate_market_share",
    "calculate_yoy_growth",
    "compute_industry_market_model",
]
