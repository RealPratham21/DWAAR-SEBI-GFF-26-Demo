"""Section completeness for Objects of the Issue — ports progress.ts."""

from __future__ import annotations

from typing import Any

from app.modules.objects_issue import decimal_math as dm
from app.modules.objects_issue.constants import SECTION_IDS


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    return True


def _status_from(any_filled: bool, all_required_filled: bool) -> str:
    if all_required_filled:
        return "complete"
    if any_filled:
        return "in_progress"
    return "not_started"


def _is_object_complete(obj: dict[str, Any]) -> bool:
    return (
        _filled(obj.get("objectName"))
        and _filled(obj.get("objectCategory"))
        and _filled(obj.get("estimatedCost"))
    )


def _is_object_started(obj: dict[str, Any]) -> bool:
    return (
        _filled(obj.get("objectName"))
        or _filled(obj.get("objectCategory"))
        or _filled(obj.get("estimatedCost"))
        or _filled(obj.get("description"))
    )


def evaluate_proceeds_and_funding_status(payload: dict[str, Any]) -> str:
    value = payload.get("proceedsAndFundingSummary") or {}
    is_pure_ofs = value.get("declaredOfferType") == "offer-for-sale"
    any_filled = any(
        [
            _filled(value.get("declaredOfferType")),
            _filled(value.get("freshIssueGrossProceeds")),
            _filled(value.get("estimatedIssueRelatedExpenses")),
            _filled(value.get("issueMadeToRaiseFundsForObjects")),
            _filled(value.get("schemeOfArrangementInvolved")),
            _filled(value.get("offerForSaleProceedsNote")),
            _filled(value.get("notes")),
        ]
    )
    required = (
        _filled(value.get("declaredOfferType")) and _filled(value.get("offerForSaleProceedsNote"))
        if is_pure_ofs
        else (
            _filled(value.get("declaredOfferType"))
            and _filled(value.get("issueMadeToRaiseFundsForObjects"))
            and _filled(value.get("freshIssueGrossProceeds"))
        )
    )
    return _status_from(any_filled, required)


def evaluate_objects_register_status(payload: dict[str, Any]) -> str:
    value = payload.get("objectsRegisterAndAllocation") or {}
    objects = value.get("objects") or []
    any_filled = (
        any(_is_object_started(obj) for obj in objects)
        or _filled(value.get("objectsAreFinalised"))
        or _filled(value.get("notes"))
    )
    required = (
        len(objects) > 0
        and all(_is_object_complete(obj) for obj in objects)
        and _filled(value.get("objectsAreFinalised"))
    )
    return _status_from(any_filled, required)


def _is_capex_item_complete(item: dict[str, Any]) -> bool:
    return _filled(item.get("itemType")) and _filled(item.get("estimatedCost"))


def _is_capex_item_started(item: dict[str, Any]) -> bool:
    return (
        _filled(item.get("itemType"))
        or _filled(item.get("estimatedCost"))
        or _filled(item.get("description"))
    )


def evaluate_capex_status(payload: dict[str, Any]) -> str:
    value = payload.get("capitalExpenditureFacilitiesAndExpansion") or {}
    capex_items = value.get("capexItems") or []
    if len(capex_items) == 0:
        return "complete" if _filled(value.get("notApplicableNote")) else "not_started"
    any_filled = any(_is_capex_item_started(item) for item in capex_items) or _filled(value.get("notes"))
    required = all(_is_capex_item_complete(item) for item in capex_items)
    return _status_from(any_filled, required)


def _is_borrowing_item_complete(item: dict[str, Any]) -> bool:
    return _filled(item.get("lenderName")) and _filled(item.get("amountProposedForRepayment"))


def _is_borrowing_item_started(item: dict[str, Any]) -> bool:
    return (
        _filled(item.get("lenderName"))
        or _filled(item.get("outstandingAmount"))
        or _filled(item.get("amountProposedForRepayment"))
    )


