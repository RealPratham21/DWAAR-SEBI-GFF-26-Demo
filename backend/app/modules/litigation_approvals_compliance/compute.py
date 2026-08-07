"""Derived model for Litigation, Approvals & Compliance."""

from __future__ import annotations

from datetime import UTC, datetime
from math import ceil
from typing import Any

from app.modules.litigation_approvals_compliance.approvals import get_approvals, is_perpetual_approval
from app.modules.litigation_approvals_compliance.constants import RECONCILIATION_TOLERANCE
from app.modules.litigation_approvals_compliance.decimal_utils import (
    add_decimals,
    days_between_dates,
    is_filled_decimal,
    parse_decimal,
    parse_iso_date,
    subtract_decimals,
)
from app.modules.litigation_approvals_compliance.matters import (
    get_matters,
    is_criminal_matter,
    is_tax_matter,
)


def _currency_key(matter: dict[str, Any]) -> str:
    amounts = matter.get("amounts") or {}
    currency = str(amounts.get("currency") or "").strip() or "UNSPECIFIED"
    unit = str(amounts.get("amountUnit") or "").strip() or "unspecified"
    return f"{currency}::{unit}"


def _matter_exposure(matter: dict[str, Any]) -> str:
    amounts = matter.get("amounts") or {}
    total = str(amounts.get("totalQuantifiedAmount") or "")
    if is_filled_decimal(total):
        return total
    return add_decimals(
        str(amounts.get("principalClaim") or ""),
        str(amounts.get("taxDemand") or ""),
        str(amounts.get("interest") or ""),
        str(amounts.get("penalty") or ""),
        str(amounts.get("fine") or ""),
        str(amounts.get("damages") or ""),
        str(amounts.get("compensation") or ""),
        str(amounts.get("otherExposure") or ""),
    )


