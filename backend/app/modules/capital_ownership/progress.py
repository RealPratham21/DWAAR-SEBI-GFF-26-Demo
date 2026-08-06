"""Section completion for Capital & Ownership — ports `frontend/lib/capital-ownership/progress.ts`.

Mirrors the IPO Setup progress model: each section resolves to
`not_started | in_progress | complete`, and an unanswered ternary is never treated as "no".
"""

from __future__ import annotations

from typing import Any

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.constants import SECTION_IDS, SECTION_LABELS


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
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


def evaluate_current_capital_structure_status(payload: dict[str, Any]) -> str:
    section = payload.get("currentCapitalStructure") or {}
    equity_classes = section.get("equityClasses") or []
    equity_rows_entered = [
        item
        for item in equity_classes
        if _filled(item.get("className")) or dm.is_filled(item.get("issuedShares"))
    ]

    core = [
        _filled(section.get("asOnDate")),
        len(equity_rows_entered) > 0,
        dm.is_filled(section.get("authorisedEquityShareCapital")),
        dm.is_filled(section.get("issuedEquityShareCapital")),
        dm.is_filled(section.get("paidUpEquityShareCapital")),
        _filled(section.get("allSharesFullyPaidUp")),
        _filled(section.get("shareCapitalMatchesMcaRecords")),
        _filled(section.get("dematStatusOverall")),
    ]
    answered = sum(1 for value in core if value)

    classes_complete = all(
        dm.is_filled(item.get("faceValuePerShare"))
        and dm.is_filled(item.get("issuedShares"))
        and dm.is_filled(item.get("paidUpShares"))
        for item in equity_rows_entered
    )
    discrepancy_explained = section.get("shareCapitalMatchesMcaRecords") != "no" or _filled(
        section.get("discrepancyWithMcaRecordsExplanation")
    )
    partly_paid_explained = section.get("partlyPaidSharesOutstanding") != "yes" or _filled(
        section.get("partlyPaidSharesDetails")
    )

    return _status_from(
        answered,
        len(core),
        classes_complete and discrepancy_explained and partly_paid_explained,
    )


def evaluate_share_capital_history_status(payload: dict[str, Any]) -> str:
    section = payload.get("shareCapitalHistory") or {}
    core = [
        _filled(section.get("historyCoversPeriodSinceIncorporation")),
        len(section.get("capitalEvents") or []) > 0,
        _filled(section.get("allHistoricalAllotmentsDocumented")),
        _filled(section.get("historyReconciledWithMcaFilings")),
        _filled(section.get("bonusIssueInLastTwelveMonths")),
        _filled(section.get("sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths")),
        _filled(section.get("anyPendingAllotments")),
    ]
    answered = sum(1 for value in core if value)

    events_complete = all(
        _filled(event.get("eventDate"))
        and _filled(event.get("eventType"))
        and (
            dm.is_filled(event.get("numberOfShares"))
            or event.get("eventType") == "increase-in-authorised-capital"
        )
        for event in (section.get("capitalEvents") or [])
    )
    gaps_explained = section.get("allHistoricalAllotmentsDocumented") != "no" or _filled(
        section.get("gapsInHistoryExplanation")
    )
    pending_explained = section.get("anyPendingAllotments") != "yes" or _filled(
        section.get("pendingAllotmentDetails")
    )

    return _status_from(answered, len(core), events_complete and gaps_explained and pending_explained)


def evaluate_shareholders_status(payload: dict[str, Any]) -> str:
    section = payload.get("shareholdersAndBeneficialOwnership") or {}
    core = [
        _filled(section.get("shareholdingAsOnDate")),
        len(section.get("shareholders") or []) > 0,
        dm.is_filled(section.get("totalNumberOfShareholders")),
        _filled(section.get("registerOfMembersMaintained")),
        _filled(section.get("significantBeneficialOwnerDeterminationCompleted")),
        _filled(section.get("foreignShareholdingExists")),
        _filled(section.get("anyShareholderAgreementsWithInvestors")),
    ]
    answered = sum(1 for value in core if value)

    shareholders_complete = all(
        _filled(item.get("name"))
        and _filled(item.get("category"))
        and dm.is_filled(item.get("equitySharesHeld"))
        for item in (section.get("shareholders") or [])
    )
    sbo_complete = section.get(
        "significantBeneficialOwnerDeterminationCompleted"
    ) != "yes" or len(section.get("beneficialOwners") or []) > 0
    foreign_complete = section.get("foreignShareholdingExists") != "yes" or _filled(
        section.get("foreignDirectInvestmentComplianceConfirmed")
    )

    return _status_from(
        answered, len(core), shareholders_complete and sbo_complete and foreign_complete
    )


