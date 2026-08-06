"""Draft-tolerant section validation for Objects of the Issue."""

from __future__ import annotations

from typing import Any

from app.modules.objects_issue import decimal_math as dm
from app.modules.objects_issue.constants import (
    APPROVAL_STATUS,
    APPRAISAL_STATUS,
    CAPEX_ITEM_TYPE,
    DECLARED_OFFER_TYPE,
    DEFINITIVE_AGREEMENT_STATUS,
    EXPENSE_CATEGORY,
    FUNDING_TIE_UP_STATUS,
    LOAN_TYPE,
    MEANS_OF_FINANCE_SOURCE,
    MONITORING_AGENCY_STATUS,
    OBJECT_CATEGORY,
    QUOTATION_SOURCE,
    TRANSACTION_TYPE,
    WORKING_CAPITAL_METHODOLOGY,
    YES_NO_NOT_SURE,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(
    errors: dict[str, str],
    field: str,
    value: Any,
    *,
    allow_negative: bool = False,
) -> None:
    if value is None or value == "":
        return
    if not dm.is_filled(value):
        errors[field] = "Enter a valid number."
        return
    if not allow_negative and dm.is_negative(value):
        errors[field] = "Value cannot be negative."


def _optional_bool(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None:
        return
    if not isinstance(value, bool):
        errors[field] = "Must be true or false."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _ids_of(items: list[Any] | None) -> set[str]:
    return {
        str(item.get("id"))
        for item in (items or [])
        if isinstance(item, dict) and item.get("id")
    }


def _optional_ref(errors: dict[str, str], field: str, value: Any, valid_ids: set[str]) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a record that does not exist."


def _object_ids_from_payload(full_payload: dict[str, Any]) -> set[str]:
    register = full_payload.get("objectsRegisterAndAllocation") or {}
    return _ids_of(register.get("objects"))


def _referenced_object_ids(full_payload: dict[str, Any]) -> set[str]:
    referenced: set[str] = set()
    capex = full_payload.get("capitalExpenditureFacilitiesAndExpansion") or {}
    for item in capex.get("capexItems") or []:
        ref = str((item or {}).get("relatedObjectId") or "").strip()
        if ref:
            referenced.add(ref)
    acquisitions = full_payload.get("acquisitionsSubsidiariesJvsAndInvestments") or {}
    for item in acquisitions.get("investmentItems") or []:
        ref = str((item or {}).get("relatedObjectId") or "").strip()
        if ref:
            referenced.add(ref)
    return referenced


def validate_proceeds_funding_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    _require_enum(errors, "declaredOfferType", data.get("declaredOfferType", ""), DECLARED_OFFER_TYPE)
    _optional_decimal(errors, "freshIssueGrossProceeds", data.get("freshIssueGrossProceeds"))
    _optional_decimal(errors, "estimatedIssueRelatedExpenses", data.get("estimatedIssueRelatedExpenses"))
    for field in (
        "issueMadeToRaiseFundsForObjects",
        "schemeOfArrangementInvolved",
    ):
        _ynns(errors, field, data.get(field, ""))
    if errors:
        raise ValidationError(errors)


def validate_objects_register_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    objects = data.get("objects")
    _check_unique_ids(errors, "objects", objects or [])
    for index, item in enumerate(objects or []):
        if not isinstance(item, dict):
            continue
        prefix = f"objects[{index}]"
        _require_enum(errors, f"{prefix}.objectCategory", item.get("objectCategory", ""), OBJECT_CATEGORY)
        _require_enum(errors, f"{prefix}.appraisalStatus", item.get("appraisalStatus", ""), APPRAISAL_STATUS)
        for field in (
            "estimatedCost",
            "amountFromNetProceeds",
            "amountFromInternalAccruals",
            "amountFromOtherSources",
            "priorityRank",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    _ynns(errors, "objectsAreFinalised", data.get("objectsAreFinalised", ""))

    new_ids = _ids_of(objects)
    removed_ids = _object_ids_from_payload(full_payload) - new_ids
    still_referenced = _referenced_object_ids(full_payload)
    for removed_id in removed_ids:
        if removed_id in still_referenced:
            errors["objects"] = (
                "Cannot remove an object that is still referenced by a capex or investment item."
            )
            break

    if errors:
        raise ValidationError(errors)


def validate_capex_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    object_ids = _object_ids_from_payload(full_payload)

    capex_items = data.get("capexItems")
    _check_unique_ids(errors, "capexItems", capex_items or [])
    for index, item in enumerate(capex_items or []):
        if not isinstance(item, dict):
            continue
        prefix = f"capexItems[{index}]"
        _require_enum(errors, f"{prefix}.itemType", item.get("itemType", ""), CAPEX_ITEM_TYPE)
        _require_enum(
            errors, f"{prefix}.quotationSource", item.get("quotationSource", ""), QUOTATION_SOURCE
        )
        _require_enum(
            errors, f"{prefix}.approvalsStatus", item.get("approvalsStatus", ""), APPROVAL_STATUS
        )
        for field in ("relatedPartyPurchase", "governmentApprovalsRequired"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        _optional_decimal(errors, f"{prefix}.estimatedCost", item.get("estimatedCost"))
        _optional_ref(errors, f"{prefix}.relatedObjectId", item.get("relatedObjectId"), object_ids)

    if errors:
        raise ValidationError(errors)


def validate_working_capital_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _optional_decimal(errors, "workingCapitalRequirementAmount", data.get("workingCapitalRequirementAmount"))
    _require_enum(
        errors,
        "workingCapitalMethodology",
        data.get("workingCapitalMethodology", ""),
        WORKING_CAPITAL_METHODOLOGY,
    )
    _require_enum(
        errors,
        "workingCapitalAppraisalStatus",
        data.get("workingCapitalAppraisalStatus", ""),
        APPRAISAL_STATUS,
    )

    borrowing_items = data.get("borrowingRepaymentItems")
    _check_unique_ids(errors, "borrowingRepaymentItems", borrowing_items or [])
    for index, item in enumerate(borrowing_items or []):
        if not isinstance(item, dict):
            continue
        prefix = f"borrowingRepaymentItems[{index}]"
        _require_enum(errors, f"{prefix}.loanType", item.get("loanType", ""), LOAN_TYPE)
        _ynns(errors, f"{prefix}.isRelatedPartyLender", item.get("isRelatedPartyLender", ""))
        for field in ("outstandingAmount", "amountProposedForRepayment", "interestRatePercentage"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    if errors:
        raise ValidationError(errors)


def validate_acquisitions_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    object_ids = _object_ids_from_payload(full_payload)

    investment_items = data.get("investmentItems")
    _check_unique_ids(errors, "investmentItems", investment_items or [])
    for index, item in enumerate(investment_items or []):
        if not isinstance(item, dict):
            continue
        prefix = f"investmentItems[{index}]"
        _require_enum(
            errors, f"{prefix}.transactionType", item.get("transactionType", ""), TRANSACTION_TYPE
        )
        _require_enum(
            errors,
            f"{prefix}.definitiveAgreementStatus",
            item.get("definitiveAgreementStatus", ""),
            DEFINITIVE_AGREEMENT_STATUS,
        )
        _ynns(errors, f"{prefix}.regulatoryApprovalsRequired", item.get("regulatoryApprovalsRequired", ""))
        _ynns(errors, f"{prefix}.isRelatedPartyTransaction", item.get("isRelatedPartyTransaction", ""))
        _optional_decimal(errors, f"{prefix}.estimatedAmount", item.get("estimatedAmount"))
        _optional_decimal(errors, f"{prefix}.proposedStakePercentage", item.get("proposedStakePercentage"))
        _optional_ref(errors, f"{prefix}.relatedObjectId", item.get("relatedObjectId"), object_ids)

    if errors:
        raise ValidationError(errors)


def validate_means_of_finance_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    means_rows = data.get("meansOfFinanceRows")
    _check_unique_ids(errors, "meansOfFinanceRows", means_rows or [])
    for index, item in enumerate(means_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"meansOfFinanceRows[{index}]"
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), MEANS_OF_FINANCE_SOURCE)
        _optional_decimal(errors, f"{prefix}.amount", item.get("amount"))

    deployment_rows = data.get("deploymentScheduleRows")
    _check_unique_ids(errors, "deploymentScheduleRows", deployment_rows or [])
    for index, item in enumerate(deployment_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"deploymentScheduleRows[{index}]"
        _optional_decimal(errors, f"{prefix}.amountToBeDeployed", item.get("amountToBeDeployed"))

    _require_enum(
        errors, "fundingTieUpStatus", data.get("fundingTieUpStatus", ""), FUNDING_TIE_UP_STATUS
    )

    if errors:
        raise ValidationError(errors)


def validate_expenses_gcp_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    expense_items = data.get("issueExpenseItems")
    _check_unique_ids(errors, "issueExpenseItems", expense_items or [])
    for index, item in enumerate(expense_items or []):
        if not isinstance(item, dict):
            continue
        prefix = f"issueExpenseItems[{index}]"
        _require_enum(
            errors, f"{prefix}.expenseCategory", item.get("expenseCategory", ""), EXPENSE_CATEGORY
        )
        _optional_decimal(errors, f"{prefix}.estimatedAmount", item.get("estimatedAmount"))

    _optional_decimal(errors, "generalCorporatePurposesAmount", data.get("generalCorporatePurposesAmount"))
    _ynns(errors, "monitoringAgencyRequired", data.get("monitoringAgencyRequired", ""))
    _require_enum(
        errors,
        "monitoringAgencyStatus",
        data.get("monitoringAgencyStatus", ""),
        MONITORING_AGENCY_STATUS,
    )

    confirmations = data.get("confirmations")
    if confirmations is not None:
        if not isinstance(confirmations, dict):
            errors["confirmations"] = "Must be an object of true/false values."
        else:
            for key, value in confirmations.items():
                _optional_bool(errors, f"confirmations.{key}", value)

    if errors:
        raise ValidationError(errors)


VALIDATORS = {
    "proceeds-and-funding-summary": validate_proceeds_funding_draft,
    "objects-register-and-allocation": validate_objects_register_draft,
    "capital-expenditure-facilities-and-expansion": validate_capex_draft,
    "working-capital-and-borrowing-repayment": validate_working_capital_draft,
    "acquisitions-subsidiaries-jvs-and-investments": validate_acquisitions_draft,
    "means-of-finance-and-deployment-schedule": validate_means_of_finance_draft,
    "expenses-gcp-monitoring-and-confirmations": validate_expenses_gcp_draft,
}
