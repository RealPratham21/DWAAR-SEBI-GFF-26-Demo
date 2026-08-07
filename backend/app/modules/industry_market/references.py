"""Cross-payload reference counting — ports frontend references.ts."""

from __future__ import annotations

from typing import Any


def _push_location(
    counts: dict[str, dict[str, Any]],
    ref_id: str,
    location: str,
) -> None:
    if not str(ref_id or "").strip():
        return
    entry = counts.setdefault(ref_id, {"total": 0, "locations": []})
    entry["total"] += 1
    entry["locations"].append(location)


def _result_from(counts: dict[str, dict[str, Any]], ref_id: str) -> dict[str, Any]:
    entry = counts.get(ref_id)
    return {
        "total": entry["total"] if entry else 0,
        "locations": entry["locations"] if entry else [],
    }


def count_source_references(payload: dict[str, Any], source_id: str) -> dict[str, Any]:
    counts: dict[str, dict[str, Any]] = {}

    macro = payload.get("macroeconomicAndIndustryContext") or {}
    for indicator in macro.get("macroeconomicIndicators") or []:
        if isinstance(indicator, dict) and indicator.get("sourceId") == source_id:
            label = indicator.get("indicatorName") or indicator.get("id")
            _push_location(counts, source_id, f"Macro indicator — {label}")

    for milestone in macro.get("industryMilestones") or []:
        if isinstance(milestone, dict) and milestone.get("sourceId") == source_id:
            label = milestone.get("event") or milestone.get("id")
            _push_location(counts, source_id, f"Industry milestone — {label}")

    market_section = payload.get("marketSizeSegmentationAndGrowth") or {}
    for series in market_section.get("marketSeries") or []:
        if not isinstance(series, dict):
            continue
        label = series.get("marketName") or series.get("id")
        if series.get("primarySourceId") == source_id:
            _push_location(counts, source_id, f"Market series — {label}")
        forecast = series.get("forecastMetadata") or {}
        if forecast.get("forecastSourceId") == source_id:
            _push_location(counts, source_id, f"Market series forecast — {label}")
        for period_value in series.get("periodValues") or []:
            if isinstance(period_value, dict) and period_value.get("sourceId") == source_id:
                period = period_value.get("period") or period_value.get("id")
                _push_location(
                    counts,
                    source_id,
                    f"Market series period — {label} ({period})",
                )

    for segment in market_section.get("marketSegmentations") or []:
        if isinstance(segment, dict) and segment.get("sourceId") == source_id:
            label = segment.get("segmentName") or segment.get("id")
            _push_location(counts, source_id, f"Market segment — {label}")

    demand = payload.get("demandDriversEndMarketsTrendsAndPolicy") or {}
    for driver in demand.get("demandDrivers") or []:
        if isinstance(driver, dict) and driver.get("sourceId") == source_id:
            label = driver.get("title") or driver.get("id")
            _push_location(counts, source_id, f"Demand driver — {label}")
    for end_market in demand.get("endMarkets") or []:
        if isinstance(end_market, dict) and end_market.get("sourceId") == source_id:
            label = end_market.get("endUserIndustry") or end_market.get("id")
            _push_location(counts, source_id, f"End market — {label}")
    for trend in demand.get("industryTrends") or []:
        if isinstance(trend, dict) and trend.get("sourceId") == source_id:
            label = trend.get("trend") or trend.get("id")
            _push_location(counts, source_id, f"Industry trend — {label}")
    for policy in demand.get("governmentPolicies") or []:
        if isinstance(policy, dict) and policy.get("sourceId") == source_id:
            label = policy.get("policyScheme") or policy.get("id")
            _push_location(counts, source_id, f"Government policy — {label}")

    value_chain = payload.get("valueChainSupplyStructureAndEntryBarriers") or {}
    for stage in value_chain.get("valueChainStages") or []:
        if isinstance(stage, dict) and stage.get("sourceId") == source_id:
            label = stage.get("name") or stage.get("id")
            _push_location(counts, source_id, f"Value chain stage — {label}")
    supply = value_chain.get("supplySideStructure") or {}
    for factor in supply.get("supplyFactors") or []:
        if isinstance(factor, dict) and factor.get("sourceId") == source_id:
            label = factor.get("factor") or factor.get("id")
            _push_location(counts, source_id, f"Supply factor — {label}")
    for capacity in value_chain.get("industryCapacityRecords") or []:
        if isinstance(capacity, dict) and capacity.get("sourceId") == source_id:
            label = capacity.get("period") or capacity.get("id")
            _push_location(counts, source_id, f"Industry capacity — {label}")
    for barrier in value_chain.get("entryBarriers") or []:
        if isinstance(barrier, dict) and barrier.get("sourceId") == source_id:
            label = barrier.get("barrierType") or barrier.get("id")
            _push_location(counts, source_id, f"Entry barrier — {label}")

    competition = payload.get("competitionMarketShareAndIssuerPositioning") or {}
    for competitor in competition.get("competitors") or []:
        if isinstance(competitor, dict) and competitor.get("sourceId") == source_id:
            label = competitor.get("companyName") or competitor.get("id")
            _push_location(counts, source_id, f"Competitor — {label}")
    for metric in competition.get("competitiveMetrics") or []:
        if isinstance(metric, dict) and metric.get("sourceId") == source_id:
            label = metric.get("metricType") or metric.get("id")
            _push_location(counts, source_id, f"Competitive metric — {label}")
    for dimension in competition.get("competitiveDimensions") or []:
        if isinstance(dimension, dict) and dimension.get("sourceId") == source_id:
            label = dimension.get("dimension") or dimension.get("id")
            _push_location(counts, source_id, f"Competitive dimension — {label}")
    for share in competition.get("marketShareRecords") or []:
        if isinstance(share, dict) and share.get("denominatorSourceId") == source_id:
            label = share.get("marketDefinition") or share.get("id")
            _push_location(counts, source_id, f"Market share denominator — {label}")
    for claim in competition.get("claims") or []:
        if isinstance(claim, dict) and claim.get("sourceId") == source_id:
            label = claim.get("exactProposedWording") or claim.get("id")
            _push_location(counts, source_id, f"Claim — {label}")

    outlook = payload.get("outlookIndustryRisksAndConfirmations") or {}
    for record in outlook.get("outlookRecords") or []:
        if isinstance(record, dict) and record.get("sourceId") == source_id:
            label = record.get("market") or record.get("id")
            _push_location(counts, source_id, f"Outlook — {label}")
    for risk in outlook.get("industryRisks") or []:
        if isinstance(risk, dict) and risk.get("sourceId") == source_id:
            label = risk.get("title") or risk.get("id")
            _push_location(counts, source_id, f"Industry risk — {label}")
    for conflict in outlook.get("conflictingResearch") or []:
        if not isinstance(conflict, dict):
            continue
        label = conflict.get("topic") or conflict.get("id")
        if conflict.get("sourceAId") == source_id:
            _push_location(counts, source_id, f"Conflicting research (A) — {label}")
        if conflict.get("sourceBId") == source_id:
            _push_location(counts, source_id, f"Conflicting research (B) — {label}")
        if conflict.get("preferredSourceId") == source_id:
            _push_location(counts, source_id, f"Preferred source — {label}")

    return _result_from(counts, source_id)


