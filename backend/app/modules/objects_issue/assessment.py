"""Objects Assessment for Objects of the Issue — ports assessment.ts."""

from __future__ import annotations

from typing import Any

from app.modules.objects_issue.compute import compute_objects_of_issue_model
from app.modules.objects_issue.progress import calculate_progress

OBJECTS_CRITERION_STATES = (
    "reconciled",
    "potential_concern",
    "missing_information",
    "pending_linked_workstream",
    "pending_supporting_source",
    "blocked",
    "pending_professional_confirmation",
    "not_applicable",
)

OBJECTS_ASSESSMENT_GROUPS = (
    "proceeds-reconciliation",
    "object-substantiation",
    "capex-project-readiness",
    "working-capital-and-borrowing-repayment",
    "means-of-finance-and-deployment",
    "sme-specific-limits",
    "governance-and-confirmations",
)

OBJECTS_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "proceeds-reconciliation": "Proceeds reconciliation",
    "object-substantiation": "Object substantiation",
    "capex-project-readiness": "Capex / project readiness",
    "working-capital-and-borrowing-repayment": "Working capital and borrowing repayment",
    "means-of-finance-and-deployment": "Means of finance and deployment",
    "sme-specific-limits": "SME-specific limits",
    "governance-and-confirmations": "Governance and confirmations",
}

STATE_PRIORITY = (
    "blocked",
    "potential_concern",
    "pending_professional_confirmation",
    "pending_linked_workstream",
    "pending_supporting_source",
    "missing_information",
    "reconciled",
    "not_applicable",
)


def _empty_ipo_reference() -> dict[str, Any]:
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


def _headline_of(criteria: list[dict[str, Any]]) -> str:
    for state in STATE_PRIORITY:
        if any(criterion["state"] == state for criterion in criteria):
            return state
    return "not_applicable"


def _criterion(id_: str, label: str, state: str, reason: str) -> dict[str, Any]:
    return {"id": id_, "label": label, "state": state, "reason": reason}


def _derive_result(counts: dict[str, int]) -> str:
    if counts.get("blocked", 0) > 0:
        return "blocking_concerns_identified"
    if counts.get("potential_concern", 0) > 0:
        return "potential_concerns_identified"
    if counts.get("missing_information", 0) > 0:
        return "disclosure_in_progress"
    return "no_blocking_concerns"


