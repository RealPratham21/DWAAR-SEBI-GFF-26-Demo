"""Derived, non-persisted computations for Objects of the Issue — ports compute.ts."""

from __future__ import annotations

from typing import Any

from app.modules.objects_issue import decimal_math as dm
from app.modules.objects_issue.gcp import calculate_gcp_cap

RECONCILIATION_TOLERANCE = "1"


def _subtract_safe(a: str, b: str) -> str:
    if not dm.is_filled(a):
        return ""
    return dm.subtract(a, b if dm.is_filled(b) else "0")


def _is_pure_ofs(proceeds: dict[str, Any], ipo_reference: dict[str, Any] | None) -> bool:
    if proceeds.get("declaredOfferType") == "offer-for-sale":
        return True
    if ipo_reference and ipo_reference.get("available") is True:
        return ipo_reference.get("proposedOfferType") == "offer-for-sale"
    return False


def _build_reconciliation_checks(args: dict[str, Any]) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []

    checks.append(
        {
            "id": "net-proceeds-known",
            "label": "Net fresh-issue proceeds are known",
            "status": (
                "not_applicable"
                if args["isPureOfs"]
                else ("reconciled" if dm.is_filled(args["netFreshIssueProceeds"]) else "pending")
            ),
            "detail": (
                "Pure offer for sale — the issuer receives no fresh-issue proceeds."
                if args["isPureOfs"]
                else (
                    "Gross fresh-issue proceeds and issue expenses are recorded."
                    if dm.is_filled(args["netFreshIssueProceeds"])
                    else "Gross fresh-issue proceeds are not yet recorded."
                )
            ),
        }
    )

    checks.append(
        {
            "id": "allocation-reconciles",
            "label": "Object allocation reconciles to estimated cost",
            "status": (
                "not_applicable"
                if args["isPureOfs"]
                else (
                    "pending"
                    if not dm.is_filled(args["totalEstimatedObjectsCost"])
                    or not dm.is_filled(args["totalAllocatedFromAllSources"])
                    else ("reconciled" if args["allocationReconciles"] else "variance")
                )
            ),
            "detail": (
                "Sum of amounts funded from net proceeds, internal accruals and other sources "
                "vs. total estimated cost of the objects."
            ),
        }
    )

    checks.append(
        {
            "id": "means-of-finance-reconciles",
            "label": "Means of finance reconciles to estimated cost",
            "status": (
                "pending"
                if not dm.is_filled(args["totalEstimatedObjectsCost"])
                or not dm.is_filled(args["totalMeansOfFinance"])
                else ("reconciled" if args["meansOfFinanceReconciles"] else "variance")
            ),
            "detail": "Total means of finance vs. total estimated cost of the objects.",
        }
    )

    checks.append(
        {
            "id": "gcp-within-limit",
            "label": "General Corporate Purposes within the applicable SME cap",
            "status": (
                "not_applicable"
                if args["isPureOfs"]
                else (
                    "pending"
                    if not dm.is_filled(args["gcpPercentageOfFreshIssue"])
                    else ("reconciled" if args["gcpWithinLimit"] else "variance")
                )
            ),
            "detail": (
                "Lower of 15% of fresh issue proceeds and ₹10 crore (versioned helper). "
                "Issue expenses are excluded from GCP."
            ),
        }
    )

    checks.append(
        {
            "id": "related-party-borrowing",
            "label": "Related-party loan repayment",
            "status": "variance" if args["relatedPartyBorrowingFlag"] else "reconciled",
            "detail": (
                "Repayment proposed to a promoter, promoter-group member or related-party lender "
                "— treated as a blocking concern."
                if args["relatedPartyBorrowingFlag"]
                else "No related-party lender is currently flagged for repayment."
            ),
        }
    )

    checks.append(
        {
            "id": "related-party-investment",
            "label": "No related-party counterparty flagged for acquisitions or investments",
            "status": "variance" if args["relatedPartyInvestmentFlag"] else "reconciled",
            "detail": (
                "One or more proposed acquisitions or investments involve a related party."
                if args["relatedPartyInvestmentFlag"]
                else "No related-party counterparty is currently flagged."
            ),
        }
    )

    return checks