def evaluate_promoters_and_control_status(payload: dict[str, Any]) -> str:
    section = payload.get("promotersAndControl") or {}
    has_promoter = section.get("companyHasIdentifiedPromoter") == "yes"
    core = [
        _filled(section.get("companyHasIdentifiedPromoter")),
        len(section.get("promoters") or []) > 0
        if has_promoter
        else _filled(section.get("noPromoterExplanation")),
        _filled(section.get("promoterIdentificationComplete")),
        _filled(section.get("promoterGroupIdentificationComplete")),
        _filled(section.get("anyPersonExercisingControlWithoutShareholding")),
        _filled(section.get("changeInControlInLastThreeYears")),
    ]
    answered = sum(1 for value in core if value)

    promoters_complete = all(
        _filled(item.get("name"))
        and _filled(item.get("promoterType"))
        and _filled(item.get("basisOfPromoterStatus"))
        for item in (section.get("promoters") or [])
    )
    group_complete = all(
        _filled(item.get("name")) and _filled(item.get("relationshipToPromoter"))
        for item in (section.get("promoterGroupMembers") or [])
    )
    arrangements_complete = all(
        _filled(item.get("arrangementType")) and _filled(item.get("partiesInvolved"))
        for item in (section.get("controlArrangements") or [])
    )
    control_explained = section.get(
        "anyPersonExercisingControlWithoutShareholding"
    ) != "yes" or _filled(section.get("controlWithoutShareholdingDetails"))
    change_explained = section.get("changeInControlInLastThreeYears") != "yes" or _filled(
        section.get("changeInControlDetails")
    )

    return _status_from(
        answered,
        len(core),
        promoters_complete
        and group_complete
        and arrangements_complete
        and control_explained
        and change_explained,
    )


def evaluate_pre_post_issue_status(payload: dict[str, Any]) -> str:
    section = payload.get("preAndPostIssueOwnership") or {}
    has_overlays = len(section.get("shareholderOverlays") or []) > 0
    core = [
        has_overlays,
        _filled(section.get("preIssueCapitalConfirmedWithLeadManager")),
        _filled(section.get("sellingShareholderConsentsObtained")),
        _filled(section.get("anyExpectedPreIssueTransfers")),
    ]
    answered = sum(1 for value in core if value)

    overlays_complete = all(
        _filled(overlay.get("shareholderId"))
        and (
            dm.is_filled(overlay.get("sharesOfferedForSale"))
            or dm.is_filled(overlay.get("otherExpectedPreIssueTransfer"))
        )
        for overlay in (section.get("shareholderOverlays") or [])
    )
    sellers_complete = section.get("sellingShareholderConsentsObtained") != "yes" or _filled(
        section.get("sellingShareholderEligibilityConfirmed")
    )
    transfers_explained = section.get("anyExpectedPreIssueTransfers") != "yes" or _filled(
        section.get("expectedPreIssueTransferDetails")
    )

    return _status_from(
        answered, len(core), overlays_complete and sellers_complete and transfers_explained
    )


