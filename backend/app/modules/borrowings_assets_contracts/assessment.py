"""Deterministic Borrowings & Contracts Assessment — authoritative backend implementation."""

from __future__ import annotations

from typing import Any

from app.modules.borrowings_assets_contracts.compute import compute_borrowings_assets_contracts_model
from app.modules.borrowings_assets_contracts.constants import (
    BAC_ASSESSMENT_GROUP_LABELS,
    BAC_ASSESSMENT_GROUPS,
    BAC_ASSESSMENT_RESULT_STATES,
    BAC_CONFIRMATION_FIELDS,
)
from app.modules.borrowings_assets_contracts.facilities import get_facilities
from app.modules.borrowings_assets_contracts.progress import calculate_borrowings_assets_contracts_progress

RESULT_LABELS = {
    "insufficient_information": "Insufficient information",
    "readiness_in_progress": "Disclosure readiness in progress",
    "borrowing_gaps_identified": "Borrowing gaps identified",
    "security_charge_gaps_identified": "Security/charge gaps identified",
    "contract_property_gaps_identified": "Contract/property gaps identified",
    "professional_confirmation_required": "Professional confirmation required",
    "pending_linked_workstream": "Pending linked workstream data",
}

WORST_STATE_PRIORITY = [
    "potential_concern",
    "pending_charge_registration",
    "pending_lender_consent",
    "covenant_review_required",
    "financial_reconciliation_pending",
    "title_review_required",
    "contract_review_required",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "missing_information",
    "reconciled",
    "not_applicable",
]


def _worst_state(states: list[str]) -> str:
    for state in WORST_STATE_PRIORITY:
        if state in states:
            return state
    return "missing_information"


def _criterion(
    criterion_id: str,
    group: str,
    label: str,
    state: str,
    reason: str,
    related_section: str,
) -> dict[str, Any]:
    return {
        "id": criterion_id,
        "group": group,
        "label": label,
        "state": state,
        "reason": reason,
        "relatedSection": related_section,
    }


