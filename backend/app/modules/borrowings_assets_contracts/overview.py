"""Overview summary derived from Borrowings, Assets & Contracts draft."""

from __future__ import annotations

from typing import Any

from app.modules.borrowings_assets_contracts.assessment import assess_borrowings_assets_contracts
from app.modules.borrowings_assets_contracts.compute import compute_borrowings_assets_contracts_model
from app.modules.borrowings_assets_contracts.constants import SECTION_IDS, SECTION_LABELS
from app.modules.borrowings_assets_contracts.progress import calculate_borrowings_assets_contracts_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if linked_references is None:
        linked_references = {}

    progress = calculate_borrowings_assets_contracts_progress(payload)
    model = compute_borrowings_assets_contracts_model(payload, linked_references)
    assessment = assess_borrowings_assets_contracts(payload, linked_references)
    currency_totals = model.get("currencyTotals") or []
    primary = currency_totals[0] if currency_totals else None
    snapshot = (payload.get("financialIndebtednessAndFacilityMaster") or {}).get(
        "borrowingSnapshot"
    ) or {}

    sections_in_progress = sum(
        1 for status in progress["sections"].values() if status == "in_progress"
    )
    incomplete_sections = [
        section_id
        for section_id in SECTION_IDS
        if progress["sections"].get(section_id) != "complete"
    ]
    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS[section_id]}",
        }
        for section_id in incomplete_sections[:4]
    ]

    counts = assessment["counts"]
    assessment_concerns = (
        counts["potentialConcern"]
        + counts["pendingChargeRegistration"]
        + counts["covenantReviewRequired"]
        + counts["financialReconciliationPending"]
        + counts["titleReviewRequired"]
        + counts["contractReviewRequired"]
    )
    pending_professional_review_items = (
        counts["pendingProfessionalConfirmation"] + counts["pendingLenderConsent"]
    )

    consent_counts = model["consentCounts"]
    reporting_currency = str(snapshot.get("reportingCurrency") or "").strip()
    display_unit = str(snapshot.get("displayUnit") or "").strip()

    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "positionAsOfDate": model["positionAsOfDate"],
        "reportingCurrency": model.get("primaryCurrency") or reporting_currency or None,
        "amountUnit": model.get("primaryAmountUnit") or display_unit or None,
        "currencyTotals": currency_totals,
        "facilityCount": model["facilityCount"],
        "totalSanctioned": (primary or {}).get("totalSanctioned") or "",
        "totalOutstanding": (primary or {}).get("totalOutstanding") or "",
        "securedDebt": (primary or {}).get("securedDebt") or "",
        "unsecuredDebt": (primary or {}).get("unsecuredDebt") or "",
        "totalUndrawn": (primary or {}).get("totalUndrawn") or "",
        "fundBasedExposure": (primary or {}).get("fundBasedExposure") or "",
        "nonFundBasedExposure": (primary or {}).get("nonFundBasedExposure") or "",
        "relatedPartyBorrowings": (primary or {}).get("relatedPartyBorrowings") or "",
        "chargeCount": model["chargeCount"],
        "chargesRegistered": model["chargesRegistered"],
        "chargesPendingRegistration": model["chargesPendingRegistration"],
        "personalGuaranteeCount": model["personalGuaranteeCount"],
        "corporateGuaranteeCount": model["corporateGuaranteeCount"],
        "financialCovenantsRequiringReview": model["covenantsRequiringReview"],
        "recordedBreaches": model["recordedBreaches"],
        "waiversPending": model["waiversPending"],
        "lenderConsentsRequired": consent_counts["consentRequired"],
        "lenderConsentsReceived": consent_counts["consentReceived"],
        "debtProposedForIpoRepayment": model["debtProposedForIpoRepayment"],
        "objectsReconciliationStatus": model["reconciliation"]["objects"]["status"],
        "materialProperties": model["propertyCount"],
        "ownedProperties": model["ownedPropertyCount"],
        "leasedLicensedProperties": model["leasedPropertyCount"],
        "propertyLeasesExpiringWithin12Months": len(model["propertyLeasesExpiringWithin12Months"]),
        "titleOccupancyReviewItems": model["titleOccupancyReviewItems"],
        "materialAssets": model["materialAssetCount"],
        "encumberedMaterialAssets": model["encumberedMaterialAssetCount"],
        "materialContracts": model["contractCount"],
        "contractsExpiringWithin12Months": len(model["contractsExpiringWithin12Months"]),
        "contractsWithChangeOfControlClauses": model["contractsWithChangeOfControlClauses"],
        "materialContractReviewItems": model["materialContractReviewItems"],
        "financialsReconciliationStatus": model["reconciliation"]["financials"]["status"],
        "interestVarianceCount": model["interestVarianceCount"],
        "assessmentConcerns": assessment_concerns,
        "pendingProfessionalReviewItems": pending_professional_review_items,
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
    }
