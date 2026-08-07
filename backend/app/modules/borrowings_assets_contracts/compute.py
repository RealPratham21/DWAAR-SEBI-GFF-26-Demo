"""Derived model for Borrowings, Assets & Contracts."""

from __future__ import annotations

import calendar
from datetime import date
from decimal import Decimal
from typing import Any

from app.modules.borrowings_assets_contracts.constants import RECONCILIATION_TOLERANCE
from app.modules.borrowings_assets_contracts.decimal_utils import (
    is_filled,
    parse_decimal,
    sum_decimals,
    to_decimal_string,
)
from app.modules.borrowings_assets_contracts.facilities import get_facilities
from app.modules.borrowings_assets_contracts.masters import (
    format_contract_label,
    format_property_label,
    get_contracts,
    get_properties,
)


def _currency_key(facility: dict[str, Any]) -> str:
    sanction = facility.get("sanctionAndUtilisation") or {}
    currency = str(sanction.get("currency") or "").strip() or "UNSPECIFIED"
    unit = str(sanction.get("amountUnit") or "").strip() or "unspecified"
    return f"{currency}::{unit}"


def _sum_field(facilities: list[dict[str, Any]], pick) -> str:
    return sum_decimals([pick(f) for f in facilities])


def _build_currency_totals(facilities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for facility in facilities:
        key = _currency_key(facility)
        groups.setdefault(key, []).append(facility)

    totals: list[dict[str, Any]] = []
    for key, group in groups.items():
        currency, amount_unit = key.split("::", 1)
        secured = [f for f in group if f.get("securedUnsecured") == "secured"]
        unsecured = [
            f
            for f in group
            if f.get("securedUnsecured") in ("unsecured", "partially-secured")
        ]
        fund_based = [f for f in group if f.get("fundBasedNonFundBased") == "fund-based"]
        non_fund_based = [f for f in group if f.get("fundBasedNonFundBased") == "non-fund-based"]
        related_party = [
            f
            for f in group
            if (f.get("lender") or {}).get("relatedPartyStatus") == "yes"
            or (f.get("lender") or {}).get("lenderType")
            in ("related-party", "promoter", "director", "group-entity")
        ]

        pick_outstanding = lambda f: str((f.get("sanctionAndUtilisation") or {}).get("totalOutstanding") or "")
        pick = lambda field: (lambda f: str((f.get("sanctionAndUtilisation") or {}).get(field) or ""))

        totals.append(
            {
                "currency": currency,
                "amountUnit": amount_unit,
                "facilityCount": len(group),
                "totalSanctioned": _sum_field(group, pick("currentSanctionedLimit")),
                "totalDisbursed": _sum_field(group, pick("totalAmountDisbursed")),
                "totalPrincipalOutstanding": _sum_field(group, pick("principalOutstanding")),
                "totalAccruedInterest": _sum_field(group, pick("accruedInterest")),
                "totalOutstanding": _sum_field(group, pick_outstanding),
                "totalUndrawn": _sum_field(group, pick("undrawnAmount")),
                "securedDebt": _sum_field(secured, pick_outstanding),
                "unsecuredDebt": _sum_field(unsecured, pick_outstanding),
                "fundBasedExposure": _sum_field(fund_based, pick_outstanding),
                "nonFundBasedExposure": _sum_field(non_fund_based, pick_outstanding),
                "relatedPartyBorrowings": _sum_field(related_party, pick_outstanding),
            }
        )
    return totals


def _calculate_effective_rate(facility: dict[str, Any]) -> str | None:
    interest = facility.get("interest") or {}
    if interest.get("rateType") != "floating":
        return None
    benchmark = parse_decimal(interest.get("benchmarkRate"))
    spread = parse_decimal(interest.get("spread"))
    if benchmark is None and spread is None:
        return None
    return to_decimal_string((benchmark or Decimal("0")) + (spread or Decimal("0")))


def _build_interest_variances(facilities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for facility in facilities:
        calculated = _calculate_effective_rate(facility)
        entered = str((facility.get("interest") or {}).get("enteredEffectiveRate") or "")
        variance: str | None = None
        has_variance = False

        if calculated is not None and is_filled(entered):
            calc = parse_decimal(calculated)
            ent = parse_decimal(entered)
            if calc is not None and ent is not None:
                diff = abs(calc - ent)
                variance = to_decimal_string(diff)
                has_variance = diff > Decimal("0.01")

        lender = facility.get("lender") or {}
        lender_name = str(lender.get("lenderName") or "").strip()
        facility_type = str(facility.get("facilityType") or "").replace("-", " ")
        facility_label = lender_name or facility_type

        entries.append(
            {
                "facilityId": str(facility.get("id") or ""),
                "facilityLabel": facility_label,
                "calculatedEffectiveRate": calculated,
                "enteredEffectiveRate": entered,
                "variance": variance,
                "hasVariance": has_variance,
            }
        )
    return entries


def _parse_iso_date(value: str) -> date | None:
    trimmed = (value or "").strip()
    if not trimmed:
        return None
    try:
        return date.fromisoformat(trimmed[:10])
    except ValueError:
        return None


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(value.day, last_day))


def _days_until(from_date: date, to_date: date) -> int:
    return (to_date - from_date).days


def _build_expiry_windows(
    payload: dict[str, Any],
    as_of: date,
) -> dict[str, list[dict[str, Any]]]:
    horizon = _add_months(as_of, 12)

    property_leases: list[dict[str, Any]] = []
    for property_record in get_properties(payload):
        if property_record.get("occupancyBasis") == "owned":
            continue
        leased_details = property_record.get("leasedDetails") or {}
        expiry = _parse_iso_date(str(leased_details.get("expiry") or ""))
        if expiry is None or expiry > horizon:
            continue
        property_leases.append(
            {
                "id": str(property_record.get("id") or ""),
                "kind": "property-lease",
                "label": format_property_label(property_record),
                "expiryDate": str(leased_details.get("expiry") or ""),
                "daysUntilExpiry": _days_until(as_of, expiry),
            }
        )

    contracts: list[dict[str, Any]] = []
    for contract in get_contracts(payload):
        basic_terms = contract.get("basicTerms") or {}
        expiry = _parse_iso_date(str(basic_terms.get("expiry") or ""))
        if expiry is None or expiry > horizon:
            continue
        contracts.append(
            {
                "id": str(contract.get("id") or ""),
                "kind": "contract",
                "label": format_contract_label(contract),
                "expiryDate": str(basic_terms.get("expiry") or ""),
                "daysUntilExpiry": _days_until(as_of, expiry),
            }
        )

    return {"propertyLeases": property_leases, "contracts": contracts}


def _reconciliation_status_label(status: str, linked_available: bool) -> str:
    if not linked_available:
        return "Pending linked workstream"
    match status:
        case "reconciled":
            return "Reconciled"
        case "potential-inconsistency":
            return "Potential inconsistency"
        case "pending-professional-confirmation":
            return "Pending professional confirmation"
        case "pending-linked-workstream":
            return "Pending linked workstream"
        case _:
            return status.replace("-", " ") if status else "Not captured"


def _subtract_like_ts(minuend: str, subtrahend: str) -> str:
    left = parse_decimal(minuend)
    right = parse_decimal(subtrahend)
    if left is None and right is None:
        return ""
    return to_decimal_string((left or Decimal("0")) - (right or Decimal("0")))


def _build_reconciliation_preview(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
    currency_totals: list[dict[str, Any]],
) -> dict[str, Any]:
    reconciliation = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    financials_rec = reconciliation.get("financialsReconciliation") or {}
    facilities = get_facilities(payload)

    primary_total = currency_totals[0].get("totalOutstanding") if currency_totals else ""
    if not is_filled(str(primary_total or "")):
        primary_total = sum_decimals(
            [
                str((f.get("sanctionAndUtilisation") or {}).get("totalOutstanding") or "")
                for f in facilities
            ]
        )

    financials_linked = bool((linked_references.get("financialsKpis") or {}).get("available"))
    financials_value = (linked_references.get("financialsKpis") or {}).get("totalDebt")
    financials_difference = str(financials_rec.get("difference") or "")
    if (
        not is_filled(financials_difference)
        and financials_linked
        and is_filled(str(primary_total or ""))
        and financials_value
    ):
        financials_difference = _subtract_like_ts(str(primary_total), str(financials_value))

    financials_status = str(financials_rec.get("reconciliationStatus") or "")
    if not financials_status:
        if not financials_linked:
            financials_status = "pending-linked-workstream"
        elif is_filled(financials_difference):
            diff = abs(parse_decimal(financials_difference) or Decimal("0"))
            financials_status = (
                "reconciled"
                if diff <= Decimal(str(RECONCILIATION_TOLERANCE))
                else "potential-inconsistency"
            )

    objects_items = [
        item
        for item in (reconciliation.get("objectsOfIssueRepayments") or [])
        if isinstance(item, dict)
    ]
    facility_ids = {str(f.get("id")) for f in facilities if f.get("id")}
    unresolved_objects = sum(
        1
        for item in objects_items
        if item.get("reconciliationStatus") in (
            "potential-inconsistency",
            "pending-professional-confirmation",
        )
        or (
            item.get("linkedFacilityId")
            and str(item.get("linkedFacilityId")) not in facility_ids
        )
    )

    objects_linked = bool((linked_references.get("objectsOfIssue") or {}).get("available"))
    if not objects_linked and objects_items:
        objects_status = "pending-linked-workstream"
    elif unresolved_objects > 0:
        objects_status = "potential-inconsistency"
    elif objects_items:
        objects_status = "reconciled"
    else:
        objects_status = ""

    group_rec = reconciliation.get("groupEntitiesReconciliation") or {}
    capital_rec = reconciliation.get("capitalOwnershipReconciliation") or {}
    business_rec = reconciliation.get("businessOperationsReconciliation") or {}

    bac_facility_total = str(financials_rec.get("bacFacilityTotal") or "")
    if not is_filled(bac_facility_total):
        bac_facility_total = str(primary_total or "")

    return {
        "financials": {
            "bacFacilityTotal": bac_facility_total,
            "financialsValue": financials_value,
            "difference": financials_difference,
            "status": _reconciliation_status_label(financials_status, financials_linked),
            "detail": (
                "Compare BAC facility totals with Financials & KPIs debt figures."
                if financials_linked
                else "Financials & KPIs linked data not yet available."
            ),
        },
        "objects": {
            "repaymentItemCount": len(objects_items),
            "unresolvedCount": unresolved_objects,
            "status": _reconciliation_status_label(objects_status, objects_linked),
            "detail": (
                f"{len(objects_items)} proposed repayment item(s) captured for Objects reconciliation."
                if objects_items
                else "No Objects of the Issue repayment links captured yet."
            ),
        },
        "groupEntities": {
            "status": _reconciliation_status_label(
                str(group_rec.get("reconciliationStatus") or ""),
                bool((linked_references.get("groupEntities") or {}).get("available")),
            ),
            "detail": (
                "Group Entities loans, guarantees and security cross-check."
                if (linked_references.get("groupEntities") or {}).get("available")
                else "Group Entities linked data not yet available."
            ),
        },
        "capitalOwnership": {
            "status": _reconciliation_status_label(
                str(capital_rec.get("reconciliationStatus") or ""),
                bool((linked_references.get("capitalOwnership") or {}).get("available")),
            ),
            "detail": (
                "Capital & Ownership promoter guarantees and pledge cross-check."
                if (linked_references.get("capitalOwnership") or {}).get("available")
                else "Capital & Ownership linked data not yet available."
            ),
        },
        "businessOperations": {
            "status": _reconciliation_status_label(
                str(business_rec.get("reconciliationStatus") or ""),
                bool((linked_references.get("businessOperations") or {}).get("available")),
            ),
            "detail": (
                "Business & Operations facilities, assets and insurance mapping cross-check."
                if (linked_references.get("businessOperations") or {}).get("available")
                else "Business & Operations linked data not yet available."
            ),
        },
    }


def compute_borrowings_assets_contracts_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    facilities = get_facilities(payload)
    section = payload.get("financialIndebtednessAndFacilityMaster") or {}
    snapshot = section.get("borrowingSnapshot") or {}
    currency_totals = _build_currency_totals(facilities)
    primary = currency_totals[0] if currency_totals else None

    securities = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    charges = [c for c in (securities.get("charges") or []) if isinstance(c, dict)]
    guarantees = [g for g in (securities.get("guarantees") or []) if isinstance(g, dict)]
    covenant_section = payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}

    consents = [c for c in (covenant_section.get("lenderConsents") or []) if isinstance(c, dict)]
    consent_required = sum(
        1 for c in consents if c.get("ipoConsentRequirement") in ("required", "not-sure")
    )
    consent_requested = sum(1 for c in consents if c.get("consentRequested") == "yes")
    consent_received = sum(1 for c in consents if c.get("consentReceived") == "yes")

    as_of = _parse_iso_date(str(snapshot.get("positionAsOfDate") or "")) or date.today()
    expiry_windows = _build_expiry_windows(payload, as_of)

    properties = get_properties(payload)
    owned_property_count = sum(1 for p in properties if p.get("occupancyBasis") == "owned")
    leased_property_count = sum(
        1
        for p in properties
        if p.get("occupancyBasis") not in ("owned", "", None)
    )

    contracts = get_contracts(payload)
    contracts_with_change_of_control = sum(
        1
        for c in contracts
        if (c.get("termination") or {}).get("changeOfControlTermination") == "yes"
        or (c.get("assignmentChangeOfControl") or {}).get("changeOfControlConsentRequired") == "yes"
        or (c.get("assignmentChangeOfControl") or {}).get("ipoTreatedAsChangeOfControl") == "yes"
    )

    assets_section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    assets = [a for a in (assets_section.get("assets") or []) if isinstance(a, dict)]
    encumbered_assets = sum(1 for a in assets if a.get("encumbered") == "yes")

    financial_covenants = [
        c
        for c in (covenant_section.get("covenants") or [])
        if isinstance(c, dict) and c.get("covenantType") == "financial"
    ]
    covenants_requiring_review = sum(
        1
        for c in financial_covenants
        if (c.get("financialDetails") or {}).get("complianceStatus") in ("breached", "not-sure")
        or (c.get("financialDetails") or {}).get("professionalConfirmation") == "pending"
    )

    default_events = [
        e for e in (covenant_section.get("defaultEvents") or []) if isinstance(e, dict)
    ]
    recorded_breaches = sum(
        1
        for e in default_events
        if e.get("continuingStatus") == "continuing" or e.get("waiverObtained") != "yes"
    )
    waivers_pending = sum(1 for e in default_events if e.get("waiverObtained") != "yes")

    properties_section = payload.get("immovablePropertiesAndOccupancyRights") or {}
    property_issues = len(
        [i for i in (properties_section.get("propertyIssues") or []) if isinstance(i, dict)]
    )
    materiality_section = payload.get("contractMaterialityExpiryAndInspectionReadiness") or {}
    material_contract_review_items = len(
        [r for r in (materiality_section.get("materialityRecords") or []) if isinstance(r, dict)]
    ) + sum(
        1
        for b in (materiality_section.get("breachDisputeReadiness") or [])
        if isinstance(b, dict) and b.get("currentBreach") == "yes"
    )

    reconciliation = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    debt_proposed_for_ipo_repayment = sum_decimals(
        [
            str(item.get("proposedRepayment") or "")
            for item in (reconciliation.get("objectsOfIssueRepayments") or [])
            if isinstance(item, dict)
        ]
    )

    interest_variances = _build_interest_variances(facilities)
    reporting_currency = str(snapshot.get("reportingCurrency") or "").strip()
    display_unit = str(snapshot.get("displayUnit") or "").strip()

    return {
        "facilityCount": len(facilities),
        "currencyTotals": currency_totals,
        "primaryCurrency": (primary or {}).get("currency") or reporting_currency or None,
        "primaryAmountUnit": (primary or {}).get("amountUnit") or display_unit or None,
        "positionAsOfDate": str(snapshot.get("positionAsOfDate") or ""),
        "interestVariances": interest_variances,
        "interestVarianceCount": sum(1 for entry in interest_variances if entry.get("hasVariance")),
        "consentCounts": {
            "facilitiesReviewed": len(consents),
            "consentRequired": consent_required,
            "consentRequested": consent_requested,
            "consentReceived": consent_received,
            "consentPending": max(0, consent_required - consent_received),
        },
        "chargeCount": len(charges),
        "chargesRegistered": sum(1 for c in charges if c.get("status") == "registered"),
        "chargesPendingRegistration": sum(
            1
            for c in charges
            if c.get("status")
            in (
                "pending-registration",
                "modified-pending-filing",
                "professional-confirmation-required",
            )
        ),
        "personalGuaranteeCount": sum(1 for g in guarantees if g.get("guaranteeType") == "personal"),
        "corporateGuaranteeCount": sum(
            1 for g in guarantees if g.get("guaranteeType") in ("corporate", "issuer-given")
        ),
        "financialCovenantCount": len(financial_covenants),
        "covenantsRequiringReview": covenants_requiring_review,
        "recordedBreaches": recorded_breaches,
        "waiversPending": waivers_pending,
        "propertyCount": len(properties),
        "ownedPropertyCount": owned_property_count,
        "leasedPropertyCount": leased_property_count,
        "propertyLeasesExpiringWithin12Months": expiry_windows["propertyLeases"],
        "contractCount": len(contracts),
        "contractsExpiringWithin12Months": expiry_windows["contracts"],
        "contractsWithChangeOfControlClauses": contracts_with_change_of_control,
        "materialAssetCount": len(assets),
        "encumberedMaterialAssetCount": encumbered_assets,
        "titleOccupancyReviewItems": property_issues,
        "materialContractReviewItems": material_contract_review_items,
        "debtProposedForIpoRepayment": debt_proposed_for_ipo_repayment,
        "reconciliation": _build_reconciliation_preview(payload, linked_references, currency_totals),
    }
