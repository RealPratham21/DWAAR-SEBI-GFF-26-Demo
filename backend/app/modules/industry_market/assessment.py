"""Deterministic Industry Assessment for Industry & Market — ports frontend assessment.ts."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.claims import derive_claim_status, detect_unsupported_claim_wording
from app.modules.industry_market.compute import compute_industry_market_model
from app.modules.industry_market.constants import (
    INDUSTRY_ASSESSMENT_GROUP_LABELS,
    INDUSTRY_ASSESSMENT_GROUPS,
    INDUSTRY_MARKET_CONFIRMATION_FIELDS,
)
from app.modules.industry_market.market_series import (
    calculate_cagr,
    reconcile_reported_vs_calculated_cagr,
    reconcile_segment_percentages,
)
from app.modules.industry_market.market_share import validate_market_share_record
from app.modules.industry_market.progress import calculate_industry_market_progress
from app.modules.industry_market.sources import get_sources


def _worst_state(states: list[str]) -> str:
    priority = [
        "potential_inconsistency",
        "conflicting_sources",
        "missing_source",
        "stale_source",
        "methodology_concern",
        "missing_information",
        "pending_industry_report",
        "pending_linked_workstream",
        "pending_professional_confirmation",
        "substantiated",
        "not_applicable",
    ]
    for state in priority:
        if state in states:
            return state
    return "missing_information"


def _derive_result(criteria: list[dict[str, Any]]) -> dict[str, str]:
    has_inconsistency = any(c["state"] == "potential_inconsistency" for c in criteria)
    has_conflicting = any(c["state"] == "conflicting_sources" for c in criteria)
    has_missing_source = any(c["state"] == "missing_source" for c in criteria)
    has_pending_linked = any(c["state"] == "pending_linked_workstream" for c in criteria)
    has_professional = any(
        c["state"] in ("pending_professional_confirmation", "pending_industry_report")
        for c in criteria
    )
    missing_count = sum(1 for c in criteria if c["state"] == "missing_information")

    if has_inconsistency or has_conflicting:
        return {
            "result": "inconsistencies_identified",
            "resultLabel": "Inconsistencies identified",
            "summary": (
                "One or more industry checks show a potential inconsistency or conflicting "
                "source that needs review."
            ),
        }
    if has_missing_source:
        return {
            "result": "source_gaps_identified",
            "resultLabel": "Source gaps identified",
            "summary": "Material statistics or claims still lack supporting source references.",
        }
    if has_pending_linked:
        return {
            "result": "pending_linked_workstream",
            "resultLabel": "Pending linked workstream",
            "summary": (
                "Some cross-workstream mappings await Business & Operations or "
                "Financials & KPIs wiring."
            ),
        }
    if has_professional:
        return {
            "result": "professional_confirmation_required",
            "resultLabel": "Professional confirmation required",
            "summary": (
                "Commissioned reports or sensitive claims still need professional confirmation."
            ),
        }
    if missing_count > len(criteria) / 2:
        return {
            "result": "insufficient_information",
            "resultLabel": "Disclosure readiness in progress",
            "summary": "Much of the industry and market record is still blank or unanswered.",
        }
    return {
        "result": "readiness_in_progress",
        "resultLabel": "Readiness in progress",
        "summary": "Entered information is largely captured; remaining gaps are noted below.",
    }


def _build_industry_assessment(
    payload: dict[str, Any],
    model: dict[str, Any],
    progress: dict[str, Any],
    linked_references: dict[str, Any] | None,
) -> dict[str, Any]:
    linked = linked_references or {}
    criteria: list[dict[str, Any]] = []
    scope = payload.get("industryScopeAndCompanyMarketMapping") or {}
    classification = scope.get("industryClassification") or {}
    market_definition = scope.get("marketDefinition") or {}
    sources = get_sources(payload)

    criteria.append(
        {
            "id": "primary-industry",
            "group": "scope_and_relevance",
            "label": "Primary industry captured",
            "state": (
                "substantiated"
                if str(classification.get("primaryIndustry") or "").strip()
                else "missing_information"
            ),
            "reason": (
                f"Primary industry: {classification.get('primaryIndustry')}."
                if str(classification.get("primaryIndustry") or "").strip()
                else "Primary industry not recorded."
            ),
        },
    )

    criteria.append(
        {
            "id": "relevant-market-defined",
            "group": "scope_and_relevance",
            "label": "Relevant market defined",
            "state": (
                "substantiated"
                if str(market_definition.get("marketName") or "").strip()
                else "missing_information"
            ),
            "reason": (
                f"Market: {market_definition.get('marketName')}."
                if str(market_definition.get("marketName") or "").strip()
                else "Relevant market name not recorded."
            ),
        },
    )

    criteria.append(
        {
            "id": "geography-defined",
            "group": "scope_and_relevance",
            "label": "Geography defined",
            "state": (
                "substantiated"
                if str(market_definition.get("geography") or "").strip()
                else "missing_information"
            ),
            "reason": (
                f"Geography: {market_definition.get('geography')}."
                if str(market_definition.get("geography") or "").strip()
                else "Market geography not recorded."
            ),
        },
    )

    mappings = scope.get("companyMarketMappings") or []
    criteria.append(
        {
            "id": "issuer-market-mapping",
            "group": "scope_and_relevance",
            "label": "Market mapped to issuer products",
            "state": "substantiated" if mappings else "missing_information",
            "reason": (
                f"{len(mappings)} company-to-market mapping(s) recorded."
                if mappings
                else "No company-to-market mappings recorded."
            ),
        },
    )

    exclusions = scope.get("scopeExclusions") or []
    criteria.append(
        {
            "id": "scope-exclusions",
            "group": "scope_and_relevance",
            "label": "Scope exclusions explained",
            "state": (
                "substantiated"
                if exclusions
                or str(market_definition.get("marketBoundaryExplanation") or "").strip()
                else "missing_information"
            ),
            "reason": (
                f"{len(exclusions)} exclusion(s) recorded."
                if exclusions
                else "No explicit scope exclusions — confirm market boundary explanation is adequate."
            ),
        },
    )

    business_ops = linked.get("businessOperations") or {}
    if not business_ops.get("available"):
        criteria.append(
            {
                "id": "business-operations-alignment",
                "group": "scope_and_relevance",
                "label": "Market scope aligns with Business & Operations",
                "state": "pending_linked_workstream",
                "reason": "Business & Operations reference unavailable (IM2 wiring).",
            },
        )

    for source in sources:
        readiness = str(source.get("sourceReadinessStatus") or "")
        if readiness == "current":
            state = "substantiated"
        elif readiness in ("potentially_stale", "superseded"):
            state = "stale_source"
        elif readiness == "methodology_unclear":
            state = "methodology_concern"
        elif readiness == "professional_confirmation_required":
            state = "pending_professional_confirmation"
        elif readiness == "pending_verification":
            state = "pending_industry_report"
        else:
            state = "missing_information"

        title = source.get("title") or source.get("id")
        criteria.append(
            {
                "id": f"source-readiness-{source.get('id')}",
                "group": "source_readiness",
                "label": f"Source readiness — {title}",
                "state": state,
                "reason": (
                    f"Status: {readiness.replace('_', ' ')}."
                    if readiness
                    else "Source readiness status not recorded."
                ),
            },
        )

        if not str(source.get("publicationDate") or "").strip() or not str(
            source.get("dataCutOffDate") or "",
        ).strip():
            criteria.append(
                {
                    "id": f"source-dates-{source.get('id')}",
                    "group": "source_readiness",
                    "label": f"Publication / cut-off dates — {title}",
                    "state": "missing_information",
                    "reason": "Publication date or data cut-off date missing.",
                },
            )

        if source.get("sourceType") == "commissioned-industry-report":
            commissioned = source.get("commissionedReportDetails") or {}
            criteria.append(
                {
                    "id": f"commissioned-report-{source.get('id')}",
                    "group": "source_readiness",
                    "label": f"Commissioned report disclosures — {title}",
                    "state": (
                        "substantiated"
                        if commissioned.get("independenceConfirmed") == "yes"
                        and str(commissioned.get("consentNoObjectionStatus") or "").strip()
                        else (
                            "pending_professional_confirmation"
                            if commissioned.get("independenceConfirmed") == "not_sure"
                            else "missing_information"
                        )
                    ),
                    "reason": "Commissioned industry report governance fields reviewed.",
                },
            )

    if not sources:
        criteria.append(
            {
                "id": "source-registry-empty",
                "group": "source_readiness",
                "label": "Source registry populated",
                "state": "missing_source",
                "reason": "No sources recorded in the master Source Registry.",
            },
        )

    market_section = payload.get("marketSizeSegmentationAndGrowth") or {}
    for series in market_section.get("marketSeries") or []:
        if not isinstance(series, dict):
            continue
        historical = [
            pv
            for pv in (series.get("periodValues") or [])
            if isinstance(pv, dict) and pv.get("actualEstimateForecast") != "forecast"
        ]
        label = series.get("marketName") or series.get("id")
        criteria.append(
            {
                "id": f"market-series-{series.get('id')}",
                "group": "market_sizing_and_segmentation",
                "label": f"Market series — {label}",
                "state": (
                    "substantiated"
                    if historical and str(series.get("primarySourceId") or "").strip()
                    else (
                        "missing_source"
                        if historical
                        else "missing_information"
                    )
                ),
                "reason": (
                    f"{len(historical)} historical/actual period value(s) recorded."
                    if historical
                    else "No historical market values recorded."
                ),
            },
        )

        latest = historical[-1] if historical else None
        forecast_meta = series.get("forecastMetadata") or {}
        calculated_cagr = ""
        if latest and dm.is_filled(latest.get("value")) and dm.is_filled(
            forecast_meta.get("forecastValue"),
        ):
            calculated_cagr = calculate_cagr(
                str(latest.get("value") or ""),
                str(forecast_meta.get("forecastValue") or ""),
                max(len(historical) - 1, 1),
            )
        cagr_reconciliation = reconcile_reported_vs_calculated_cagr(
            str(forecast_meta.get("reportedCagr") or ""),
            calculated_cagr,
        )
        if str(forecast_meta.get("forecastValue") or "").strip():
            criteria.append(
                {
                    "id": f"forecast-marked-{series.get('id')}",
                    "group": "market_sizing_and_segmentation",
                    "label": f"Forecast distinguished — {label}",
                    "state": (
                        "substantiated"
                        if str(forecast_meta.get("forecastSourceId") or "").strip()
                        else "missing_source"
                    ),
                    "reason": "Forecast values should reference an explicit source.",
                },
            )

        if (
            dm.is_filled(forecast_meta.get("reportedCagr"))
            and latest
            and dm.is_filled(latest.get("value"))
            and dm.is_filled(forecast_meta.get("forecastValue"))
            and not cagr_reconciliation["reconciles"]
        ):
            criteria.append(
                {
                    "id": f"cagr-reconcile-{series.get('id')}",
                    "group": "market_sizing_and_segmentation",
                    "label": f"CAGR reconciliation — {label}",
                    "state": "potential_inconsistency",
                    "reason": cagr_reconciliation["message"],
                },
            )

    for reconciliation in reconcile_segment_percentages(
        [s for s in (market_section.get("marketSegmentations") or []) if isinstance(s, dict)],
    ):
        if not reconciliation["reconciles"]:
            criteria.append(
                {
                    "id": (
                        f"segment-reconcile-{reconciliation['parentMarketSeriesId']}-"
                        f"{reconciliation['period']}"
                    ),
                    "group": "market_sizing_and_segmentation",
                    "label": "Segment percentages reconcile",
                    "state": "potential_inconsistency",
                    "reason": " ".join(reconciliation["flags"]),
                },
            )

    if not business_ops.get("available"):
        criteria.append(
            {
                "id": "product-service-mapping",
                "group": "cross_workstream_consistency",
                "label": "Product/service mapping",
                "state": "pending_linked_workstream",
                "reason": "Business & Operations product/service links await IM2 wiring.",
            },
        )

    financials = linked.get("financialsKpis") or {}
    if not financials.get("available"):
        criteria.append(
            {
                "id": "financial-segment-distinction",
                "group": "cross_workstream_consistency",
                "label": "Financial segment distinction",
                "state": "pending_linked_workstream",
                "reason": "Financials & KPIs reporting segment references await IM2 wiring.",
            },
        )

    for mapping in market_section.get("segmentMappings") or []:
        if (
            isinstance(mapping, dict)
            and mapping.get("sameDefinition") == "no"
            and not str(mapping.get("differenceExplanation") or "").strip()
        ):
            criteria.append(
                {
                    "id": f"segment-mapping-{mapping.get('id')}",
                    "group": "cross_workstream_consistency",
                    "label": "Market vs accounting segment distinction",
                    "state": "potential_inconsistency",
                    "reason": (
                        "Segment marked as different definition but no explanation recorded."
                    ),
                },
            )

    demand = payload.get("demandDriversEndMarketsTrendsAndPolicy") or {}
    for driver in demand.get("demandDrivers") or []:
        if not isinstance(driver, dict):
            continue
        criteria.append(
            {
                "id": f"demand-driver-{driver.get('id')}",
                "group": "demand_trend_substantiation",
                "label": f"Demand driver — {driver.get('title') or driver.get('id')}",
                "state": (
                    "substantiated"
                    if str(driver.get("sourceId") or "").strip()
                    else (
                        "missing_source"
                        if str(driver.get("description") or "").strip()
                        else "missing_information"
                    )
                ),
                "reason": (
                    "Demand driver references a source."
                    if str(driver.get("sourceId") or "").strip()
                    else "Demand driver lacks supporting source."
                ),
            },
        )

    for trend in demand.get("industryTrends") or []:
        if not isinstance(trend, dict):
            continue
        criteria.append(
            {
                "id": f"industry-trend-{trend.get('id')}",
                "group": "demand_trend_substantiation",
                "label": f"Industry trend — {trend.get('trend') or trend.get('id')}",
                "state": (
                    "substantiated"
                    if str(trend.get("sourceId") or "").strip()
                    else "missing_source"
                ),
                "reason": (
                    "Trend references a source."
                    if str(trend.get("sourceId") or "").strip()
                    else "Trend statement lacks supporting source."
                ),
            },
        )

    value_chain = payload.get("valueChainSupplyStructureAndEntryBarriers") or {}
    for barrier in value_chain.get("entryBarriers") or []:
        if not isinstance(barrier, dict):
            continue
        criteria.append(
            {
                "id": f"entry-barrier-{barrier.get('id')}",
                "group": "value_chain_and_supply_structure",
                "label": f"Entry barrier — {barrier.get('barrierType') or barrier.get('id')}",
                "state": (
                    "substantiated"
                    if str(barrier.get("sourceId") or "").strip()
                    else (
                        "missing_source"
                        if str(barrier.get("description") or "").strip()
                        else "missing_information"
                    )
                ),
                "reason": (
                    "Barrier references supporting evidence."
                    if str(barrier.get("sourceId") or "").strip()
                    else "Barrier recorded without source — not treated as substantiated."
                ),
            },
        )

    competition = payload.get("competitionMarketShareAndIssuerPositioning") or {}
    if not competition.get("competitors"):
        criteria.append(
            {
                "id": "competitors-identified",
                "group": "competitive_landscape",
                "label": "Relevant competitors identified",
                "state": "missing_information",
                "reason": "No competitor records captured.",
            },
        )

    for share in competition.get("marketShareRecords") or []:
        if not isinstance(share, dict):
            continue
        validation = validate_market_share_record(share, payload)
        state = "substantiated"
        if validation["denominatorWithoutSource"] or validation["unsupportedNumerator"]:
            state = "missing_source"
        elif (
            validation["periodMismatch"]
            or validation["geographyMismatch"]
            or validation["unitMismatch"]
            or validation["calculatedVsReportedDifference"]
        ):
            state = "potential_inconsistency"
        criteria.append(
            {
                "id": f"market-share-{share.get('id')}",
                "group": "market_share_integrity",
                "label": f"Market share — {share.get('marketDefinition') or share.get('id')}",
                "state": state,
                "reason": (
                    " ".join(validation["flags"])
                    if validation["flags"]
                    else "Market share inputs reviewed."
                ),
            },
        )

    for claim in competition.get("claims") or []:
        if not isinstance(claim, dict):
            continue
        derived_status = derive_claim_status(claim, payload)
        wording = detect_unsupported_claim_wording(str(claim.get("exactProposedWording") or ""))
        state = "substantiated"
        if derived_status in ("do_not_use", "insufficient_source"):
            state = "missing_source" if wording else "missing_information"
        elif derived_status == "stale_source":
            state = "stale_source"
        elif derived_status == "contradictory_sources":
            state = "conflicting_sources"
        elif derived_status == "professional_confirmation_required":
            state = "pending_professional_confirmation"
        elif derived_status == "potentially_substantiated":
            state = "methodology_concern"
        criteria.append(
            {
                "id": f"claim-{claim.get('id')}",
                "group": "claim_substantiation",
                "label": f"Claim — {claim.get('exactProposedWording') or claim.get('id')}",
                "state": state,
                "reason": (
                    f"Unsupported wording detected ({', '.join(wording)}); "
                    f"status: {derived_status.replace('_', ' ')}."
                    if wording
                    else f"Derived claim status: {derived_status.replace('_', ' ')}."
                ),
            },
        )

    outlook = payload.get("outlookIndustryRisksAndConfirmations") or {}
    for outlook_record in outlook.get("outlookRecords") or []:
        if not isinstance(outlook_record, dict):
            continue
        data_nature = outlook_record.get("dataNature")
        criteria.append(
            {
                "id": f"outlook-{outlook_record.get('id')}",
                "group": "outlook_and_conflicting_research",
                "label": f"Outlook — {outlook_record.get('market') or outlook_record.get('id')}",
                "state": (
                    "methodology_concern"
                    if data_nature == "issuer-expectation"
                    else (
                        "substantiated"
                        if str(outlook_record.get("sourceId") or "").strip()
                        else "missing_source"
                    )
                ),
                "reason": (
                    "Issuer expectation distinguished from independent research — confirm before use."
                    if data_nature == "issuer-expectation"
                    else (
                        "Outlook references a source."
                        if str(outlook_record.get("sourceId") or "").strip()
                        else "Outlook lacks supporting source."
                    )
                ),
            },
        )

    for conflict in outlook.get("conflictingResearch") or []:
        if not isinstance(conflict, dict):
            continue
        criteria.append(
            {
                "id": f"conflict-{conflict.get('id')}",
                "group": "outlook_and_conflicting_research",
                "label": f"Conflicting research — {conflict.get('topic') or conflict.get('id')}",
                "state": (
                    "substantiated"
                    if conflict.get("reconciled") == "yes"
                    else (
                        "conflicting_sources"
                        if str(conflict.get("sourceAId") or "").strip()
                        and str(conflict.get("sourceBId") or "").strip()
                        else "missing_information"
                    )
                ),
                "reason": (
                    "Conflict marked as reconciled."
                    if conflict.get("reconciled") == "yes"
                    else "Conflicting source values require review."
                ),
            },
        )

    confirmations = outlook.get("confirmations") or {}
    for key, label in INDUSTRY_MARKET_CONFIRMATION_FIELDS:
        criteria.append(
            {
                "id": f"confirmation-{key}",
                "group": "outlook_and_conflicting_research",
                "label": label,
                "state": "substantiated" if confirmations.get(key) else "missing_information",
                "reason": "Confirmed." if confirmations.get(key) else "Not confirmed yet.",
            },
        )

    groups = [
        {
            "group": group,
            "label": INDUSTRY_ASSESSMENT_GROUP_LABELS[group],
            "headlineState": _worst_state(
                [c["state"] for c in criteria if c["group"] == group],
            ),
            "criteria": [c for c in criteria if c["group"] == group],
        }
        for group in INDUSTRY_ASSESSMENT_GROUPS
    ]

    counts = {
        "substantiated": sum(1 for c in criteria if c["state"] == "substantiated"),
        "potentialInconsistency": sum(
            1 for c in criteria if c["state"] == "potential_inconsistency"
        ),
        "missingInformation": sum(1 for c in criteria if c["state"] == "missing_information"),
        "missingSource": sum(1 for c in criteria if c["state"] == "missing_source"),
        "staleSource": sum(1 for c in criteria if c["state"] == "stale_source"),
        "methodologyConcern": sum(1 for c in criteria if c["state"] == "methodology_concern"),
        "conflictingSources": sum(1 for c in criteria if c["state"] == "conflicting_sources"),
        "pendingIndustryReport": sum(
            1 for c in criteria if c["state"] == "pending_industry_report"
        ),
        "pendingLinkedWorkstream": sum(
            1 for c in criteria if c["state"] == "pending_linked_workstream"
        ),
        "pendingProfessionalConfirmation": sum(
            1 for c in criteria if c["state"] == "pending_professional_confirmation"
        ),
        "notApplicable": sum(1 for c in criteria if c["state"] == "not_applicable"),
    }

    unanswered_confirmations = sum(
        1 for key, _ in INDUSTRY_MARKET_CONFIRMATION_FIELDS if not confirmations.get(key)
    )
    unsupported_claims = sum(
        1
        for claim in (competition.get("claims") or [])
        if isinstance(claim, dict)
        and derive_claim_status(claim, payload) in ("do_not_use", "insufficient_source")
    )

    result_info = _derive_result(criteria)

    return {
        **result_info,
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "sourceCount": model["sourceCount"],
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "unsupportedClaims": unsupported_claims,
            "conflictingSourceCount": model["conflictingSourceCount"],
            "staleSourceCount": model["potentiallyStaleSourceCount"],
        },
    }


def assess_industry_market(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    progress = calculate_industry_market_progress(payload)
    model = compute_industry_market_model(payload, linked_references)
    return _build_industry_assessment(payload, model, progress, linked_references)
