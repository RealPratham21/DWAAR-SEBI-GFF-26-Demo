"""Overview summary derived from Intermediaries & Filing draft (IF2)."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.assessment import assess_intermediaries_filing
from app.modules.intermediaries_filing.compute import compute_intermediaries_filing_model
from app.modules.intermediaries_filing.constants import SECTION_LABELS
from app.modules.intermediaries_filing.progress import calculate_intermediaries_filing_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_intermediaries_filing_progress(payload)
    model = compute_intermediaries_filing_model(payload, linked)
    assessment = assess_intermediaries_filing(payload, linked)
    config = payload.get("issueConfigurationAndFilingSnapshot") or {}
    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    ipo_snapshot = config.get("ipoSetupLinkedSnapshot") or {}
    ipo_linked = linked.get("ipoSetup") or {}

    sections_in_progress = sum(1 for status in progress["sections"].values() if status == "in_progress")
    incomplete_sections = [
        section_id
        for section_id, status in progress["sections"].items()
        if status not in {"complete", "not_applicable"}
    ]
    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS.get(section_id, section_id)}",
        }
        for section_id in incomplete_sections[:4]
    ]

    assessment_concerns = (
        assessment["counts"]["potentialConcern"]
        + assessment["counts"]["exchangeQueryPending"]
        + assessment["counts"]["underwritingPending"]
        + assessment["counts"]["marketMakingPending"]
        + assessment["counts"]["issueInfrastructurePending"]
        + assessment["counts"]["listingActionPending"]
    )

    repo = section8.get("merchantBankerDdRepositoryReadiness") or {}
    if repo.get("uploadComplete") == "yes":
        repository_readiness = "complete"
    elif repo.get("uploadProcessStarted") == "yes":
        repository_readiness = "in_progress"
    else:
        repository_readiness = "not_started"

    reconciliation = config.get("filingSnapshotReconciliation") or {}
    section6 = payload.get("underwritingMarketMakingAndDistributionArrangements") or {}
    section7 = payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}

    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "currentFilingStage": progress["currentFilingStage"],
        "targetSmePlatform": ipo_snapshot.get("targetSmePlatform") or ipo_linked.get("targetSmePlatform") or "",
        "issueMethod": ipo_snapshot.get("issueMethod") or ipo_linked.get("issueMethod") or "",
        "freshIssueAmount": reconciliation.get("freshIssueAmount", ""),
        "ofsAmount": reconciliation.get("ofsAmount", ""),
        "totalOfferAmount": reconciliation.get("totalOfferAmount", ""),
        "currentPriceBandStatus": (config.get("pricing") or {}).get("priceBand")
        or (config.get("pricing") or {}).get("finalIssuePrice")
        or "",
        "authoritativeDocumentVersion": model["finalDocumentAggregates"]["authoritativeVersionLabel"],
        "intermediaryCount": model["intermediaryAggregates"]["totalCount"],
        "leadManagerCount": model["intermediaryAggregates"]["leadManagerCount"],
        "activeIntermediaryCount": model["intermediaryAggregates"]["activeCount"],
        "agreementsPendingCount": model["intermediaryAggregates"]["agreementPendingCount"],
        "registrationsPendingReview": model["intermediaryAggregates"]["registrationsPendingReview"],
        "ddAreasSignedOff": model["dueDiligenceAggregates"]["signedOffCount"],
        "ddAreasTotal": model["dueDiligenceAggregates"]["areaCount"],
        "openDdAreas": model["dueDiligenceAggregates"]["areaCount"]
        - model["dueDiligenceAggregates"]["signedOffCount"],
        "certificatesReady": model["certificateConsentAggregates"]["signedCertificateCount"],
        "certificatesPending": model["certificateConsentAggregates"]["certificatesPending"],
        "consentsRequired": model["certificateConsentAggregates"]["consentCount"],
        "consentsReceived": model["certificateConsentAggregates"]["consentsReceived"],
        "chapterSignoffsComplete": model["certificateConsentAggregates"]["chapterSignoffsComplete"],
        "chapterSignoffsTotal": model["certificateConsentAggregates"]["chapterSignoffsTotal"],
        "filingCount": model["filingAggregates"]["filingCount"],
        "openExchangeQueries": model["filingAggregates"]["openQueryCount"],
        "overdueExchangeQueries": model["filingAggregates"]["overdueQueryCount"],
        "inPrincipleStatus": (section3.get("inPrincipleApproval") or {}).get("approvalReceived", ""),
        "sebiSmeFilingStatus": (section3.get("sebiSmeFiling") or {}).get("status", ""),
        "rocFilingStatus": (section3.get("rocFiling") or {}).get("filingComplete", ""),
        "isinStatus": model["infrastructureAggregates"]["isinStatus"],
        "sponsorBankReady": model["infrastructureAggregates"]["sponsorBankReady"],
        "upiReady": model["infrastructureAggregates"]["upiReady"],
        "asbaReady": model["infrastructureAggregates"]["asbaReady"],
        "bankRolesReady": model["infrastructureAggregates"]["configuredBankRoles"],
        "bankRolesTotal": model["infrastructureAggregates"]["requiredBankRoles"],
        "underwritingCoverage": model["underwritingAggregates"]["totalUnderwritingPercentage"],
        "uncoveredShares": model["underwritingAggregates"]["uncoveredShares"],
        "merchantBankerOwnAccountPercentage": model["underwritingAggregates"]["ownAccountPercentage"],
        "marketMakerAppointed": model["marketMakingAggregates"]["marketMakerAppointed"],
        "marketMakingAgreementExecuted": model["marketMakingAggregates"]["agreementExecuted"],
        "marketMakingReservationStatus": (section6.get("marketMakerReservation") or {}).get(
            "allocationStatus", ""
        ),
        "issueOpeningDate": model["programmeAggregates"]["issueOpeningDate"],
        "issueClosingDate": model["programmeAggregates"]["issueClosingDate"],
        "preliminaryTPlus3ListingDate": model["programmeAggregates"]["preliminaryTPlus3ListingDate"],
        "basisStatus": (section7.get("basisOfAllotment") or {}).get("basisPrepared", ""),
        "dematStatus": (section7.get("dematCredit") or {}).get("sharesCredited", ""),
        "listingStatus": (section7.get("listing") or {}).get("listingCompletionStatus", ""),
        "unresolvedPlaceholders": model["finalDocumentAggregates"]["openPlaceholderCount"],
        "inspectionItemsPending": model["finalDocumentAggregates"]["inspectionItemsPending"],
        "issueAgreementsPending": model["finalDocumentAggregates"]["issueAgreementsPending"],
        "advertisementsPending": model["finalDocumentAggregates"]["publicCommunicationsPending"],
        "repositoryReadiness": repository_readiness,
        "reconciliationMismatchCount": model["reconciliation"]["totalMismatchCount"],
        "assessmentConcerns": assessment_concerns,
        "pendingProfessionalConfirmations": assessment["counts"]["pendingProfessionalConfirmation"],
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
    }