def evaluate_promoter_contribution_status(payload: dict[str, Any]) -> str:
    section = payload.get("promoterContributionLockInAndEncumbrances") or {}
    applicable = section.get("minimumPromoterContributionApplicable") != "no"
    core = [
        _filled(section.get("minimumPromoterContributionApplicable")),
        len(section.get("contributionLots") or []) > 0
        if applicable
        else _filled(section.get("exemptionFromMinimumContributionClaimed")),
        _filled(section.get("contributionBroughtInBeforeIssueOpening")),
        _filled(section.get("anyEncumbranceOnPromoterShares")),
        _filled(section.get("entirePreIssueCapitalLockInUnderstood")),
        _filled(section.get("sharesIneligibleForContributionExist")),
    ]
    answered = sum(1 for value in core if value)

    lots_complete = all(
        dm.is_filled(lot.get("numberOfShares"))
        and _filled(lot.get("dateOfAcquisition"))
        and _filled(lot.get("modeOfAcquisition"))
        and _filled(lot.get("eligibleForMinimumPromoterContribution"))
        for lot in (section.get("contributionLots") or [])
    )
    encumbrances_complete = all(
        _filled(item.get("encumbranceType")) and dm.is_filled(item.get("numberOfSharesEncumbered"))
        for item in (section.get("encumbrances") or [])
    )
    encumbrance_answered = section.get("anyEncumbranceOnPromoterShares") != "yes" or len(
        section.get("encumbrances") or []
    ) > 0
    ineligible_explained = section.get("sharesIneligibleForContributionExist") != "yes" or _filled(
        section.get("ineligibleSharesDetails")
    )
    exemption_explained = section.get(
        "exemptionFromMinimumContributionClaimed"
    ) != "yes" or _filled(section.get("exemptionBasis"))

    return _status_from(
        answered,
        len(core),
        lots_complete
        and encumbrances_complete
        and encumbrance_answered
        and ineligible_explained
        and exemption_explained,
    )


def evaluate_outstanding_securities_status(payload: dict[str, Any]) -> str:
    section = payload.get("outstandingSecuritiesTransactionsAndConfirmations") or {}
    confirmations = list((section.get("confirmations") or {}).values())
    confirmations_checked = sum(1 for value in confirmations if value)

    core = [
        _filled(section.get("anyOutstandingConvertibleInstruments")),
        _filled(section.get("anyTransactionsInLastEighteenMonths")),
        _filled(section.get("allSharesDematerialisedBeforeFiling")),
        _filled(section.get("anyPendingShareTransfers")),
        _filled(section.get("anyDisputesOverTitleToShares")),
        confirmations_checked > 0,
    ]
    answered = sum(1 for value in core if value)

    instruments = section.get("outstandingInstruments") or []
    instruments_complete = section.get("anyOutstandingConvertibleInstruments") != "yes" or (
        len(instruments) > 0
        and all(
            _filled(item.get("instrumentType"))
            and dm.is_filled(item.get("potentialEquitySharesOnConversion"))
            for item in instruments
        )
    )
    transactions = section.get("recentTransactions") or []
    transactions_complete = section.get("anyTransactionsInLastEighteenMonths") != "yes" or (
        len(transactions) > 0
        and all(
            _filled(item.get("transactionDate"))
            and _filled(item.get("transactionType"))
            and dm.is_filled(item.get("numberOfShares"))
            for item in transactions
        )
    )
    pending_explained = section.get("anyPendingShareTransfers") != "yes" or _filled(
        section.get("pendingShareTransferDetails")
    )
    disputes_explained = section.get("anyDisputesOverTitleToShares") != "yes" or _filled(
        section.get("titleDisputeDetails")
    )
    confirmations_complete = confirmations_checked == len(confirmations)

    return _status_from(
        answered,
        len(core),
        instruments_complete
        and transactions_complete
        and pending_explained
        and disputes_explained
        and confirmations_complete,
    )


_EVALUATORS = {
    "current-capital-structure": evaluate_current_capital_structure_status,
    "share-capital-history": evaluate_share_capital_history_status,
    "shareholders-beneficial-ownership": evaluate_shareholders_status,
    "promoters-and-control": evaluate_promoters_and_control_status,
    "pre-post-issue-ownership": evaluate_pre_post_issue_status,
    "promoter-contribution-lock-in": evaluate_promoter_contribution_status,
    "outstanding-securities-confirmations": evaluate_outstanding_securities_status,
}


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: _EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(statuses)
    if sections_complete == total_sections:
        overall = "complete"
    elif any(status != "not_started" for status in statuses):
        overall = "in_progress"
    else:
        overall = "not_started"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall,
    }


def list_missing_required(payload: dict[str, Any]) -> list[str]:
    progress = calculate_progress(payload)
    missing: list[str] = []
    for section_id, status in progress["sections"].items():
        if status != "complete":
            missing.append(f"{SECTION_LABELS[section_id]} incomplete")
    return missing