def assess_objects_of_issue(
    payload: dict[str, Any],
    ipo_reference: dict[str, Any] | None = None,
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ipo_reference = ipo_reference or _empty_ipo_reference()
    linked_references = linked_references or {}

    model = compute_objects_of_issue_model(payload, ipo_reference)
    progress = calculate_progress(payload)
    expenses = payload.get("expensesGcpMonitoringAndConfirmations") or {}
    confirmations = expenses.get("confirmations") or {}
    unanswered_confirmations = sum(1 for value in confirmations.values() if not value)

    groups: list[dict[str, Any]] = []

    # Proceeds reconciliation
    proceeds = payload.get("proceedsAndFundingSummary") or {}
    proceeds_criteria = [
        _criterion(
            "ofs-proceeds-excluded",
            "OFS proceeds excluded from issuer utilisation",
            "reconciled" if model["isPureOfs"] else "not_applicable",
            (
                "Pure offer for sale — the issuer receives no offer proceeds; "
                "fund-utilisation objects are not applicable."
                if model["isPureOfs"]
                else "Fresh issue or mixed offer — issuer proceeds utilisation applies."
            ),
        ),
        _criterion(
            "net-proceeds-calculated",
            "Net proceeds calculated",
            (
                "not_applicable"
                if model["isPureOfs"]
                else ("reconciled" if model["netFreshIssueProceeds"] else "missing_information")
            ),
            (
                "Not applicable for a pure offer for sale."
                if model["isPureOfs"]
                else (
                    "Derived from gross fresh-issue proceeds less estimated issue-related expenses."
                    if model["netFreshIssueProceeds"]
                    else "Gross fresh-issue proceeds or issue expenses are not yet recorded."
                )
            ),
        ),
        _criterion(
            "ipo-setup-linked",
            "Offer terms linked from IPO Setup & Eligibility",
            "reconciled" if ipo_reference.get("available") else "pending_linked_workstream",
            (
                "Offer type and sizing are read from IPO Setup & Eligibility."
                if ipo_reference.get("available")
                else "IPO Setup & Eligibility is not yet wired — offer terms are entered manually in O1."
            ),
        ),
        _criterion(
            "declared-offer-type-recorded",
            "Declared offer type is recorded",
            "reconciled" if proceeds.get("declaredOfferType") else "missing_information",
            (
                f"Declared offer type: {proceeds.get('declaredOfferType')}."
                if proceeds.get("declaredOfferType")
                else "Declared offer type has not been recorded yet."
            ),
        ),
    ]
    groups.append(
        {
            "group": "proceeds-reconciliation",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["proceeds-reconciliation"],
            "headlineState": _headline_of(proceeds_criteria),
            "criteria": proceeds_criteria,
        }
    )

    # Object substantiation
    register = payload.get("objectsRegisterAndAllocation") or {}
    objects = register.get("objects") or []
    objects_with_basis = sum(
        1 for obj in objects if obj.get("estimatedCost") and obj.get("description")
    )
    object_criteria = [
        _criterion(
            "objects-register-recorded",
            "Objects register is recorded",
            "missing_information" if len(objects) == 0 else "reconciled",
            (
                "No object of the issue has been recorded yet."
                if len(objects) == 0
                else f"{len(objects)} object(s) recorded."
            ),
        ),
        _criterion(
            "object-allocations-reconcile",
            "Object allocations reconcile to estimated cost",
            (
                "not_applicable"
                if model["isPureOfs"]
                else (
                    "missing_information"
                    if not model["totalEstimatedObjectsCost"] or not model["totalAllocatedFromAllSources"]
                    else ("reconciled" if model["allocationReconciles"] else "potential_concern")
                )
            ),
            (
                "Fund-utilisation objects are not applicable for a pure offer for sale."
                if model["isPureOfs"]
                else (
                    "Compares total estimated cost against amounts from net proceeds, "
                    "internal accruals and other sources."
                )
            ),
        ),
        _criterion(
            "unallocated-net-proceeds-identified",
            "Unallocated net proceeds identified",
            (
                "not_applicable"
                if model["isPureOfs"]
                else ("missing_information" if not model["netFreshIssueProceeds"] else "reconciled")
            ),
            (
                "Not applicable for a pure offer for sale."
                if model["isPureOfs"]
                else (
                    f"Unallocated net proceeds: ₹{model['unallocatedNetProceeds']}."
                    if model["unallocatedNetProceeds"]
                    else "Net proceeds are fully allocated across objects."
                )
            ),
        ),
        _criterion(
            "material-objects-have-basis",
            "Material objects have an amount and basis",
            (
                "missing_information"
                if len(objects) == 0
                else (
                    "missing_information"
                    if any(not obj.get("estimatedCost") or not obj.get("description") for obj in objects)
                    else (
                        "potential_concern"
                        if register.get("objectsAreFinalised") == "no"
                        else "reconciled"
                    )
                )
            ),
            (
                "No objects recorded yet."
                if len(objects) == 0
                else f"{objects_with_basis} of {len(objects)} object(s) have cost and purpose recorded."
            ),
        ),
    ]
    groups.append(
        {
            "group": "object-substantiation",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["object-substantiation"],
            "headlineState": _headline_of(object_criteria),
            "criteria": object_criteria,
        }
    )

    # Capex / project readiness
    capex = payload.get("capitalExpenditureFacilitiesAndExpansion") or {}
    capex_items = capex.get("capexItems") or []
    related_party_capex = any(item.get("relatedPartyPurchase") == "yes" for item in capex_items)
    capex_criteria = [
        _criterion(
            "capex-items-recorded",
            "Capex projects recorded where relevant",
            (
                "reconciled"
                if model["hasCapexRelevantObjects"]
                and len(capex_items) > 0
                or (not model["hasCapexRelevantObjects"] and len(capex_items) > 0)
                else (
                    "missing_information"
                    if model["hasCapexRelevantObjects"] and len(capex_items) == 0
                    else "not_applicable"
                )
            ),
            (
                "The objects register includes a capital-expenditure object, "
                "but no capex item has been entered yet."
                if model["hasCapexRelevantObjects"] and len(capex_items) == 0
                else f"{len(capex_items)} capex item(s) recorded."
            ),
        ),
        _criterion(
            "capex-costs-reconcile",
            "Capex costs and funding reconcile",
            (
                "not_applicable"
                if not model["hasCapexRelevantObjects"] or len(capex_items) == 0
                else (
                    "reconciled"
                    if model["totalCapexCost"] and model["totalEstimatedObjectsCost"]
                    else "missing_information"
                )
            ),
            (
                "Capex project costs are tracked against the objects register in O1; "
                "detailed cost line reconciliation is expanded in O2."
            ),
        ),
        _criterion(
            "capex-related-party-purchases",
            "Related-party capex purchases disclosed",
            (
                "not_applicable"
                if len(capex_items) == 0
                else ("potential_concern" if related_party_capex else "reconciled")
            ),
            (
                "One or more capex items are flagged as a related-party purchase."
                if related_party_capex
                else "No capex item is currently flagged as a related-party purchase."
            ),
        ),
    ]
    groups.append(
        {
            "group": "capex-project-readiness",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["capex-project-readiness"],
            "headlineState": _headline_of(capex_criteria),
            "criteria": capex_criteria,
        }
    )

    # Working capital and borrowing repayment
    working_capital = payload.get("workingCapitalAndBorrowingRepayment") or {}
    borrowing_items = working_capital.get("borrowingRepaymentItems") or []

    def _repayment_exceeds_outstanding(item: dict[str, Any]) -> bool:
        outstanding = item.get("outstandingAmount")
        proposed = item.get("amountProposedForRepayment")
        if not outstanding or not proposed:
            return False
        try:
            return float(proposed) > float(outstanding)
        except ValueError:
            return False

    wc_criteria = [
        _criterion(
            "working-capital-supported",
            "Working capital amount is supported",
            "reconciled" if working_capital.get("workingCapitalRequirementAmount") else "missing_information",
            (
                f"Methodology: {working_capital.get('workingCapitalMethodology') or 'not recorded'}."
                if working_capital.get("workingCapitalRequirementAmount")
                else "Working capital requirement has not been recorded yet."
            ),
        ),
        _criterion(
            "debt-repayment-within-outstanding",
            "Debt repayment does not exceed outstanding balance",
            (
                "not_applicable"
                if len(borrowing_items) == 0
                else (
                    "potential_concern"
                    if any(_repayment_exceeds_outstanding(item) for item in borrowing_items)
                    else "reconciled"
                )
            ),
            "Each proposed repayment is compared against the recorded outstanding balance.",
        ),
        _criterion(
            "related-party-repayment",
            "Related-party loan repayment",
            (
                "not_applicable"
                if len(borrowing_items) == 0
                else ("blocked" if model["relatedPartyBorrowingFlag"] else "reconciled")
            ),
            (
                "Repayment proposed to a promoter, promoter-group member or related-party lender "
                "— blocking concern."
                if model["relatedPartyBorrowingFlag"]
                else "No related-party lender is currently flagged for repayment."
            ),
        ),
    ]
    groups.append(
        {
            "group": "working-capital-and-borrowing-repayment",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["working-capital-and-borrowing-repayment"],
            "headlineState": _headline_of(wc_criteria),
            "criteria": wc_criteria,
        }
    )

    # Means of finance and deployment
    means_of_finance = payload.get("meansOfFinanceAndDeploymentSchedule") or {}
    mof_criteria = [
        _criterion(
            "means-of-finance-reconcile",
            "Means of finance reconcile to object costs",
            (
                "missing_information"
                if not model["totalEstimatedObjectsCost"] or not model["totalMeansOfFinance"]
                else ("reconciled" if model["meansOfFinanceReconciles"] else "potential_concern")
            ),
            "Compares the total means of finance against the total estimated cost of the objects.",
        ),
        _criterion(
            "deployment-schedule-exists",
            "Deployment schedule exists",
            (
                "missing_information"
                if len(means_of_finance.get("deploymentScheduleRows") or []) == 0
                else "reconciled"
            ),
            (
                "No deployment schedule row has been recorded yet."
                if len(means_of_finance.get("deploymentScheduleRows") or []) == 0
                else f"{len(means_of_finance.get('deploymentScheduleRows') or [])} deployment schedule row(s) recorded."
            ),
        ),
        _criterion(
            "bridge-finance-disclosed",
            "Bridge or temporary financing disclosed",
            (
                "potential_concern"
                if means_of_finance.get("fundingTieUpStatus") == "not-tied-up"
                else (
                    "reconciled"
                    if means_of_finance.get("fundingTieUpStatus")
                    else "missing_information"
                )
            ),
            means_of_finance.get("fundingTieUpDetails") or "Funding tie-up status not recorded yet.",
        ),
    ]
    groups.append(
        {
            "group": "means-of-finance-and-deployment",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["means-of-finance-and-deployment"],
            "headlineState": _headline_of(mof_criteria),
            "criteria": mof_criteria,
        }
    )

    # SME-specific limits
    sme_criteria = [
        _criterion(
            "gcp-within-limit",
            "GCP remains within the applicable limit",
            (
                "not_applicable"
                if model["isPureOfs"]
                else (
                    "missing_information"
                    if not expenses.get("generalCorporatePurposesAmount")
                    else ("reconciled" if model["gcpWithinLimit"] else "potential_concern")
                )
            ),
            (
                f"GCP is within the applicable cap (lower of 15% of fresh issue proceeds or ₹10 crore). "
                f"Applicable cap: ₹{model['gcpApplicableCap'] or '—'}."
                if model["gcpWithinLimit"]
                else "General Corporate Purposes exceeds the applicable SME cap."
            ),
        ),
        _criterion(
            "issue-expenses-excluded-from-gcp",
            "Issue expenses excluded from GCP",
            "potential_concern" if model["gcpIncludesIssueExpenses"] else "reconciled",
            "Issue expenses are tracked separately from General Corporate Purposes by product rule.",
        ),
    ]
    groups.append(
        {
            "group": "sme-specific-limits",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["sme-specific-limits"],
            "headlineState": _headline_of(sme_criteria),
            "criteria": sme_criteria,
        }
    )

    # Governance and confirmations
    acquisitions = payload.get("acquisitionsSubsidiariesJvsAndInvestments") or {}
    monitoring_status = expenses.get("monitoringAgencyStatus") or ""
    gov_criteria = [
        _criterion(
            "monitoring-applicability-answered",
            "Monitoring agency applicability is answered",
            (
                "not_applicable"
                if monitoring_status == "not-applicable"
                else (
                    "reconciled"
                    if monitoring_status == "appointed"
                    else (
                        "pending_supporting_source"
                        if monitoring_status
                        else "missing_information"
                    )
                )
            ),
            (
                f"Monitoring agency: {expenses.get('monitoringAgencyName')}."
                if expenses.get("monitoringAgencyName")
                else "Monitoring agency status not fully recorded yet."
            ),
        ),
        _criterion(
            "acquisition-related-party",
            "Acquisition related-party counterparty disclosed",
            (
                "not_applicable"
                if len(acquisitions.get("investmentItems") or []) == 0
                else ("potential_concern" if model["relatedPartyInvestmentFlag"] else "reconciled")
            ),
            (
                "One or more proposed acquisitions or investments involve a related party."
                if model["relatedPartyInvestmentFlag"]
                else "No related-party counterparty is currently flagged."
            ),
        ),
        _criterion(
            "issuer-confirmations-complete",
            "Issuer confirmations are complete",
            (
                "reconciled"
                if unanswered_confirmations == 0
                else "pending_professional_confirmation"
            ),
            (
                "All issuer confirmations are checked."
                if unanswered_confirmations == 0
                else f"{unanswered_confirmations} confirmation(s) are not yet checked."
            ),
        ),
    ]
    groups.append(
        {
            "group": "governance-and-confirmations",
            "label": OBJECTS_ASSESSMENT_GROUP_LABELS["governance-and-confirmations"],
            "headlineState": _headline_of(gov_criteria),
            "criteria": gov_criteria,
        }
    )

    del linked_references

    for group in groups:
        group_counts = {
            state: sum(1 for item in group["criteria"] if item["state"] == state)
            for state in OBJECTS_CRITERION_STATES
        }
        group["counts"] = group_counts

    criteria = [item for group in groups for item in group["criteria"]]
    counts = {state: sum(1 for item in criteria if item["state"] == state) for state in OBJECTS_CRITERION_STATES}
    blocking_concerns = counts.get("blocked", 0) + counts.get("potential_concern", 0)

    metrics = {
        "objects": len(objects),
        "sectionsComplete": progress["sectionsComplete"],
        "unansweredConfirmations": unanswered_confirmations,
        "unreconciledChecks": sum(
            1 for check in model["reconciliation"] if check["status"] == "variance"
        ),
        "blockingConcerns": blocking_concerns,
        "netFreshIssueProceeds": model["netFreshIssueProceeds"],
        "totalEstimatedObjectsCost": model["totalEstimatedObjectsCost"],
    }

    result_label = (
        f"{counts.get('blocked', 0)} blocking concern(s) identified"
        if counts.get("blocked", 0) > 0
        else (
            f"{counts.get('potential_concern', 0)} potential concern(s) to review"
            if counts.get("potential_concern", 0) > 0
            else (
                "Disclosure readiness in progress"
                if counts.get("missing_information", 0) > 0
                else "No blocking concerns currently identified"
            )
        )
    )

    summary = (
        "This is a disclosure-readiness view derived from the current in-memory draft, "
        "not a strong-or-weak score or a substitute for professional advice. "
        "Unanswered questions are treated as missing information, never as a negative declaration."
    )

    return {
        "result": _derive_result(counts),
        "resultLabel": result_label,
        "summary": summary,
        "metrics": metrics,
        "counts": counts,
        "groups": groups,
        "criteria": criteria,
    }
