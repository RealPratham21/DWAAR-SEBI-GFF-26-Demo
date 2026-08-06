"""Empty canonical Objects of the Issue payload (schemaVersion 1) — mirrors frontend O1 exactly."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.objects_issue.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_proceeds_and_funding_summary() -> dict[str, Any]:
    return {
        "declaredOfferType": "",
        "freshIssueGrossProceeds": "",
        "estimatedIssueRelatedExpenses": "",
        "issueMadeToRaiseFundsForObjects": "",
        "schemeOfArrangementInvolved": "",
        "offerForSaleProceedsNote": "",
        "notes": "",
    }


def create_empty_issue_object(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "objectName": "",
        "objectCategory": "",
        "description": "",
        "estimatedCost": "",
        "amountFromNetProceeds": "",
        "amountFromInternalAccruals": "",
        "amountFromOtherSources": "",
        "appraisalStatus": "",
        "appraisingAgencyName": "",
        "expectedUtilisationPeriod": "",
        "priorityRank": "",
        "notes": "",
    }


def create_empty_objects_register_and_allocation() -> dict[str, Any]:
    return {
        "objects": [],
        "objectsAreFinalised": "",
        "notes": "",
    }


def create_empty_capex_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "itemType": "",
        "description": "",
        "location": "",
        "relatedObjectId": "",
        "estimatedCost": "",
        "expectedCommissioningDate": "",
        "quotationSource": "",
        "relatedPartyPurchase": "",
        "governmentApprovalsRequired": "",
        "approvalsStatus": "",
        "notes": "",
    }


def create_empty_capital_expenditure_facilities_and_expansion() -> dict[str, Any]:
    return {
        "capexItems": [],
        "notApplicableNote": "",
        "notes": "",
    }


def create_empty_borrowing_repayment_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "lenderName": "",
        "loanType": "",
        "outstandingAmount": "",
        "amountProposedForRepayment": "",
        "interestRatePercentage": "",
        "isRelatedPartyLender": "",
        "repaymentRationale": "",
        "notes": "",
    }


def create_empty_working_capital_and_borrowing_repayment() -> dict[str, Any]:
    return {
        "workingCapitalRequirementAmount": "",
        "workingCapitalMethodology": "",
        "workingCapitalAppraisalStatus": "",
        "borrowingRepaymentItems": [],
        "notes": "",
    }


def create_empty_investment_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "targetEntityName": "",
        "transactionType": "",
        "relatedObjectId": "",
        "estimatedAmount": "",
        "proposedStakePercentage": "",
        "definitiveAgreementStatus": "",
        "regulatoryApprovalsRequired": "",
        "regulatoryApprovalDetails": "",
        "isRelatedPartyTransaction": "",
        "rationale": "",
        "notes": "",
    }


def create_empty_acquisitions_subsidiaries_jvs_and_investments() -> dict[str, Any]:
    return {
        "investmentItems": [],
        "notes": "",
    }


def create_empty_means_of_finance_row(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "source": "",
        "amount": "",
        "notes": "",
    }


def create_empty_deployment_schedule_row(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodLabel": "",
        "amountToBeDeployed": "",
        "notes": "",
    }


def create_empty_means_of_finance_and_deployment_schedule() -> dict[str, Any]:
    return {
        "meansOfFinanceRows": [],
        "deploymentScheduleRows": [],
        "fundingTieUpStatus": "",
        "fundingTieUpDetails": "",
        "notes": "",
    }


def create_empty_issue_expense_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "expenseCategory": "",
        "estimatedAmount": "",
        "notes": "",
    }


def create_empty_objects_of_issue_confirmations() -> dict[str, Any]:
    return {
        "objectsServeBonafideBusinessPurposes": False,
        "noPartOfProceedsBenefitsRelatedPartiesBeyondDisclosed": False,
        "deploymentScheduleIsManagementEstimate": False,
        "shortfallToBeMetFromInternalAccrualsOrOtherSources": False,
        "meansOfFinanceExcludingIssueProceedsAlreadyTiedUp": False,
        "monitoringAndUtilisationCertificationRequirementUnderstood": False,
        "professionalReviewRemainsRequired": False,
    }


def create_empty_expenses_gcp_monitoring_and_confirmations() -> dict[str, Any]:
    return {
        "issueExpenseItems": [],
        "generalCorporatePurposesAmount": "",
        "monitoringAgencyRequired": "",
        "monitoringAgencyName": "",
        "monitoringAgencyStatus": "",
        "confirmations": create_empty_objects_of_issue_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "proceedsAndFundingSummary": create_empty_proceeds_and_funding_summary(),
        "objectsRegisterAndAllocation": create_empty_objects_register_and_allocation(),
        "capitalExpenditureFacilitiesAndExpansion": (
            create_empty_capital_expenditure_facilities_and_expansion()
        ),
        "workingCapitalAndBorrowingRepayment": create_empty_working_capital_and_borrowing_repayment(),
        "acquisitionsSubsidiariesJvsAndInvestments": (
            create_empty_acquisitions_subsidiaries_jvs_and_investments()
        ),
        "meansOfFinanceAndDeploymentSchedule": create_empty_means_of_finance_and_deployment_schedule(),
        "expensesGcpMonitoringAndConfirmations": (
            create_empty_expenses_gcp_monitoring_and_confirmations()
        ),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
