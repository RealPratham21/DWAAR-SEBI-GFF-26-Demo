"""Overview summary derived from persisted IPO Setup payload."""

from __future__ import annotations

from typing import Any

from app.modules.ipo_setup_eligibility.assessment import assess_ipo_eligibility
from app.modules.ipo_setup_eligibility.progress import calculate_progress, list_missing_required


PLATFORM_LABELS = {
    "nse-emerge": "NSE Emerge",
    "bse-sme": "BSE SME",
    "undecided": "Undecided",
}
OFFER_TYPE_LABELS = {
    "fresh-issue": "Fresh issue",
    "offer-for-sale": "Offer for sale",
    "fresh-and-ofs": "Fresh issue and offer for sale",
    "undecided": "Undecided",
}
STAGE_LABELS = {
    "exploring-ipo": "Exploring an IPO",
    "preparing-internally": "Preparing internally",
    "advisers-being-appointed": "Advisers being appointed",
    "preparing-draft-offer-document": "Preparing draft offer document",
    "preparing-exchange-application": "Preparing exchange application",
    "application-filed": "Application filed",
}
PRICING_LABELS = {
    "fixed-price": "Fixed-price issue",
    "book-built": "Book-built issue",
    "undecided": "Undecided",
}


def _label(value: str, labels: dict[str, str]) -> str:
    if not value:
        return "Not provided"
    return labels.get(value, value)


def build_overview_summary(payload: dict[str, Any]) -> dict[str, Any]:
    progress = calculate_progress(payload)
    assessment = assess_ipo_eligibility(payload)
    direction = payload.get("ipoDirection") or {}
    missing = list_missing_required(payload)
    concerns = [
        {"key": item["key"], "label": item["label"], "explanation": item["explanation"]}
        for item in assessment["criteria"]
        if item["result"] == "potential_concern"
    ]

    next_actions: list[dict[str, str]] = []
    if progress["sections"].get("ipo-direction") != "complete":
        next_actions.append(
            {
                "label": "Complete IPO Direction",
                "sectionId": "ipo-direction",
                "href": "/projects/demo/workstreams/ipo-setup-eligibility?tab=information&section=ipo-direction",
            }
        )
    if progress["sections"].get("offer-structure") != "complete":
        next_actions.append(
            {
                "label": "Complete Proposed Offer Structure",
                "sectionId": "offer-structure",
                "href": "/projects/demo/workstreams/ipo-setup-eligibility?tab=information&section=offer-structure",
            }
        )
    if concerns or assessment["result"] != "insufficient_information":
        next_actions.append(
            {
                "label": "Review Eligibility Assessment",
                "sectionId": "",
                "href": "/projects/demo/workstreams/ipo-setup-eligibility?tab=eligibility-assessment",
            }
        )

    return {
        "preparationStage": direction.get("preparationStage") or "",
        "preparationStageLabel": _label(direction.get("preparationStage") or "", STAGE_LABELS),
        "targetPlatform": direction.get("targetSmePlatform") or "",
        "targetPlatformLabel": _label(direction.get("targetSmePlatform") or "", PLATFORM_LABELS),
        "offerType": direction.get("proposedOfferType") or "",
        "offerTypeLabel": _label(direction.get("proposedOfferType") or "", OFFER_TYPE_LABELS),
        "pricingMethod": direction.get("proposedPricingMethod") or "",
        "pricingMethodLabel": _label(direction.get("proposedPricingMethod") or "", PRICING_LABELS),
        "sectionsComplete": progress["sectionsComplete"],
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "sectionStatuses": progress["sections"],
        "preliminaryAssessmentResult": assessment["result"],
        "preliminaryAssessmentLabel": assessment["resultLabel"],
        "potentialConcerns": concerns,
        "missingRequiredResponses": missing,
        "missingRequiredCount": len(missing),
        "processReadinessStatus": progress["sections"].get("process-readiness", "not_started"),
        "recommendedNextActions": next_actions,
        "offerComputations": assessment["offerComputations"],
    }