def assess_borrowings_assets_contracts(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_borrowings_assets_contracts_progress(payload)
    model = compute_borrowings_assets_contracts_model(payload, linked_references)
    criteria: list[dict[str, Any]] = []
    facilities = get_facilities(payload)

    criteria.append(
        _criterion(
            "facilities-identified",
            "financial_indebtedness",
            "Facilities identified",
            "reconciled" if facilities else "missing_information",
            f"{len(facilities)} facility record(s) in the Facility Master."
            if facilities
            else "No facilities recorded in the Facility Master.",
            "financial-indebtedness-and-facility-master",
        )
    )

    incomplete_facilities = sum(
        1
        for facility in facilities
        if not str((facility.get("lender") or {}).get("lenderName") or "").strip()
        or not str((facility.get("sanctionAndUtilisation") or {}).get("principalOutstanding") or "").strip()
    )
    criteria.append(
        _criterion(
            "facility-amounts",
            "financial_indebtedness",
            "Sanctioned/outstanding amounts captured",
            "reconciled"
            if incomplete_facilities == 0 and facilities
            else ("not_applicable" if not facilities else "missing_information"),
            "Lender and outstanding amounts captured for all facilities."
            if incomplete_facilities == 0
            else f"{incomplete_facilities} facility(ies) missing lender or outstanding amounts.",
            "financial-indebtedness-and-facility-master",
        )
    )

    if model["interestVarianceCount"] > 0:
        criteria.append(
            _criterion(
                "interest-variance",
                "financial_indebtedness",
                "Interest rate variance reviewed",
                "potential_concern",
                f"{model['interestVarianceCount']} floating-rate facility(ies) show calculated vs entered rate variance.",
                "financial-indebtedness-and-facility-master",
            )
        )

    financials_status = (
        (payload.get("reconciliationChangesAndIssuerConfirmations") or {})
        .get("financialsReconciliation")
        or {}
    ).get("reconciliationStatus")
    fin = linked_references.get("financialsKpis") or {}
    criteria.append(
        _criterion(
            "financials-reconciliation",
            "financial_indebtedness",
            "Financials debt reconciliation",
            "pending_linked_workstream"
            if not fin.get("available")
            else (
                "reconciled"
                if financials_status == "reconciled"
                else (
                    "financial_reconciliation_pending"
                    if financials_status == "potential-inconsistency"
                    else (
                        "pending_professional_confirmation"
                        if financials_status == "pending-professional-confirmation"
                        else (
                            "financial_reconciliation_pending"
                            if facilities
                            else "missing_information"
                        )
                    )
                )
            ),
            model["reconciliation"]["financials"]["detail"],
            "reconciliation-changes-and-issuer-confirmations",
        )
    )

    securities_section = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    securities = [s for s in (securities_section.get("securities") or []) if isinstance(s, dict)]
    snapshot = (payload.get("financialIndebtednessAndFacilityMaster") or {}).get(
        "borrowingSnapshot"
    ) or {}
    criteria.append(
        _criterion(
            "security-linked",
            "security_and_charges",
            "Security linked to facilities",
            "missing_information"
            if not securities and snapshot.get("securedBorrowingsExist") == "yes"
            else (
                "not_applicable"
                if not securities
                else ("reconciled" if all(s.get("linkedFacilityId") for s in securities) else "missing_information")
            ),
            f"{len(securities)} security record(s) captured."
            if securities
            else "No security records captured yet.",
            "security-charges-guarantees-and-borrowing-powers",
        )
    )

    criteria.append(
        _criterion(
            "charge-registration",
            "security_and_charges",
            "RoC charge registration status",
            "pending_charge_registration"
            if model["chargesPendingRegistration"] > 0
            else (
                "reconciled"
                if model["chargeCount"] > 0
                else (
                    "missing_information"
                    if not (securities_section.get("charges") or [])
                    and snapshot.get("securedBorrowingsExist") == "yes"
                    else "not_applicable"
                )
            ),
            f"{model['chargesPendingRegistration']} charge(s) pending registration or professional confirmation."
            if model["chargesPendingRegistration"] > 0
            else (
                f"{model['chargesRegistered']} of {model['chargeCount']} charge(s) recorded as registered."
                if model["chargeCount"] > 0
                else "No charge records captured."
            ),
            "security-charges-guarantees-and-borrowing-powers",
        )
    )

    if model["personalGuaranteeCount"] + model["corporateGuaranteeCount"] > 0:
        criteria.append(
            _criterion(
                "guarantees-disclosed",
                "security_and_charges",
                "Guarantees captured",
                "reconciled",
                f"{model['personalGuaranteeCount']} personal and {model['corporateGuaranteeCount']} "
                "corporate/issuer guarantee(s) recorded.",
                "security-charges-guarantees-and-borrowing-powers",
            )
        )

    powers = securities_section.get("borrowingPowers") or {}
    authority_state = powers.get("authorityState")
    criteria.append(
        _criterion(
            "borrowing-authority",
            "borrowing_authority",
            "Board/shareholder borrowing authority",
            "potential_concern"
            if authority_state == "potential-concern"
            else (
                "pending_professional_confirmation"
                if authority_state == "pending-professional-confirmation"
                else (
                    "reconciled"
                    if powers.get("boardBorrowingResolutionExists") == "yes"
                    or powers.get("shareholderBorrowingApprovalExists") == "yes"
                    else (
                        "missing_information"
                        if powers.get("boardBorrowingResolutionExists") == ""
                        else "not_applicable"
                    )
                )
            ),
            f"Borrowing authority state: {str(authority_state).replace('-', ' ')}."
            if authority_state
            else "Borrowing powers/resolutions not yet captured.",
            "security-charges-guarantees-and-borrowing-powers",
        )
    )

    covenant_section = payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}
    criteria.append(
        _criterion(
            "financial-covenants",
            "covenants_defaults",
            "Financial covenants captured",
            "covenant_review_required"
            if model["financialCovenantCount"] > 0 and model["covenantsRequiringReview"] > 0
            else (
                "reconciled"
                if model["financialCovenantCount"] > 0 or covenant_section.get("covenants")
                else "missing_information"
            ),
            f"{model['covenantsRequiringReview']} financial covenant(s) require review."
            if model["covenantsRequiringReview"] > 0
            else f"{model['financialCovenantCount']} financial covenant(s) captured.",
            "covenants-defaults-waivers-and-lender-consents",
        )
    )

    if model["recordedBreaches"] > 0:
        criteria.append(
            _criterion(
                "defaults-breaches",
                "covenants_defaults",
                "Defaults/delays disclosed",
                "covenant_review_required" if model["waiversPending"] > 0 else "reconciled",
                f"{model['recordedBreaches']} default/delay event(s) recorded; "
                f"{model['waiversPending']} waiver(s) pending.",
                "covenants-defaults-waivers-and-lender-consents",
            )
        )

    consent_counts = model["consentCounts"]
    criteria.append(
        _criterion(
            "lender-consents",
            "ipo_lender_readiness",
            "IPO/change-of-control lender consents",
            "pending_lender_consent"
            if consent_counts["consentPending"] > 0
            else (
                "reconciled"
                if consent_counts["consentRequired"] > 0 or consent_counts["facilitiesReviewed"] > 0
                else "missing_information"
            ),
            f"{consent_counts['consentPending']} required consent(s) still pending."
            if consent_counts["consentPending"] > 0
            else (
                f"{consent_counts['consentReceived']} of {consent_counts['consentRequired']} "
                "required consent(s) received."
            ),
            "covenants-defaults-waivers-and-lender-consents",
        )
    )

    objects = model["reconciliation"]["objects"]
    objects_of_issue = linked_references.get("objectsOfIssue") or {}
    criteria.append(
        _criterion(
            "objects-repayment",
            "ipo_lender_readiness",
            "Objects debt repayment reconciliation",
            "pending_linked_workstream"
            if not objects_of_issue.get("available") and objects["repaymentItemCount"] > 0
            else (
                "potential_concern"
                if objects["unresolvedCount"] > 0
                else (
                    "reconciled"
                    if objects["repaymentItemCount"] > 0
                    else "not_applicable"
                )
            ),
            objects["detail"],
            "reconciliation-changes-and-issuer-confirmations",
        )
    )

    criteria.append(
        _criterion(
            "properties-captured",
            "properties_assets",
            "Material properties captured",
            "reconciled" if model["propertyCount"] > 0 else "missing_information",
            f"{model['propertyCount']} property record(s) "
            f"({model['ownedPropertyCount']} owned, {model['leasedPropertyCount']} leased/licensed)."
            if model["propertyCount"] > 0
            else "No properties recorded in the Property Master.",
            "immovable-properties-and-occupancy-rights",
        )
    )

    if model["titleOccupancyReviewItems"] > 0:
        criteria.append(
            _criterion(
                "title-occupancy-issues",
                "properties_assets",
                "Title/occupancy issues reviewed",
                "title_review_required",
                f"{model['titleOccupancyReviewItems']} title/occupancy issue(s) recorded for review.",
                "immovable-properties-and-occupancy-rights",
            )
        )

    criteria.append(
        _criterion(
            "material-assets",
            "properties_assets",
            "Material assets and encumbrance",
            "reconciled" if model["materialAssetCount"] > 0 else "not_applicable",
            f"{model['materialAssetCount']} material asset(s); "
            f"{model['encumberedMaterialAssetCount']} encumbered."
            if model["materialAssetCount"] > 0
            else "No material assets recorded yet.",
            "material-assets-encumbrance-and-insurance-linkage",
        )
    )

    criteria.append(
        _criterion(
            "material-contracts",
            "contracts",
            "Material contracts identified",
            "reconciled" if model["contractCount"] > 0 else "missing_information",
            f"{model['contractCount']} contract(s) in the Contract Master."
            if model["contractCount"] > 0
            else "No material contracts recorded yet.",
            "material-business-strategic-and-other-contracts",
        )
    )

    if model["materialContractReviewItems"] > 0:
        criteria.append(
            _criterion(
                "contract-review",
                "contracts",
                "Contract materiality/breach review",
                "contract_review_required",
                f"{model['materialContractReviewItems']} contract review item(s) flagged.",
                "contract-materiality-expiry-and-inspection-readiness",
            )
        )

    if model["contractsExpiringWithin12Months"]:
        criteria.append(
            _criterion(
                "contract-expiry",
                "contracts",
                "Contracts expiring within 12 months",
                "contract_review_required",
                f"{len(model['contractsExpiringWithin12Months'])} contract(s) expiring within 12 months.",
                "contract-materiality-expiry-and-inspection-readiness",
            )
        )

    linked_checks = [
        {
            "id": "linked-group-entities",
            "label": "Group Entities reconciliation",
            "available": bool((linked_references.get("groupEntities") or {}).get("available")),
            "status": model["reconciliation"]["groupEntities"]["status"],
            "section": "reconciliation-changes-and-issuer-confirmations",
        },
        {
            "id": "linked-capital",
            "label": "Capital & Ownership reconciliation",
            "available": bool((linked_references.get("capitalOwnership") or {}).get("available")),
            "status": model["reconciliation"]["capitalOwnership"]["status"],
            "section": "reconciliation-changes-and-issuer-confirmations",
        },
        {
            "id": "linked-business",
            "label": "Business & Operations reconciliation",
            "available": bool((linked_references.get("businessOperations") or {}).get("available")),
            "status": model["reconciliation"]["businessOperations"]["status"],
            "section": "reconciliation-changes-and-issuer-confirmations",
        },
    ]

    for check in linked_checks:
        criteria.append(
            _criterion(
                check["id"],
                "cross_workstream_reconciliation",
                check["label"],
                "pending_linked_workstream"
                if not check["available"]
                else (
                    "reconciled"
                    if check["status"] == "Reconciled"
                    else (
                        "potential_concern"
                        if check["status"] == "Potential inconsistency"
                        else (
                            "pending_professional_confirmation"
                            if check["status"] == "Pending professional confirmation"
                            else "missing_information"
                        )
                    )
                ),
                f"{check['label']}: {check['status']}."
                if check["available"]
                else f"{check['label']} linked data not yet available.",
                check["section"],
            )
        )

    confirmations = (payload.get("reconciliationChangesAndIssuerConfirmations") or {}).get(
        "confirmations"
    ) or {}
    unanswered_confirmations = sum(
        1 for key, _ in BAC_CONFIRMATION_FIELDS if confirmations.get(key) in (None, "")
    )
    criteria.append(
        _criterion(
            "issuer-confirmations",
            "cross_workstream_reconciliation",
            "Issuer confirmations",
            "reconciled" if unanswered_confirmations == 0 else "missing_information",
            "All issuer confirmations answered."
            if unanswered_confirmations == 0
            else f"{unanswered_confirmations} confirmation(s) still unanswered.",
            "reconciliation-changes-and-issuer-confirmations",
        )
    )

    counts = {
        "reconciled": 0,
        "potentialConcern": 0,
        "missingInformation": 0,
        "pendingChargeRegistration": 0,
        "pendingLenderConsent": 0,
        "covenantReviewRequired": 0,
        "financialReconciliationPending": 0,
        "titleReviewRequired": 0,
        "contractReviewRequired": 0,
        "pendingLinkedWorkstream": 0,
        "pendingProfessionalConfirmation": 0,
        "notApplicable": 0,
    }
    state_to_count = {
        "reconciled": "reconciled",
        "potential_concern": "potentialConcern",
        "missing_information": "missingInformation",
        "pending_charge_registration": "pendingChargeRegistration",
        "pending_lender_consent": "pendingLenderConsent",
        "covenant_review_required": "covenantReviewRequired",
        "financial_reconciliation_pending": "financialReconciliationPending",
        "title_review_required": "titleReviewRequired",
        "contract_review_required": "contractReviewRequired",
        "pending_linked_workstream": "pendingLinkedWorkstream",
        "pending_professional_confirmation": "pendingProfessionalConfirmation",
        "not_applicable": "notApplicable",
    }
    for item in criteria:
        key = state_to_count.get(item["state"])
        if key:
            counts[key] += 1

    groups = []
    for group in BAC_ASSESSMENT_GROUPS:
        group_criteria = [item for item in criteria if item["group"] == group]
        if not group_criteria:
            continue
        groups.append(
            {
                "group": group,
                "label": BAC_ASSESSMENT_GROUP_LABELS[group],
                "headlineState": _worst_state([item["state"] for item in group_criteria]),
                "criteria": group_criteria,
            }
        )

    potential_concerns = (
        counts["potentialConcern"]
        + counts["pendingChargeRegistration"]
        + counts["covenantReviewRequired"]
        + counts["titleReviewRequired"]
        + counts["contractReviewRequired"]
    )

    result = "readiness_in_progress"
    if counts["pendingLinkedWorkstream"] > 0 and progress["sectionsComplete"] == 0:
        result = "pending_linked_workstream"
    elif counts["pendingProfessionalConfirmation"] > 0 or counts["pendingLenderConsent"] > 0:
        result = "professional_confirmation_required"
    elif counts["contractReviewRequired"] > 0 or counts["titleReviewRequired"] > 0:
        result = "contract_property_gaps_identified"
    elif counts["pendingChargeRegistration"] > 0 or counts["financialReconciliationPending"] > 0:
        result = "security_charge_gaps_identified"
    elif counts["missingInformation"] > 0 and not facilities:
        result = "insufficient_information"
    elif counts["potentialConcern"] > 0 or counts["financialReconciliationPending"] > 0:
        result = "borrowing_gaps_identified"
    elif progress["sectionsComplete"] == 0:
        result = "insufficient_information"

    if result not in BAC_ASSESSMENT_RESULT_STATES:
        result = "readiness_in_progress"

    return {
        "result": result,
        "resultLabel": RESULT_LABELS[result],
        "summary": (
            "This is a disclosure readiness view derived from the current in-memory draft, not a "
            "compliant/non-compliant or investment-quality score. Unanswered questions are treated "
            "as missing information."
        ),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "facilityCount": model["facilityCount"],
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "consentPending": consent_counts["consentPending"],
            "chargesPendingRegistration": model["chargesPendingRegistration"],
            "potentialConcerns": potential_concerns,
        },
    }
