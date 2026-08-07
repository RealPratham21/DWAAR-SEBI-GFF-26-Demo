"""Overview summary derived from Industry & Market payload."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market.assessment import assess_industry_market
from app.modules.industry_market.compute import compute_industry_market_model
from app.modules.industry_market.constants import SECTION_LABELS
from app.modules.industry_market.progress import calculate_industry_market_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    progress = calculate_industry_market_progress(payload)
    model = compute_industry_market_model(payload, linked_references)
    assessment = assess_industry_market(payload, linked_references)

    sections_in_progress = sum(
        1 for status in progress["sections"].values() if status == "in_progress"
    )
    incomplete_sections = [
        section_id
        for section_id, status in progress["sections"].items()
        if status != "complete"
    ]
    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS[section_id]}",
        }
        for section_id in incomplete_sections[:4]
    ]

    counts = assessment.get("counts") or {}
    assessment_concerns = (
        counts.get("potentialInconsistency", 0)
        + counts.get("missingSource", 0)
        + counts.get("staleSource", 0)
        + counts.get("conflictingSources", 0)
    )

    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "primaryIndustry": model["primaryIndustry"],
        "relevantMarket": model["relevantMarket"],
        "geography": model["geography"],
        "latestMarketSize": model["latestMarketSize"],
        "latestMarketSizePeriod": model["latestMarketSizePeriod"],
        "latestMarketSizeUnit": model["latestMarketSizeUnit"],
        "forecastMarketSize": model["forecastMarketSize"],
        "forecastPeriod": model["forecastPeriod"],
        "forecastCagr": model["forecastCagr"],
        "relevantMarketSegmentCount": model["marketSegmentCount"],
        "issuerLinkedSegmentCount": model["issuerLinkedSegmentCount"],
        "competitorsIdentified": model["competitorCount"],
        "calculatedIssuerMarketShare": model["calculatedIssuerMarketShare"],
        "marketShareBasis": model["marketShareBasis"],
        "marketSharePeriod": model["marketSharePeriod"],
        "externalSourceCount": model["sourceCount"],
        "currentSourceCount": model["currentSourceCount"],
        "potentiallyStaleSourceCount": model["potentiallyStaleSourceCount"],
        "pendingVerificationSourceCount": model["pendingVerificationSourceCount"],
        "commissionedReportCount": model["commissionedReportCount"],
        "claimsProposed": model["claimsProposed"],
        "claimsSubstantiated": model["claimsSubstantiated"],
        "claimsNeedingEvidence": model["claimsNeedingEvidence"],
        "conflictingSourceCount": model["conflictingSourceCount"],
        "assessmentConcerns": assessment_concerns,
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
    }