def _build_exposure_by_currency(matters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for matter in matters:
        key = _currency_key(matter)
        groups.setdefault(key, []).append(matter)

    result: list[dict[str, Any]] = []
    for key, group in groups.items():
        currency, amount_unit = key.split("::", 1)
        tax_matters = [m for m in group if is_tax_matter(m)]
        result.append(
            {
                "currency": currency,
                "amountUnit": amount_unit,
                "matterCount": len(group),
                "totalExposure": add_decimals(*[_matter_exposure(m) for m in group]),
                "taxExposure": add_decimals(
                    *[
                        str((m.get("amounts") or {}).get("taxDemand") or "") or _matter_exposure(m)
                        for m in tax_matters
                    ]
                ),
                "criminalCount": sum(1 for m in group if is_criminal_matter(m)),
                "pendingCount": sum(
                    1
                    for m in group
                    if (m.get("statusOutcome") or {}).get("outcomeStatus")
                    in {"pending", "appeal-pending", ""}
                ),
            }
        )
    return result


def _build_matters_by_category(matters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for matter in matters:
        category = str((matter.get("identity") or {}).get("category") or "") or "unspecified"
        counts[category] = counts.get(category, 0) + 1
    return sorted(
        [{"category": category, "count": count} for category, count in counts.items()],
        key=lambda item: item["count"],
        reverse=True,
    )


def _build_tax_aggregates(payload: dict[str, Any]) -> dict[str, Any]:
    section3 = payload.get("criminalRegulatoryTaxAndEnforcementReadiness") or {}
    tax_details = [
        detail for detail in (section3.get("taxProceedingDetails") or []) if isinstance(detail, dict)
    ]
    direct_types = {"direct-tax"}
    indirect_types = {"gst", "customs", "excise", "vat-sales-tax", "service-tax"}

    direct_tax_demand = ""
    indirect_tax_demand = ""

    for detail in tax_details:
        demand = add_decimals(
            str(detail.get("demand") or ""),
            str(detail.get("interest") or ""),
            str(detail.get("penalty") or ""),
        )
        tax_type = str(detail.get("taxType") or "")
        if tax_type in direct_types:
            direct_tax_demand = add_decimals(direct_tax_demand, demand)
        elif tax_type in indirect_types:
            indirect_tax_demand = add_decimals(indirect_tax_demand, demand)
        elif tax_type:
            direct_tax_demand = add_decimals(direct_tax_demand, demand)

    for matter in get_matters(payload):
        if not is_tax_matter(matter):
            continue
        amounts = matter.get("amounts") or {}
        demand = str(amounts.get("taxDemand") or "") or _matter_exposure(matter)
        if (matter.get("identity") or {}).get("category") == "tax":
            direct_tax_demand = add_decimals(direct_tax_demand, demand)

    return {
        "directTaxDemand": direct_tax_demand,
        "indirectTaxDemand": indirect_tax_demand,
        "totalDemand": add_decimals(direct_tax_demand, indirect_tax_demand),
        "totalBalanceDisputed": add_decimals(
            *[str(detail.get("balanceDisputed") or "") for detail in tax_details]
        ),
        "proceedingCount": len(tax_details),
    }


def _build_approval_expiry_windows(
    payload: dict[str, Any],
    as_of: datetime,
) -> dict[str, list[dict[str, Any]]]:
    windows: dict[str, list[dict[str, Any]]] = {
        "within30Days": [],
        "within90Days": [],
        "within180Days": [],
        "within365Days": [],
    }

    from datetime import timedelta

    horizon365 = as_of + timedelta(days=365)

    for approval in get_approvals(payload):
        if is_perpetual_approval(approval):
            continue
        details = approval.get("details") or {}
        renewal = approval.get("renewalMetadata") or {}
        expiry = parse_iso_date(str(details.get("expiryDate") or "")) or parse_iso_date(
            str(renewal.get("renewalDueDate") or "")
        )
        if expiry is None or expiry > horizon365:
            continue

        days_until = ceil((expiry - as_of).total_seconds() / (60 * 60 * 24))
        identity = approval.get("identity") or {}
        holder = approval.get("holder") or {}
        label = (
            str(identity.get("approvalLicenceName") or "").strip()
            or str(holder.get("displayName") or "").strip()
            or str(approval.get("approvalId") or "")[:8]
        )
        expiry_date = str(details.get("expiryDate") or "").strip() or str(
            renewal.get("renewalDueDate") or ""
        ).strip()
        entry_base = {
            "approvalId": str(approval.get("approvalId") or ""),
            "label": label,
            "expiryDate": expiry_date,
            "daysUntilExpiry": days_until,
        }

        if days_until <= 30:
            windows["within30Days"].append({**entry_base, "window": "30"})
        if days_until <= 90:
            windows["within90Days"].append({**entry_base, "window": "90"})
        if days_until <= 180:
            windows["within180Days"].append({**entry_base, "window": "180"})
        if days_until <= 365:
            windows["within365Days"].append({**entry_base, "window": "365"})

    return windows


def _reconciliation_status_label(status: str, linked_available: bool) -> str:
    if not linked_available:
        return "Pending linked workstream"
    mapping = {
        "reconciled": "Reconciled",
        "potential-inconsistency": "Potential inconsistency",
        "pending-professional-confirmation": "Pending professional confirmation",
        "pending-linked-workstream": "Pending linked workstream",
        "missing-information": "Missing information",
    }
    if status in mapping:
        return mapping[status]
    return status.replace("-", " ") if status else "Not captured"


def _build_reconciliation_preview(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    reconciliation = payload.get("reconciliationRemediationAndIssuerConfirmations") or {}
    financials_rec = reconciliation.get("financialsReconciliation") or {}
    tax_aggregates = _build_tax_aggregates(payload)
    matters = get_matters(payload)
    litigation_aggregate = str(financials_rec.get("litigationAggregateAmount") or "") or add_decimals(
        *[_matter_exposure(m) for m in matters]
    )

    financials_kpis = linked_references.get("financialsKpis") or {}
    litigation_difference = str(financials_rec.get("litigationDifference") or "")
    contingent = financials_kpis.get("contingentLiabilitiesTotal")
    if not is_filled_decimal(litigation_difference) and financials_kpis.get("available") and contingent:
        litigation_difference = subtract_decimals(litigation_aggregate, str(contingent))

    financials_status = str(financials_rec.get("reconciliationStatus") or "")
    if not financials_status and financials_kpis.get("available") and contingent:
        diff = abs(parse_decimal(litigation_difference) or 0)
        financials_status = (
            "reconciled" if diff <= RECONCILIATION_TOLERANCE else "potential-inconsistency"
        )

    return {
        "financials": {
            "status": _reconciliation_status_label(
                financials_status,
                bool(financials_kpis.get("available")),
            ),
            "detail": (
                f"Litigation aggregate {litigation_aggregate or '—'} vs Financials contingent liabilities {contingent or '—'}. Tax aggregate {tax_aggregates.get('totalDemand') or '—'}."
                if financials_kpis.get("available")
                else "Financials & KPIs linked data not yet available."
            ),
        },
        "groupEntities": {
            "status": _reconciliation_status_label(
                str((reconciliation.get("groupEntitiesReconciliation") or {}).get("reconciliationStatus") or ""),
                bool((linked_references.get("groupEntities") or {}).get("available")),
            ),
            "detail": (
                "Group Entities legal declarations and subsidiary litigation cross-check."
                if (linked_references.get("groupEntities") or {}).get("available")
                else "Group Entities linked data not yet available."
            ),
        },
        "managementGovernance": {
            "status": _reconciliation_status_label(
                str(
                    (reconciliation.get("managementGovernanceReconciliation") or {}).get(
                        "reconciliationStatus"
                    )
                    or ""
                ),
                bool((linked_references.get("managementGovernance") or {}).get("available")),
            ),
            "detail": (
                "Management & Governance director/KMP legal declarations cross-check."
                if (linked_references.get("managementGovernance") or {}).get("available")
                else "Management & Governance linked data not yet available."
            ),
        },
        "bac": {
            "status": _reconciliation_status_label(
                str((reconciliation.get("bacReconciliation") or {}).get("reconciliationStatus") or ""),
                bool((linked_references.get("borrowingsAssetsContracts") or {}).get("available")),
            ),
            "detail": (
                "Borrowings, Assets & Contracts defaults, disputes and lender matters cross-check."
                if (linked_references.get("borrowingsAssetsContracts") or {}).get("available")
                else "Borrowings, Assets & Contracts linked data not yet available."
            ),
        },
        "businessOperations": {
            "status": _reconciliation_status_label(
                str(
                    (reconciliation.get("businessOperationsReconciliation") or {}).get(
                        "reconciliationStatus"
                    )
                    or ""
                ),
                bool((linked_references.get("businessOperations") or {}).get("available")),
            ),
            "detail": (
                "Business & Operations facilities, licences and operational incidents cross-check."
                if (linked_references.get("businessOperations") or {}).get("available")
                else "Business & Operations linked data not yet available."
            ),
        },
        "objectsOfIssue": {
            "status": _reconciliation_status_label(
                str(
                    (reconciliation.get("objectsOfIssueReconciliation") or {}).get(
                        "reconciliationStatus"
                    )
                    or ""
                ),
                bool((linked_references.get("objectsOfIssue") or {}).get("available")),
            ),
            "detail": (
                "Objects of the Issue capex/expansion approval plan cross-check."
                if (linked_references.get("objectsOfIssue") or {}).get("available")
                else "Objects of the Issue linked data not yet available."
            ),
        },
        "ipoSetup": {
            "status": _reconciliation_status_label(
                str((reconciliation.get("ipoSetupReconciliation") or {}).get("reconciliationStatus") or ""),
                bool((linked_references.get("ipoSetup") or {}).get("available")),
            ),
            "detail": (
                "IPO Setup & Eligibility debarment and serious proceedings declarations cross-check."
                if (linked_references.get("ipoSetup") or {}).get("available")
                else "IPO Setup & Eligibility linked data not yet available."
            ),
        },
    }


def _build_creditor_totals(payload: dict[str, Any]) -> dict[str, Any]:
    section = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}
    aggregates = section.get("creditorAggregateInputs") or {}
    creditors = [c for c in (section.get("materialCreditors") or []) if isinstance(c, dict)]

    material_outstanding = str(aggregates.get("materialCreditorAmount") or "") or add_decimals(
        *[
            str(c.get("amountOutstanding") or "")
            for c in creditors
            if c.get("msmeStatus") != "yes"
        ]
    )
    msme_outstanding = str(aggregates.get("msmeOutstandingAmount") or "") or add_decimals(
        *[str(c.get("amountOutstanding") or "") for c in creditors if c.get("msmeStatus") == "yes"]
    )

    return {
        "materialCreditorCount": sum(1 for c in creditors if c.get("msmeStatus") != "yes"),
        "msmeCreditorCount": sum(1 for c in creditors if c.get("msmeStatus") == "yes"),
        "materialOutstanding": material_outstanding,
        "msmeOutstanding": msme_outstanding,
        "aggregateOutstanding": add_decimals(material_outstanding, msme_outstanding),
        "reconciliationDifference": str(aggregates.get("reconciliationDifference") or ""),
        "reconciliationStatus": str(aggregates.get("reconciliationStatus") or ""),
    }


def compute_litigation_approvals_compliance_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    matters = get_matters(payload)
    approvals = get_approvals(payload)
    section6 = payload.get("corporateStatutoryAndOperationalComplianceExceptions") or {}
    section5 = payload.get("approvalConditionsFacilityComplianceAndRenewalReadiness") or {}
    as_of = datetime.now(tz=UTC)

    delayed_statutory_dues = 0
    for due in section6.get("statutoryDues") or []:
        if not isinstance(due, dict):
            continue
        delay = parse_decimal(str(due.get("delayDays") or ""))
        if delay is None and due.get("dueDate") and due.get("paymentDate"):
            delay = days_between_dates(str(due.get("dueDate")), str(due.get("paymentDate")))
        if delay is not None and delay > 0:
            delayed_statutory_dues += 1

    approval_conditions_outstanding = sum(
        1
        for condition in (section5.get("approvalConditions") or [])
        if isinstance(condition, dict)
        and condition.get("complianceStatus") in {"pending", "delayed", "not-sure"}
    )

    snapshot = (payload.get("legalUniverseMaterialityPolicyAndPartyMapping") or {}).get(
        "legalDdSnapshot"
    ) or {}

    return {
        "matterCount": len(matters),
        "mattersByCategory": _build_matters_by_category(matters),
        "criminalMatterCount": sum(1 for m in matters if is_criminal_matter(m)),
        "taxMatterCount": sum(1 for m in matters if is_tax_matter(m)),
        "pendingOutcomeCount": sum(
            1
            for m in matters
            if (m.get("statusOutcome") or {}).get("outcomeStatus")
            in {"pending", "appeal-pending", ""}
        ),
        "exposureByCurrency": _build_exposure_by_currency(matters),
        "taxAggregates": _build_tax_aggregates(payload),
        "approvalCount": len(approvals),
        "expiredApprovalCount": sum(
            1
            for a in approvals
            if a.get("status") in {"expired-renewal-applied", "expired-renewal-not-applied"}
        ),
        "renewalPendingCount": sum(
            1 for a in approvals if a.get("status") in {"renewal-pending", "application-pending"}
        ),
        "approvalExpiryWindows": _build_approval_expiry_windows(payload, as_of),
        "complianceCounts": {
            "domainReviewCount": len(section6.get("complianceDomainReviews") or []),
            "domainsWithKnownExceptions": sum(
                1
                for review in (section6.get("complianceDomainReviews") or [])
                if isinstance(review, dict) and review.get("knownExceptions") == "yes"
            ),
            "complianceIssueCount": len(section6.get("complianceIssues") or []),
            "continuingIssues": sum(
                1
                for issue in (section6.get("complianceIssues") or [])
                if isinstance(issue, dict) and issue.get("continuing") == "yes"
            ),
            "statutoryDueCount": len(section6.get("statutoryDues") or []),
            "delayedStatutoryDues": delayed_statutory_dues,
            "approvalConditionsOutstanding": approval_conditions_outstanding,
        },
        "creditorTotals": _build_creditor_totals(payload),
        "remediationOpenCount": sum(
            1
            for action in (
                (payload.get("reconciliationRemediationAndIssuerConfirmations") or {}).get(
                    "remediationActions"
                )
                or []
            )
            if isinstance(action, dict)
            and action.get("status") in {"open", "in-progress", "blocked"}
        ),
        "legalDdAsOfDate": str(snapshot.get("legalDdAsOfDate") or ""),
        "reconciliation": _build_reconciliation_preview(payload, linked_references),
    }
