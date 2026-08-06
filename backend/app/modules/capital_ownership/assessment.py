"""Deterministic Capital Assessment for Capital & Ownership — ports `frontend/lib/capital-ownership/assessment.ts`.

The assessment is intentionally NON-BINARY: it never returns pass/fail. Each criterion lands
in one of six states, and the overall result describes the quality of the record rather than
eligibility. An unanswered question is `missing_information`, never a negative answer.
"""

from __future__ import annotations

from typing import Any

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.compute import compute_capital_ownership_model
from app.modules.capital_ownership.constants import CAPITAL_OWNERSHIP_CONFIRMATION_KEYS
from app.modules.capital_ownership.progress import calculate_progress

CRITERION_STATES = (
    "reconciled",
    "potential_inconsistency",
    "missing_information",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "not_applicable",
)

ASSESSMENT_GROUPS = (
    "capital_reconciliation",
    "ownership_reconciliation",
    "offer_reconciliation",
    "promoter_lock_in_readiness",
)

ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "capital_reconciliation": "Capital reconciliation",
    "ownership_reconciliation": "Ownership reconciliation",
    "offer_reconciliation": "Offer reconciliation",
    "promoter_lock_in_readiness": "Promoter contribution & lock-in readiness",
}

CRITERION_STATE_LABELS: dict[str, str] = {
    "reconciled": "Reconciled",
    "potential_inconsistency": "Potential inconsistency",
    "missing_information": "Missing information",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

# Frontend result states, kept identical so the API matches the canonical frontend contract.
ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "appears_reconciled",
    "inconsistencies_identified",
    "pending_linked_workstream",
    "professional_confirmation_required",
)

_GROUP_BY_RECONCILIATION: dict[str, str] = {
    "capital": "capital_reconciliation",
    "ownership": "ownership_reconciliation",
    "offer": "offer_reconciliation",
    "lock_in": "promoter_lock_in_readiness",
}


def _state_from_check(check: dict[str, Any]) -> str:
    status = check["status"]
    if status == "reconciled":
        return "reconciled"
    if status == "variance":
        return "potential_inconsistency"
    if status == "not_applicable":
        return "not_applicable"
    return "missing_information"


def _state_from_ternary(answer: str, *, no_state: str = "potential_inconsistency") -> str:
    if answer == "yes":
        return "reconciled"
    if answer == "no":
        return no_state
    if answer == "not_sure":
        return "pending_professional_confirmation"
    return "missing_information"


def _empty_counts() -> dict[str, int]:
    return {state: 0 for state in CRITERION_STATES}


def _headline_state_for(counts: dict[str, int]) -> str:
    if counts["potential_inconsistency"] > 0:
        return "potential_inconsistency"
    if counts["missing_information"] > 0:
        return "missing_information"
    if counts["pending_linked_workstream"] > 0:
        return "pending_linked_workstream"
    if counts["pending_professional_confirmation"] > 0:
        return "pending_professional_confirmation"
    if counts["reconciled"] > 0:
        return "reconciled"
    return "not_applicable"


def _label_for_result(result: str) -> str:
    return {
        "insufficient_information": "Insufficient information",
        "appears_reconciled": "Capital and ownership appear reconciled",
        "inconsistencies_identified": "Potential inconsistencies identified",
        "pending_linked_workstream": "Pending linked workstream",
        "professional_confirmation_required": "Professional confirmation required",
    }.get(result, "Insufficient information")


def _summary_for_result(result: str) -> str:
    return {
        "insufficient_information": (
            "Too much of the capital and ownership record is still blank to draw a meaningful "
            "view. Blank answers are not read as negative."
        ),
        "inconsistencies_identified": (
            "One or more figures do not reconcile across sections. These are indicative "
            "differences, not conclusions — review the underlying records."
        ),
        "pending_linked_workstream": (
            "Key inputs depend on another workstream (usually IPO Setup & Eligibility) that is "
            "not yet complete."
        ),
        "professional_confirmation_required": (
            'Entries marked "not sure" or awaiting professional sign-off need confirmation '
            "before this view can be relied upon."
        ),
    }.get(
        result,
        (
            "On currently entered values the capital and ownership record reconciles. "
            "Registrar, depository and professional confirmation remain required."
        ),
    )