def validate_source_deletion(payload: dict[str, Any], source_id: str) -> dict[str, Any]:
    refs = count_source_references(payload, source_id)
    return {
        "sourceId": source_id,
        "canDelete": refs["total"] == 0,
        "dependencies": refs["locations"],
    }


def count_market_series_references(payload: dict[str, Any], series_id: str) -> dict[str, Any]:
    counts: dict[str, dict[str, Any]] = {}
    market_section = payload.get("marketSizeSegmentationAndGrowth") or {}
    segments = market_section.get("marketSegmentations") or []

    for segment in segments:
        if isinstance(segment, dict) and segment.get("parentMarketSeriesId") == series_id:
            label = segment.get("segmentName") or segment.get("id")
            _push_location(counts, series_id, f"Market segment — {label}")

    for mapping in market_section.get("segmentMappings") or []:
        if not isinstance(mapping, dict):
            continue
        linked = next(
            (
                s
                for s in segments
                if isinstance(s, dict) and s.get("id") == mapping.get("marketSegmentId")
            ),
            None,
        )
        if linked and linked.get("parentMarketSeriesId") == series_id:
            _push_location(counts, series_id, f"Segment mapping — {mapping.get('id')}")

    return _result_from(counts, series_id)


def count_competitor_references(payload: dict[str, Any], competitor_id: str) -> dict[str, Any]:
    counts: dict[str, dict[str, Any]] = {}
    competition = payload.get("competitionMarketShareAndIssuerPositioning") or {}
    for metric in competition.get("competitiveMetrics") or []:
        if isinstance(metric, dict) and metric.get("competitorId") == competitor_id:
            label = metric.get("metricType") or metric.get("id")
            _push_location(counts, competitor_id, f"Competitive metric — {label}")
    for dimension in competition.get("competitiveDimensions") or []:
        if isinstance(dimension, dict) and dimension.get("competitorId") == competitor_id:
            label = dimension.get("dimension") or dimension.get("id")
            _push_location(counts, competitor_id, f"Competitive dimension — {label}")
    return _result_from(counts, competitor_id)
