"""Draft-tolerant section validation for Industry & Market."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.constants import (
    ACTUAL_ESTIMATE_FORECAST,
    BARRIER_STRENGTH,
    BARRIER_TYPE,
    CLAIM_STATUS,
    CLAIM_TYPE,
    CLASSIFICATION_SOURCE,
    COMMISSIONED_REPORT_PURPOSE,
    COMPETITOR_METRIC_TYPE,
    CYCLICAL_DEFENSIVE,
    DATA_NATURE,
    DEMAND_DRIVER_CATEGORY,
    FORECAST_SCENARIO,
    GEOGRAPHY,
    INDUSTRY_MARKET_CONFIRMATION_FIELDS,
    INDUSTRY_RISK_CATEGORY,
    MACRO_INDICATOR_CATEGORY,
    MARKET_METRIC,
    MARKET_SHARE_METRIC_BASIS,
    NOMINAL_REAL,
    NUMERATOR_SOURCE,
    OUTLOOK_DATA_NATURE,
    POLICY_NATURE,
    SCOPE_EXCLUSION_TYPE,
    SEGMENTATION_DIMENSION,
    SOURCE_READINESS_STATUS,
    SOURCE_TYPE,
    TREND_TIMELINE_STATUS,
    YES_NO_NOT_SURE,
)
from app.modules.industry_market.references import (
    count_competitor_references,
    count_market_series_references,
    validate_source_deletion,
)
from app.modules.industry_market.sources import get_sources


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(
    errors: dict[str, str],
    field: str,
    value: Any,
    allowed: frozenset[str],
) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or str(value).strip() == "":
        return
    if dm.is_invalid(value):
        errors[field] = "Enter a valid decimal value."


def _optional_bool(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None:
        return
    if not isinstance(value, bool):
        errors[field] = "Must be true or false."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _source_ids(payload: dict[str, Any]) -> set[str]:
    return {str(s.get("id")) for s in get_sources(payload) if s.get("id")}


def _optional_source_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a source that does not exist in the registry."


def _validate_source_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_sources: list[Any] | None,
) -> None:
    old_ids = _source_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_sources or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["researchSourcesAndIndustryReportGovernance"] = {
        **(full_payload.get("researchSourcesAndIndustryReportGovernance") or {}),
        "sources": new_sources or [],
    }
    for removed_id in old_ids - new_ids:
        validation = validate_source_deletion(merged, removed_id)
        if not validation["canDelete"]:
            deps = ", ".join(validation["dependencies"])
            errors["sources"] = f"Cannot remove source referenced elsewhere: {deps}"


def _validate_competitor_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_competitors: list[Any] | None,
) -> None:
    competition = full_payload.get("competitionMarketShareAndIssuerPositioning") or {}
    old_ids = {
        str(c.get("id"))
        for c in (competition.get("competitors") or [])
        if isinstance(c, dict) and c.get("id")
    }
    new_ids = {
        str(item.get("id"))
        for item in (new_competitors or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["competitionMarketShareAndIssuerPositioning"] = {
        **competition,
        "competitors": new_competitors or [],
    }
    for removed_id in old_ids - new_ids:
        refs = count_competitor_references(merged, removed_id)
        if refs["total"] > 0:
            deps = ", ".join(refs["locations"])
            errors["competitors"] = f"Cannot remove competitor referenced elsewhere: {deps}"


def _validate_market_series_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_series: list[Any] | None,
) -> None:
    market_section = full_payload.get("marketSizeSegmentationAndGrowth") or {}
    old_ids = {
        str(s.get("id"))
        for s in (market_section.get("marketSeries") or [])
        if isinstance(s, dict) and s.get("id")
    }
    new_ids = {
        str(item.get("id"))
        for item in (new_series or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["marketSizeSegmentationAndGrowth"] = {
        **market_section,
        "marketSeries": new_series or [],
    }
    for removed_id in old_ids - new_ids:
        refs = count_market_series_references(merged, removed_id)
        if refs["total"] > 0:
            deps = ", ".join(refs["locations"])
            errors["marketSeries"] = f"Cannot remove market series referenced elsewhere: {deps}"


def _validate_source_record(
    errors: dict[str, str],
    prefix: str,
    source: dict[str, Any],
) -> None:
    _require_enum(errors, f"{prefix}.sourceType", source.get("sourceType"), SOURCE_TYPE)
    _require_enum(errors, f"{prefix}.dataNature", source.get("dataNature"), DATA_NATURE)
    _require_enum(
        errors,
        f"{prefix}.sourceReadinessStatus",
        source.get("sourceReadinessStatus"),
        SOURCE_READINESS_STATUS,
    )
    commissioned = source.get("commissionedReportDetails") or {}
    _require_enum(errors, f"{prefix}.commissionedReportDetails.purpose", commissioned.get("purpose"), COMMISSIONED_REPORT_PURPOSE)
    for field in (
        "commissionedByIssuer",
        "commissionedByPromoter",
        "commissionedBySellingShareholder",
        "independenceConfirmed",
        "includedProposedAsMaterialDocument",
        "providerDisclaimerCaptured",
    ):
        _ynns(errors, f"{prefix}.commissionedReportDetails.{field}", commissioned.get(field))
    methodology = source.get("methodology") or {}
    for field in ("primaryResearchUsed", "secondaryResearchUsed"):
        _ynns(errors, f"{prefix}.methodology.{field}", methodology.get(field))


def validate_industry_scope(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    del full_payload
    errors: dict[str, str] = {}
    classification = section.get("industryClassification") or {}
    market = section.get("marketDefinition") or {}
    _require_enum(
        errors,
        "industryClassification.classificationSource",
        classification.get("classificationSource"),
        CLASSIFICATION_SOURCE,
    )
    _require_enum(errors, "marketDefinition.geography", market.get("geography"), GEOGRAPHY)
    _check_unique_ids(errors, "companyMarketMappings", section.get("companyMarketMappings") or [])
    _check_unique_ids(errors, "scopeExclusions", section.get("scopeExclusions") or [])
    for index, mapping in enumerate(section.get("companyMarketMappings") or []):
        if isinstance(mapping, dict):
            _optional_decimal(
                errors,
                f"companyMarketMappings[{index}].relevantRevenueContribution",
                mapping.get("relevantRevenueContribution"),
            )
    for index, exclusion in enumerate(section.get("scopeExclusions") or []):
        if isinstance(exclusion, dict):
            _require_enum(
                errors,
                f"scopeExclusions[{index}].exclusionType",
                exclusion.get("exclusionType"),
                SCOPE_EXCLUSION_TYPE,
            )
    if errors:
        raise ValidationError(errors)


def validate_sources(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    sources = section.get("sources") or []
    _check_unique_ids(errors, "sources", sources)
    _validate_source_deletions(errors, full_payload, sources)
    for index, source in enumerate(sources):
        if isinstance(source, dict):
            _validate_source_record(errors, f"sources[{index}]", source)
    if errors:
        raise ValidationError(errors)


def validate_macro_context(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    _check_unique_ids(errors, "macroeconomicIndicators", section.get("macroeconomicIndicators") or [])
    _check_unique_ids(errors, "industryMilestones", section.get("industryMilestones") or [])
    for index, indicator in enumerate(section.get("macroeconomicIndicators") or []):
        if not isinstance(indicator, dict):
            continue
        _require_enum(
            errors,
            f"macroeconomicIndicators[{index}].category",
            indicator.get("category"),
            MACRO_INDICATOR_CATEGORY,
        )
        _require_enum(
            errors,
            f"macroeconomicIndicators[{index}].actualEstimateForecast",
            indicator.get("actualEstimateForecast"),
            ACTUAL_ESTIMATE_FORECAST,
        )
        _optional_decimal(errors, f"macroeconomicIndicators[{index}].value", indicator.get("value"))
        _optional_source_ref(
            errors,
            f"macroeconomicIndicators[{index}].sourceId",
            indicator.get("sourceId"),
            source_ids,
        )
    for index, milestone in enumerate(section.get("industryMilestones") or []):
        if isinstance(milestone, dict):
            _optional_source_ref(
                errors,
                f"industryMilestones[{index}].sourceId",
                milestone.get("sourceId"),
                source_ids,
            )
    if errors:
        raise ValidationError(errors)


def validate_market_size(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    market_series = section.get("marketSeries") or []
    _check_unique_ids(errors, "marketSeries", market_series)
    _check_unique_ids(errors, "marketSegmentations", section.get("marketSegmentations") or [])
    _check_unique_ids(errors, "segmentMappings", section.get("segmentMappings") or [])
    _validate_market_series_deletions(errors, full_payload, market_series)

    series_ids = {
        str(s.get("id")) for s in market_series if isinstance(s, dict) and s.get("id")
    }

    for index, series in enumerate(market_series):
        if not isinstance(series, dict):
            continue
        _require_enum(errors, f"marketSeries[{index}].metric", series.get("metric"), MARKET_METRIC)
        _require_enum(
            errors,
            f"marketSeries[{index}].nominalReal",
            series.get("nominalReal"),
            NOMINAL_REAL,
        )
        _optional_source_ref(
            errors,
            f"marketSeries[{index}].primarySourceId",
            series.get("primarySourceId"),
            source_ids,
        )
        forecast = series.get("forecastMetadata") or {}
        _require_enum(
            errors,
            f"marketSeries[{index}].forecastMetadata.scenario",
            forecast.get("scenario"),
            FORECAST_SCENARIO,
        )
        _optional_source_ref(
            errors,
            f"marketSeries[{index}].forecastMetadata.forecastSourceId",
            forecast.get("forecastSourceId"),
            source_ids,
        )
        _check_unique_ids(errors, f"marketSeries[{index}].periodValues", series.get("periodValues") or [])
        for pv_index, period_value in enumerate(series.get("periodValues") or []):
            if not isinstance(period_value, dict):
                continue
            _require_enum(
                errors,
                f"marketSeries[{index}].periodValues[{pv_index}].actualEstimateForecast",
                period_value.get("actualEstimateForecast"),
                ACTUAL_ESTIMATE_FORECAST,
            )
            _optional_decimal(
                errors,
                f"marketSeries[{index}].periodValues[{pv_index}].value",
                period_value.get("value"),
            )
            _optional_source_ref(
                errors,
                f"marketSeries[{index}].periodValues[{pv_index}].sourceId",
                period_value.get("sourceId"),
                source_ids,
            )

    for index, segment in enumerate(section.get("marketSegmentations") or []):
        if not isinstance(segment, dict):
            continue
        parent_id = str(segment.get("parentMarketSeriesId") or "").strip()
        if parent_id and parent_id not in series_ids:
            errors[f"marketSegmentations[{index}].parentMarketSeriesId"] = (
                "References a market series that does not exist."
            )
        _require_enum(
            errors,
            f"marketSegmentations[{index}].segmentationDimension",
            segment.get("segmentationDimension"),
            SEGMENTATION_DIMENSION,
        )
        for field in ("marketSize", "marketSharePercentage", "growthRate", "forecastValue"):
            _optional_decimal(errors, f"marketSegmentations[{index}].{field}", segment.get(field))
        _optional_source_ref(
            errors,
            f"marketSegmentations[{index}].sourceId",
            segment.get("sourceId"),
            source_ids,
        )

    for index, mapping in enumerate(section.get("segmentMappings") or []):
        if isinstance(mapping, dict):
            _ynns(errors, f"segmentMappings[{index}].sameDefinition", mapping.get("sameDefinition"))

    if errors:
        raise ValidationError(errors)


def validate_demand_trends(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    for collection in (
        "demandDrivers",
        "endMarkets",
        "industryTrends",
        "governmentPolicies",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, driver in enumerate(section.get("demandDrivers") or []):
        if not isinstance(driver, dict):
            continue
        _require_enum(
            errors,
            f"demandDrivers[{index}].category",
            driver.get("category"),
            DEMAND_DRIVER_CATEGORY,
        )
        _require_enum(
            errors,
            f"demandDrivers[{index}].actualEstimateForecast",
            driver.get("actualEstimateForecast"),
            ACTUAL_ESTIMATE_FORECAST,
        )
        _optional_decimal(errors, f"demandDrivers[{index}].quantifiedImpact", driver.get("quantifiedImpact"))
        _optional_source_ref(errors, f"demandDrivers[{index}].sourceId", driver.get("sourceId"), source_ids)

    for index, end_market in enumerate(section.get("endMarkets") or []):
        if not isinstance(end_market, dict):
            continue
        _require_enum(
            errors,
            f"endMarkets[{index}].cyclicalDefensive",
            end_market.get("cyclicalDefensive"),
            CYCLICAL_DEFENSIVE,
        )
        for field in ("currentSize", "growth", "shareOfIssuerRelevantDemand"):
            _optional_decimal(errors, f"endMarkets[{index}].{field}", end_market.get(field))
        _optional_source_ref(errors, f"endMarkets[{index}].sourceId", end_market.get("sourceId"), source_ids)

    for index, trend in enumerate(section.get("industryTrends") or []):
        if isinstance(trend, dict):
            _require_enum(
                errors,
                f"industryTrends[{index}].timelineStatus",
                trend.get("timelineStatus"),
                TREND_TIMELINE_STATUS,
            )
            _optional_source_ref(errors, f"industryTrends[{index}].sourceId", trend.get("sourceId"), source_ids)

    for index, policy in enumerate(section.get("governmentPolicies") or []):
        if isinstance(policy, dict):
            _require_enum(errors, f"governmentPolicies[{index}].nature", policy.get("nature"), POLICY_NATURE)
            _optional_source_ref(
                errors,
                f"governmentPolicies[{index}].sourceId",
                policy.get("sourceId"),
                source_ids,
            )

    if errors:
        raise ValidationError(errors)


def validate_value_chain(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    _check_unique_ids(errors, "valueChainStages", section.get("valueChainStages") or [])
    supply = section.get("supplySideStructure") or {}
    _check_unique_ids(errors, "supplySideStructure.supplyFactors", supply.get("supplyFactors") or [])
    _check_unique_ids(errors, "industryCapacityRecords", section.get("industryCapacityRecords") or [])
    _check_unique_ids(errors, "entryBarriers", section.get("entryBarriers") or [])

    for index, stage in enumerate(section.get("valueChainStages") or []):
        if isinstance(stage, dict):
            _optional_decimal(errors, f"valueChainStages[{index}].sequenceOrder", stage.get("sequenceOrder"))
            _ynns(errors, f"valueChainStages[{index}].issuerParticipates", stage.get("issuerParticipates"))
            _optional_source_ref(errors, f"valueChainStages[{index}].sourceId", stage.get("sourceId"), source_ids)

    for index, factor in enumerate(supply.get("supplyFactors") or []):
        if isinstance(factor, dict):
            _optional_decimal(errors, f"supplySideStructure.supplyFactors[{index}].quantification", factor.get("quantification"))
            _optional_source_ref(
                errors,
                f"supplySideStructure.supplyFactors[{index}].sourceId",
                factor.get("sourceId"),
                source_ids,
            )

    for index, capacity in enumerate(section.get("industryCapacityRecords") or []):
        if isinstance(capacity, dict):
            for field in (
                "installedIndustryCapacity",
                "production",
                "capacityUtilisation",
                "capacityAnnounced",
                "capacityUnderConstruction",
            ):
                _optional_decimal(errors, f"industryCapacityRecords[{index}].{field}", capacity.get(field))
            _optional_source_ref(
                errors,
                f"industryCapacityRecords[{index}].sourceId",
                capacity.get("sourceId"),
                source_ids,
            )

    for index, barrier in enumerate(section.get("entryBarriers") or []):
        if isinstance(barrier, dict):
            _require_enum(errors, f"entryBarriers[{index}].barrierType", barrier.get("barrierType"), BARRIER_TYPE)
            _require_enum(errors, f"entryBarriers[{index}].strength", barrier.get("strength"), BARRIER_STRENGTH)
            _optional_source_ref(errors, f"entryBarriers[{index}].sourceId", barrier.get("sourceId"), source_ids)

    if errors:
        raise ValidationError(errors)


def validate_competition(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    competitors = section.get("competitors") or []
    _check_unique_ids(errors, "competitors", competitors)
    _check_unique_ids(errors, "competitiveMetrics", section.get("competitiveMetrics") or [])
    _check_unique_ids(errors, "competitiveDimensions", section.get("competitiveDimensions") or [])
    _check_unique_ids(errors, "marketShareRecords", section.get("marketShareRecords") or [])
    _check_unique_ids(errors, "claims", section.get("claims") or [])
    _validate_competitor_deletions(errors, full_payload, competitors)

    competitor_ids = {
        str(c.get("id")) for c in competitors if isinstance(c, dict) and c.get("id")
    }

    for index, competitor in enumerate(competitors):
        if isinstance(competitor, dict):
            _optional_source_ref(
                errors,
                f"competitors[{index}].sourceId",
                competitor.get("sourceId"),
                source_ids,
            )

    for index, metric in enumerate(section.get("competitiveMetrics") or []):
        if not isinstance(metric, dict):
            continue
        competitor_id = str(metric.get("competitorId") or "").strip()
        if competitor_id and competitor_id not in competitor_ids:
            errors[f"competitiveMetrics[{index}].competitorId"] = (
                "References a competitor that does not exist."
            )
        _require_enum(
            errors,
            f"competitiveMetrics[{index}].metricType",
            metric.get("metricType"),
            COMPETITOR_METRIC_TYPE,
        )
        _optional_decimal(errors, f"competitiveMetrics[{index}].value", metric.get("value"))
        _ynns(errors, f"competitiveMetrics[{index}].comparableToIssuer", metric.get("comparableToIssuer"))
        _optional_source_ref(
            errors,
            f"competitiveMetrics[{index}].sourceId",
            metric.get("sourceId"),
            source_ids,
        )

    for index, dimension in enumerate(section.get("competitiveDimensions") or []):
        if not isinstance(dimension, dict):
            continue
        competitor_id = str(dimension.get("competitorId") or "").strip()
        if competitor_id and competitor_id not in competitor_ids:
            errors[f"competitiveDimensions[{index}].competitorId"] = (
                "References a competitor that does not exist."
            )
        _ynns(errors, f"competitiveDimensions[{index}].comparable", dimension.get("comparable"))
        _optional_source_ref(
            errors,
            f"competitiveDimensions[{index}].sourceId",
            dimension.get("sourceId"),
            source_ids,
        )

    for index, share in enumerate(section.get("marketShareRecords") or []):
        if not isinstance(share, dict):
            continue
        _require_enum(
            errors,
            f"marketShareRecords[{index}].metricBasis",
            share.get("metricBasis"),
            MARKET_SHARE_METRIC_BASIS,
        )
        _require_enum(
            errors,
            f"marketShareRecords[{index}].numeratorSource",
            share.get("numeratorSource"),
            NUMERATOR_SOURCE,
        )
        for field in ("issuerNumerator", "totalMarketDenominator", "reportedMarketShare"):
            _optional_decimal(errors, f"marketShareRecords[{index}].{field}", share.get(field))
        _optional_source_ref(
            errors,
            f"marketShareRecords[{index}].denominatorSourceId",
            share.get("denominatorSourceId"),
            source_ids,
        )

    for index, claim in enumerate(section.get("claims") or []):
        if not isinstance(claim, dict):
            continue
        _require_enum(errors, f"claims[{index}].claimType", claim.get("claimType"), CLAIM_TYPE)
        _require_enum(errors, f"claims[{index}].reviewStatus", claim.get("reviewStatus"), CLAIM_STATUS)
        for field in (
            "independentSource",
            "commissionedReportSource",
            "currentFreshEnough",
            "conflictingSourceExists",
        ):
            _ynns(errors, f"claims[{index}].{field}", claim.get(field))
        _optional_source_ref(errors, f"claims[{index}].sourceId", claim.get("sourceId"), source_ids)

    if errors:
        raise ValidationError(errors)


def validate_outlook(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    source_ids = _source_ids(full_payload)
    _check_unique_ids(errors, "outlookRecords", section.get("outlookRecords") or [])
    _check_unique_ids(errors, "industryRisks", section.get("industryRisks") or [])
    _check_unique_ids(errors, "conflictingResearch", section.get("conflictingResearch") or [])

    for index, record in enumerate(section.get("outlookRecords") or []):
        if isinstance(record, dict):
            _require_enum(
                errors,
                f"outlookRecords[{index}].dataNature",
                record.get("dataNature"),
                OUTLOOK_DATA_NATURE,
            )
            for field in ("currentMarketSize", "expectedMarketSize", "expectedCagr"):
                _optional_decimal(errors, f"outlookRecords[{index}].{field}", record.get(field))
            _optional_source_ref(
                errors,
                f"outlookRecords[{index}].sourceId",
                record.get("sourceId"),
                source_ids,
            )

    for index, risk in enumerate(section.get("industryRisks") or []):
        if isinstance(risk, dict):
            _require_enum(
                errors,
                f"industryRisks[{index}].category",
                risk.get("category"),
                INDUSTRY_RISK_CATEGORY,
            )
            _optional_source_ref(
                errors,
                f"industryRisks[{index}].sourceId",
                risk.get("sourceId"),
                source_ids,
            )

    for index, conflict in enumerate(section.get("conflictingResearch") or []):
        if not isinstance(conflict, dict):
            continue
        for field in ("sourceAId", "sourceBId", "preferredSourceId"):
            _optional_source_ref(errors, f"conflictingResearch[{index}].{field}", conflict.get(field), source_ids)
        for field in ("valueFromA", "valueFromB"):
            _optional_decimal(errors, f"conflictingResearch[{index}].{field}", conflict.get(field))
        for field in (
            "differentMarketDefinition",
            "differentDates",
            "differentMethodology",
            "differentGeography",
            "reconciled",
        ):
            _ynns(errors, f"conflictingResearch[{index}].{field}", conflict.get(field))

    confirmations = section.get("confirmations") or {}
    for key, _ in INDUSTRY_MARKET_CONFIRMATION_FIELDS:
        _optional_bool(errors, f"confirmations.{key}", confirmations.get(key))

    if errors:
        raise ValidationError(errors)


VALIDATORS: dict[str, Callable[[dict[str, Any], dict[str, Any]], None]] = {
    "industry-scope-and-company-market-mapping": validate_industry_scope,
    "research-sources-and-industry-report-governance": validate_sources,
    "macroeconomic-and-industry-context": validate_macro_context,
    "market-size-segmentation-and-growth": validate_market_size,
    "demand-drivers-end-markets-trends-and-policy": validate_demand_trends,
    "value-chain-supply-structure-and-entry-barriers": validate_value_chain,
    "competition-market-share-and-issuer-positioning": validate_competition,
    "outlook-industry-risks-and-confirmations": validate_outlook,
}