def evaluate_working_capital_status(payload: dict[str, Any]) -> str:
    value = payload.get("workingCapitalAndBorrowingRepayment") or {}
    borrowing_items = value.get("borrowingRepaymentItems") or []
    any_filled = any(
        [
            _filled(value.get("workingCapitalRequirementAmount")),
            _filled(value.get("workingCapitalMethodology")),
            any(_is_borrowing_item_started(item) for item in borrowing_items),
            _filled(value.get("notes")),
        ]
    )
    required = _filled(value.get("workingCapitalRequirementAmount")) and all(
        _is_borrowing_item_complete(item) for item in borrowing_items
    )
    return _status_from(any_filled, required)


def _is_investment_item_complete(item: dict[str, Any]) -> bool:
    return (
        _filled(item.get("targetEntityName"))
        and _filled(item.get("transactionType"))
        and _filled(item.get("estimatedAmount"))
    )


def _is_investment_item_started(item: dict[str, Any]) -> bool:
    return (
        _filled(item.get("targetEntityName"))
        or _filled(item.get("transactionType"))
        or _filled(item.get("estimatedAmount"))
    )


def evaluate_acquisitions_status(payload: dict[str, Any]) -> str:
    value = payload.get("acquisitionsSubsidiariesJvsAndInvestments") or {}
    investment_items = value.get("investmentItems") or []
    if len(investment_items) == 0:
        return "in_progress" if _filled(value.get("notes")) else "not_started"
    any_filled = any(_is_investment_item_started(item) for item in investment_items) or _filled(
        value.get("notes")
    )
    required = all(_is_investment_item_complete(item) for item in investment_items)
    return _status_from(any_filled, required)


def evaluate_means_of_finance_status(payload: dict[str, Any]) -> str:
    value = payload.get("meansOfFinanceAndDeploymentSchedule") or {}
    any_filled = any(
        [
            len(value.get("meansOfFinanceRows") or []) > 0,
            len(value.get("deploymentScheduleRows") or []) > 0,
            _filled(value.get("fundingTieUpStatus")),
            _filled(value.get("notes")),
        ]
    )
    required = (
        len(value.get("meansOfFinanceRows") or []) > 0
        and len(value.get("deploymentScheduleRows") or []) > 0
        and _filled(value.get("fundingTieUpStatus"))
    )
    return _status_from(any_filled, required)


def evaluate_expenses_gcp_status(payload: dict[str, Any]) -> str:
    value = payload.get("expensesGcpMonitoringAndConfirmations") or {}
    any_filled = any(
        [
            len(value.get("issueExpenseItems") or []) > 0,
            _filled(value.get("generalCorporatePurposesAmount")),
            _filled(value.get("monitoringAgencyRequired")),
            _filled(value.get("notes")),
        ]
    )
    required = len(value.get("issueExpenseItems") or []) > 0 and _filled(
        value.get("monitoringAgencyRequired")
    )
    return _status_from(any_filled, required)


_EVALUATORS: dict[str, Any] = {
    "proceeds-and-funding-summary": evaluate_proceeds_and_funding_status,
    "objects-register-and-allocation": evaluate_objects_register_status,
    "capital-expenditure-facilities-and-expansion": evaluate_capex_status,
    "working-capital-and-borrowing-repayment": evaluate_working_capital_status,
    "acquisitions-subsidiaries-jvs-and-investments": evaluate_acquisitions_status,
    "means-of-finance-and-deployment-schedule": evaluate_means_of_finance_status,
    "expenses-gcp-monitoring-and-confirmations": evaluate_expenses_gcp_status,
}


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: _EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    total_sections = len(SECTION_IDS)
    if sections_complete == total_sections:
        overall_status = "complete"
    elif sections_complete > 0 or any(status != "not_started" for status in sections.values()):
        overall_status = "in_progress"
    else:
        overall_status = "not_started"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
