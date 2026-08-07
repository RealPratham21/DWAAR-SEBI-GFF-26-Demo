"""Derived model for Intermediaries & Filing (IF2)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.modules.intermediaries_filing.decimal_utils import add_decimals, divide_decimals, subtract_decimals
from app.modules.intermediaries_filing.filings import (
    get_authoritative_version,
    get_authoritative_version_conflict_count,
    get_filings,
    get_offer_document_versions,
)
from app.modules.intermediaries_filing.intermediaries import get_intermediaries, get_lead_managers
from app.modules.intermediaries_filing.reconciliation import build_reconciliation_preview
from app.modules.intermediaries_filing.rules import (
    MARKET_MAKING_MINIMUM_DAYS,
    compare_merchant_banker_own_account,
    compare_underwriting_coverage,
)
from app.modules.intermediaries_filing.working_days import compute_preliminary_t_plus3


def _count_overlapping_commitments(payload: dict[str, Any]) -> bool:
    section = payload.get("underwritingMarketMakingAndDistributionArrangements") or {}
    seen: set[str] = set()
    for commitment in section.get("underwritingCommitments") or []:
        if not isinstance(commitment, dict):
            continue
        intermediary_id = str(commitment.get("intermediaryId") or "")
        shares = str(commitment.get("sharesUnderwritten") or "")
        if not intermediary_id or not shares:
            continue
        key = f"{intermediary_id}::{shares}"
        if key in seen:
            return True
        seen.add(key)
    return False


def _filled_text(value: Any) -> bool:
    return bool(str(value or "").strip())


def compute_intermediaries_filing_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    intermediaries = get_intermediaries(payload)
    filings = get_filings(payload)
    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    section4 = payload.get("dueDiligenceCertificatesConsentsAndSignoffs") or {}
    section5 = payload.get("depositoriesBankingAsbaUpiAndIssueInfrastructure") or {}
    section6 = payload.get("underwritingMarketMakingAndDistributionArrangements") or {}
    section7 = payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}
    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}

    underwriting_summary = section6.get("underwritingSummary") or {}
    commitments = [
        item for item in (section6.get("underwritingCommitments") or []) if isinstance(item, dict)
    ]
    total_shares_committed = add_decimals(
        *[str(item.get("sharesUnderwritten") or "") for item in commitments]
    )
    total_amount_committed = add_decimals(
        *[str(item.get("amountUnderwritten") or "") for item in commitments]
    )
    issue_shares = str(underwriting_summary.get("issueShares") or "")
    total_underwriting_percentage = (
        str(underwriting_summary.get("totalUnderwritingPercentage") or "")
        or divide_decimals(total_shares_committed, issue_shares)
        or ""
    )

    own_account_shares = add_decimals(
        *[
            str(item.get("sharesUnderwritten") or "")
            for item in commitments
            if item.get("ownAccount") == "yes"
        ],
        str(underwriting_summary.get("leadManagerOwnAccountCommitment") or ""),
    )
    own_account_percentage = (
        str(underwriting_summary.get("ownAccountPercentage") or "")
        or divide_decimals(own_account_shares, issue_shares)
        or ""
    )

    calendar = section7.get("issueCalendar") or {}
    t_plus3 = compute_preliminary_t_plus3(str(calendar.get("issueClosingDate") or ""))
    authoritative = get_authoritative_version(payload)

    open_queries = [
        query
        for query in (section3.get("exchangeQueries") or [])
        if isinstance(query, dict)
        and query.get("status") not in {"closed", "superseded"}
    ]
    now_ms = datetime.now(tz=UTC).timestamp() * 1000

    def _query_overdue(query: dict[str, Any]) -> bool:
        due_text = str(query.get("responseDueDate") or "").strip()
        if not due_text:
            return False
        try:
            due = datetime.fromisoformat(due_text.replace("Z", "+00:00")).timestamp() * 1000
        except ValueError:
            return False
        return due < now_ms

    return {
        "intermediaryAggregates": {
            "totalCount": len(intermediaries),
            "leadManagerCount": len(get_lead_managers(payload)),
            "activeCount": sum(
                1
                for item in intermediaries
                if (item.get("appointment") or {}).get("status") == "active"
            ),
            "agreementPendingCount": sum(
                1
                for item in intermediaries
                if (item.get("appointment") or {}).get("status") == "agreement_pending"
            ),
            "registrationsPendingReview": sum(
                1
                for item in intermediaries
                if (item.get("registration") or {}).get("registrationStatus")
                in {"pending_verification", "professional_confirmation_required"}
            ),
        },
        "filingAggregates": {
            "filingCount": len(filings),
            "openQueryCount": len(open_queries),
            "overdueQueryCount": sum(1 for query in open_queries if _query_overdue(query)),
            "closedQueryCount": sum(
                1
                for query in (section3.get("exchangeQueries") or [])
                if isinstance(query, dict) and query.get("status") == "closed"
            ),
            "resubmissionCount": len(section3.get("resubmissions") or []),
            "latestFilingDate": max(
                (str(filing.get("filingDate") or "") for filing in filings if filing.get("filingDate")),
                default="",
            ),
        },
        "certificateConsentAggregates": {
            "certificateCount": len(section4.get("certificates") or []),
            "signedCertificateCount": sum(
                1
                for certificate in (section4.get("certificates") or [])
                if isinstance(certificate, dict)
                and (
                    certificate.get("status") == "signed"
                    or certificate.get("signed") == "yes"
                )
            ),
            "certificatesPending": sum(
                1
                for certificate in (section4.get("certificates") or [])
                if isinstance(certificate, dict)
                and certificate.get("status") in {"not_started", "draft", "under_review"}
            ),
            "consentCount": len(section4.get("consents") or []),
            "consentsReceived": sum(
                1
                for consent in (section4.get("consents") or [])
                if isinstance(consent, dict) and consent.get("received") == "yes"
            ),
            "consentsWithdrawn": sum(
                1
                for consent in (section4.get("consents") or [])
                if isinstance(consent, dict) and consent.get("withdrawn") == "yes"
            ),
            "chapterSignoffsComplete": sum(
                1
                for signoff in (section4.get("chapterSignoffs") or [])
                if isinstance(signoff, dict) and signoff.get("finalSignOff") == "yes"
            ),
            "chapterSignoffsTotal": len(section4.get("chapterSignoffs") or []),
        },
        "dueDiligenceAggregates": {
            "areaCount": len(section4.get("dueDiligenceAreas") or []),
            "startedCount": sum(
                1
                for area in (section4.get("dueDiligenceAreas") or [])
                if isinstance(area, dict) and area.get("dueDiligenceStarted") == "yes"
            ),
            "signedOffCount": sum(
                1
                for area in (section4.get("dueDiligenceAreas") or [])
                if isinstance(area, dict) and area.get("finalSignOff") == "yes"
            ),
            "unresolvedMaterialCount": sum(
                1
                for area in (section4.get("dueDiligenceAreas") or [])
                if isinstance(area, dict) and area.get("materialUnresolvedIssue") == "yes"
            ),
        },
        "infrastructureAggregates": {
            "isinStatus": str((section5.get("depositoryReadiness") or {}).get("isinStatus") or ""),
            "configuredBankRoles": sum(
                1
                for role in (section5.get("issueBankRoles") or [])
                if isinstance(role, dict)
                and role.get("accountSetupStatus") in {"configured", "ready"}
            ),
            "requiredBankRoles": len(section5.get("issueBankRoles") or []),
            "sponsorBankReady": (
                (section5.get("sponsorBankUpiReadiness") or {}).get("sponsorBankAppointed") == "yes"
                and (section5.get("sponsorBankUpiReadiness") or {}).get("agreementExecuted") == "yes"
            ),
            "upiReady": (section5.get("sponsorBankUpiReadiness") or {}).get("upiSetupComplete") == "yes",
            "asbaReady": (section5.get("asbaConfiguration") or {}).get("asbaApplicable") == "yes",
        },
        "underwritingAggregates": {
            "totalSharesCommitted": total_shares_committed
            or str(underwriting_summary.get("totalUnderwritingCommitment") or ""),
            "totalAmountCommitted": total_amount_committed
            or str(underwriting_summary.get("totalUnderwritingCommitment") or ""),
            "totalUnderwritingPercentage": total_underwriting_percentage,
            "uncoveredShares": subtract_decimals(
                issue_shares,
                total_shares_committed or str(underwriting_summary.get("totalUnderwritingCommitment") or ""),
            ),
            "uncoveredAmount": subtract_decimals(
                str(underwriting_summary.get("issueAmount") or ""),
                total_amount_committed or str(underwriting_summary.get("totalUnderwritingCommitment") or ""),
            ),
            "ownAccountPercentage": own_account_percentage,
            "ownAccountComparison": compare_merchant_banker_own_account(own_account_percentage),
            "coverageComparison": compare_underwriting_coverage(total_underwriting_percentage),
            "overlappingCommitmentWarning": _count_overlapping_commitments(payload),
        },
        "marketMakingAggregates": {
            "marketMakerAppointed": _filled_text(
                (section6.get("marketMakerConfiguration") or {}).get("marketMakerIntermediaryId")
            ),
            "agreementExecuted": (section6.get("marketMakerConfiguration") or {}).get("agreementExecuted")
            == "yes",
            "reservationShares": str((section6.get("marketMakerReservation") or {}).get("reservedShares") or ""),
            "configuredMinimumDays": MARKET_MAKING_MINIMUM_DAYS,
            "reservationDiscrepancy": str(
                (section6.get("marketMakerReservation") or {}).get("discrepancyWithIpoSetup") or ""
            ),
        },
        "programmeAggregates": {
            "issueOpeningDate": str(calendar.get("issueOpeningDate") or ""),
            "issueClosingDate": str(calendar.get("issueClosingDate") or ""),
            "preliminaryTPlus3ListingDate": t_plus3["tPlus3"],
            "subscriptionRowCount": len(section7.get("subscriptionRows") or []),
            "postIssueActionsComplete": sum(
                1
                for action in (section7.get("postIssueActions") or [])
                if isinstance(action, dict) and action.get("status") == "complete"
            ),
            "postIssueActionsTotal": len(section7.get("postIssueActions") or []),
        },
        "finalDocumentAggregates": {
            "versionCount": len(get_offer_document_versions(payload)),
            "authoritativeVersionLabel": (
                f"{authoritative.get('type', '')} {authoritative.get('versionLabel', '')}".strip()
                if authoritative
                else ""
            ),
            "authoritativeVersionConflict": get_authoritative_version_conflict_count(payload) > 1,
            "openPlaceholderCount": sum(
                1
                for placeholder in (section8.get("placeholders") or [])
                if isinstance(placeholder, dict)
                and placeholder.get("status") in {"open", "in_progress"}
            ),
            "inspectionItemsPending": sum(
                1
                for item in (section8.get("inspectionItems") or [])
                if isinstance(item, dict) and item.get("inclusionStatus") == "pending_review"
            ),
            "issueAgreementsPending": sum(
                1
                for agreement in (section8.get("issueAgreements") or [])
                if isinstance(agreement, dict)
                and agreement.get("status") not in {"executed", "not_applicable", "superseded"}
            ),
            "publicCommunicationsPending": sum(
                1
                for communication in (section8.get("publicCommunications") or [])
                if isinstance(communication, dict) and communication.get("finalCopyAvailable") != "yes"
            ),
        },
        "reconciliation": build_reconciliation_preview(payload, linked_references),
        "currentFilingStage": str(
            ((payload.get("issueConfigurationAndFilingSnapshot") or {}).get("filingSnapshot") or {}).get(
                "filingStage"
            )
            or ""
        ),
    }
