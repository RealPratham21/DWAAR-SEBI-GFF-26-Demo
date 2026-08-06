"""Derived Capital & Ownership computations — ports `frontend/lib/capital-ownership/compute.ts`.

Nothing in this file is persisted. Every result is recomputed from the payload plus the
read-only IPO Setup reference, using Decimal-safe string arithmetic (`decimal_math`).

Two rules are enforced structurally rather than by convention:
- An offer for sale NEVER increases share capital. Only a fresh issue (plus pre-issue
  placements, conversions and ESOP allotments recorded as such) changes the post-issue total.
- A selling shareholder can never offer more shares than they hold; the excess is reported
  as an issue instead of being silently clamped.
"""

from __future__ import annotations

from typing import Any

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.constants import DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE

INCREASING_EVENTS = frozenset(
    {
        "incorporation-initial-subscription",
        "further-allotment-cash",
        "rights-issue",
        "bonus-issue",
        "preferential-allotment",
        "private-placement",
        "esop-allotment",
        "sweat-equity-allotment",
        "conversion-of-securities",
        "conversion-of-loan",
        "scheme-of-arrangement",
    }
)
DECREASING_EVENTS = frozenset(
    {
        "buyback",
        "capital-reduction",
        "forfeiture-of-shares",
        "redemption-of-preference-shares",
        "cancellation-of-shares",
    }
)
RATIO_EVENTS = frozenset({"share-split-subdivision", "share-consolidation"})
NON_CAPITAL_EVENTS = frozenset({"increase-in-authorised-capital"})


def _ceil_shares(value: str) -> str:
    """Round up to a whole share."""
    if not dm.is_filled(value):
        return ""
    rounded = dm.round_decimal(value, 0)
    return dm.add(rounded, "1") if dm.compare(rounded, value) == -1 else rounded


def ipo_setup_reference_from_payload(payload: dict[str, Any] | None) -> dict[str, Any]:
    """Build the read-only IPO Setup mirror from that workstream's payload.

    IPO Setup fields may be persisted as JSON numbers (I1); every value here is converted
    to a Decimal-safe string.
    """
    if not payload:
        return {
            "available": False,
            "proposedOfferType": "",
            "faceValuePerEquityShare": "",
            "existingIssuedEquityShares": "",
            "existingPaidUpEquityShareCapital": "",
            "proposedIssuePrice": "",
            "proposedFreshIssueShares": "",
            "proposedFreshIssueAmount": "",
            "proposedOfsShares": "",
            "proposedOfsAmount": "",
        }
    direction = payload.get("ipoDirection") or {}
    offer = payload.get("offerStructure") or {}
    return {
        "available": True,
        "proposedOfferType": direction.get("proposedOfferType") or "",
        "faceValuePerEquityShare": dm.to_decimal_string(offer.get("faceValuePerEquityShare")),
        "existingIssuedEquityShares": dm.to_decimal_string(offer.get("existingIssuedEquityShares")),
        "existingPaidUpEquityShareCapital": dm.to_decimal_string(
            offer.get("existingPaidUpEquityShareCapital")
        ),
        "proposedIssuePrice": dm.to_decimal_string(offer.get("proposedIssuePrice")),
        "proposedFreshIssueShares": dm.to_decimal_string(offer.get("proposedFreshIssueShares")),
        "proposedFreshIssueAmount": dm.to_decimal_string(offer.get("proposedFreshIssueAmount")),
        "proposedOfsShares": dm.to_decimal_string(offer.get("proposedOfsShares")),
        "proposedOfsAmount": dm.to_decimal_string(offer.get("proposedOfsAmount")),
    }


def offer_type_flags(offer_type: str) -> tuple[bool, bool]:
    includes_fresh = offer_type in {"fresh-issue", "fresh-and-ofs"}
    includes_ofs = offer_type in {"offer-for-sale", "fresh-and-ofs"}
    return includes_fresh, includes_ofs


# -------------------------------------------------------------------------- #
# 1. Current capital totals                                                  #
# -------------------------------------------------------------------------- #


