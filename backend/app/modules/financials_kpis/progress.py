"""Section completion for Financials & KPIs — ports frontend progress.ts."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis import decimal_math as dm
from app.modules.financials_kpis.constants import FINANCIALS_KPIS_CONFIRMATION_FIELDS, SECTION_IDS
from app.modules.financials_kpis.periods import has_three_full_year_periods


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_reporting_scope_status(payload: dict[str, Any]) -> str:
    section = payload.get("reportingScopePeriodsAndAuditorReadiness") or {}
    basis = section.get("reportingBasis") or {}
    core = [
        _filled(basis.get("financialYearEnd")),
        _filled(basis.get("accountingFramework")),
        _filled(basis.get("financialPresentation")),
        _filled(basis.get("currency")),
        _filled(basis.get("displayUnit")),
        _filled(basis.get("ociApplies")),
        _filled(basis.get("cashFlowAvailable")),
        len(section.get("financialPeriods") or []) > 0,
        _filled((section.get("auditorReadiness") or {}).get("currentStatutoryAuditor")),
        _filled((section.get("auditorReadiness") or {}).get("restatementExerciseStatus")),
    ]
    answered = sum(1 for item in core if item)
    periods = section.get("financialPeriods") or []
    periods_complete = all(
        _filled(period.get("label"))
        and _filled(period.get("startDate"))
        and _filled(period.get("endDate"))
        and _filled(period.get("fullYearOrInterim"))
        for period in periods
        if isinstance(period, dict)
    )
    three_years = has_three_full_year_periods(payload)
    return _status_from(answered, len(core), periods_complete and three_years)


def evaluate_pl_status(payload: dict[str, Any]) -> str:
    section = payload.get("restatedStatementOfProfitAndLoss") or {}
    core = [
        len(section.get("plLineValues") or []) > 0,
        len(section.get("perShareByPeriod") or []) > 0
        or len(section.get("exceptionalItems") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    pl_complete = all(
        _filled(row.get("periodId")) and _filled(row.get("lineKey")) and dm.is_filled(row.get("amount"))
        for row in section.get("plLineValues") or []
        if isinstance(row, dict)
    )
    per_share_complete = all(
        _filled(row.get("periodId")) and dm.is_filled(row.get("weightedAvgBasicShares"))
        for row in section.get("perShareByPeriod") or []
        if isinstance(row, dict)
    )
    return _status_from(answered, len(core), pl_complete and per_share_complete)


def evaluate_balance_sheet_status(payload: dict[str, Any]) -> str:
    section = payload.get("assetsLiabilitiesEquityAndCashFlows") or {}
    core = [
        len(section.get("balanceSheetLineValues") or []) > 0,
        len(section.get("cashFlowLineValues") or []) > 0
        or len(section.get("changesInEquityLineValues") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    bs_complete = all(
        _filled(row.get("periodId")) and _filled(row.get("lineKey")) and dm.is_filled(row.get("amount"))
        for row in section.get("balanceSheetLineValues") or []
        if isinstance(row, dict)
    )
    cf_complete = all(
        _filled(row.get("periodId")) and _filled(row.get("lineKey"))
        for row in section.get("cashFlowLineValues") or []
        if isinstance(row, dict)
    )
    return _status_from(answered, len(core), bs_complete and cf_complete)


def evaluate_restatement_status(payload: dict[str, Any]) -> str:
    section = payload.get("restatementAdjustmentsPoliciesAndAuditorMatters") or {}
    core = [
        len(section.get("restatementAdjustments") or []) > 0
        or len(section.get("accountingPolicies") or []) > 0
        or len(section.get("auditReportMatters") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    adjustments_complete = all(
        _filled(row.get("periodId"))
        and _filled(row.get("originalLineItem"))
        and dm.is_filled(row.get("originalAuditedAmount"))
        for row in section.get("restatementAdjustments") or []
        if isinstance(row, dict)
    )
    policies_complete = all(
        _filled(row.get("policyCategory"))
        for row in section.get("accountingPolicies") or []
        if isinstance(row, dict)
    )
    audit_complete = all(
        _filled(row.get("periodId")) and _filled(row.get("auditOpinion"))
        for row in section.get("auditReportMatters") or []
        if isinstance(row, dict)
    )
    return _status_from(
        answered, len(core), adjustments_complete and policies_complete and audit_complete
    )


def evaluate_other_financial_info_status(payload: dict[str, Any]) -> str:
    section = payload.get("otherFinancialInformation") or {}
    indebtedness = section.get("indebtednessSummary") or {}
    core = [
        len(section.get("segmentRecords") or []) > 0
        or len(section.get("relatedPartyTransactions") or []) > 0
        or len(section.get("workingCapitalSummaries") or []) > 0,
        _filled(indebtedness.get("totalDebt")) or _filled(indebtedness.get("notes")),
        len(section.get("taxByPeriod") or []) > 0 or len(section.get("dividendRecords") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    segments_complete = all(
        _filled(row.get("periodId")) and _filled(row.get("segmentName"))
        for row in section.get("segmentRecords") or []
        if isinstance(row, dict)
    )
    wc_complete = all(
        _filled(row.get("periodId"))
        for row in section.get("workingCapitalSummaries") or []
        if isinstance(row, dict)
    )
    return _status_from(answered, len(core), segments_complete and wc_complete)


def evaluate_ratios_status(payload: dict[str, Any]) -> str:
    section = payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
    core = [
        len(section.get("formulaRecords") or []) > 0
        or len(section.get("smeEligibilityByPeriod") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    formulas_complete = all(
        _filled(row.get("metricKey")) and _filled(row.get("definition"))
        for row in section.get("formulaRecords") or []
        if isinstance(row, dict)
    )
    sme_complete = all(
        _filled(row.get("periodId"))
        and (
            dm.is_filled(row.get("operatingProfit"))
            or dm.is_filled(row.get("netWorth"))
            or dm.is_filled(row.get("fcfe"))
        )
        for row in section.get("smeEligibilityByPeriod") or []
        if isinstance(row, dict)
    )
    return _status_from(answered, len(core), formulas_complete and sme_complete)


def evaluate_kpi_governance_status(payload: dict[str, Any]) -> str:
    section = payload.get("kpiSelectionGovernanceAndPeerComparison") or {}
    mgmt = section.get("managementCertification") or {}
    audit = section.get("auditCommitteeGovernance") or {}
    prof = section.get("professionalCertification") or {}
    core = [
        len(section.get("selectedDataCandidates") or []) > 0
        or len(section.get("kpiRegister") or []) > 0,
        _filled(mgmt.get("status")) or _filled(audit.get("approvalStatus")),
        _filled(prof.get("certificationStatus")),
    ]
    answered = sum(1 for item in core if item)
    candidates_complete = all(
        _filled(row.get("metricName")) and _filled(row.get("category"))
        for row in section.get("selectedDataCandidates") or []
        if isinstance(row, dict)
    )
    kpi_complete = all(
        _filled(row.get("name")) and _filled(row.get("plainEnglishDefinition"))
        for row in section.get("kpiRegister") or []
        if isinstance(row, dict)
    )
    peers_complete = all(
        _filled(row.get("companyName"))
        for row in section.get("peerComparisons") or []
        if isinstance(row, dict)
    )
    return _status_from(answered, len(core), candidates_complete and kpi_complete and peers_complete)


def evaluate_mda_status(payload: dict[str, Any]) -> str:
    section = payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
    confirmations = section.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key, _label in FINANCIALS_KPIS_CONFIRMATION_FIELDS if confirmations.get(key)
    )
    liquidity = section.get("liquidityCapitalResources") or {}
    core = [
        len(section.get("performanceFactors") or []) > 0
        or len(section.get("varianceAnalyses") or []) > 0,
        _filled(liquidity.get("principalLiquiditySources")),
        len(section.get("trendsUncertainties") or []) > 0
        or len(section.get("subsequentEvents") or []) > 0,
        confirmations_checked > 0,
    ]
    answered = sum(1 for item in core if item)
    variance_complete = all(
        _filled(row.get("lineItem"))
        and _filled(row.get("previousPeriodId"))
        and _filled(row.get("currentPeriodId"))
        and _filled(row.get("explanation"))
        for row in section.get("varianceAnalyses") or []
        if isinstance(row, dict)
    )
    confirmations_complete = confirmations_checked == len(FINANCIALS_KPIS_CONFIRMATION_FIELDS)
    return _status_from(answered, len(core), variance_complete and confirmations_complete)


_EVALUATORS = {
    "reporting-scope-periods-and-auditor-readiness": evaluate_reporting_scope_status,
    "restated-statement-of-profit-and-loss": evaluate_pl_status,
    "assets-liabilities-equity-and-cash-flows": evaluate_balance_sheet_status,
    "restatement-adjustments-policies-and-auditor-matters": evaluate_restatement_status,
    "other-financial-information": evaluate_other_financial_info_status,
    "ratios-capitalisation-and-issue-price-metrics": evaluate_ratios_status,
    "kpi-selection-governance-and-peer-comparison": evaluate_kpi_governance_status,
    "mda-trends-material-developments-and-confirmations": evaluate_mda_status,
}


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: _EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(SECTION_IDS)
    if sections_complete == total_sections:
        overall_status = "complete"
    elif sections_complete > 0 or any(status != "not_started" for status in statuses):
        overall_status = "in_progress"
    else:
        overall_status = "not_started"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