def _criterion(
    *,
    criterion_id: str,
    group: str,
    label: str,
    state: str,
    reason: str,
    expected: str | None = None,
    actual: str | None = None,
    difference: str | None = None,
) -> dict[str, Any]:
    return {
        "id": criterion_id,
        "group": group,
        "label": label,
        "state": state,
        "reason": reason,
        "expected": expected,
        "actual": actual,
        "difference": difference,
    }


def assess_capital_ownership(payload: dict[str, Any], ipo_reference: dict[str, Any]) -> dict[str, Any]:
    model = compute_capital_ownership_model(payload, ipo_reference)
    progress = calculate_progress(payload)
    structure = payload.get("currentCapitalStructure") or {}
    history = payload.get("shareCapitalHistory") or {}
    ownership = payload.get("shareholdersAndBeneficialOwnership") or {}
    promoters = payload.get("promotersAndControl") or {}
    offer = payload.get("preAndPostIssueOwnership") or {}
    lock_in_section = payload.get("promoterContributionLockInAndEncumbrances") or {}
    outstanding_section = payload.get("outstandingSecuritiesTransactionsAndConfirmations") or {}

    criteria: list[dict[str, Any]] = []

    for check in model["reconciliation"]:
        criteria.append(
            _criterion(
                criterion_id=check["id"],
                group=_GROUP_BY_RECONCILIATION[check["group"]],
                label=check["label"],
                state=_state_from_check(check),
                reason=check["message"],
                expected=check["expected"],
                actual=check["actual"],
                difference=check["difference"],
            )
        )

    # ---------------------------- Capital ---------------------------------- #

    mca_match = structure.get("shareCapitalMatchesMcaRecords") or ""
    criteria.append(
        _criterion(
            criterion_id="mca-records-match",
            group="capital_reconciliation",
            label="Share capital agrees with MCA records",
            state=_state_from_ternary(mca_match),
            reason=(
                (
                    structure.get("discrepancyWithMcaRecordsExplanation")
                    or "A discrepancy with MCA records is reported but not explained."
                )
                if mca_match == "no"
                else (
                    "Whether share capital matches MCA records has not been answered."
                    if mca_match == ""
                    else "Issuer response recorded for agreement with MCA records."
                )
            ),
        )
    )

    history_documented = history.get("allHistoricalAllotmentsDocumented") or ""
    criteria.append(
        _criterion(
            criterion_id="history-documented",
            group="capital_reconciliation",
            label="Historical allotments are documented",
            state=_state_from_ternary(history_documented),
            reason=(
                (
                    history.get("gapsInHistoryExplanation")
                    or "Gaps in the capital history are reported."
                )
                if history_documented == "no"
                else (
                    "Documentation status of historical allotments has not been answered."
                    if history_documented == ""
                    else "Issuer indicates historical allotments are documented."
                )
            ),
        )
    )

    if model["history"]["eventsMissingShareCount"] > 0 or model["history"]["eventsWithUnknownType"] > 0:
        criteria.append(
            _criterion(
                criterion_id="history-event-completeness",
                group="capital_reconciliation",
                label="Capital events carry a type and share count",
                state="missing_information",
                reason=(
                    f"{model['history']['eventsWithUnknownType']} event(s) have no type and "
                    f"{model['history']['eventsMissingShareCount']} event(s) have no share count, "
                    "so the running total cannot be completed."
                ),
            )
        )

    sufficiency = structure.get("authorisedCapitalSufficientForProposedIssue") or ""
    criteria.append(
        _criterion(
            criterion_id="authorised-capital-sufficiency",
            group="capital_reconciliation",
            label="Authorised capital is sufficient for the proposed issue",
            state=(
                (
                    "potential_inconsistency"
                    if dm.is_filled(structure.get("authorisedCapitalIncreaseRequiredAmount"))
                    else "missing_information"
                )
                if sufficiency == "no"
                else _state_from_ternary(sufficiency)
            ),
            reason=(
                "An increase in authorised capital is required before the fresh issue can be "
                "allotted."
                if sufficiency == "no"
                else (
                    "Sufficiency of authorised capital for the proposed issue has not been answered."
                    if sufficiency == ""
                    else "Issuer indicates authorised capital is sufficient for the proposed issue."
                )
            ),
        )
    )

    confirmations = outstanding_section.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key in CAPITAL_OWNERSHIP_CONFIRMATION_KEYS if confirmations.get(key)
    )
    unanswered_confirmations = len(CAPITAL_OWNERSHIP_CONFIRMATION_KEYS) - confirmations_checked
    criteria.append(
        _criterion(
            criterion_id="issuer-confirmations",
            group="capital_reconciliation",
            label="Issuer confirmations",
            state="reconciled" if unanswered_confirmations == 0 else "missing_information",
            reason=(
                "All issuer confirmations are acknowledged."
                if unanswered_confirmations == 0
                else (
                    f"{unanswered_confirmations} confirmation(s) remain unchecked, so this view "
                    "stays preliminary."
                )
            ),
        )
    )

    # --------------------------- Ownership --------------------------------- #

    register_maintained = ownership.get("registerOfMembersMaintained") or ""
    register_up_to_date = ownership.get("registerOfMembersUpToDate") or ""
    criteria.append(
        _criterion(
            criterion_id="register-of-members",
            group="ownership_reconciliation",
            label="Register of members is maintained and current",
            state=(
                _state_from_ternary(register_up_to_date)
                if register_maintained == "yes"
                else _state_from_ternary(register_maintained)
            ),
            reason=(
                "Whether the register of members is maintained has not been answered."
                if register_maintained == ""
                else (
                    "The register of members is reported as not maintained."
                    if register_maintained == "no"
                    else (
                        "The register of members is maintained and reported as current."
                        if register_up_to_date == "yes"
                        else "The register of members is maintained; its currency needs confirmation."
                    )
                )
            ),
        )
    )

    sbo_determination = ownership.get("significantBeneficialOwnerDeterminationCompleted") or ""
    beneficial_owners = ownership.get("beneficialOwners") or []
    criteria.append(
        _criterion(
            criterion_id="sbo-determination",
            group="ownership_reconciliation",
            label="Significant beneficial owner determination",
            state=(
                "potential_inconsistency"
                if sbo_determination == "yes" and len(beneficial_owners) == 0
                else _state_from_ternary(sbo_determination, no_state="missing_information")
            ),
            reason=(
                "The determination is marked complete but no significant beneficial owner has "
                "been recorded."
                if sbo_determination == "yes" and len(beneficial_owners) == 0
                else (
                    "Significant beneficial owner determination status has not been answered."
                    if sbo_determination == ""
                    else f"{len(beneficial_owners)} beneficial owner record(s) captured."
                )
            ),
        )
    )

    sbos_missing_filings = sum(
        1
        for item in beneficial_owners
        if item.get("isSignificantBeneficialOwner") == "yes" and item.get("formBen2Filed") != "yes"
    )
    if sbos_missing_filings > 0:
        criteria.append(
            _criterion(
                criterion_id="sbo-filings",
                group="ownership_reconciliation",
                label="Significant beneficial owner filings",
                state="missing_information",
                reason=(
                    f"{sbos_missing_filings} significant beneficial owner(s) do not have "
                    "Form BEN-2 recorded as filed."
                ),
            )
        )

    has_identified_promoter = promoters.get("companyHasIdentifiedPromoter") or ""
    promoter_records = promoters.get("promoters") or []
    criteria.append(
        _criterion(
            criterion_id="promoter-identification",
            group="ownership_reconciliation",
            label="Promoter identification is complete",
            state=(
                (
                    "pending_professional_confirmation"
                    if promoters.get("noPromoterExplanation")
                    else "missing_information"
                )
                if has_identified_promoter == "no"
                else (
                    "potential_inconsistency"
                    if has_identified_promoter == "yes" and len(promoter_records) == 0
                    else _state_from_ternary(
                        promoters.get("promoterIdentificationComplete") or "",
                        no_state="missing_information",
                    )
                )
            ),
            reason=(
                "The issuer reports no identified promoter. A promoter-less classification "
                "needs professional confirmation."
                if has_identified_promoter == "no"
                else (
                    "A promoter is reported but no promoter record has been added."
                    if has_identified_promoter == "yes" and len(promoter_records) == 0
                    else (
                        "Completeness of promoter identification has not been answered."
                        if not (promoters.get("promoterIdentificationComplete") or "")
                        else f"{len(promoter_records)} promoter record(s) captured."
                    )
                )
            ),
        )
    )

    group_complete = promoters.get("promoterGroupIdentificationComplete") or ""
    criteria.append(
        _criterion(
            criterion_id="promoter-group-identification",
            group="ownership_reconciliation",
            label="Promoter group identification is complete",
            state=_state_from_ternary(group_complete, no_state="missing_information"),
            reason=(
                "Completeness of promoter group identification has not been answered."
                if group_complete == ""
                else (
                    f"{len(promoters.get('promoterGroupMembers') or [])} promoter group "
                    "member(s) captured."
                )
            ),
        )
    )

    control_arrangements = promoters.get("controlArrangements") or []
    surviving_arrangements = sum(
        1
        for item in control_arrangements
        if item.get("survivesPostListing") == "yes"
        and item.get("terminationOnListingAgreed") != "yes"
    )
    unanswered_arrangements = sum(
        1
        for item in control_arrangements
        if item.get("survivesPostListing") in ("", "not_sure", None)
    )
    criteria.append(
        _criterion(
            criterion_id="control-arrangements",
            group="ownership_reconciliation",
            label="Control arrangements are resolved before listing",
            state=(
                (
                    "potential_inconsistency"
                    if promoters.get("anyPersonExercisingControlWithoutShareholding") == "yes"
                    else "missing_information"
                )
                if len(control_arrangements) == 0
                else (
                    "potential_inconsistency"
                    if surviving_arrangements > 0
                    else "missing_information"
                    if unanswered_arrangements > 0
                    else "reconciled"
                )
            ),
            reason=(
                (
                    "Control without shareholding is reported but no control arrangement has "
                    "been recorded."
                    if promoters.get("anyPersonExercisingControlWithoutShareholding") == "yes"
                    else "No control arrangements have been recorded yet."
                )
                if len(control_arrangements) == 0
                else (
                    f"{surviving_arrangements} arrangement(s) survive listing without an agreed "
                    "termination."
                    if surviving_arrangements > 0
                    else (
                        f"{unanswered_arrangements} arrangement(s) do not state whether they "
                        "survive listing."
                        if unanswered_arrangements > 0
                        else "Recorded arrangements terminate on listing or do not survive it."
                    )
                )
            ),
        )
    )

    foreign_exists = ownership.get("foreignShareholdingExists") or ""
    criteria.append(
        _criterion(
            criterion_id="foreign-investment-compliance",
            group="ownership_reconciliation",
            label="Foreign investment compliance",
            state=(
                "not_applicable"
                if foreign_exists == "no"
                else (
                    "missing_information"
                    if foreign_exists == ""
                    else _state_from_ternary(
                        ownership.get("foreignDirectInvestmentComplianceConfirmed") or ""
                    )
                )
            ),
            reason=(
                "No foreign shareholding is reported."
                if foreign_exists == "no"
                else (
                    "Existence of foreign shareholding has not been answered."
                    if foreign_exists == ""
                    else (
                        "Foreign investment compliance is confirmed by the issuer."
                        if ownership.get("foreignDirectInvestmentComplianceConfirmed") == "yes"
                        else "Foreign investment compliance has not been confirmed."
                    )
                )
            ),
        )
    )

    if model["capTable"]["shareholdersWithoutShareCount"] > 0:
        criteria.append(
            _criterion(
                criterion_id="shareholder-quantities",
                group="ownership_reconciliation",
                label="Shareholder quantities are complete",
                state="missing_information",
                reason=(
                    f"{model['capTable']['shareholdersWithoutShareCount']} shareholder record(s) "
                    "have no equity share count."
                ),
            )
        )
    if model["capTable"]["shareholdersWithoutCategory"] > 0:
        criteria.append(
            _criterion(
                criterion_id="shareholder-categories",
                group="ownership_reconciliation",
                label="Shareholder categories are assigned",
                state="missing_information",
                reason=(
                    f"{model['capTable']['shareholdersWithoutCategory']} shareholder record(s) "
                    "have no category, so promoter and public splits are incomplete."
                ),
            )
        )

    # ----------------------------- Offer ------------------------------------ #

    if not ipo_reference.get("available"):
        criteria.append(
            _criterion(
                criterion_id="ipo-setup-linkage",
                group="offer_reconciliation",
                label="IPO Setup & Eligibility linkage",
                state="pending_linked_workstream",
                reason=(
                    "Offer sizing is governed by IPO Setup & Eligibility, which has not been "
                    "completed. Pre/post-issue views remain indicative."
                ),
            )
        )
    else:
        offer_type = ipo_reference.get("proposedOfferType") or ""
        criteria.append(
            _criterion(
                criterion_id="ipo-setup-linkage",
                group="offer_reconciliation",
                label="IPO Setup & Eligibility linkage",
                state=(
                    "pending_linked_workstream"
                    if offer_type in ("", "undecided")
                    else "reconciled"
                ),
                reason=(
                    "The proposed offer type in IPO Setup is still undecided."
                    if offer_type in ("", "undecided")
                    else "Offer inputs are mirrored from IPO Setup & Eligibility."
                ),
            )
        )

    for issue in model["prePost"]["issues"]:
        if issue["code"] in ("ofs_exceeds_holding", "transfer_exceeds_holding"):
            criteria.append(
                _criterion(
                    criterion_id=f"offer-issue-{issue['id']}",
                    group="offer_reconciliation",
                    label="Offer-for-sale quantity within holding",
                    state="potential_inconsistency",
                    reason=issue["message"],
                )
            )

    total_ofs_shares = model["prePost"]["totalSharesOfferedForSale"]
    criteria.append(
        _criterion(
            criterion_id="selling-shareholder-consents",
            group="offer_reconciliation",
            label="Selling shareholder consents and eligibility",
            state=(
                (
                    _state_from_ternary(
                        offer.get("sellingShareholderEligibilityConfirmed") or "",
                        no_state="potential_inconsistency",
                    )
                    if offer.get("sellingShareholderConsentsObtained") == "yes"
                    else _state_from_ternary(offer.get("sellingShareholderConsentsObtained") or "")
                )
                if dm.is_positive(total_ofs_shares)
                else "not_applicable"
            ),
            reason=(
                "No shares are currently marked for sale."
                if not dm.is_positive(total_ofs_shares)
                else (
                    "Selling shareholder consents have not been confirmed."
                    if not (offer.get("sellingShareholderConsentsObtained") or "")
                    else (
                        "Consents are obtained and eligibility of the selling shareholders is "
                        "confirmed."
                        if offer.get("sellingShareholderEligibilityConfirmed") == "yes"
                        else (
                            "Consents are recorded; eligibility of the selling shareholders "
                            "still needs confirmation."
                        )
                    )
                )
            ),
        )
    )

    criteria.append(
        _criterion(
            criterion_id="ofs-holding-period",
            group="offer_reconciliation",
            label="Offer-for-sale shares meet the holding-period requirement",
            state=(
                _state_from_ternary(offer.get("offerForSaleSharesHeldForRequiredPeriod") or "")
                if dm.is_positive(total_ofs_shares)
                else "not_applicable"
            ),
            reason=(
                "No shares are currently marked for sale."
                if not dm.is_positive(total_ofs_shares)
                else (
                    "Whether the offered shares meet the holding-period requirement has not "
                    "been answered."
                    if not (offer.get("offerForSaleSharesHeldForRequiredPeriod") or "")
                    else "Issuer response recorded for the offer-for-sale holding-period requirement."
                )
            ),
        )
    )

    any_convertibles = outstanding_section.get("anyOutstandingConvertibleInstruments") or ""
    criteria.append(
        _criterion(
            criterion_id="outstanding-convertibles",
            group="offer_reconciliation",
            label="Outstanding convertible instruments before filing",
            state=(
                "not_applicable"
                if any_convertibles == "no"
                else (
                    "missing_information"
                    if any_convertibles == ""
                    else (
                        "potential_inconsistency"
                        if model["outstanding"]["instrumentsSurvivingFiling"] > 0
                        else (
                            "missing_information"
                            if model["outstanding"]["instrumentsWithUnknownSettlement"] > 0
                            else "reconciled"
                        )
                    )
                )
            ),
            reason=(
                "No outstanding convertible instruments are reported."
                if any_convertibles == "no"
                else (
                    "Existence of outstanding convertible instruments has not been answered."
                    if any_convertibles == ""
                    else (
                        f"{model['outstanding']['instrumentsSurvivingFiling']} instrument(s) are "
                        "expected to remain outstanding at filing, which affects the offer structure."
                        if model["outstanding"]["instrumentsSurvivingFiling"] > 0
                        else (
                            f"{model['outstanding']['instrumentsWithUnknownSettlement']} "
                            "instrument(s) do not state whether they convert or lapse before filing."
                            if model["outstanding"]["instrumentsWithUnknownSettlement"] > 0
                            else "All recorded instruments are expected to convert or lapse before filing."
                        )
                    )
                )
            ),
        )
    )

    demat_before_filing = outstanding_section.get("allSharesDematerialisedBeforeFiling") or ""
    criteria.append(
        _criterion(
            criterion_id="dematerialisation-before-filing",
            group="offer_reconciliation",
            label="Shares dematerialised before filing",
            state=_state_from_ternary(demat_before_filing),
            reason=(
                "Dematerialisation of all shares before filing has not been answered."
                if demat_before_filing == ""
                else (
                    "Not all shares are expected to be dematerialised before filing."
                    if demat_before_filing == "no"
                    else "Issuer expects all shares to be dematerialised before filing."
                )
            ),
        )
    )

    # -------------------- Promoter contribution & lock-in ------------------- #

    if model["lockIn"]["lotsMissingEligibilityAnswer"] > 0:
        criteria.append(
            _criterion(
                criterion_id="contribution-lot-eligibility",
                group="promoter_lock_in_readiness",
                label="Contribution lots have an eligibility answer",
                state="missing_information",
                reason=(
                    f"{model['lockIn']['lotsMissingEligibilityAnswer']} contribution lot(s) are "
                    "unanswered or marked not sure for minimum-contribution eligibility."
                ),
            )
        )

    contribution_timing = lock_in_section.get("contributionBroughtInBeforeIssueOpening") or ""
    criteria.append(
        _criterion(
            criterion_id="contribution-timing",
            group="promoter_lock_in_readiness",
            label="Contribution brought in before issue opening",
            state=(
                "not_applicable"
                if lock_in_section.get("minimumPromoterContributionApplicable") == "no"
                else _state_from_ternary(contribution_timing)
            ),
            reason=(
                "Minimum promoter contribution is reported as not applicable."
                if lock_in_section.get("minimumPromoterContributionApplicable") == "no"
                else (
                    "Whether the contribution will be brought in before issue opening has not "
                    "been answered."
                    if contribution_timing == ""
                    else "Issuer response recorded for the timing of promoter contribution."
                )
            ),
        )
    )

    demat_lock_in = lock_in_section.get("lockInSharesToBeHeldInDematerialisedForm") or ""
    criteria.append(
        _criterion(
            criterion_id="lock-in-demat",
            group="promoter_lock_in_readiness",
            label="Lock-in shares will be held in dematerialised form",
            state=(
                "potential_inconsistency"
                if model["lockIn"]["lotsNotDematerialised"] > 0
                else _state_from_ternary(demat_lock_in)
            ),
            reason=(
                f"{model['lockIn']['lotsNotDematerialised']} contribution lot(s) are recorded as "
                "not dematerialised."
                if model["lockIn"]["lotsNotDematerialised"] > 0
                else (
                    "Dematerialisation of lock-in shares has not been answered."
                    if demat_lock_in == ""
                    else "Issuer expects lock-in shares to be held in dematerialised form."
                )
            ),
        )
    )

    criteria.append(
        _criterion(
            criterion_id="lock-in-professional-confirmation",
            group="promoter_lock_in_readiness",
            label="Lock-in compliance professionally confirmed",
            state=(
                "reconciled"
                if lock_in_section.get("lockInComplianceProfessionallyConfirmed") == "yes"
                else "pending_professional_confirmation"
            ),
            reason=(
                "Lock-in compliance is confirmed by a professional adviser."
                if lock_in_section.get("lockInComplianceProfessionallyConfirmed") == "yes"
                else "Lock-in composition and periods still require professional confirmation."
            ),
        )
    )

    entire_lock_in_understood = lock_in_section.get("entirePreIssueCapitalLockInUnderstood") or ""
    criteria.append(
        _criterion(
            criterion_id="entire-pre-issue-lock-in",
            group="promoter_lock_in_readiness",
            label="Lock-in of the remaining pre-issue capital is understood",
            state=_state_from_ternary(entire_lock_in_understood, no_state="missing_information"),
            reason=(
                "Understanding of lock-in on the remaining pre-issue capital has not been "
                "answered."
                if entire_lock_in_understood == ""
                else "Issuer response recorded for lock-in of the remaining pre-issue capital."
            ),
        )
    )

    # ---------------------------- Aggregation -------------------------------- #

    counts = _empty_counts()
    for criterion in criteria:
        counts[criterion["state"]] += 1

    groups: list[dict[str, Any]] = []
    for group in ASSESSMENT_GROUPS:
        group_criteria = [item for item in criteria if item["group"] == group]
        group_counts = _empty_counts()
        for item in group_criteria:
            group_counts[item["state"]] += 1
        groups.append(
            {
                "group": group,
                "label": ASSESSMENT_GROUP_LABELS[group],
                "criteria": group_criteria,
                "counts": group_counts,
                "headlineState": _headline_state_for(group_counts),
            }
        )

    # Insufficient information wins while the workspace is still mostly blank so a single
    # answered "no" cannot dominate the headline before enough sections exist to judge.
    result = "appears_reconciled"
    if counts["missing_information"] >= 6 or progress["sectionsComplete"] < 2:
        result = "insufficient_information"
    elif counts["potential_inconsistency"] > 0:
        result = "inconsistencies_identified"
    elif counts["pending_professional_confirmation"] > 0:
        result = "professional_confirmation_required"
    elif counts["pending_linked_workstream"] > 0:
        result = "pending_linked_workstream"
    elif counts["missing_information"] > 0:
        result = "insufficient_information"

    return {
        "result": result,
        "resultLabel": _label_for_result(result),
        "summary": _summary_for_result(result),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "currentEquityShares": model["totals"]["currentEquityShares"],
            "paidUpEquityCapital": model["totals"]["paidUpEquityCapitalFromClasses"],
            "postIssueEquityShares": model["prePost"]["postIssueShares"],
            "promoterPreIssuePercentage": model["dilution"]["promoterPreIssuePercentage"],
            "promoterPostIssuePercentage": model["dilution"]["promoterPostIssuePercentage"],
            "promoterDilutionPercentagePoints": model["dilution"]["promoterDilutionPercentagePoints"],
            "totalSharesOfferedForSale": model["prePost"]["totalSharesOfferedForSale"],
            "minimumContributionRequiredShares": model["lockIn"]["requiredContributionShares"],
            "eligibleContributionShares": model["lockIn"]["eligibleShares"],
            "contributionShortfallShares": model["lockIn"]["shortfallShares"],
            "potentialDilutionFromConvertibles": model["outstanding"]["potentialDilutionPercentage"],
            "unreconciledChecks": sum(
                1 for check in model["reconciliation"] if check["status"] == "variance"
            ),
            "unansweredConfirmations": unanswered_confirmations,
            "sectionsComplete": progress["sectionsComplete"],
        },
    }