def compute_current_capital_totals(structure: dict[str, Any]) -> dict[str, Any]:
    equity = structure.get("equityClasses") or []
    preference = structure.get("preferenceClasses") or []

    authorised_equity_shares = dm.sum_decimals([item.get("authorisedShares") for item in equity])
    issued_equity_shares = dm.sum_decimals([item.get("issuedShares") for item in equity])
    subscribed_equity_shares = dm.sum_decimals([item.get("subscribedShares") for item in equity])
    paid_up_equity_shares = dm.sum_decimals([item.get("paidUpShares") for item in equity])
    partly_paid_equity_shares = dm.sum_decimals([item.get("partlyPaidShares") for item in equity])
    forfeited_equity_shares = dm.sum_decimals([item.get("sharesForfeited") for item in equity])
    dematerialised_equity_shares = dm.sum_decimals(
        [item.get("sharesInDematerialisedForm") for item in equity]
    )

    authorised_equity_capital_from_classes = dm.sum_decimals(
        [dm.mul(item.get("authorisedShares"), item.get("faceValuePerShare")) for item in equity]
    )
    paid_up_equity_capital_from_classes = dm.sum_decimals(
        [dm.mul(item.get("paidUpShares"), item.get("faceValuePerShare")) for item in equity]
    )
    total_voting_rights = dm.sum_decimals(
        [dm.mul(item.get("paidUpShares"), item.get("votingRightsPerShare")) for item in equity]
    )

    authorised_preference_shares = dm.sum_decimals(
        [item.get("authorisedShares") for item in preference]
    )
    issued_preference_shares = dm.sum_decimals([item.get("issuedShares") for item in preference])
    paid_up_preference_shares = dm.sum_decimals([item.get("paidUpShares") for item in preference])
    authorised_preference_capital_from_classes = dm.sum_decimals(
        [dm.mul(item.get("authorisedShares"), item.get("faceValuePerShare")) for item in preference]
    )
    paid_up_preference_capital_from_classes = dm.sum_decimals(
        [dm.mul(item.get("paidUpShares"), item.get("faceValuePerShare")) for item in preference]
    )
    potential_equity_from_preference_conversion = dm.sum_decimals(
        [item.get("potentialEquitySharesOnConversion") for item in preference]
    )

    total_authorised_capital_from_classes = dm.sum_decimals(
        [authorised_equity_capital_from_classes, authorised_preference_capital_from_classes]
    )
    total_paid_up_capital_from_classes = dm.sum_decimals(
        [paid_up_equity_capital_from_classes, paid_up_preference_capital_from_classes]
    )

    current_equity_shares = dm.first_filled(
        paid_up_equity_shares, subscribed_equity_shares, issued_equity_shares
    )

    implied_equity_face_value = (
        dm.div(paid_up_equity_capital_from_classes, paid_up_equity_shares, 6)
        if dm.is_filled(paid_up_equity_capital_from_classes) and dm.is_positive(paid_up_equity_shares)
        else dm.first_filled(*[item.get("faceValuePerShare") for item in equity])
    )

    dematerialised_percentage = (
        dm.pct(dematerialised_equity_shares, current_equity_shares, 4)
        if dm.is_positive(current_equity_shares)
        else ""
    )

    declared_authorised_equity_capital = dm.to_decimal_string(
        structure.get("authorisedEquityShareCapital")
    )
    declared_issued_equity_capital = dm.to_decimal_string(structure.get("issuedEquityShareCapital"))
    declared_paid_up_equity_capital = dm.to_decimal_string(structure.get("paidUpEquityShareCapital"))

    return {
        "authorisedEquityShares": authorised_equity_shares,
        "authorisedEquityCapitalFromClasses": authorised_equity_capital_from_classes,
        "issuedEquityShares": issued_equity_shares,
        "subscribedEquityShares": subscribed_equity_shares,
        "paidUpEquityShares": paid_up_equity_shares,
        "paidUpEquityCapitalFromClasses": paid_up_equity_capital_from_classes,
        "partlyPaidEquityShares": partly_paid_equity_shares,
        "forfeitedEquityShares": forfeited_equity_shares,
        "dematerialisedEquityShares": dematerialised_equity_shares,
        "dematerialisedPercentage": dematerialised_percentage,
        "totalVotingRights": total_voting_rights,
        "authorisedPreferenceShares": authorised_preference_shares,
        "authorisedPreferenceCapitalFromClasses": authorised_preference_capital_from_classes,
        "issuedPreferenceShares": issued_preference_shares,
        "paidUpPreferenceShares": paid_up_preference_shares,
        "paidUpPreferenceCapitalFromClasses": paid_up_preference_capital_from_classes,
        "potentialEquityFromPreferenceConversion": potential_equity_from_preference_conversion,
        "totalAuthorisedCapitalFromClasses": total_authorised_capital_from_classes,
        "totalPaidUpCapitalFromClasses": total_paid_up_capital_from_classes,
        "impliedEquityFaceValue": implied_equity_face_value,
        "currentEquityShares": current_equity_shares,
        "declaredAuthorisedEquityCapital": declared_authorised_equity_capital,
        "declaredIssuedEquityCapital": declared_issued_equity_capital,
        "declaredPaidUpEquityCapital": declared_paid_up_equity_capital,
        "authorisedEquityCapitalVariance": dm.difference(
            declared_authorised_equity_capital, authorised_equity_capital_from_classes
        ),
        "paidUpEquityCapitalVariance": dm.difference(
            declared_paid_up_equity_capital, paid_up_equity_capital_from_classes
        ),
    }


# -------------------------------------------------------------------------- #
# 2. Share capital history                                                   #
# -------------------------------------------------------------------------- #


def capital_event_direction(event_type: str) -> str:
    if event_type == "":
        return "unknown"
    if event_type in INCREASING_EVENTS:
        return "increase"
    if event_type in DECREASING_EVENTS:
        return "decrease"
    if event_type in RATIO_EVENTS:
        return "ratio"
    if event_type in NON_CAPITAL_EVENTS:
        return "none"
    return "unknown"


