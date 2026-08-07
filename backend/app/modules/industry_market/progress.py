"""Section completion for Industry & Market."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.constants import (
    INDUSTRY_MARKET_CONFIRMATION_FIELDS,
    SECTION_IDS,
)


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_industry_scope_status(payload: dict[str, Any]) -> str:
    section = payload.get("industryScopeAndCompanyMarketMapping") or {}
    classification = section.get("industryClassification") or {}
    market = section.get("marketDefinition") or {}
    core = [
        _filled(classification.get("primaryIndustry")),
        _filled(classification.get("classificationSource")),
        _filled(market.get("marketName")),
        _filled(market.get("geography")),
        _filled(market.get("marketBoundaryExplanation")),
        len(section.get("companyMarketMappings") or []) > 0
        or _filled(market.get("relevanceToIssuerExplanation")),
    ]
    answered = sum(1 for item in core if item)
    mappings = section.get("companyMarketMappings") or []
    mappings_complete = all(
        isinstance(m, dict)
        and _filled(m.get("marketSegment"))
        and _filled(m.get("natureOfParticipation"))
        for m in mappings
    )
    return _status_from(answered, len(core), mappings_complete)


def evaluate_sources_status(payload: dict[str, Any]) -> str:
    section = payload.get("researchSourcesAndIndustryReportGovernance") or {}
    sources = section.get("sources") or []
    core = [len(sources) > 0]
    answered = sum(1 for item in core if item)
    sources_complete = all(
        isinstance(s, dict)
        and _filled(s.get("sourceType"))
        and _filled(s.get("title"))
        and _filled(s.get("sourceReadinessStatus"))
        and _filled(s.get("dataNature"))
        for s in sources
    )
    return _status_from(answered, len(core), sources_complete)


def evaluate_macro_context_status(payload: dict[str, Any]) -> str:
    section = payload.get("macroeconomicAndIndustryContext") or {}
    evolution = section.get("industryEvolution") or {}
    core = [
        len(section.get("macroeconomicIndicators") or []) > 0
        or _filled(evolution.get("industryOriginDevelopment")),
        len(section.get("industryMilestones") or []) > 0
        or _filled(evolution.get("structuralEvolution")),
        _filled(evolution.get("importantRegulatoryChanges"))
        or _filled(evolution.get("digitalisation")),
    ]
    answered = sum(1 for item in core if item)
    indicators_complete = all(
        isinstance(i, dict)
        and _filled(i.get("indicatorName"))
        and _filled(i.get("relevanceExplanation"))
        and (_filled(i.get("sourceId")) or dm.is_filled(i.get("value")))
        for i in (section.get("macroeconomicIndicators") or [])
    )
    return _status_from(answered, len(core), indicators_complete)


def evaluate_market_size_status(payload: dict[str, Any]) -> str:
    section = payload.get("marketSizeSegmentationAndGrowth") or {}
    core = [
        len(section.get("marketSeries") or []) > 0,
        len(section.get("marketSegmentations") or []) > 0
        or len(section.get("segmentMappings") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    series_complete = all(
        isinstance(s, dict)
        and _filled(s.get("marketName"))
        and _filled(s.get("metric"))
        and _filled(s.get("primarySourceId"))
        and len(s.get("periodValues") or []) > 0
        for s in (section.get("marketSeries") or [])
    )
    return _status_from(answered, len(core), series_complete)


def evaluate_demand_trends_status(payload: dict[str, Any]) -> str:
    section = payload.get("demandDriversEndMarketsTrendsAndPolicy") or {}
    core = [
        len(section.get("demandDrivers") or []) > 0,
        len(section.get("endMarkets") or []) > 0
        or len(section.get("industryTrends") or []) > 0,
        len(section.get("governmentPolicies") or []) > 0
        or len(section.get("industryTrends") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    drivers_complete = all(
        isinstance(d, dict)
        and _filled(d.get("title"))
        and _filled(d.get("category"))
        and _filled(d.get("description"))
        for d in (section.get("demandDrivers") or [])
    )
    return _status_from(answered, len(core), drivers_complete)


def evaluate_value_chain_status(payload: dict[str, Any]) -> str:
    section = payload.get("valueChainSupplyStructureAndEntryBarriers") or {}
    supply = section.get("supplySideStructure") or {}
    core = [
        len(section.get("valueChainStages") or []) > 0,
        _filled(supply.get("majorRawMaterialsInputs"))
        or len(supply.get("supplyFactors") or []) > 0,
        len(section.get("entryBarriers") or []) > 0
        or len(section.get("industryCapacityRecords") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    stages_complete = all(
        isinstance(s, dict) and _filled(s.get("name")) and _filled(s.get("sequenceOrder"))
        for s in (section.get("valueChainStages") or [])
    )
    return _status_from(answered, len(core), stages_complete)


def evaluate_competition_status(payload: dict[str, Any]) -> str:
    section = payload.get("competitionMarketShareAndIssuerPositioning") or {}
    core = [
        len(section.get("competitors") or []) > 0,
        len(section.get("marketShareRecords") or []) > 0
        or len(section.get("competitiveMetrics") or []) > 0,
        len(section.get("claims") or []) > 0
        or len(section.get("competitiveDimensions") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    share_complete = all(
        isinstance(r, dict)
        and dm.is_filled(r.get("issuerNumerator"))
        and dm.is_filled(r.get("totalMarketDenominator"))
        and _filled(r.get("denominatorSourceId"))
        for r in (section.get("marketShareRecords") or [])
    )
    return _status_from(answered, len(core), share_complete)


def evaluate_outlook_status(payload: dict[str, Any]) -> str:
    section = payload.get("outlookIndustryRisksAndConfirmations") or {}
    confirmations = section.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key, _ in INDUSTRY_MARKET_CONFIRMATION_FIELDS if confirmations.get(key)
    )
    core = [
        len(section.get("outlookRecords") or []) > 0,
        len(section.get("industryRisks") or []) > 0
        or len(section.get("conflictingResearch") or []) > 0,
        confirmations_checked > 0,
    ]
    answered = sum(1 for item in core if item)
    confirmations_complete = confirmations_checked == len(INDUSTRY_MARKET_CONFIRMATION_FIELDS)
    return _status_from(answered, len(core), confirmations_complete)


def calculate_industry_market_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {
        "industry-scope-and-company-market-mapping": evaluate_industry_scope_status(payload),
        "research-sources-and-industry-report-governance": evaluate_sources_status(payload),
        "macroeconomic-and-industry-context": evaluate_macro_context_status(payload),
        "market-size-segmentation-and-growth": evaluate_market_size_status(payload),
        "demand-drivers-end-markets-trends-and-policy": evaluate_demand_trends_status(payload),
        "value-chain-supply-structure-and-entry-barriers": evaluate_value_chain_status(payload),
        "competition-market-share-and-issuer-positioning": evaluate_competition_status(payload),
        "outlook-industry-risks-and-confirmations": evaluate_outlook_status(payload),
    }
    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(SECTION_IDS)
    overall_status = "not_started"
    if sections_complete == total_sections:
        overall_status = "complete"
    elif any(status != "not_started" for status in statuses):
        overall_status = "in_progress"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
