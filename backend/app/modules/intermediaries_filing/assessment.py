"""Deterministic Filing Readiness assessment (IF2)."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.compute import compute_intermediaries_filing_model
from app.modules.intermediaries_filing.constants import (
    IF_ASSESSMENT_GROUP_LABELS,
    IF_ASSESSMENT_GROUPS,
    IF_ASSESSMENT_RESULT_STATES,
    IF_CONFIRMATION_FIELDS,
    IF_CRITERION_STATE_LABELS,
)
from app.modules.intermediaries_filing.filings import get_filings
from app.modules.intermediaries_filing.intermediaries import get_intermediaries, get_lead_managers
from app.modules.intermediaries_filing.progress import calculate_intermediaries_filing_progress
from app.modules.intermediaries_filing.rules import IF_RULES_AS_OF, IF_RULES_VERSION, is_stage_at_least

_WORST_STATE_PRIORITY = [
    "potential_concern",
    "exchange_query_pending",
    "underwriting_pending",
    "market_making_pending",
    "issue_infrastructure_pending",
    "listing_action_pending",
    "approval_pending",
    "certificate_pending",
    "consent_pending",
    "agreement_pending",
    "appointment_pending",
    "filing_pending",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "missing_information",
    "ready",
    "not_yet_due",
    "not_applicable",
]

_RESULT_LABELS = {
    "insufficient_information": "Insufficient information",
    "preparation_in_progress": "Preparation in progress",
    "intermediary_actions_pending": "Intermediary actions pending",
    "due_diligence_pending": "Due diligence pending",
    "exchange_review_in_progress": "Exchange review in progress",
    "filing_actions_pending": "Filing actions pending",
    "issue_infrastructure_pending": "Issue infrastructure pending",
    "underwriting_or_market_making_pending": "Underwriting or Market Making pending",
    "pre_issue_readiness": "Pre-issue readiness",
    "issue_execution_in_progress": "Issue execution in progress",
    "listing_actions_pending": "Listing actions pending",
    "broadly_ready_for_current_stage": "Broadly ready for current stage",
    "professional_confirmation_required": "Professional confirmation required",
}


def _worst_state(states: list[str]) -> str:
    for state in _WORST_STATE_PRIORITY:
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


def _filled(value: str) -> bool:
    return bool(str(value or "").strip())


def assess_intermediaries_filing(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_intermediaries_filing_progress(payload)
    model = compute_intermediaries_filing_model(payload, linked_references)
    criteria: list[dict[str, Any]] = []

    section1 = payload.get("issueTeamAndIntermediaryMaster") or {}
    snapshot = section1.get("issueTeamSnapshot") or {}
    stage = progress["currentFilingStage"]
    filings = get_filings(payload)
    lead_managers = get_lead_managers(payload)

    criteria.append(
        _criterion(
            "lead-manager",
            "intermediary_readiness",
            "Lead Manager appointed",
            (
                "ready"
                if lead_managers
                else "not_applicable"
                if snapshot.get("leadManagerAppointed") == "no"
                else "appointment_pending"
                if snapshot.get("leadManagerAppointed") == "yes"
                else "missing_information"
            ),
            (
                f"{len(lead_managers)} Lead Manager record(s) in Intermediary Master."
                if lead_managers
                else "Lead Manager appointment not yet reflected in Intermediary Master."
            ),
            "issue-team-and-intermediary-master",
        )
    )

    criteria.append(
        _criterion(
            "registrar",
            "intermediary_readiness",
            "Registrar appointed",
            (
                "ready"
                if any("registrar_to_issue" in (item.get("roles") or []) for item in get_intermediaries(payload))
                else "appointment_pending"
                if snapshot.get("registrarAppointed") == "yes"
                else "not_applicable"
                if snapshot.get("registrarAppointed") == "no"
                else "missing_information"
            ),
            "Registrar appointment status reviewed against Intermediary Master.",
            "issue-team-and-intermediary-master",
        )
    )

    agreement_pending = model["intermediaryAggregates"]["agreementPendingCount"]
    if agreement_pending > 0:
        criteria.append(
            _criterion(
                "intermediary-agreements",
                "intermediary_readiness",
                "Intermediary agreements pending",
                "agreement_pending",
                f"{agreement_pending} intermediary appointment(s) with agreement pending.",
                "issue-team-and-intermediary-master",
            )
        )

    if len(lead_managers) > 1:
        inter_se = section1.get("interSeAgreement") or {}
        criteria.append(
            _criterion(
                "inter-se-agreement",
                "intermediary_readiness",
                "Inter-se agreement and responsibilities",
                "ready" if inter_se.get("interSeAgreementExecuted") == "yes" else "agreement_pending",
                (
                    f"Inter-se agreement executed: {inter_se.get('interSeAgreementExecuted')}."
                    if inter_se.get("interSeAgreementExecuted")
                    else "Multiple Lead Managers recorded; inter-se agreement/responsibilities require review."
                ),
                "issue-team-and-intermediary-master",
            )
        )

    ipo = linked_references.get("ipoSetup") or {}
    criteria.append(
        _criterion(
            "ipo-setup-reconciliation",
            "issue_configuration",
            "IPO Setup reconciliation",
            (
                "pending_linked_workstream"
                if not ipo.get("available")
                else "potential_concern"
                if model["reconciliation"]["ipoSetup"]["mismatchCount"] > 0
                else "ready"
            ),
            (
                f"{model['reconciliation']['ipoSetup']['status']}: {model['reconciliation']['ipoSetup']['detail']}"
                if ipo.get("available")
                else "IPO Setup linked data not yet available."
            ),
            "issue-configuration-and-filing-snapshot",
        )
    )

    capital = linked_references.get("capitalOwnership") or {}
    criteria.append(
        _criterion(
            "capital-reconciliation",
            "issue_configuration",
            "Capital reconciliation",
            (
                "pending_linked_workstream"
                if not capital.get("available")
                else "potential_concern"
                if model["reconciliation"]["capitalOwnership"]["mismatchCount"] > 0
                else "ready"
            ),
            (
                f"{model['reconciliation']['capitalOwnership']['status']}: "
                f"{model['reconciliation']['capitalOwnership']['detail']}"
                if capital.get("available")
                else "Capital & Ownership linked data not yet available."
            ),
            "issue-configuration-and-filing-snapshot",
        )
    )

    final_doc = model["finalDocumentAggregates"]
    criteria.append(
        _criterion(
            "authoritative-document",
            "filing_readiness",
            "Current authoritative document version",
            (
                "potential_concern"
                if final_doc["authoritativeVersionConflict"]
                else "ready"
                if final_doc["authoritativeVersionLabel"]
                else "filing_pending"
            ),
            (
                "More than one document version marked as current authoritative."
                if final_doc["authoritativeVersionConflict"]
                else f"Authoritative version: {final_doc['authoritativeVersionLabel']}."
                if final_doc["authoritativeVersionLabel"]
                else "No authoritative offer-document version marked yet."
            ),
            "filing-and-regulatory-milestone-tracker",
        )
    )

    if model["filingAggregates"]["openQueryCount"] > 0:
        criteria.append(
            _criterion(
                "open-exchange-queries",
                "filing_readiness",
                "Open Exchange queries",
                "exchange_query_pending",
                (
                    f"{model['filingAggregates']['openQueryCount']} open Exchange query round(s); "
                    f"{model['filingAggregates']['overdueQueryCount']} overdue."
                ),
                "filing-and-regulatory-milestone-tracker",
            )
        )

    if not filings and is_stage_at_least(stage, "exchange_draft_filing"):
        criteria.append(
            _criterion(
                "filing-records",
                "filing_readiness",
                "Filing records captured",
                "filing_pending",
                "Filing stage indicates Exchange filing activity but no Filing records captured.",
                "filing-and-regulatory-milestone-tracker",
            )
        )

    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    in_principle = section3.get("inPrincipleApproval") or {}
    if in_principle.get("applied") == "yes" and in_principle.get("approvalReceived") != "yes":
        criteria.append(
            _criterion(
                "in-principle-approval",
                "filing_readiness",
                "In-principle approval",
                "approval_pending",
                "In-principle approval applied but approval not yet recorded as received.",
                "filing-and-regulatory-milestone-tracker",
            )
        )

    dd = model["dueDiligenceAggregates"]
    criteria.append(
        _criterion(
            "dd-areas",
            "due_diligence_signoffs",
            "Due-diligence area tracker",
            "ready" if dd["areaCount"] > 0 else "missing_information",
            (
                f"{dd['areaCount']} DD area(s); {dd['signedOffCount']} signed off."
                if dd["areaCount"] > 0
                else "No due-diligence areas captured yet."
            ),
            "due-diligence-certificates-consents-and-signoffs",
        )
    )

    cert = model["certificateConsentAggregates"]
    if cert["certificatesPending"] > 0:
        criteria.append(
            _criterion(
                "certificates-pending",
                "due_diligence_signoffs",
                "Certificates pending",
                "certificate_pending",
                f"{cert['certificatesPending']} certificate(s) not yet final/signed.",
                "due-diligence-certificates-consents-and-signoffs",
            )
        )

    if cert["consentCount"] > 0:
        pending_consents = cert["consentCount"] - cert["consentsReceived"]
        if pending_consents > 0:
            criteria.append(
                _criterion(
                    "consents-pending",
                    "due_diligence_signoffs",
                    "Consents pending",
                    "consent_pending",
                    f"{pending_consents} consent(s) not yet received.",
                    "due-diligence-certificates-consents-and-signoffs",
                )
            )

    if dd["unresolvedMaterialCount"] > 0:
        criteria.append(
            _criterion(
                "dd-unresolved",
                "due_diligence_signoffs",
                "Unresolved material DD issues",
                "potential_concern",
                f"{dd['unresolvedMaterialCount']} DD area(s) with material unresolved issues.",
                "due-diligence-certificates-consents-and-signoffs",
            )
        )

    section5 = payload.get("depositoriesBankingAsbaUpiAndIssueInfrastructure") or {}
    criteria.append(
        _criterion(
            "isin-readiness",
            "issue_infrastructure",
            "ISIN readiness",
            (
                "ready"
                if (section5.get("depositoryReadiness") or {}).get("isinStatus") == "active"
                else "issue_infrastructure_pending"
            ),
            f"ISIN status: {model['infrastructureAggregates']['isinStatus'] or 'not captured'}.",
            "depositories-banking-asba-upi-and-issue-infrastructure",
        )
    )

    if not model["infrastructureAggregates"]["sponsorBankReady"]:
        criteria.append(
            _criterion(
                "sponsor-bank",
                "issue_infrastructure",
                "Sponsor Bank readiness",
                (
                    "not_applicable"
                    if (section5.get("sponsorBankUpiReadiness") or {}).get("sponsorBankAppointed") == "no"
                    else "issue_infrastructure_pending"
                ),
                "Sponsor Bank appointment/agreement readiness requires review.",
                "depositories-banking-asba-upi-and-issue-infrastructure",
            )
        )

    uw = model["underwritingAggregates"]
    if uw["coverageComparison"] == "below_threshold":
        criteria.append(
            _criterion(
                "underwriting-coverage",
                "underwriting_market_making",
                "Underwriting coverage",
                "underwriting_pending",
                (
                    f"Underwriting coverage {uw['totalUnderwritingPercentage'] or '—'}% "
                    "below applicable SME preview threshold."
                ),
                "underwriting-market-making-and-distribution-arrangements",
            )
        )

    if uw["ownAccountComparison"] == "below_threshold":
        criteria.append(
            _criterion(
                "merchant-banker-own-account",
                "underwriting_market_making",
                "Merchant banker own-account commitment",
                "underwriting_pending",
                (
                    f"Own-account {uw['ownAccountPercentage'] or '—'}% "
                    "below preview minimum threshold."
                ),
                "underwriting-market-making-and-distribution-arrangements",
            )
        )

    if uw["overlappingCommitmentWarning"]:
        criteria.append(
            _criterion(
                "duplicate-underwriting",
                "underwriting_market_making",
                "Duplicate underwriting commitments",
                "potential_concern",
                "Potential overlapping underwriting commitment entries detected.",
                "underwriting-market-making-and-distribution-arrangements",
            )
        )

    if snapshot.get("marketMakerAppointed") == "yes" and not model["marketMakingAggregates"]["marketMakerAppointed"]:
        criteria.append(
            _criterion(
                "market-maker",
                "underwriting_market_making",
                "Market Maker appointed",
                "market_making_pending",
                "Market Maker indicated in issue team snapshot but not linked in configuration.",
                "underwriting-market-making-and-distribution-arrangements",
            )
        )

    section7 = payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}
    if not is_stage_at_least(stage, "issue_closed"):
        criteria.extend(
            [
                _criterion(
                    "basis-of-allotment",
                    "issue_listing_programme",
                    "Basis of Allotment",
                    "not_yet_due",
                    "Issue not yet closed; Basis of Allotment is not yet due at current filing stage.",
                    "issue-programme-allotment-listing-and-post-issue-execution",
                ),
                _criterion(
                    "listing-application",
                    "issue_listing_programme",
                    "Listing application",
                    "not_yet_due",
                    "Listing application actions are not yet due at current filing stage.",
                    "issue-programme-allotment-listing-and-post-issue-execution",
                ),
            ]
        )
    else:
        basis = section7.get("basisOfAllotment") or {}
        criteria.append(
            _criterion(
                "basis-of-allotment",
                "issue_listing_programme",
                "Basis of Allotment",
                "ready" if basis.get("allotmentFinalized") == "yes" else "listing_action_pending",
                (
                    "Allotment finalized."
                    if basis.get("allotmentFinalized") == "yes"
                    else "Basis of Allotment/allotment actions pending after issue close."
                ),
                "issue-programme-allotment-listing-and-post-issue-execution",
            )
        )

    if _filled(model["programmeAggregates"]["issueClosingDate"]):
        criteria.append(
            _criterion(
                "preliminary-t3",
                "issue_listing_programme",
                "Preliminary T+3 schedule",
                "ready",
                (
                    "Preliminary T+3 listing date: "
                    f"{model['programmeAggregates']['preliminaryTPlus3ListingDate'] or '—'} "
                    "(working-day estimate)."
                ),
                "issue-programme-allotment-listing-and-post-issue-execution",
            )
        )

    if final_doc["openPlaceholderCount"] > 0:
        criteria.append(
            _criterion(
                "open-placeholders",
                "final_offer_document_readiness",
                "Unresolved placeholders",
                "potential_concern",
                f"{final_doc['openPlaceholderCount']} open placeholder(s) in register.",
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
            )
        )

    if final_doc["inspectionItemsPending"] > 0:
        criteria.append(
            _criterion(
                "inspection-items",
                "final_offer_document_readiness",
                "Inspection items pending review",
                "missing_information",
                f"{final_doc['inspectionItemsPending']} inspection item(s) pending review.",
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
            )
        )

    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    confirmations = section8.get("finalConfirmations") or {}
    unanswered_confirmations = sum(1 for key, _ in IF_CONFIRMATION_FIELDS if confirmations.get(key) == "")
    criteria.append(
        _criterion(
            "issuer-confirmations",
            "final_offer_document_readiness",
            "Final issuer confirmations",
            "ready" if unanswered_confirmations == 0 else "missing_information",
            (
                "All final issuer confirmations answered."
                if unanswered_confirmations == 0
                else f"{unanswered_confirmations} final confirmation(s) still unanswered."
            ),
            "final-offer-document-advertisements-material-documents-and-filing-readiness",
        )
    )

    linked_checks = [
        (
            "linked-objects",
            "issue_configuration",
            "Objects reconciliation",
            "objectsOfIssue",
            "issue-configuration-and-filing-snapshot",
        ),
        (
            "linked-financials",
            "due_diligence_signoffs",
            "Financials reconciliation",
            "financialsKpis",
            "due-diligence-certificates-consents-and-signoffs",
        ),
        (
            "linked-lac",
            "filing_readiness",
            "LAC filing cut-off",
            "litigationApprovalsCompliance",
            "filing-and-regulatory-milestone-tracker",
        ),
        (
            "linked-bac",
            "final_offer_document_readiness",
            "BAC inspection reconciliation",
            "borrowingsAssetsContracts",
            "final-offer-document-advertisements-material-documents-and-filing-readiness",
        ),
    ]
    for check_id, group, label, linked_key, related_section in linked_checks:
        linked = linked_references.get(linked_key) or {}
        recon = model["reconciliation"][linked_key]
        criteria.append(
            _criterion(
                check_id,
                group,
                label,
                (
                    "pending_linked_workstream"
                    if not linked.get("available")
                    else "potential_concern"
                    if recon["mismatchCount"] > 0
                    else "ready"
                    if recon["status"] == "Reconciled"
                    else "pending_professional_confirmation"
                ),
                (
                    f"{label}: {recon['status']}."
                    if linked.get("available")
                    else f"{label} linked data not yet available."
                ),
                related_section,
            )
        )

    counts = {
        "ready": 0,
        "potentialConcern": 0,
        "missingInformation": 0,
        "appointmentPending": 0,
        "agreementPending": 0,
        "certificatePending": 0,
        "consentPending": 0,
        "exchangeQueryPending": 0,
        "filingPending": 0,
        "approvalPending": 0,
        "underwritingPending": 0,
        "marketMakingPending": 0,
        "issueInfrastructurePending": 0,
        "listingActionPending": 0,
        "pendingLinkedWorkstream": 0,
        "pendingProfessionalConfirmation": 0,
        "notApplicable": 0,
        "notYetDue": 0,
    }
    state_to_count = {
        "ready": "ready",
        "potential_concern": "potentialConcern",
        "missing_information": "missingInformation",
        "appointment_pending": "appointmentPending",
        "agreement_pending": "agreementPending",
        "certificate_pending": "certificatePending",
        "consent_pending": "consentPending",
        "exchange_query_pending": "exchangeQueryPending",
        "filing_pending": "filingPending",
        "approval_pending": "approvalPending",
        "underwriting_pending": "underwritingPending",
        "market_making_pending": "marketMakingPending",
        "issue_infrastructure_pending": "issueInfrastructurePending",
        "listing_action_pending": "listingActionPending",
        "pending_linked_workstream": "pendingLinkedWorkstream",
        "pending_professional_confirmation": "pendingProfessionalConfirmation",
        "not_applicable": "notApplicable",
        "not_yet_due": "notYetDue",
    }
    for entry in criteria:
        count_key = state_to_count.get(entry["state"])
        if count_key:
            counts[count_key] += 1

    groups = [
        {
            "group": group,
            "label": IF_ASSESSMENT_GROUP_LABELS[group],
            "headlineState": _worst_state([entry["state"] for entry in criteria if entry["group"] == group]),
            "criteria": [entry for entry in criteria if entry["group"] == group],
        }
        for group in IF_ASSESSMENT_GROUPS
        if any(entry["group"] == group for entry in criteria)
    ]

    potential_concerns = (
        counts["potentialConcern"]
        + counts["exchangeQueryPending"]
        + counts["underwritingPending"]
        + counts["marketMakingPending"]
    )

    result = "broadly_ready_for_current_stage"
    if counts["pendingLinkedWorkstream"] > 0 and progress["sectionsComplete"] == 0:
        result = "insufficient_information"
    elif counts["pendingProfessionalConfirmation"] > 0:
        result = "professional_confirmation_required"
    elif counts["exchangeQueryPending"] > 0:
        result = "exchange_review_in_progress"
    elif counts["appointmentPending"] > 0 or counts["agreementPending"] > 0:
        result = "intermediary_actions_pending"
    elif counts["certificatePending"] > 0 or counts["consentPending"] > 0 or dd["unresolvedMaterialCount"] > 0:
        result = "due_diligence_pending"
    elif counts["filingPending"] > 0 or counts["approvalPending"] > 0:
        result = "filing_actions_pending"
    elif counts["issueInfrastructurePending"] > 0:
        result = "issue_infrastructure_pending"
    elif counts["underwritingPending"] > 0 or counts["marketMakingPending"] > 0:
        result = "underwriting_or_market_making_pending"
    elif is_stage_at_least(stage, "issue_open") and not is_stage_at_least(stage, "listed"):
        result = "issue_execution_in_progress"
    elif counts["listingActionPending"] > 0:
        result = "listing_actions_pending"
    elif progress["sectionsComplete"] == 0:
        result = "insufficient_information"
    elif progress["overallStatus"] == "in_progress":
        result = "preparation_in_progress"
    elif is_stage_at_least(stage, "pre_issue_filing") and potential_concerns == 0:
        result = "pre_issue_readiness"

    if result not in IF_ASSESSMENT_RESULT_STATES:
        result = "broadly_ready_for_current_stage"

    return {
        "result": result,
        "resultLabel": _RESULT_LABELS[result],
        "summary": (
            "This is a filing readiness view derived from the current in-memory draft, not a "
            "regulatory approval or safe-to-launch determination. Unanswered questions are treated "
            "as missing information."
        ),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "intermediaryCount": model["intermediaryAggregates"]["totalCount"],
            "filingCount": model["filingAggregates"]["filingCount"],
            "openQueryCount": model["filingAggregates"]["openQueryCount"],
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "reconciliationMismatchCount": model["reconciliation"]["totalMismatchCount"],
            "potentialConcerns": potential_concerns,
        },
        "rulesVersion": IF_RULES_VERSION,
        "rulesAsOf": IF_RULES_AS_OF,
        "criterionStateLabels": IF_CRITERION_STATE_LABELS,
    }
