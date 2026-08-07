"""Draft-tolerant section validation for Financials & KPIs."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis import decimal_math as dm
from app.modules.financials_kpis.constants import (
    ACCOUNTING_FRAMEWORK,
    ACCOUNTING_POLICY_CATEGORY,
    ADJUSTING_NON_ADJUSTING,
    AUDIT_OPINION,
    AUDITED_STATUS,
    BS_LINE_KEY,
    CASH_OR_NON_CASH,
    CF_LINE_KEY,
    CONSOLIDATION_METHOD,
    DEBIT_CREDIT_DIRECTION,
    DISPLAY_UNIT,
    DRHP_LOCATION,
    EQUITY_LINE_KEY,
    FINALISATION_STATUS,
    FINANCIAL_PRESENTATION,
    FINANCIAL_STATEMENT,
    FULL_YEAR_OR_INTERIM,
    INCOME_OR_EXPENSE,
    INDIAN_OR_GLOBAL,
    KPI_CATEGORY,
    KPI_PROPOSED_TREATMENT,
    ONE_OFF_OR_RECURRING,
    PERIOD_BASIS,
    PL_LINE_KEY,
    PROFESSIONAL_CONFIRMATION_STATUS,
    RECURRING_OR_NON_RECURRING,
    REPORTING_ENTITY_TYPE,
    RESTATED_STATUS,
    RESTATEMENT_ADJUSTMENT_CATEGORY,
    RESTATEMENT_EXERCISE_STATUS,
    RETROSPECTIVE_PROSPECTIVE,
    SOURCE_STATUS,
    TEMPORARY_OR_CONTINUING,
    YES_NO_NOT_SURE,
)
from app.modules.financials_kpis.periods import get_period_ids, validate_period_deletion


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


def _optional_ref(errors: dict[str, str], field: str, value: Any, valid_ids: set[str]) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a period that does not exist."


def _period_ids_from_payload(full_payload: dict[str, Any]) -> set[str]:
    return get_period_ids(full_payload)


def _validate_period_refs_in_rows(
    errors: dict[str, str],
    field: str,
    rows: list[Any] | None,
    period_ids: set[str],
    *,
    period_field: str = "periodId",
) -> None:
    for index, item in enumerate(rows or []):
        if not isinstance(item, dict):
            continue
        _optional_ref(
            errors,
            f"{field}[{index}].{period_field}",
            item.get(period_field),
            period_ids,
        )


def _validate_period_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_periods: list[Any] | None,
) -> None:
    old_ids = _period_ids_from_payload(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_periods or [])
        if isinstance(item, dict) and item.get("id")
    }
    for removed_id in old_ids - new_ids:
        validation = validate_period_deletion(full_payload, removed_id)
        if not validation["canDelete"]:
            errors["financialPeriods"] = validation["message"]
            break


def validate_reporting_scope_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    basis = data.get("reportingBasis") or {}
    if not isinstance(basis, dict):
        errors["reportingBasis"] = "Must be an object."
    else:
        for field, allowed in (
            ("accountingFramework", ACCOUNTING_FRAMEWORK),
            ("financialPresentation", FINANCIAL_PRESENTATION),
            ("displayUnit", DISPLAY_UNIT),
        ):
            _require_enum(errors, f"reportingBasis.{field}", basis.get(field, ""), allowed)
        for field in (
            "ociApplies",
            "cashFlowAvailable",
            "changesInEquityAvailable",
            "comparativePeriodConsistency",
            "subsidiariesDeclared",
            "associatesDeclared",
            "jointVenturesDeclared",
            "foreignEntitiesDeclared",
            "recentlyAcquiredDisposedDeclared",
            "predecessorEntityDeclared",
            "promotingCompanyTrackRecordDeclared",
        ):
            _ynns(errors, f"reportingBasis.{field}", basis.get(field, ""))

    period_ids: set[str] = set()
    financial_periods = data.get("financialPeriods")
    _check_unique_ids(errors, "financialPeriods", financial_periods or [])
    for index, item in enumerate(financial_periods or []):
        if not isinstance(item, dict):
            continue
        prefix = f"financialPeriods[{index}]"
        period_id = str(item.get("id") or "").strip()
        if period_id:
            period_ids.add(period_id)
        for field, allowed in (
            ("fullYearOrInterim", FULL_YEAR_OR_INTERIM),
            ("basis", PERIOD_BASIS),
            ("auditedStatus", AUDITED_STATUS),
            ("restatedStatus", RESTATED_STATUS),
            ("sourceStatus", SOURCE_STATUS),
            ("finalisationStatus", FINALISATION_STATUS),
        ):
            _require_enum(errors, f"{prefix}.{field}", item.get(field, ""), allowed)
        _optional_decimal(errors, f"{prefix}.months", item.get("months"))
        _optional_ref(errors, f"{prefix}.comparablePeriodId", item.get("comparablePeriodId"), period_ids)

    for index, item in enumerate(financial_periods or []):
        if not isinstance(item, dict):
            continue
        comparable = str(item.get("comparablePeriodId") or "").strip()
        if comparable and comparable not in period_ids:
            errors[f"financialPeriods[{index}].comparablePeriodId"] = (
                "References a period that does not exist."
            )

    _validate_period_deletions(errors, full_payload, financial_periods or [])

    entities = data.get("reportingEntities")
    _check_unique_ids(errors, "reportingEntities", entities or [])
    for index, item in enumerate(entities or []):
        if not isinstance(item, dict):
            continue
        prefix = f"reportingEntities[{index}]"
        _require_enum(errors, f"{prefix}.entityType", item.get("entityType", ""), REPORTING_ENTITY_TYPE)
        _require_enum(
            errors,
            f"{prefix}.consolidationMethod",
            item.get("consolidationMethod", ""),
            CONSOLIDATION_METHOD,
        )
        _require_enum(errors, f"{prefix}.auditedStatus", item.get("auditedStatus", ""), AUDITED_STATUS)
        _ynns(errors, f"{prefix}.financialStatementsAvailable", item.get("financialStatementsAvailable", ""))
        _optional_decimal(errors, f"{prefix}.ownershipPct", item.get("ownershipPct"))
        _optional_ref(errors, f"{prefix}.includedFromPeriodId", item.get("includedFromPeriodId"), period_ids)
        _optional_ref(errors, f"{prefix}.excludedFromPeriodId", item.get("excludedFromPeriodId"), period_ids)

    auditor = data.get("auditorReadiness") or {}
    if isinstance(auditor, dict):
        _ynns(errors, "auditorReadiness.peerReviewStatus", auditor.get("peerReviewStatus", ""))
        _ynns(
            errors,
            "auditorReadiness.restatedInformationBoardApproved",
            auditor.get("restatedInformationBoardApproved", ""),
        )
        _ynns(
            errors,
            "auditorReadiness.financialInformationSufficientlyCurrent",
            auditor.get("financialInformationSufficientlyCurrent", ""),
        )
        _require_enum(
            errors,
            "auditorReadiness.restatementExerciseStatus",
            auditor.get("restatementExerciseStatus", ""),
            RESTATEMENT_EXERCISE_STATUS,
        )
        _require_enum(
            errors,
            "auditorReadiness.professionalConfirmationStatus",
            auditor.get("professionalConfirmationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _optional_ref(
            errors,
            "auditorReadiness.latestFilingReadyPeriodId",
            auditor.get("latestFilingReadyPeriodId"),
            period_ids,
        )

    changes = data.get("auditorChangeRecords")
    _check_unique_ids(errors, "auditorChangeRecords", changes or [])
    for index, item in enumerate(changes or []):
        if not isinstance(item, dict):
            continue
        _ynns(
            errors,
            f"auditorChangeRecords[{index}].disagreementWithManagement",
            item.get("disagreementWithManagement", ""),
        )

    if errors:
        raise ValidationError(errors)


def validate_pl_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    pl_rows = data.get("plLineValues")
    _check_unique_ids(errors, "plLineValues", pl_rows or [])
    for index, item in enumerate(pl_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"plLineValues[{index}]"
        _require_enum(errors, f"{prefix}.lineKey", item.get("lineKey", ""), PL_LINE_KEY)
        _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS)
        _require_enum(
            errors,
            f"{prefix}.professionalConfirmationStatus",
            item.get("professionalConfirmationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _ynns(errors, f"{prefix}.adjustmentPresent", item.get("adjustmentPresent", ""))
        _optional_decimal(errors, f"{prefix}.amount", item.get("amount"), allow_negative=True)
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    exceptional = data.get("exceptionalItems")
    _check_unique_ids(errors, "exceptionalItems", exceptional or [])
    for index, item in enumerate(exceptional or []):
        if not isinstance(item, dict):
            continue
        prefix = f"exceptionalItems[{index}]"
        _require_enum(errors, f"{prefix}.incomeOrExpense", item.get("incomeOrExpense", ""), INCOME_OR_EXPENSE)
        _require_enum(errors, f"{prefix}.cashOrNonCash", item.get("cashOrNonCash", ""), CASH_OR_NON_CASH)
        _require_enum(
            errors,
            f"{prefix}.recurringOrNonRecurring",
            item.get("recurringOrNonRecurring", ""),
            RECURRING_OR_NON_RECURRING,
        )
        _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS)
        _ynns(errors, f"{prefix}.includedInEbitda", item.get("includedInEbitda", ""))
        _optional_decimal(errors, f"{prefix}.amount", item.get("amount"), allow_negative=True)
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    per_share = data.get("perShareByPeriod")
    _check_unique_ids(errors, "perShareByPeriod", per_share or [])
    for index, item in enumerate(per_share or []):
        if not isinstance(item, dict):
            continue
        prefix = f"perShareByPeriod[{index}]"
        _ynns(
            errors,
            f"{prefix}.retrospectiveCapitalAdjustmentApplied",
            item.get("retrospectiveCapitalAdjustmentApplied", ""),
        )
        for field in (
            "weightedAvgBasicShares",
            "weightedAvgDilutedShares",
            "basicEps",
            "dilutedEps",
            "faceValue",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    if errors:
        raise ValidationError(errors)


def validate_balance_sheet_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    for field, line_enum in (
        ("balanceSheetLineValues", BS_LINE_KEY),
        ("cashFlowLineValues", CF_LINE_KEY),
        ("changesInEquityLineValues", EQUITY_LINE_KEY),
    ):
        rows = data.get(field)
        _check_unique_ids(errors, field, rows or [])
        for index, item in enumerate(rows or []):
            if not isinstance(item, dict):
                continue
            prefix = f"{field}[{index}]"
            _require_enum(errors, f"{prefix}.lineKey", item.get("lineKey", ""), line_enum)
            _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS)
            _optional_decimal(errors, f"{prefix}.amount", item.get("amount"), allow_negative=True)
            _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    if errors:
        raise ValidationError(errors)


def validate_restatement_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    adjustments = data.get("restatementAdjustments")
    _check_unique_ids(errors, "restatementAdjustments", adjustments or [])
    for index, item in enumerate(adjustments or []):
        if not isinstance(item, dict):
            continue
        prefix = f"restatementAdjustments[{index}]"
        _require_enum(
            errors, f"{prefix}.financialStatement", item.get("financialStatement", ""), FINANCIAL_STATEMENT
        )
        _require_enum(
            errors,
            f"{prefix}.debitCreditDirection",
            item.get("debitCreditDirection", ""),
            DEBIT_CREDIT_DIRECTION,
        )
        _require_enum(
            errors, f"{prefix}.category", item.get("category", ""), RESTATEMENT_ADJUSTMENT_CATEGORY
        )
        _require_enum(errors, f"{prefix}.cashOrNonCash", item.get("cashOrNonCash", ""), CASH_OR_NON_CASH)
        _require_enum(
            errors,
            f"{prefix}.recurringOrNonRecurring",
            item.get("recurringOrNonRecurring", ""),
            RECURRING_OR_NON_RECURRING,
        )
        _require_enum(
            errors,
            f"{prefix}.professionalConclusionStatus",
            item.get("professionalConclusionStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        for dec_field in (
            "originalAuditedAmount",
            "adjustmentAmount",
            "restatedAmount",
            "taxEffect",
            "epsImpact",
            "netWorthImpact",
        ):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field), allow_negative=True)
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    policies = data.get("accountingPolicies")
    _check_unique_ids(errors, "accountingPolicies", policies or [])
    for index, item in enumerate(policies or []):
        if not isinstance(item, dict):
            continue
        prefix = f"accountingPolicies[{index}]"
        _require_enum(
            errors, f"{prefix}.policyCategory", item.get("policyCategory", ""), ACCOUNTING_POLICY_CATEGORY
        )
        _ynns(errors, f"{prefix}.changeDuringPeriod", item.get("changeDuringPeriod", ""))
        _require_enum(
            errors,
            f"{prefix}.retrospectiveProspectiveTreatment",
            item.get("retrospectiveProspectiveTreatment", ""),
            RETROSPECTIVE_PROSPECTIVE,
        )
        _require_enum(
            errors,
            f"{prefix}.auditorConfirmationStatus",
            item.get("auditorConfirmationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    audit_matters = data.get("auditReportMatters")
    _check_unique_ids(errors, "auditReportMatters", audit_matters or [])
    for index, item in enumerate(audit_matters or []):
        if not isinstance(item, dict):
            continue
        prefix = f"auditReportMatters[{index}]"
        _require_enum(errors, f"{prefix}.auditOpinion", item.get("auditOpinion", ""), AUDIT_OPINION)
        for yn_field in (
            "goingConcernUncertainty",
            "internalFinancialControlQualification",
            "caroRemark",
            "fraudReported",
            "statutoryDuesDefaultDelay",
            "accountingSystemOrAuditTrailConcern",
            "adjustedInRestatedInformation",
        ):
            _ynns(errors, f"{prefix}.{yn_field}", item.get(yn_field, ""))
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    if errors:
        raise ValidationError(errors)


def validate_other_financial_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    for field in (
        "segmentRecords",
        "relatedPartyTransactions",
        "contingentLiabilities",
        "workingCapitalSummaries",
        "taxByPeriod",
        "dividendRecords",
    ):
        rows = data.get(field)
        _check_unique_ids(errors, field, rows or [])
        _validate_period_refs_in_rows(errors, field, rows, period_ids)

    for field in ("segmentRecords", "relatedPartyTransactions", "contingentLiabilities"):
        rows = data.get(field) or []
        for index, item in enumerate(rows):
            if not isinstance(item, dict):
                continue
            _require_enum(
                errors,
                f"{field}[{index}].sourceStatus",
                item.get("sourceStatus", ""),
                SOURCE_STATUS,
            )

    rp_rows = data.get("relatedPartyTransactions") or []
    for index, item in enumerate(rp_rows):
        if not isinstance(item, dict):
            continue
        prefix = f"relatedPartyTransactions[{index}]"
        _ynns(errors, f"{prefix}.armsLengthStatus", item.get("armsLengthStatus", ""))
        for dec_field in ("transactionAmount", "outstandingBalance", "relevantPercentage"):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field))

    wc_rows = data.get("workingCapitalSummaries") or []
    for index, item in enumerate(wc_rows):
        if not isinstance(item, dict):
            continue
        prefix = f"workingCapitalSummaries[{index}]"
        for dec_field in (
            "currentAssets",
            "currentLiabilities",
            "netWorkingCapital",
            "inventory",
            "receivables",
            "payables",
            "inventoryDays",
            "receivableDays",
            "payableDays",
            "cashConversionCycle",
            "workingCapitalBorrowings",
        ):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field), allow_negative=True)

    indebtedness = data.get("indebtednessSummary")
    if isinstance(indebtedness, dict):
        for dec_field in (
            "longTermDebt",
            "shortTermDebt",
            "currentMaturities",
            "leaseLiabilities",
            "totalDebt",
            "securedDebt",
            "unsecuredDebt",
            "relatedPartyDebt",
            "cashAndCashEquivalents",
            "netDebt",
            "undrawnFacilities",
            "debtProposedForIpoRepayment",
        ):
            _optional_decimal(errors, f"indebtednessSummary.{dec_field}", indebtedness.get(dec_field))
        _require_enum(
            errors,
            "indebtednessSummary.sourceStatus",
            indebtedness.get("sourceStatus", ""),
            SOURCE_STATUS,
        )

    tax_rows = data.get("taxByPeriod") or []
    for index, item in enumerate(tax_rows):
        if not isinstance(item, dict):
            continue
        prefix = f"taxByPeriod[{index}]"
        _require_enum(
            errors,
            f"{prefix}.auditorConfirmationStatus",
            item.get("auditorConfirmationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    dividend_rows = data.get("dividendRecords") or []
    for index, item in enumerate(dividend_rows):
        if not isinstance(item, dict):
            continue
        prefix = f"dividendRecords[{index}]"
        for yn_field in ("boardApproval", "shareholderApproval", "lendingRestriction"):
            _ynns(errors, f"{prefix}.{yn_field}", item.get(yn_field, ""))

    dividend_policy = data.get("dividendPolicy")
    if isinstance(dividend_policy, dict):
        for yn_field in ("policyExists", "futureDividendDiscretionary"):
            _ynns(errors, f"dividendPolicy.{yn_field}", dividend_policy.get(yn_field, ""))
        _require_enum(
            errors,
            "dividendPolicy.professionalReviewStatus",
            dividend_policy.get("professionalReviewStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    if errors:
        raise ValidationError(errors)


def validate_ratios_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    formulas = data.get("formulaRecords")
    _check_unique_ids(errors, "formulaRecords", formulas or [])
    for index, item in enumerate(formulas or []):
        if not isinstance(item, dict):
            continue
        prefix = f"formulaRecords[{index}]"
        _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS)
        _require_enum(
            errors,
            f"{prefix}.professionalConfirmationStatus",
            item.get("professionalConfirmationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _ynns(errors, f"{prefix}.comparableAcrossPeriods", item.get("comparableAcrossPeriods", ""))
        _ynns(errors, f"{prefix}.methodologyChanged", item.get("methodologyChanged", ""))

    sme_rows = data.get("smeEligibilityByPeriod")
    _check_unique_ids(errors, "smeEligibilityByPeriod", sme_rows or [])
    for index, item in enumerate(sme_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"smeEligibilityByPeriod[{index}]"
        _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS)
        for dec_field in ("operatingProfit", "netWorth", "fcfe"):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field), allow_negative=True)
        _optional_ref(errors, f"{prefix}.periodId", item.get("periodId"), period_ids)

    if errors:
        raise ValidationError(errors)


def _validate_values_by_period(
    errors: dict[str, str],
    field: str,
    values: list[Any] | None,
    period_ids: set[str],
) -> None:
    for index, item in enumerate(values or []):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid period value."
            continue
        _optional_ref(errors, f"{field}[{index}].periodId", item.get("periodId"), period_ids)
        _optional_decimal(errors, f"{field}[{index}].value", item.get("value"))


def validate_kpi_governance_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    candidates = data.get("selectedDataCandidates")
    _check_unique_ids(errors, "selectedDataCandidates", candidates or [])
    for index, item in enumerate(candidates or []):
        if not isinstance(item, dict):
            continue
        prefix = f"selectedDataCandidates[{index}]"
        _require_enum(errors, f"{prefix}.category", item.get("category", ""), KPI_CATEGORY)
        _require_enum(errors, f"{prefix}.sourceType", item.get("sourceType", ""), SOURCE_STATUS)
        _require_enum(
            errors, f"{prefix}.proposedTreatment", item.get("proposedTreatment", ""), KPI_PROPOSED_TREATMENT
        )
        for yn_field in (
            "sharedWithInvestorsPriorThreeYears",
            "presentedToBoardAuditCommittee",
            "historicallyUsedByManagement",
            "usedInIssuePriceDeliberations",
            "usedByPeers",
            "verifiable",
            "certifiable",
            "containsProjections",
            "confidentialBusinessSensitive",
            "relevantToCurrentBusiness",
        ):
            _ynns(errors, f"{prefix}.{yn_field}", item.get(yn_field, ""))
        _validate_values_by_period(errors, f"{prefix}.valuesByPeriod", item.get("valuesByPeriod"), period_ids)

    register = data.get("kpiRegister")
    _check_unique_ids(errors, "kpiRegister", register or [])
    for index, item in enumerate(register or []):
        if not isinstance(item, dict):
            continue
        prefix = f"kpiRegister[{index}]"
        _require_enum(errors, f"{prefix}.category", item.get("category", ""), KPI_CATEGORY)
        _require_enum(errors, f"{prefix}.drhpLocation", item.get("drhpLocation", ""), DRHP_LOCATION)
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), SOURCE_STATUS)
        _require_enum(
            errors,
            f"{prefix}.professionalCertificationStatus",
            item.get("professionalCertificationStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _ynns(errors, f"{prefix}.comparableAcrossPeriods", item.get("comparableAcrossPeriods", ""))
        _ynns(
            errors,
            f"{prefix}.restatementRecalculationRequired",
            item.get("restatementRecalculationRequired", ""),
        )
        _validate_values_by_period(errors, f"{prefix}.valuesByPeriod", item.get("valuesByPeriod"), period_ids)

    peers = data.get("peerComparisons")
    _check_unique_ids(errors, "peerComparisons", peers or [])
    for index, item in enumerate(peers or []):
        if not isinstance(item, dict):
            continue
        prefix = f"peerComparisons[{index}]"
        _require_enum(errors, f"{prefix}.indianOrGlobal", item.get("indianOrGlobal", ""), INDIAN_OR_GLOBAL)
        for dec_field in ("revenueTotalIncome", "eps", "pe", "ronw", "nav"):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field))

    _ynns(errors, "searchPerformed", data.get("searchPerformed", ""))
    _optional_decimal(errors, "suitablePeersFoundCount", data.get("suitablePeersFoundCount"))
    _require_enum(
        errors,
        "professionalReviewStatus",
        data.get("professionalReviewStatus", ""),
        PROFESSIONAL_CONFIRMATION_STATUS,
    )

    mgmt = data.get("managementCertification")
    if isinstance(mgmt, dict):
        for yn_field in (
            "accuracyConfirmed",
            "historicalUseConfirmed",
            "projectionsExcluded",
            "managementNotePrepared",
        ):
            _ynns(errors, f"managementCertification.{yn_field}", mgmt.get(yn_field, ""))

    audit = data.get("auditCommitteeGovernance")
    if isinstance(audit, dict):
        for yn_field in (
            "auditCommitteeConstituted",
            "selectedDataPresented",
            "kpiDisclosuresPresented",
            "exclusionRationalesPresented",
            "peerDataPresented",
            "definitionsFormulasReviewed",
            "minutesAvailable",
            "changesImplemented",
        ):
            _ynns(errors, f"auditCommitteeGovernance.{yn_field}", audit.get(yn_field, ""))

    prof = data.get("professionalCertification")
    if isinstance(prof, dict):
        _ynns(errors, "professionalCertification.peerReviewStatus", prof.get("peerReviewStatus", ""))

    if errors:
        raise ValidationError(errors)


def validate_mda_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    period_ids = _period_ids_from_payload(full_payload)

    for field in ("performanceFactors", "trendsUncertainties", "subsequentEvents"):
        rows = data.get(field)
        _check_unique_ids(errors, field, rows or [])

    performance = data.get("performanceFactors") or []
    for index, item in enumerate(performance):
        if not isinstance(item, dict):
            continue
        prefix = f"performanceFactors[{index}]"
        _require_enum(
            errors,
            f"{prefix}.temporaryOrContinuing",
            item.get("temporaryOrContinuing", ""),
            TEMPORARY_OR_CONTINUING,
        )
        _require_enum(
            errors,
            f"{prefix}.professionalReviewStatus",
            item.get("professionalReviewStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _optional_decimal(errors, f"{prefix}.quantifiedImpact", item.get("quantifiedImpact"), allow_negative=True)

    variances = data.get("varianceAnalyses")
    _check_unique_ids(errors, "varianceAnalyses", variances or [])
    for index, item in enumerate(variances or []):
        if not isinstance(item, dict):
            continue
        prefix = f"varianceAnalyses[{index}]"
        _optional_ref(errors, f"{prefix}.previousPeriodId", item.get("previousPeriodId"), period_ids)
        _optional_ref(errors, f"{prefix}.currentPeriodId", item.get("currentPeriodId"), period_ids)
        _require_enum(
            errors, f"{prefix}.oneOffOrRecurring", item.get("oneOffOrRecurring", ""), ONE_OFF_OR_RECURRING
        )
        _ynns(errors, f"{prefix}.managementConfirmation", item.get("managementConfirmation", ""))
        _require_enum(
            errors,
            f"{prefix}.professionalReviewStatus",
            item.get("professionalReviewStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        for dec_field in ("previousValue", "currentValue"):
            _optional_decimal(errors, f"{prefix}.{dec_field}", item.get(dec_field), allow_negative=True)

    liquidity = data.get("liquidityCapitalResources")
    if isinstance(liquidity, dict):
        _ynns(
            errors,
            "liquidityCapitalResources.operatingCashFlowAdequacy",
            liquidity.get("operatingCashFlowAdequacy", ""),
        )
        _ynns(
            errors,
            "liquidityCapitalResources.goingConcernConcerns",
            liquidity.get("goingConcernConcerns", ""),
        )
        for dec_field in (
            "cashAvailable",
            "workingCapitalFacilities",
            "undrawnLimits",
            "debtRepaymentsDue",
            "capitalCommitments",
            "expectedCapex",
            "restrictedCash",
        ):
            _optional_decimal(
                errors,
                f"liquidityCapitalResources.{dec_field}",
                liquidity.get(dec_field),
            )

    trends = data.get("trendsUncertainties") or []
    for index, item in enumerate(trends):
        if not isinstance(item, dict):
            continue
        _require_enum(
            errors,
            f"trendsUncertainties[{index}].professionalReviewStatus",
            item.get("professionalReviewStatus", ""),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    events = data.get("subsequentEvents") or []
    for index, item in enumerate(events):
        if not isinstance(item, dict):
            continue
        prefix = f"subsequentEvents[{index}]"
        _require_enum(
            errors,
            f"{prefix}.adjustingNonAdjusting",
            item.get("adjustingNonAdjusting", ""),
            ADJUSTING_NON_ADJUSTING,
        )
        for yn_field in (
            "amountKnown",
            "includedInFinancialInformation",
            "updatedInterimInformationRequired",
            "auditorNotified",
            "boardNotified",
        ):
            _ynns(errors, f"{prefix}.{yn_field}", item.get(yn_field, ""))
        _optional_decimal(errors, f"{prefix}.financialImpact", item.get("financialImpact"), allow_negative=True)

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
    "reporting-scope-periods-and-auditor-readiness": validate_reporting_scope_draft,
    "restated-statement-of-profit-and-loss": validate_pl_draft,
    "assets-liabilities-equity-and-cash-flows": validate_balance_sheet_draft,
    "restatement-adjustments-policies-and-auditor-matters": validate_restatement_draft,
    "other-financial-information": validate_other_financial_draft,
    "ratios-capitalisation-and-issue-price-metrics": validate_ratios_draft,
    "kpi-selection-governance-and-peer-comparison": validate_kpi_governance_draft,
    "mda-trends-material-developments-and-confirmations": validate_mda_draft,
}
