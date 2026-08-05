"""Authoritative preliminary eligibility assessment — mirrors I1 rules with Decimal math."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.modules.ipo_setup_eligibility.constants import (
    DECLARATION_FIELDS,
    OPERATING_PROFIT_THRESHOLD,
)
from app.modules.ipo_setup_eligibility.offer_compute import (
    _dec_to_json,
    _to_decimal,
    compute_offer_from_payload,
)
from app.modules.ipo_setup_eligibility.progress import calculate_progress


RESULT_LABELS = {
    "insufficient_information": "Insufficient information",
    "preliminary_criteria_appear_satisfied": "Preliminary criteria appear satisfied",
    "eligibility_concerns_identified": "Eligibility concerns identified",
    "professional_assessment_required": "Professional assessment required",
}


def _criterion(
    *,
    key: str,
    group: str,
    label: str,
    state: str,
    explanation: str,
    values_used: dict[str, Any] | None = None,
    missing_fields: list[str] | None = None,
    related_section: str | None = None,
) -> dict[str, Any]:
    return {
        "key": key,
        "label": label,
        "group": group,
        "result": state,
        "explanation": explanation,
        "valuesUsed": values_used or {},
        "missingFields": missing_fields or [],
        "relatedSection": related_section,
        "deepLink": (
            f"/projects/demo/workstreams/ipo-setup-eligibility"
            f"?tab=information&section={related_section}"
            if related_section
            else "/projects/demo/workstreams/ipo-setup-eligibility?tab=eligibility-assessment"
        ),
    }


def assess_ipo_eligibility(payload: dict[str, Any]) -> dict[str, Any]:
    offer = compute_offer_from_payload(payload)
    decimals = offer.get("_decimals") or {}
    progress = calculate_progress(payload)
    track = payload.get("trackRecordAndFinancialEligibility") or {}
    direction = payload.get("ipoDirection") or {}
    declarations = payload.get("eligibilityDeclarations") or {}
    process = payload.get("processReadiness") or {}
    years = track.get("financialYears") or []

    threshold = Decimal(OPERATING_PROFIT_THRESHOLD)
    years_meeting_op = 0
    years_positive_fcfe = 0
    net_worth_values: list[Decimal] = []
    for row in years:
        if not isinstance(row, dict):
            continue
        op = _to_decimal(row.get("operatingProfitFromOperations"))
        if op is not None and op >= threshold:
            years_meeting_op += 1
        fcfe = _to_decimal(row.get("freeCashFlowToEquity"))
        if fcfe is not None and fcfe > 0:
            years_positive_fcfe += 1
        nw = _to_decimal(row.get("netWorth"))
        if nw is not None:
            net_worth_values.append(nw)

    positive_net_worth: bool | None
    if not net_worth_values:
        positive_net_worth = None
    else:
        positive_net_worth = any(value > 0 for value in net_worth_values)

    basis = track.get("operatingTrackRecordBasis") or ""
    if basis == "":
        three_year: bool | None = None
    elif basis == "not-yet-established":
        three_year = False
    else:
        three_year = track.get("threeCompleteFinancialYearsAvailable") == "yes"

    unresolved_adverse = sum(
        1 for key, _ in DECLARATION_FIELDS if declarations.get(key) == "yes"
    )
    unanswered_declarations = sum(
        1 for key, _ in DECLARATION_FIELDS if not (declarations.get(key) or "").strip()
    )
    not_sure_declarations = sum(
        1 for key, _ in DECLARATION_FIELDS if declarations.get(key) == "not-sure"
    )

    criteria: list[dict[str, Any]] = []

    conversion = direction.get("publicCompanyConversionStatus") or ""
    if not conversion:
        criteria.append(
            _criterion(
                key="public-company-status",
                group="issuer_eligibility",
                label="Public-company conversion status",
                state="missing_information",
                explanation="Conversion status has not been provided.",
                missing_fields=["publicCompanyConversionStatus"],
                related_section="ipo-direction",
            )
        )
    elif conversion == "completed":
        criteria.append(
            _criterion(
                key="public-company-status",
                group="issuer_eligibility",
                label="Public-company conversion status",
                state="appears_satisfied",
                explanation="Issuer reports conversion as completed.",
                values_used={"publicCompanyConversionStatus": conversion},
                related_section="ipo-direction",
            )
        )
    elif conversion == "professional-confirmation-required":
        criteria.append(
            _criterion(
                key="public-company-status",
                group="issuer_eligibility",
                label="Public-company conversion status",
                state="professional_confirmation_required",
                explanation="Conversion status requires professional confirmation.",
                values_used={"publicCompanyConversionStatus": conversion},
                related_section="ipo-direction",
            )
        )
    elif direction.get("referencedCompanyClass") == "public":
        criteria.append(
            _criterion(
                key="public-company-status",
                group="issuer_eligibility",
                label="Public-company conversion status",
                state="appears_satisfied",
                explanation="Company & Incorporation currently records company class as public.",
                values_used={
                    "referencedCompanyClass": direction.get("referencedCompanyClass"),
                    "publicCompanyConversionStatus": conversion,
                },
                related_section="ipo-direction",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="public-company-status",
                group="issuer_eligibility",
                label="Public-company conversion status",
                state="pending_linked_workstream",
                explanation=(
                    f"Conversion is {conversion.replace('-', ' ')}. "
                    "Company class remains governed by Company & Incorporation."
                ),
                values_used={"publicCompanyConversionStatus": conversion},
                related_section="ipo-direction",
            )
        )

    platform = direction.get("targetSmePlatform") or ""
    if not platform or platform == "undecided":
        criteria.append(
            _criterion(
                key="target-platform",
                group="issuer_eligibility",
                label="Target SME platform",
                state="missing_information",
                explanation="Target platform is undecided or not provided.",
                missing_fields=["targetSmePlatform"],
                related_section="ipo-direction",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="target-platform",
                group="issuer_eligibility",
                label="Target SME platform",
                state="appears_satisfied",
                explanation=f"Target platform recorded as {platform}.",
                values_used={"targetSmePlatform": platform},
                related_section="ipo-direction",
            )
        )

    if basis == "":
        criteria.append(
            _criterion(
                key="track-record",
                group="financial_eligibility",
                label="Three-year operating track record",
                state="missing_information",
                explanation="Track-record basis has not been selected.",
                missing_fields=["operatingTrackRecordBasis"],
                related_section="track-record-financial",
            )
        )
    elif three_year is False:
        criteria.append(
            _criterion(
                key="track-record",
                group="financial_eligibility",
                label="Three-year operating track record",
                state="potential_concern",
                explanation=(
                    "Track record is not yet established or three complete years are not available."
                ),
                values_used={
                    "operatingTrackRecordBasis": basis,
                    "threeCompleteFinancialYearsAvailable": track.get(
                        "threeCompleteFinancialYearsAvailable"
                    ),
                },
                related_section="track-record-financial",
            )
        )
    elif track.get("threeCompleteFinancialYearsAvailable") == "not-sure":
        criteria.append(
            _criterion(
                key="track-record",
                group="financial_eligibility",
                label="Three-year operating track record",
                state="professional_confirmation_required",
                explanation="Availability of three complete financial years is marked not sure.",
                related_section="track-record-financial",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="track-record",
                group="financial_eligibility",
                label="Three-year operating track record",
                state="appears_satisfied",
                explanation=(
                    "Issuer indicates three complete financial years are available on the selected basis."
                ),
                related_section="track-record-financial",
            )
        )

    all_op_null = all(
        not isinstance(row, dict) or row.get("operatingProfitFromOperations") is None
        for row in years
    )
    if years_meeting_op == 0 and all_op_null:
        criteria.append(
            _criterion(
                key="operating-profit",
                group="financial_eligibility",
                label="Operating profit threshold years",
                state="missing_information",
                explanation="Operating profit figures have not been entered for the three-year grid.",
                missing_fields=["financialYears.operatingProfitFromOperations"],
                related_section="track-record-financial",
            )
        )
    elif years_meeting_op >= 2:
        criteria.append(
            _criterion(
                key="operating-profit",
                group="financial_eligibility",
                label="Operating profit threshold years",
                state="appears_satisfied",
                explanation=(
                    f"{years_meeting_op} year(s) meet the indicative ₹1 crore operating-profit screen."
                ),
                values_used={"yearsMeetingOperatingProfitThreshold": years_meeting_op},
                related_section="track-record-financial",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="operating-profit",
                group="financial_eligibility",
                label="Operating profit threshold years",
                state="potential_concern",
                explanation=(
                    f"Only {years_meeting_op} year(s) meet the indicative ₹1 crore operating-profit screen."
                ),
                values_used={"yearsMeetingOperatingProfitThreshold": years_meeting_op},
                related_section="track-record-financial",
            )
        )

    if positive_net_worth is None:
        criteria.append(
            _criterion(
                key="net-worth",
                group="financial_eligibility",
                label="Positive net worth",
                state="missing_information",
                explanation="Net worth figures are not yet available in the financial grid.",
                missing_fields=["financialYears.netWorth"],
                related_section="track-record-financial",
            )
        )
    elif positive_net_worth:
        criteria.append(
            _criterion(
                key="net-worth",
                group="financial_eligibility",
                label="Positive net worth",
                state="appears_satisfied",
                explanation="At least one year shows positive net worth.",
                related_section="track-record-financial",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="net-worth",
                group="financial_eligibility",
                label="Positive net worth",
                state="potential_concern",
                explanation="Entered net worth figures are not positive.",
                related_section="track-record-financial",
            )
        )

    all_fcfe_null = all(
        not isinstance(row, dict) or row.get("freeCashFlowToEquity") is None for row in years
    )
    if years_positive_fcfe == 0 and all_fcfe_null:
        fcfe_state = "missing_information"
        fcfe_reason = "FCFE figures have not been entered."
    elif years_positive_fcfe > 0:
        fcfe_state = "appears_satisfied"
        fcfe_reason = f"{years_positive_fcfe} year(s) show positive FCFE."
    else:
        fcfe_state = "potential_concern"
        fcfe_reason = f"{years_positive_fcfe} year(s) show positive FCFE."
    criteria.append(
        _criterion(
            key="fcfe",
            group="financial_eligibility",
            label="Positive free cash flow to equity",
            state=fcfe_state,
            explanation=fcfe_reason,
            values_used={"yearsWithPositiveFcfe": years_positive_fcfe},
            related_section="track-record-financial",
        )
    )

    if any(
        isinstance(row, dict) and row.get("sourceType") == "management-estimate" for row in years
    ):
        criteria.append(
            _criterion(
                key="management-estimates",
                group="financial_eligibility",
                label="Management estimates",
                state="pending_supporting_document",
                explanation=(
                    "One or more years rely on management estimates pending "
                    "documentary/professional confirmation."
                ),
                related_section="track-record-financial",
            )
        )

    auditor = track.get("auditorHasConfirmedEligibilityFigures") or ""
    if auditor == "yes":
        criteria.append(
            _criterion(
                key="auditor-confirmation",
                group="financial_eligibility",
                label="Auditor confirmation of eligibility figures",
                state="appears_satisfied",
                explanation="Issuer indicates the auditor has confirmed eligibility figures.",
                related_section="track-record-financial",
            )
        )
    elif auditor == "no":
        criteria.append(
            _criterion(
                key="auditor-confirmation",
                group="financial_eligibility",
                label="Auditor confirmation of eligibility figures",
                state="pending_supporting_document",
                explanation="Auditor confirmation of eligibility figures is not yet obtained.",
                related_section="track-record-financial",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="auditor-confirmation",
                group="financial_eligibility",
                label="Auditor confirmation of eligibility figures",
                state="missing_information",
                explanation="Auditor confirmation status is unanswered (not treated as No).",
                missing_fields=["auditorHasConfirmedEligibilityFigures"],
                related_section="track-record-financial",
            )
        )

    post_paid_up = decimals.get("proposedPostIssuePaidUpCapital")
    if post_paid_up is None:
        criteria.append(
            _criterion(
                key="post-issue-capital",
                group="offer_eligibility",
                label="Proposed post-issue paid-up capital",
                state="missing_information",
                explanation="Existing paid-up capital and/or fresh-issue inputs are incomplete.",
                missing_fields=[
                    "existingPaidUpEquityShareCapital",
                    "proposedFreshIssueShares",
                    "faceValuePerEquityShare",
                ],
                related_section="offer-structure",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="post-issue-capital",
                group="offer_eligibility",
                label="Proposed post-issue paid-up capital",
                state="appears_satisfied",
                explanation="Post-issue paid-up capital can be derived from current inputs.",
                values_used={
                    "proposedPostIssuePaidUpCapital": _dec_to_json(post_paid_up),
                },
                related_section="offer-structure",
            )
        )

    ofs_pct = decimals.get("ofsPercentageOfOffer")
    offer_type = direction.get("proposedOfferType") or ""
    if offer_type in {"", "undecided"}:
        criteria.append(
            _criterion(
                key="ofs-share",
                group="offer_eligibility",
                label="OFS share of total offer",
                state="missing_information",
                explanation="Proposed offer type is not determined.",
                missing_fields=["proposedOfferType"],
                related_section="ipo-direction",
            )
        )
    elif offer_type == "fresh-issue":
        criteria.append(
            _criterion(
                key="ofs-share",
                group="offer_eligibility",
                label="OFS share of total offer",
                state="not_applicable",
                explanation="Offer is fresh issue only; OFS percentage is not applicable.",
                related_section="offer-structure",
            )
        )
    elif ofs_pct is None:
        criteria.append(
            _criterion(
                key="ofs-share",
                group="offer_eligibility",
                label="OFS share of total offer",
                state="missing_information",
                explanation="OFS share inputs are incomplete.",
                related_section="offer-structure",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="ofs-share",
                group="offer_eligibility",
                label="OFS share of total offer",
                state="appears_satisfied",
                explanation=f"OFS is {_dec_to_json(ofs_pct)}% of total shares offered.",
                values_used={"ofsPercentageOfOffer": _dec_to_json(ofs_pct)},
                related_section="offer-structure",
            )
        )

    if unanswered_declarations > 0:
        criteria.append(
            _criterion(
                key="declarations-completeness",
                group="legal_disqualification",
                label="Eligibility declarations completeness",
                state="missing_information",
                explanation=(
                    f"{unanswered_declarations} declaration(s) remain unanswered. "
                    "Unanswered is not treated as No."
                ),
                related_section="eligibility-declarations",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="declarations-completeness",
                group="legal_disqualification",
                label="Eligibility declarations completeness",
                state="appears_satisfied",
                explanation="All eligibility declarations have an explicit yes / no / not-sure response.",
                related_section="eligibility-declarations",
            )
        )

    if unresolved_adverse > 0:
        criteria.append(
            _criterion(
                key="adverse-declarations",
                group="legal_disqualification",
                label="Unresolved adverse declarations",
                state="potential_concern",
                explanation=(
                    f"{unresolved_adverse} declaration(s) answered Yes. "
                    "Materiality is not decided automatically — professional review is required."
                ),
                values_used={"unresolvedAdverseDeclarations": unresolved_adverse},
                related_section="eligibility-declarations",
            )
        )
    elif unanswered_declarations == 0:
        criteria.append(
            _criterion(
                key="adverse-declarations",
                group="legal_disqualification",
                label="Unresolved adverse declarations",
                state="appears_satisfied",
                explanation="No declaration is currently answered Yes.",
                related_section="eligibility-declarations",
            )
        )

    if not_sure_declarations > 0:
        criteria.append(
            _criterion(
                key="not-sure-declarations",
                group="legal_disqualification",
                label="Declarations marked not sure",
                state="professional_confirmation_required",
                explanation=(
                    f"{not_sure_declarations} declaration(s) are marked not sure "
                    "and need professional follow-up."
                ),
                related_section="eligibility-declarations",
            )
        )

    lm = process.get("leadManagerAppointmentStatus") or ""
    if not lm or lm == "not-started":
        criteria.append(
            _criterion(
                key="lead-manager",
                group="process_readiness",
                label="Lead manager appointment",
                state="missing_information",
                explanation="Lead manager appointment has not progressed.",
                missing_fields=["leadManagerAppointmentStatus"],
                related_section="process-readiness",
            )
        )
    elif lm == "appointed":
        criteria.append(
            _criterion(
                key="lead-manager",
                group="process_readiness",
                label="Lead manager appointment",
                state="appears_satisfied",
                explanation="Lead manager is marked appointed.",
                related_section="process-readiness",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="lead-manager",
                group="process_readiness",
                label="Lead manager appointment",
                state="pending_supporting_document",
                explanation=f"Lead manager status: {lm.replace('-', ' ')}.",
                related_section="process-readiness",
            )
        )

    if progress["sections"].get("issuer-confirmations") != "complete":
        criteria.append(
            _criterion(
                key="issuer-confirmations",
                group="process_readiness",
                label="Issuer confirmations",
                state="missing_information",
                explanation=(
                    "Not all issuer confirmations are checked. "
                    "Incomplete confirmations keep the assessment preliminary."
                ),
                related_section="issuer-confirmations",
            )
        )
    else:
        criteria.append(
            _criterion(
                key="issuer-confirmations",
                group="process_readiness",
                label="Issuer confirmations",
                state="appears_satisfied",
                explanation="All issuer confirmations are acknowledged.",
                related_section="issuer-confirmations",
            )
        )

    states = [item["result"] for item in criteria]
    has_concern = "potential_concern" in states
    has_professional = "professional_confirmation_required" in states
    missing_count = sum(
        1
        for state in states
        if state
        in {
            "missing_information",
            "pending_supporting_document",
            "pending_linked_workstream",
        }
    )

    if has_concern:
        result = "eligibility_concerns_identified"
    elif has_professional:
        result = "professional_assessment_required"
    elif missing_count >= 3 or progress["sectionsComplete"] < 2:
        result = "insufficient_information"
    else:
        result = "preliminary_criteria_appear_satisfied"

    summaries = {
        "insufficient_information": (
            "Too many required inputs remain unanswered for a meaningful preliminary view."
        ),
        "eligibility_concerns_identified": (
            "One or more potential concerns were identified. This is not a final eligibility decision."
        ),
        "professional_assessment_required": (
            "Inputs require professional or exchange confirmation before reliance."
        ),
        "preliminary_criteria_appear_satisfied": (
            "Based on currently entered values, preliminary criteria appear satisfied. "
            "Professional confirmation remains required."
        ),
    }

    groups = {
        "issuer_eligibility": [],
        "financial_eligibility": [],
        "offer_eligibility": [],
        "legal_disqualification": [],
        "process_readiness": [],
    }
    for item in criteria:
        groups.setdefault(item["group"], []).append(item)

    return {
        "result": result,
        "resultLabel": RESULT_LABELS[result],
        "summary": summaries[result],
        "criteria": criteria,
        "groupedCriteria": groups,
        "metrics": {
            "proposedPostIssuePaidUpCapital": _dec_to_json(
                decimals.get("proposedPostIssuePaidUpCapital")
            ),
            "ofsPercentageOfOffer": _dec_to_json(decimals.get("ofsPercentageOfOffer")),
            "yearsMeetingOperatingProfitThreshold": years_meeting_op,
            "positiveNetWorthAvailable": positive_net_worth,
            "yearsWithPositiveFcfe": years_positive_fcfe,
            "threeYearTrackRecordEstablished": three_year,
            "publicCompanyConversionStatus": conversion or "not provided",
            "unresolvedAdverseDeclarations": unresolved_adverse,
        },
        "offerComputations": {
            key: value
            for key, value in offer.items()
            if key != "_decimals"
        },
    }