def sort_capital_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Events sorted oldest-first; blank dates sink to the end but keep their relative order."""
    indexed = list(enumerate(events))

    def sort_key(entry: tuple[int, dict[str, Any]]) -> tuple[str, int]:
        index, event = entry
        return (event.get("eventDate") or "9999-12-31", index)

    indexed.sort(key=sort_key)
    return [event for _, event in indexed]


def _affects_equity(event: dict[str, Any]) -> bool:
    return event.get("securityType") in ("equity", "")


def compute_capital_history_cumulative(events: list[dict[str, Any]]) -> dict[str, Any]:
    ordered = sort_capital_events(events)
    rows: list[dict[str, Any]] = []

    cumulative = "0"
    cumulative_broken = False
    face_value = ""
    events_missing_date = 0
    events_missing_share_count = 0
    events_with_unknown_type = 0

    issued: list[str] = []
    reduced: list[str] = []
    bonus: list[str] = []
    other_than_cash: list[str] = []
    promoter_shares: list[str] = []
    consideration: list[str] = []

    for index, event in enumerate(ordered):
        warnings: list[str] = []
        direction = capital_event_direction(event.get("eventType") or "")
        equity_event = _affects_equity(event)

        if not event.get("eventDate"):
            warnings.append("Event date is missing.")
            events_missing_date += 1
        if direction == "unknown":
            warnings.append("Event type is not selected, so the share movement cannot be applied.")
            events_with_unknown_type += 1

        next_face_value = dm.first_filled(
            event.get("postEventFaceValuePerShare"), event.get("faceValuePerShare"), face_value
        )

        delta = ""
        if direction in ("increase", "decrease"):
            magnitude = dm.to_decimal_string(event.get("numberOfShares"))
            if magnitude == "":
                warnings.append("Number of shares is missing.")
                events_missing_share_count += 1
            else:
                delta = magnitude if direction == "increase" else dm.negate(magnitude)
        elif direction == "ratio":
            from_ratio = dm.to_decimal_string(event.get("splitOrConsolidationRatioFrom"))
            to_ratio = dm.to_decimal_string(event.get("splitOrConsolidationRatioTo"))
            if from_ratio == "" or to_ratio == "" or dm.is_zero(from_ratio):
                warnings.append("Split or consolidation ratio is incomplete.")
            elif not cumulative_broken and dm.is_filled(cumulative):
                resulting = dm.div(dm.mul(cumulative, to_ratio), from_ratio, 0)
                delta = dm.sub(resulting, cumulative)
        elif direction == "none":
            delta = "0"

        if equity_event:
            if delta == "":
                if direction != "unknown" or (event.get("eventType") or "") != "":
                    cumulative_broken = True
            elif not cumulative_broken:
                cumulative = dm.add(cumulative, delta)
            face_value = next_face_value

        cumulative_equity_shares = "" if cumulative_broken or not equity_event else cumulative
        cumulative_paid_up_capital = (
            "" if cumulative_equity_shares == "" else dm.mul(cumulative_equity_shares, face_value)
        )

        if delta != "" and equity_event:
            if dm.is_positive(delta):
                issued.append(delta)
            elif dm.compare(delta, "0") == -1:
                reduced.append(dm.negate(delta))
            if event.get("eventType") == "bonus-issue":
                bonus.append(delta)
            if event.get("considerationType") in ("other-than-cash", "part-cash-part-other"):
                other_than_cash.append(delta)
        if event.get("includesPromoterAllotment") == "yes":
            promoter_shares.append(dm.to_decimal_string(event.get("promoterSharesInEvent")))
        consideration.append(dm.to_decimal_string(event.get("totalConsiderationAmount")))

        rows.append(
            {
                "eventId": event.get("id"),
                "sequence": index + 1,
                "eventDate": event.get("eventDate") or "",
                "eventType": event.get("eventType") or "",
                "securityType": event.get("securityType") or "",
                "direction": direction,
                "sharesDelta": delta,
                "cumulativeEquityShares": cumulative_equity_shares,
                "faceValuePerShare": face_value if equity_event else next_face_value,
                "cumulativePaidUpCapital": cumulative_paid_up_capital,
                "considerationAmount": dm.to_decimal_string(event.get("totalConsiderationAmount")),
                "warnings": warnings,
            }
        )

    closing_equity_shares = "" if cumulative_broken else cumulative

    return {
        "rows": rows,
        "closingEquityShares": closing_equity_shares,
        "closingFaceValuePerShare": face_value,
        "closingPaidUpEquityCapital": (
            "" if closing_equity_shares == "" else dm.mul(closing_equity_shares, face_value)
        ),
        "totalSharesIssued": dm.sum_decimals(issued),
        "totalSharesReduced": dm.sum_decimals(reduced),
        "bonusSharesIssued": dm.sum_decimals(bonus),
        "sharesIssuedForConsiderationOtherThanCash": dm.sum_decimals(other_than_cash),
        "promoterSharesAllotted": dm.sum_decimals(promoter_shares),
        "totalConsiderationReceived": dm.sum_decimals(consideration),
        "eventsMissingDate": events_missing_date,
        "eventsMissingShareCount": events_missing_share_count,
        "eventsWithUnknownType": events_with_unknown_type,
        "cumulativeIsComplete": len(ordered) > 0 and not cumulative_broken,
    }


# -------------------------------------------------------------------------- #
# 3. Cap table                                                               #
# -------------------------------------------------------------------------- #


def _is_promoter_category(category: str) -> bool:
    return category in ("promoter", "promoter-group")


def compute_cap_table(
    shareholders: list[dict[str, Any]],
    reference_total_equity_shares: str | None,
) -> dict[str, Any]:
    reference_total_equity_shares = dm.to_decimal_string(reference_total_equity_shares)

    total_equity_shares_from_register = dm.sum_decimals(
        [item.get("equitySharesHeld") for item in shareholders]
    )
    denominator = dm.first_filled(reference_total_equity_shares, total_equity_shares_from_register)

    rows: list[dict[str, Any]] = []
    for shareholder in shareholders:
        equity_shares = dm.to_decimal_string(shareholder.get("equitySharesHeld"))
        encumbered_shares = dm.to_decimal_string(shareholder.get("sharesEncumbered"))
        rows.append(
            {
                "shareholderId": shareholder.get("id"),
                "name": shareholder.get("name") or "",
                "category": shareholder.get("category") or "",
                "holderType": shareholder.get("holderType") or "",
                "equityShares": equity_shares,
                "preferenceShares": dm.to_decimal_string(shareholder.get("preferenceSharesHeld")),
                "percentageOfEquity": (
                    dm.pct(equity_shares, denominator, 4) if dm.is_positive(denominator) else ""
                ),
                "encumberedShares": encumbered_shares,
                "encumberedPercentageOfHolding": (
                    dm.pct(encumbered_shares, equity_shares, 4) if dm.is_positive(equity_shares) else ""
                ),
                "dematerialisedShares": dm.to_decimal_string(
                    shareholder.get("sharesInDematerialisedForm")
                ),
                "isPromoterOrGroup": (
                    _is_promoter_category(shareholder.get("category") or "")
                    or shareholder.get("isPartOfPromoterGroup") == "yes"
                ),
            }
        )

    def shares_for(predicate) -> str:
        return dm.sum_decimals([row["equityShares"] for row in rows if predicate(row)])

    promoter_shares = shares_for(lambda row: row["category"] == "promoter")
    promoter_group_shares = shares_for(
        lambda row: row["category"] == "promoter-group"
        or (row["category"] != "promoter" and row["isPromoterOrGroup"])
    )
    promoter_and_group_shares = dm.sum_decimals([promoter_shares, promoter_group_shares])
    public_shares = shares_for(lambda row: row["category"] == "public")
    employee_shares = shares_for(lambda row: row["category"] == "employee")
    institutional_shares = shares_for(lambda row: row["category"] == "institutional-investor")
    other_shares = shares_for(
        lambda row: not row["isPromoterOrGroup"]
        and row["category"] not in ("public", "employee", "institutional-investor")
    )

    def percentage_of_total(value: str) -> str:
        return dm.pct(value, denominator, 4) if dm.is_positive(denominator) else ""

    return {
        "rows": rows,
        "totalEquitySharesFromRegister": total_equity_shares_from_register,
        "referenceTotalEquityShares": reference_total_equity_shares,
        "registerVariance": dm.difference(
            reference_total_equity_shares, total_equity_shares_from_register
        ),
        "totalPreferenceShares": dm.sum_decimals([row["preferenceShares"] for row in rows]),
        "totalEncumberedShares": dm.sum_decimals([row["encumberedShares"] for row in rows]),
        "shareholdersWithoutCategory": sum(
            1 for item in shareholders if not (item.get("category") or "")
        ),
        "shareholdersWithoutShareCount": sum(
            1 for item in shareholders if not dm.is_filled(item.get("equitySharesHeld"))
        ),
        "groups": {
            "promoterShares": promoter_shares,
            "promoterPercentage": percentage_of_total(promoter_shares),
            "promoterGroupShares": promoter_group_shares,
            "promoterGroupPercentage": percentage_of_total(promoter_group_shares),
            "promoterAndGroupShares": promoter_and_group_shares,
            "promoterAndGroupPercentage": percentage_of_total(promoter_and_group_shares),
            "publicShares": public_shares,
            "publicPercentage": percentage_of_total(public_shares),
            "employeeShares": employee_shares,
            "institutionalShares": institutional_shares,
            "otherShares": other_shares,
        },
    }


# -------------------------------------------------------------------------- #
# 4. Pre & post issue                                                        #
# -------------------------------------------------------------------------- #


def compute_pre_post_issue(
    shareholders: list[dict[str, Any]],
    ipo_reference: dict[str, Any],
    overlays: list[dict[str, Any]],
    *,
    pre_issue_total_equity_shares: str | None = None,
    additional_pre_issue_shares: str | None = None,
    fresh_issue_shares_override: str | None = None,
) -> dict[str, Any]:
    issues: list[dict[str, Any]] = []
    overlay_by_shareholder: dict[str, dict[str, Any]] = {}
    for overlay in overlays:
        shareholder_id = overlay.get("shareholderId") or ""
        if not shareholder_id:
            issues.append(
                {
                    "id": f"overlay-unlinked-{overlay.get('id')}",
                    "code": "overlay_without_shareholder",
                    "severity": "warning",
                    "message": "An offer-for-sale entry is not linked to a shareholder.",
                }
            )
            continue
        overlay_by_shareholder[shareholder_id] = overlay

    register_pre_issue_shares = dm.first_filled(
        pre_issue_total_equity_shares,
        dm.sum_decimals([item.get("equitySharesHeld") for item in shareholders]),
        ipo_reference.get("existingIssuedEquityShares"),
    )
    additional_pre_issue_shares_value = (
        dm.to_decimal_string(additional_pre_issue_shares) or "0"
    )
    adjusted_pre_issue_shares = (
        ""
        if register_pre_issue_shares == ""
        else dm.add(register_pre_issue_shares, additional_pre_issue_shares_value)
    )

    fresh_issue_source_is_override = dm.is_filled(fresh_issue_shares_override)
    fresh_issue_shares = (
        dm.to_decimal_string(fresh_issue_shares_override)
        if fresh_issue_source_is_override
        else dm.to_decimal_string(ipo_reference.get("proposedFreshIssueShares"))
    )

    post_issue_shares = (
        ""
        if adjusted_pre_issue_shares == "" or fresh_issue_shares == ""
        else dm.add(adjusted_pre_issue_shares, fresh_issue_shares)
    )

    rows: list[dict[str, Any]] = []
    for shareholder in shareholders:
        overlay = overlay_by_shareholder.get(shareholder.get("id") or "")
        pre_issue_shares = dm.to_decimal_string(shareholder.get("equitySharesHeld"))
        shares_offered_for_sale = dm.to_decimal_string(
            overlay.get("sharesOfferedForSale") if overlay else None
        )
        other_expected_pre_issue_transfer = dm.to_decimal_string(
            overlay.get("otherExpectedPreIssueTransfer") if overlay else None
        )

        reductions = dm.sum_decimals([shares_offered_for_sale, other_expected_pre_issue_transfer])
        post_issue_shares_for_holder = (
            ""
            if pre_issue_shares == ""
            else dm.sub(pre_issue_shares, reductions if reductions != "" else "0")
        )

        offer_exceeds_holding = (
            dm.is_filled(pre_issue_shares)
            and dm.is_filled(shares_offered_for_sale)
            and dm.greater_than(shares_offered_for_sale, pre_issue_shares)
        )
        if offer_exceeds_holding:
            name = shareholder.get("name") or "A shareholder"
            issues.append(
                {
                    "id": f"ofs-exceeds-{shareholder.get('id')}",
                    "code": "ofs_exceeds_holding",
                    "severity": "error",
                    "message": f"{name} is offering more shares than currently held.",
                }
            )

        if (
            dm.is_filled(pre_issue_shares)
            and dm.is_filled(post_issue_shares_for_holder)
            and dm.compare(post_issue_shares_for_holder, "0") == -1
        ):
            name = shareholder.get("name") or "A shareholder"
            issues.append(
                {
                    "id": f"transfer-exceeds-{shareholder.get('id')}",
                    "code": "transfer_exceeds_holding",
                    "severity": "error",
                    "message": (
                        f"{name} has offer and transfer quantities exceeding the holding."
                    ),
                }
            )

        pre_issue_percentage = (
            dm.pct(pre_issue_shares, adjusted_pre_issue_shares, 4)
            if dm.is_positive(adjusted_pre_issue_shares)
            else ""
        )
        post_issue_percentage = (
            dm.pct(post_issue_shares_for_holder, post_issue_shares, 4)
            if dm.is_positive(post_issue_shares)
            else ""
        )

        is_promoter_or_group = (
            _is_promoter_category(shareholder.get("category") or "")
            or shareholder.get("isPartOfPromoterGroup") == "yes"
        )

        rows.append(
            {
                "shareholderId": shareholder.get("id"),
                "name": shareholder.get("name") or "",
                "category": shareholder.get("category") or "",
                "isPromoterOrGroup": is_promoter_or_group,
                "preIssueShares": pre_issue_shares,
                "preIssuePercentage": pre_issue_percentage,
                "sharesOfferedForSale": shares_offered_for_sale,
                "otherExpectedPreIssueTransfer": other_expected_pre_issue_transfer,
                "postIssueShares": post_issue_shares_for_holder,
                "postIssuePercentage": post_issue_percentage,
                "dilutionPercentagePoints": dm.sub(pre_issue_percentage, post_issue_percentage),
                "offerExceedsHolding": offer_exceeds_holding,
            }
        )

    total_shares_offered_for_sale = dm.sum_decimals([row["sharesOfferedForSale"] for row in rows])
    total_other_expected_transfers = dm.sum_decimals(
        [row["otherExpectedPreIssueTransfer"] for row in rows]
    )

    _, includes_ofs = offer_type_flags(ipo_reference.get("proposedOfferType") or "")
    if (
        ipo_reference.get("available")
        and not includes_ofs
        and dm.is_positive(total_shares_offered_for_sale)
        and ipo_reference.get("proposedOfferType") not in ("", "undecided")
    ):
        issues.append(
            {
                "id": "ofs-without-offer-for-sale",
                "code": "ofs_without_offer_for_sale",
                "severity": "warning",
                "message": (
                    "Shares are marked for sale even though the proposed offer type in "
                    "IPO Setup does not include an offer for sale."
                ),
            }
        )

    if (
        dm.is_filled(ipo_reference.get("proposedOfsShares"))
        and dm.is_filled(total_shares_offered_for_sale)
        and dm.compare(ipo_reference.get("proposedOfsShares"), total_shares_offered_for_sale) != 0
    ):
        issues.append(
            {
                "id": "ofs-total-mismatch",
                "code": "ofs_total_mismatch",
                "severity": "warning",
                "message": (
                    "Total shares marked for sale here do not match the proposed "
                    "offer-for-sale size recorded in IPO Setup."
                ),
            }
        )

    if adjusted_pre_issue_shares == "":
        issues.append(
            {
                "id": "pre-issue-total-unavailable",
                "code": "pre_issue_total_unavailable",
                "severity": "info",
                "message": "Pre-issue share count is not yet available, so percentages cannot be computed.",
            }
        )
    if fresh_issue_shares == "":
        issues.append(
            {
                "id": "fresh-issue-unavailable",
                "code": "fresh_issue_unavailable",
                "severity": "info",
                "message": (
                    "Fresh-issue share count is not yet available, so the post-issue view is indicative."
                ),
            }
        )

    promoter_rows = [row for row in rows if row["isPromoterOrGroup"]]
    public_rows = [row for row in rows if not row["isPromoterOrGroup"]]
    promoter_pre_issue_shares = dm.sum_decimals([row["preIssueShares"] for row in promoter_rows])
    promoter_post_issue_shares = dm.sum_decimals([row["postIssueShares"] for row in promoter_rows])
    public_pre_issue_shares = dm.sum_decimals([row["preIssueShares"] for row in public_rows])
    public_existing_post_issue_shares = dm.sum_decimals(
        [row["postIssueShares"] for row in public_rows]
    )
    public_post_issue_shares = dm.sum_decimals(
        [public_existing_post_issue_shares, fresh_issue_shares, total_shares_offered_for_sale]
    )

    total_offer_size_shares = dm.sum_decimals([fresh_issue_shares, total_shares_offered_for_sale])

    return {
        "rows": rows,
        "registerPreIssueShares": register_pre_issue_shares,
        "additionalPreIssueShares": additional_pre_issue_shares_value,
        "adjustedPreIssueShares": adjusted_pre_issue_shares,
        "freshIssueShares": fresh_issue_shares,
        "freshIssueSourceIsOverride": fresh_issue_source_is_override,
        "totalSharesOfferedForSale": total_shares_offered_for_sale,
        "totalOtherExpectedTransfers": total_other_expected_transfers,
        "postIssueShares": post_issue_shares,
        "capitalIncreaseShares": dm.sum_decimals([fresh_issue_shares, additional_pre_issue_shares_value]),
        "ofsIncreasesCapital": False,
        "totalOfferSizeShares": total_offer_size_shares,
        "offerAsPercentageOfPostIssueCapital": (
            dm.pct(total_offer_size_shares, post_issue_shares, 4)
            if dm.is_positive(post_issue_shares)
            else ""
        ),
        "groups": {
            "promoterPreIssueShares": promoter_pre_issue_shares,
            "promoterPreIssuePercentage": (
                dm.pct(promoter_pre_issue_shares, adjusted_pre_issue_shares, 4)
                if dm.is_positive(adjusted_pre_issue_shares)
                else ""
            ),
            "promoterPostIssueShares": promoter_post_issue_shares,
            "promoterPostIssuePercentage": (
                dm.pct(promoter_post_issue_shares, post_issue_shares, 4)
                if dm.is_positive(post_issue_shares)
                else ""
            ),
            "publicPreIssueShares": public_pre_issue_shares,
            "publicPostIssueShares": public_post_issue_shares,
            "publicPostIssuePercentage": (
                dm.pct(public_post_issue_shares, post_issue_shares, 4)
                if dm.is_positive(post_issue_shares)
                else ""
            ),
        },
        "issues": issues,
    }


# -------------------------------------------------------------------------- #
# 5. Dilution                                                                #
# -------------------------------------------------------------------------- #


def compute_dilution(view: dict[str, Any], face_value_per_share: str) -> dict[str, Any]:
    groups = view["groups"]
    paid_up_capital_increase = dm.mul(view["capitalIncreaseShares"], face_value_per_share)
    return {
        "promoterPreIssuePercentage": groups["promoterPreIssuePercentage"],
        "promoterPostIssuePercentage": groups["promoterPostIssuePercentage"],
        "promoterDilutionPercentagePoints": dm.sub(
            groups["promoterPreIssuePercentage"], groups["promoterPostIssuePercentage"]
        ),
        "publicPostIssuePercentage": groups["publicPostIssuePercentage"],
        "freshIssueDilutionPercentage": (
            dm.pct(view["freshIssueShares"], view["postIssueShares"], 4)
            if dm.is_positive(view["postIssueShares"])
            else ""
        ),
        "offerSizePercentageOfPostIssue": view["offerAsPercentageOfPostIssueCapital"],
        "postIssuePaidUpCapital": dm.mul(view["postIssueShares"], face_value_per_share),
        "paidUpCapitalIncrease": paid_up_capital_increase,
    }


# -------------------------------------------------------------------------- #
# 6. Outstanding instruments                                                 #
# -------------------------------------------------------------------------- #


def compute_outstanding_instruments(
    section: dict[str, Any], post_issue_shares: str
) -> dict[str, Any]:
    instruments = section.get("outstandingInstruments") or []
    total_potential_equity_shares = dm.sum_decimals(
        [item.get("potentialEquitySharesOnConversion") for item in instruments]
    )
    fully_diluted_shares = (
        ""
        if post_issue_shares == ""
        else dm.add(post_issue_shares, total_potential_equity_shares or "0")
    )

    return {
        "instrumentCount": len(instruments),
        "totalPotentialEquityShares": total_potential_equity_shares,
        "potentialDilutionPercentage": (
            dm.pct(total_potential_equity_shares, fully_diluted_shares, 4)
            if dm.is_positive(fully_diluted_shares)
            else ""
        ),
        "fullyDilutedShares": fully_diluted_shares,
        "instrumentsSettlingBeforeFiling": sum(
            1 for item in instruments if item.get("willConvertOrLapseBeforeFiling") == "yes"
        ),
        "instrumentsSurvivingFiling": sum(
            1 for item in instruments if item.get("willConvertOrLapseBeforeFiling") == "no"
        ),
        "instrumentsWithUnknownSettlement": sum(
            1
            for item in instruments
            if item.get("willConvertOrLapseBeforeFiling") in ("", "not_sure", None)
        ),
        "totalConsiderationOnConversion": dm.sum_decimals(
            [
                dm.mul(
                    item.get("potentialEquitySharesOnConversion"),
                    item.get("conversionOrExercisePricePerShare"),
                )
                for item in instruments
            ]
        ),
    }


# -------------------------------------------------------------------------- #
# 7. Promoter contribution & lock-in                                         #
# -------------------------------------------------------------------------- #


def compute_lock_in_readiness(
    section: dict[str, Any], post_issue_equity_shares: str
) -> dict[str, Any]:
    lots = section.get("contributionLots") or []
    applicable_answer = section.get("minimumPromoterContributionApplicable")
    applicable = True if applicable_answer == "yes" else False if applicable_answer == "no" else None

    required_percentage = (
        dm.to_decimal_string(section.get("targetMinimumContributionPercentage"))
        if dm.is_filled(section.get("targetMinimumContributionPercentage"))
        else DEFAULT_MINIMUM_CONTRIBUTION_PERCENTAGE
    )

    required_contribution_shares = (
        _ceil_shares(dm.percentage_of(required_percentage, post_issue_equity_shares, 6))
        if dm.is_positive(post_issue_equity_shares)
        else ""
    )

    earmarked_shares = dm.sum_decimals([lot.get("numberOfShares") for lot in lots])
    eligible_shares = dm.sum_decimals(
        [
            lot.get("numberOfShares")
            for lot in lots
            if lot.get("eligibleForMinimumPromoterContribution") == "yes"
        ]
    )
    ineligible_shares = dm.sum_decimals(
        [
            lot.get("numberOfShares")
            for lot in lots
            if lot.get("eligibleForMinimumPromoterContribution") == "no"
        ]
    )
    unclassified_shares = dm.sum_decimals(
        [
            lot.get("numberOfShares")
            for lot in lots
            if lot.get("eligibleForMinimumPromoterContribution") in ("", "not_sure", None)
        ]
    )

    shortfall_raw = dm.sub(required_contribution_shares, eligible_shares or "0")
    shortfall_shares = (
        "" if shortfall_raw == "" else shortfall_raw if dm.is_positive(shortfall_raw) else "0"
    )
    surplus_shares = (
        ""
        if shortfall_raw == ""
        else dm.negate(shortfall_raw)
        if dm.compare(shortfall_raw, "0") == -1
        else "0"
    )

    encumbrances = section.get("encumbrances") or []
    promoter_encumbered_shares = dm.sum_decimals(
        [
            item.get("numberOfSharesEncumbered")
            for item in encumbrances
            if item.get("holderCategory") in ("promoter", "promoter-group")
        ]
    )
    encumbered_contribution_shares = dm.sum_decimals(
        [
            item.get("numberOfSharesEncumbered")
            for item in encumbrances
            if item.get("affectsPromoterContributionShares") == "yes"
        ]
    )

    meets_requirement = (
        None
        if required_contribution_shares == "" or eligible_shares == ""
        else dm.compare(eligible_shares, required_contribution_shares) != -1
    )

    return {
        "applicable": applicable,
        "requiredPercentage": required_percentage,
        "postIssueEquityShares": dm.to_decimal_string(post_issue_equity_shares),
        "requiredContributionShares": required_contribution_shares,
        "earmarkedShares": earmarked_shares,
        "eligibleShares": eligible_shares,
        "ineligibleShares": ineligible_shares,
        "unclassifiedShares": unclassified_shares,
        "shortfallShares": shortfall_shares,
        "surplusShares": surplus_shares,
        "eligibleAsPercentageOfPostIssue": (
            dm.pct(eligible_shares, post_issue_equity_shares, 4)
            if dm.is_positive(post_issue_equity_shares)
            else ""
        ),
        "meetsRequirement": meets_requirement,
        "lotsMissingEligibilityAnswer": sum(
            1
            for lot in lots
            if lot.get("eligibleForMinimumPromoterContribution") in ("", "not_sure", None)
        ),
        "lotsNotDematerialised": sum(1 for lot in lots if lot.get("dematerialised") == "no"),
        "encumberedContributionShares": encumbered_contribution_shares,
        "encumbrancesRequiringRelease": sum(
            1
            for item in encumbrances
            if item.get("affectsPromoterContributionShares") == "yes"
            and item.get("willBeReleasedBeforeFiling") != "yes"
        ),
        "totalEncumberedShares": dm.sum_decimals(
            [item.get("numberOfSharesEncumbered") for item in encumbrances]
        ),
        "promoterEncumberedShares": promoter_encumbered_shares,
    }


# -------------------------------------------------------------------------- #
# 8. Reconciliation                                                          #
# -------------------------------------------------------------------------- #


def _compare_check(
    check_id: str,
    group: str,
    label: str,
    expected: str,
    actual: str,
    messages: dict[str, str],
) -> dict[str, Any]:
    if not dm.is_filled(expected) or not dm.is_filled(actual):
        return {
            "id": check_id,
            "group": group,
            "label": label,
            "status": "insufficient_data",
            "expected": expected,
            "actual": actual,
            "difference": "",
            "message": messages["missing"],
        }
    delta = dm.difference(expected, actual)
    reconciled = dm.is_zero(delta)
    return {
        "id": check_id,
        "group": group,
        "label": label,
        "status": "reconciled" if reconciled else "variance",
        "expected": expected,
        "actual": actual,
        "difference": delta,
        "message": messages["reconciled"] if reconciled else messages["variance"],
    }


def reconcile_capital_ownership(
    payload: dict[str, Any],
    *,
    totals: dict[str, Any],
    history: dict[str, Any],
    cap_table: dict[str, Any],
    pre_post: dict[str, Any],
    lock_in: dict[str, Any],
    ipo_reference: dict[str, Any],
) -> list[dict[str, Any]]:
    structure = payload.get("currentCapitalStructure") or {}
    checks: list[dict[str, Any]] = []

    checks.append(
        _compare_check(
            "authorised-capital-vs-classes",
            "capital",
            "Authorised equity capital matches the class-wise table",
            totals["declaredAuthorisedEquityCapital"],
            totals["authorisedEquityCapitalFromClasses"],
            {
                "reconciled": "Declared authorised equity capital equals shares × face value by class.",
                "variance": (
                    "Declared authorised equity capital differs from the class-wise "
                    "authorised shares × face value."
                ),
                "missing": "Authorised capital or class-wise figures are not yet complete.",
            },
        )
    )

    checks.append(
        _compare_check(
            "paid-up-capital-vs-classes",
            "capital",
            "Paid-up equity capital matches the class-wise table",
            totals["declaredPaidUpEquityCapital"],
            totals["paidUpEquityCapitalFromClasses"],
            {
                "reconciled": "Declared paid-up equity capital equals paid-up shares × face value by class.",
                "variance": (
                    "Declared paid-up equity capital differs from the class-wise "
                    "paid-up shares × face value."
                ),
                "missing": "Paid-up capital or class-wise figures are not yet complete.",
            },
        )
    )

    checks.append(
        _compare_check(
            "paid-up-capital-vs-audited",
            "capital",
            "Paid-up capital agrees with the latest audited financials",
            structure.get("paidUpCapitalAsPerLatestAuditedFinancials") or "",
            dm.first_filled(
                totals["declaredPaidUpEquityCapital"], totals["paidUpEquityCapitalFromClasses"]
            ),
            {
                "reconciled": "Paid-up capital matches the latest audited financial statements.",
                "variance": (
                    "Paid-up capital differs from the latest audited financial statements. "
                    "Later capital events may explain this."
                ),
                "missing": "Audited paid-up capital has not been entered.",
            },
        )
    )

    if dm.is_filled(totals["authorisedEquityShares"]) and dm.is_filled(totals["issuedEquityShares"]):
        within_authorised = dm.compare(totals["issuedEquityShares"], totals["authorisedEquityShares"]) != 1
        checks.append(
            {
                "id": "issued-within-authorised",
                "group": "capital",
                "label": "Issued shares are within authorised shares",
                "status": "reconciled" if within_authorised else "variance",
                "expected": totals["authorisedEquityShares"],
                "actual": totals["issuedEquityShares"],
                "difference": dm.difference(
                    totals["authorisedEquityShares"], totals["issuedEquityShares"]
                ),
                "message": (
                    "Issued equity shares do not exceed the authorised equity shares."
                    if within_authorised
                    else "Issued equity shares exceed the authorised equity shares."
                ),
            }
        )
    else:
        checks.append(
            {
                "id": "issued-within-authorised",
                "group": "capital",
                "label": "Issued shares are within authorised shares",
                "status": "insufficient_data",
                "expected": totals["authorisedEquityShares"],
                "actual": totals["issuedEquityShares"],
                "difference": "",
                "message": "Authorised or issued share counts are not yet entered.",
            }
        )

    history_section = payload.get("shareCapitalHistory") or {}
    checks.append(
        _compare_check(
            "history-closing-vs-current",
            "capital",
            "Share capital history closes at the current share count",
            totals["currentEquityShares"],
            history["closingEquityShares"],
            {
                "reconciled": "The cumulative history ends at the current equity share count.",
                "variance": (
                    "The cumulative history does not end at the current equity share count. "
                    "An event may be missing or mis-typed."
                ),
                "missing": (
                    "No capital events have been recorded yet."
                    if len(history_section.get("capitalEvents") or []) == 0
                    else "The cumulative history cannot be completed from the events entered."
                ),
            },
        )
    )

    checks.append(
        _compare_check(
            "register-vs-capital",
            "ownership",
            "Shareholder register totals match the paid-up share count",
            totals["currentEquityShares"],
            cap_table["totalEquitySharesFromRegister"],
            {
                "reconciled": "Shareholder holdings add up to the current equity share count.",
                "variance": "Shareholder holdings do not add up to the current equity share count.",
                "missing": "Shareholder holdings or the current share count are incomplete.",
            },
        )
    )

    ownership_section = payload.get("shareholdersAndBeneficialOwnership") or {}
    shareholders = ownership_section.get("shareholders") or []
    checks.append(
        _compare_check(
            "shareholder-count",
            "ownership",
            "Number of shareholders matches the register",
            "" if len(shareholders) == 0 else str(len(shareholders)),
            ownership_section.get("totalNumberOfShareholders") or "",
            {
                "reconciled": "Recorded shareholder rows match the stated number of shareholders.",
                "variance": "Recorded shareholder rows differ from the stated number of shareholders.",
                "missing": "The stated number of shareholders has not been provided.",
            },
        )
    )

    demat = dm.sum_decimals(
        [
            dm.sum_decimals(
                [item.get("sharesInDematerialisedForm"), item.get("sharesInPhysicalForm")]
            )
            for item in shareholders
        ]
    )
    checks.append(
        _compare_check(
            "demat-plus-physical",
            "ownership",
            "Dematerialised plus physical shares equal holdings",
            cap_table["totalEquitySharesFromRegister"],
            demat,
            {
                "reconciled": "Dematerialised and physical holdings add up to total holdings.",
                "variance": "Dematerialised plus physical holdings do not equal the total holdings.",
                "missing": "Dematerialised / physical split has not been entered for all shareholders.",
            },
        )
    )

    promoters_section = payload.get("promotersAndControl") or {}
    promoter_declared_shares = dm.sum_decimals(
        [item.get("equitySharesHeld") for item in (promoters_section.get("promoters") or [])]
    )
    checks.append(
        _compare_check(
            "promoter-shares-vs-register",
            "ownership",
            "Promoter holdings match the shareholder register",
            cap_table["groups"]["promoterShares"],
            promoter_declared_shares,
            {
                "reconciled": "Promoter holdings agree between the promoter list and the register.",
                "variance": (
                    "Promoter holdings differ between the promoter list and the shareholder register."
                ),
                "missing": "Promoter holdings have not been entered in both places.",
            },
        )
    )

    _, includes_ofs = offer_type_flags(ipo_reference.get("proposedOfferType") or "")
    if not ipo_reference.get("available"):
        checks.append(
            {
                "id": "ofs-vs-ipo-setup",
                "group": "offer",
                "label": "Offer-for-sale size matches IPO Setup",
                "status": "insufficient_data",
                "expected": "",
                "actual": pre_post["totalSharesOfferedForSale"],
                "difference": "",
                "message": (
                    "IPO Setup & Eligibility has not been completed, so the offer size "
                    "cannot be compared."
                ),
            }
        )
    elif not includes_ofs and not dm.is_positive(pre_post["totalSharesOfferedForSale"]):
        checks.append(
            {
                "id": "ofs-vs-ipo-setup",
                "group": "offer",
                "label": "Offer-for-sale size matches IPO Setup",
                "status": "not_applicable",
                "expected": "",
                "actual": "",
                "difference": "",
                "message": "The proposed offer does not include an offer for sale.",
            }
        )
    else:
        checks.append(
            _compare_check(
                "ofs-vs-ipo-setup",
                "offer",
                "Offer-for-sale size matches IPO Setup",
                ipo_reference.get("proposedOfsShares") or "",
                pre_post["totalSharesOfferedForSale"],
                {
                    "reconciled": "Shares marked for sale equal the offer-for-sale size in IPO Setup.",
                    "variance": (
                        "Shares marked for sale differ from the offer-for-sale size in IPO Setup."
                    ),
                    "missing": "Offer-for-sale quantities are incomplete in one of the two workstreams.",
                },
            )
        )

    sellers_exceeding = sum(1 for row in pre_post["rows"] if row["offerExceedsHolding"])
    checks.append(
        {
            "id": "ofs-within-holdings",
            "group": "offer",
            "label": "Selling shareholders offer only shares they hold",
            "status": (
                "variance"
                if sellers_exceeding > 0
                else "reconciled"
                if dm.is_positive(pre_post["totalSharesOfferedForSale"])
                else "insufficient_data"
            ),
            "expected": "",
            "actual": str(sellers_exceeding),
            "difference": "",
            "message": (
                f"{sellers_exceeding} selling shareholder(s) are offering more shares than they hold."
                if sellers_exceeding > 0
                else (
                    "Every selling shareholder is offering shares within their existing holding."
                    if dm.is_positive(pre_post["totalSharesOfferedForSale"])
                    else "No offer-for-sale quantities have been recorded yet."
                )
            ),
        }
    )

    checks.append(
        _compare_check(
            "pre-issue-shares-vs-ipo-setup",
            "offer",
            "Pre-issue share count matches IPO Setup",
            ipo_reference.get("existingIssuedEquityShares") or "",
            totals["currentEquityShares"],
            {
                "reconciled": "Pre-issue equity shares agree with IPO Setup & Eligibility.",
                "variance": (
                    "Pre-issue equity shares differ from the figure recorded in "
                    "IPO Setup & Eligibility."
                ),
                "missing": "Pre-issue equity shares are not yet available in both workstreams.",
            },
        )
    )

    checks.append(
        {
            "id": "ofs-does-not-increase-capital",
            "group": "offer",
            "label": "Offer for sale does not increase share capital",
            "status": "insufficient_data" if pre_post["postIssueShares"] == "" else "reconciled",
            "expected": pre_post["capitalIncreaseShares"],
            "actual": pre_post["freshIssueShares"],
            "difference": "",
            "message": (
                "Post-issue share count is not yet computable."
                if pre_post["postIssueShares"] == ""
                else (
                    "Post-issue capital reflects the fresh issue and recorded pre-issue "
                    "allotments only; offer-for-sale shares change ownership, not capital."
                )
            ),
        }
    )

    if lock_in["applicable"] is False:
        checks.append(
            {
                "id": "minimum-promoter-contribution",
                "group": "lock_in",
                "label": "Minimum promoter contribution is met",
                "status": "not_applicable",
                "expected": "",
                "actual": "",
                "difference": "",
                "message": "The issuer has indicated that minimum promoter contribution is not applicable.",
            }
        )
    elif lock_in["meetsRequirement"] is None:
        checks.append(
            {
                "id": "minimum-promoter-contribution",
                "group": "lock_in",
                "label": "Minimum promoter contribution is met",
                "status": "insufficient_data",
                "expected": lock_in["requiredContributionShares"],
                "actual": lock_in["eligibleShares"],
                "difference": "",
                "message": "Post-issue capital or eligible contribution lots are not yet complete.",
            }
        )
    else:
        checks.append(
            {
                "id": "minimum-promoter-contribution",
                "group": "lock_in",
                "label": "Minimum promoter contribution is met",
                "status": "reconciled" if lock_in["meetsRequirement"] else "variance",
                "expected": lock_in["requiredContributionShares"],
                "actual": lock_in["eligibleShares"],
                "difference": lock_in["shortfallShares"],
                "message": (
                    f"Eligible lots cover the indicative {lock_in['requiredPercentage']}% "
                    "minimum promoter contribution."
                    if lock_in["meetsRequirement"]
                    else (
                        f"Eligible lots fall short of the indicative {lock_in['requiredPercentage']}% "
                        "minimum promoter contribution."
                    )
                ),
            }
        )

    lock_in_section = payload.get("promoterContributionLockInAndEncumbrances") or {}
    checks.append(
        {
            "id": "contribution-shares-unencumbered",
            "group": "lock_in",
            "label": "Contribution shares are free of encumbrances",
            "status": (
                "variance"
                if lock_in["encumbrancesRequiringRelease"] > 0
                else "insufficient_data"
                if len(lock_in_section.get("encumbrances") or []) == 0
                else "reconciled"
            ),
            "expected": "0",
            "actual": lock_in["encumberedContributionShares"],
            "difference": "",
            "message": (
                f"{lock_in['encumbrancesRequiringRelease']} encumbrance(s) affect contribution "
                "shares without a confirmed release before filing."
                if lock_in["encumbrancesRequiringRelease"] > 0
                else (
                    "No encumbrances have been recorded yet."
                    if len(lock_in_section.get("encumbrances") or []) == 0
                    else "Recorded encumbrances on contribution shares are marked for release before filing."
                )
            ),
        }
    )

    checks.append(
        _compare_check(
            "contribution-lots-within-promoter-holding",
            "lock_in",
            "Earmarked contribution lots are within promoter holdings",
            cap_table["groups"]["promoterAndGroupShares"],
            lock_in["earmarkedShares"],
            {
                "reconciled": "Earmarked contribution lots equal the promoter and promoter group holdings.",
                "variance": (
                    "Earmarked contribution lots differ from the promoter and promoter group "
                    "holdings in the register."
                ),
                "missing": "Contribution lots or promoter holdings are incomplete.",
            },
        )
    )

    return checks


# -------------------------------------------------------------------------- #
# 9. Aggregate model                                                         #
# -------------------------------------------------------------------------- #


def _additional_pre_issue_shares(section: dict[str, Any]) -> str:
    return (
        dm.sum_decimals(
            [
                section.get("expectedPreIpoPlacementShares"),
                section.get("expectedConversionSharesBeforeIssue"),
                section.get("expectedEsopAllotmentSharesBeforeIssue"),
            ]
        )
        or "0"
    )


def compute_capital_ownership_model(
    payload: dict[str, Any], ipo_reference: dict[str, Any]
) -> dict[str, Any]:
    """Single entry point used by the Overview, Information and Capital Assessment views."""
    structure = payload.get("currentCapitalStructure") or {}
    history_section = payload.get("shareCapitalHistory") or {}
    ownership_section = payload.get("shareholdersAndBeneficialOwnership") or {}
    pre_post_section = payload.get("preAndPostIssueOwnership") or {}
    outstanding_section = payload.get("outstandingSecuritiesTransactionsAndConfirmations") or {}
    lock_in_section = payload.get("promoterContributionLockInAndEncumbrances") or {}

    totals = compute_current_capital_totals(structure)
    history = compute_capital_history_cumulative(history_section.get("capitalEvents") or [])
    cap_table = compute_cap_table(
        ownership_section.get("shareholders") or [], totals["currentEquityShares"]
    )
    pre_post = compute_pre_post_issue(
        ownership_section.get("shareholders") or [],
        ipo_reference,
        pre_post_section.get("shareholderOverlays") or [],
        pre_issue_total_equity_shares=totals["currentEquityShares"],
        additional_pre_issue_shares=_additional_pre_issue_shares(pre_post_section),
        fresh_issue_shares_override=pre_post_section.get("freshIssueSharesOverride"),
    )
    face_value_per_share = dm.first_filled(
        totals["impliedEquityFaceValue"], ipo_reference.get("faceValuePerEquityShare")
    )
    dilution = compute_dilution(pre_post, face_value_per_share)
    outstanding = compute_outstanding_instruments(outstanding_section, pre_post["postIssueShares"])
    lock_in = compute_lock_in_readiness(lock_in_section, pre_post["postIssueShares"])
    reconciliation = reconcile_capital_ownership(
        payload,
        totals=totals,
        history=history,
        cap_table=cap_table,
        pre_post=pre_post,
        lock_in=lock_in,
        ipo_reference=ipo_reference,
    )

    return {
        "totals": totals,
        "history": history,
        "capTable": cap_table,
        "prePost": pre_post,
        "dilution": dilution,
        "outstanding": outstanding,
        "lockIn": lock_in,
        "reconciliation": reconciliation,
        "faceValuePerShare": face_value_per_share,
    }