def compute_objects_of_issue_model(
    payload: dict[str, Any],
    ipo_reference: dict[str, Any] | None = None,
) -> dict[str, Any]:
    proceeds = payload.get("proceedsAndFundingSummary") or {}
    is_pure_ofs = _is_pure_ofs(proceeds, ipo_reference)

    net_fresh_issue_proceeds = (
        ""
        if is_pure_ofs
        else _subtract_safe(
            proceeds.get("freshIssueGrossProceeds", ""),
            proceeds.get("estimatedIssueRelatedExpenses", ""),
        )
    )

    register = payload.get("objectsRegisterAndAllocation") or {}
    objects = register.get("objects") or []
    total_estimated_objects_cost = dm.sum_decimals([item.get("estimatedCost") for item in objects])
    total_allocated_from_net_proceeds = dm.sum_decimals(
        [item.get("amountFromNetProceeds") for item in objects]
    )
    total_allocated_from_all_sources = dm.sum_decimals(
        [
            amount
            for item in objects
            for amount in (
                item.get("amountFromNetProceeds"),
                item.get("amountFromInternalAccruals"),
                item.get("amountFromOtherSources"),
            )
        ]
    )
    unallocated_net_proceeds = _subtract_safe(
        net_fresh_issue_proceeds, total_allocated_from_net_proceeds
    )
    allocation_reconciles = (
        is_pure_ofs
        or not dm.is_filled(total_estimated_objects_cost)
        or not dm.is_filled(total_allocated_from_all_sources)
        or not dm.differs_beyond(
            total_estimated_objects_cost,
            total_allocated_from_all_sources,
            RECONCILIATION_TOLERANCE,
        )
    )

    has_capex_relevant_objects = any(
        item.get("objectCategory") == "capital-expenditure" for item in objects
    )
    capex_section = payload.get("capitalExpenditureFacilitiesAndExpansion") or {}
    capex_items = capex_section.get("capexItems") or []
    total_capex_cost = dm.sum_decimals([item.get("estimatedCost") for item in capex_items])

    has_acquisition_relevant_objects = any(
        item.get("objectCategory") == "acquisition-or-investment" for item in objects
    )
    acquisitions = payload.get("acquisitionsSubsidiariesJvsAndInvestments") or {}
    investment_items = acquisitions.get("investmentItems") or []
    total_investment_amount = dm.sum_decimals(
        [item.get("estimatedAmount") for item in investment_items]
    )
    related_party_investment_flag = any(
        item.get("isRelatedPartyTransaction") == "yes" for item in investment_items
    )

    working_capital = payload.get("workingCapitalAndBorrowingRepayment") or {}
    borrowing_items = working_capital.get("borrowingRepaymentItems") or []
    total_borrowing_repayment = dm.sum_decimals(
        [item.get("amountProposedForRepayment") for item in borrowing_items]
    )
    related_party_borrowing_flag = any(
        item.get("isRelatedPartyLender") == "yes" for item in borrowing_items
    )

    means_of_finance = payload.get("meansOfFinanceAndDeploymentSchedule") or {}
    total_means_of_finance = dm.sum_decimals(
        [row.get("amount") for row in means_of_finance.get("meansOfFinanceRows") or []]
    )
    total_deployment_scheduled = dm.sum_decimals(
        [
            row.get("amountToBeDeployed")
            for row in means_of_finance.get("deploymentScheduleRows") or []
        ]
    )
    means_of_finance_reconciles = (
        not dm.is_filled(total_estimated_objects_cost)
        or not dm.is_filled(total_means_of_finance)
        or not dm.differs_beyond(
            total_estimated_objects_cost, total_means_of_finance, RECONCILIATION_TOLERANCE
        )
    )

    expenses = payload.get("expensesGcpMonitoringAndConfirmations") or {}
    total_issue_expenses = dm.sum_decimals(
        [item.get("estimatedAmount") for item in expenses.get("issueExpenseItems") or []]
    )
    gcp_cap = calculate_gcp_cap(proceeds.get("freshIssueGrossProceeds", ""))
    gcp_percentage_of_fresh_issue = (
        ""
        if is_pure_ofs
        else dm.pct(
            expenses.get("generalCorporatePurposesAmount", ""),
            proceeds.get("freshIssueGrossProceeds", ""),
            2,
        )
    )
    gcp_within_limit = (
        is_pure_ofs
        or not dm.is_filled(expenses.get("generalCorporatePurposesAmount"))
        or not dm.is_filled(gcp_cap["applicableCap"])
        or (dm.compare(expenses.get("generalCorporatePurposesAmount"), gcp_cap["applicableCap"]) or 0)
        <= 0
    )
    gcp_includes_issue_expenses = False

    counts = {
        "objects": len(objects),
        "capexItems": len(capex_items),
        "borrowingRepaymentItems": len(borrowing_items),
        "investmentItems": len(investment_items),
        "meansOfFinanceRows": len(means_of_finance.get("meansOfFinanceRows") or []),
        "deploymentScheduleRows": len(means_of_finance.get("deploymentScheduleRows") or []),
        "issueExpenseItems": len(expenses.get("issueExpenseItems") or []),
    }

    reconciliation = _build_reconciliation_checks(
        {
            "isPureOfs": is_pure_ofs,
            "netFreshIssueProceeds": net_fresh_issue_proceeds,
            "totalEstimatedObjectsCost": total_estimated_objects_cost,
            "totalAllocatedFromAllSources": total_allocated_from_all_sources,
            "allocationReconciles": allocation_reconciles,
            "totalMeansOfFinance": total_means_of_finance,
            "meansOfFinanceReconciles": means_of_finance_reconciles,
            "gcpWithinLimit": gcp_within_limit,
            "gcpApplicableCap": gcp_cap["applicableCap"],
            "gcpPercentageOfFreshIssue": gcp_percentage_of_fresh_issue,
            "relatedPartyBorrowingFlag": related_party_borrowing_flag,
            "relatedPartyInvestmentFlag": related_party_investment_flag,
        }
    )

    return {
        "isPureOfs": is_pure_ofs,
        "netFreshIssueProceeds": net_fresh_issue_proceeds,
        "totalEstimatedObjectsCost": total_estimated_objects_cost,
        "totalAllocatedFromNetProceeds": total_allocated_from_net_proceeds,
        "totalAllocatedFromAllSources": total_allocated_from_all_sources,
        "unallocatedNetProceeds": unallocated_net_proceeds,
        "allocationReconciles": allocation_reconciles,
        "hasCapexRelevantObjects": has_capex_relevant_objects,
        "totalCapexCost": total_capex_cost,
        "hasAcquisitionRelevantObjects": has_acquisition_relevant_objects,
        "totalInvestmentAmount": total_investment_amount,
        "relatedPartyInvestmentFlag": related_party_investment_flag,
        "totalBorrowingRepayment": total_borrowing_repayment,
        "relatedPartyBorrowingFlag": related_party_borrowing_flag,
        "totalMeansOfFinance": total_means_of_finance,
        "totalDeploymentScheduled": total_deployment_scheduled,
        "meansOfFinanceReconciles": means_of_finance_reconciles,
        "totalIssueExpenses": total_issue_expenses,
        "gcpPercentageOfFreshIssue": gcp_percentage_of_fresh_issue,
        "gcpApplicableCap": gcp_cap["applicableCap"],
        "gcpWithinLimit": gcp_within_limit,
        "gcpIncludesIssueExpenses": gcp_includes_issue_expenses,
        "counts": counts,
        "reconciliation": reconciliation,
    }
