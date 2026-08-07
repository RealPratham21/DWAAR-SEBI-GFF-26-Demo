"""Shared reporting-period helpers — mirrors frontend periods.ts."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis import decimal_math as dm


def get_financial_periods(payload: dict[str, Any]) -> list[dict[str, Any]]:
    scope = payload.get("reportingScopePeriodsAndAuditorReadiness") or {}
    periods = scope.get("financialPeriods") or []
    return [period for period in periods if isinstance(period, dict)]


def get_period_ids(payload: dict[str, Any]) -> set[str]:
    return {
        str(period.get("id"))
        for period in get_financial_periods(payload)
        if period.get("id")
    }


def get_financial_period_by_id(payload: dict[str, Any], period_id: str) -> dict[str, Any] | None:
    for period in get_financial_periods(payload):
        if period.get("id") == period_id:
            return period
    return None


def get_full_year_periods(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        period
        for period in get_financial_periods(payload)
        if period.get("fullYearOrInterim") == "full-year"
    ]


def get_interim_periods(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        period
        for period in get_financial_periods(payload)
        if period.get("fullYearOrInterim") == "interim"
    ]


def is_interim_period(period: dict[str, Any]) -> bool:
    return period.get("fullYearOrInterim") == "interim"


def is_full_year_period(period: dict[str, Any]) -> bool:
    return period.get("fullYearOrInterim") == "full-year"


def count_period_references(payload: dict[str, Any], period_id: str) -> list[dict[str, Any]]:
    deps: list[dict[str, Any]] = []

    pl = payload.get("restatedStatementOfProfitAndLoss") or {}
    pl_count = sum(1 for row in pl.get("plLineValues") or [] if row.get("periodId") == period_id)
    if pl_count > 0:
        deps.append(
            {
                "section": "restated-statement-of-profit-and-loss",
                "count": pl_count,
                "description": "P&L line values",
            }
        )

    exceptional_count = sum(
        1 for row in pl.get("exceptionalItems") or [] if row.get("periodId") == period_id
    )
    if exceptional_count > 0:
        deps.append(
            {
                "section": "restated-statement-of-profit-and-loss",
                "count": exceptional_count,
                "description": "Exceptional items",
            }
        )

    per_share_count = sum(
        1 for row in pl.get("perShareByPeriod") or [] if row.get("periodId") == period_id
    )
    if per_share_count > 0:
        deps.append(
            {
                "section": "restated-statement-of-profit-and-loss",
                "count": per_share_count,
                "description": "Per-share information",
            }
        )

    bs_section = payload.get("assetsLiabilitiesEquityAndCashFlows") or {}
    bs_count = sum(
        1
        for row in bs_section.get("balanceSheetLineValues") or []
        if row.get("periodId") == period_id
    )
    if bs_count > 0:
        deps.append(
            {
                "section": "assets-liabilities-equity-and-cash-flows",
                "count": bs_count,
                "description": "Balance sheet line values",
            }
        )

    cf_count = sum(
        1 for row in bs_section.get("cashFlowLineValues") or [] if row.get("periodId") == period_id
    )
    if cf_count > 0:
        deps.append(
            {
                "section": "assets-liabilities-equity-and-cash-flows",
                "count": cf_count,
                "description": "Cash flow line values",
            }
        )

    equity_count = sum(
        1
        for row in bs_section.get("changesInEquityLineValues") or []
        if row.get("periodId") == period_id
    )
    if equity_count > 0:
        deps.append(
            {
                "section": "assets-liabilities-equity-and-cash-flows",
                "count": equity_count,
                "description": "Changes in equity line values",
            }
        )

    restatement = payload.get("restatementAdjustmentsPoliciesAndAuditorMatters") or {}
    adjustment_count = sum(
        1
        for row in restatement.get("restatementAdjustments") or []
        if row.get("periodId") == period_id
    )
    if adjustment_count > 0:
        deps.append(
            {
                "section": "restatement-adjustments-policies-and-auditor-matters",
                "count": adjustment_count,
                "description": "Restatement adjustments",
            }
        )

    audit_matter_count = sum(
        1
        for row in restatement.get("auditReportMatters") or []
        if row.get("periodId") == period_id
    )
    if audit_matter_count > 0:
        deps.append(
            {
                "section": "restatement-adjustments-policies-and-auditor-matters",
                "count": audit_matter_count,
                "description": "Audit report matters",
            }
        )

    other = payload.get("otherFinancialInformation") or {}
    segment_count = sum(
        1 for row in other.get("segmentRecords") or [] if row.get("periodId") == period_id
    )
    if segment_count > 0:
        deps.append(
            {
                "section": "other-financial-information",
                "count": segment_count,
                "description": "Segment records",
            }
        )

    rp_count = sum(
        1
        for row in other.get("relatedPartyTransactions") or []
        if row.get("periodId") == period_id
    )
    if rp_count > 0:
        deps.append(
            {
                "section": "other-financial-information",
                "count": rp_count,
                "description": "Related-party transactions",
            }
        )

    wc_count = sum(
        1
        for row in other.get("workingCapitalSummaries") or []
        if row.get("periodId") == period_id
    )
    if wc_count > 0:
        deps.append(
            {
                "section": "other-financial-information",
                "count": wc_count,
                "description": "Working capital summaries",
            }
        )

    tax_count = sum(
        1 for row in other.get("taxByPeriod") or [] if row.get("periodId") == period_id
    )
    if tax_count > 0:
        deps.append(
            {
                "section": "other-financial-information",
                "count": tax_count,
                "description": "Tax information",
            }
        )

    dividend_count = sum(
        1 for row in other.get("dividendRecords") or [] if row.get("periodId") == period_id
    )
    if dividend_count > 0:
        deps.append(
            {
                "section": "other-financial-information",
                "count": dividend_count,
                "description": "Dividend records",
            }
        )

    ratios = payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
    sme_count = sum(
        1
        for row in ratios.get("smeEligibilityByPeriod") or []
        if row.get("periodId") == period_id
    )
    if sme_count > 0:
        deps.append(
            {
                "section": "ratios-capitalisation-and-issue-price-metrics",
                "count": sme_count,
                "description": "SME eligibility records",
            }
        )

    comparable_refs = sum(
        1
        for period in get_financial_periods(payload)
        if period.get("comparablePeriodId") == period_id
    )
    if comparable_refs > 0:
        deps.append(
            {
                "section": "reporting-scope-periods-and-auditor-readiness",
                "count": comparable_refs,
                "description": "Comparable period references",
            }
        )

    return deps


def validate_period_deletion(payload: dict[str, Any], period_id: str) -> dict[str, Any]:
    dependencies = count_period_references(payload, period_id)
    total_refs = sum(dep["count"] for dep in dependencies)
    if total_refs == 0:
        return {
            "canDelete": True,
            "dependencies": [],
            "message": "No financial data references this period.",
        }
    summary = "; ".join(f"{dep['count']} {dep['description']}" for dep in dependencies)
    return {
        "canDelete": False,
        "dependencies": dependencies,
        "message": (
            f"This period is referenced by {summary}. "
            "Remove or reassign those records before deleting."
        ),
    }


def period_months(period: dict[str, Any]) -> str:
    months = period.get("months")
    if dm.is_filled(months):
        return str(months)
    return ""


def periods_are_comparable(previous: dict[str, Any], current: dict[str, Any]) -> bool:
    if previous.get("fullYearOrInterim") != current.get("fullYearOrInterim"):
        return False
    prev_months = period_months(previous)
    curr_months = period_months(current)
    if dm.is_filled(prev_months) and dm.is_filled(curr_months) and prev_months != curr_months:
        return False
    return True


def get_period_comparison_warnings(payload: dict[str, Any]) -> list[dict[str, Any]]:
    warnings: list[dict[str, Any]] = []
    periods = get_financial_periods(payload)
    period_by_id = {period.get("id"): period for period in periods if period.get("id")}

    mda = payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
    for variance in mda.get("varianceAnalyses") or []:
        previous = period_by_id.get(variance.get("previousPeriodId"))
        current = period_by_id.get(variance.get("currentPeriodId"))
        if not previous or not current:
            continue
        if periods_are_comparable(previous, current):
            continue
        warnings.append(
            {
                "id": variance.get("id"),
                "previousPeriodId": variance.get("previousPeriodId"),
                "currentPeriodId": variance.get("currentPeriodId"),
                "previousLabel": previous.get("label") or previous.get("id"),
                "currentLabel": current.get("label") or current.get("id"),
                "warning": (
                    "Comparing periods with different lengths or full-year vs interim basis "
                    "without adjustment may mislead."
                ),
            }
        )

    for period in periods:
        comparable_id = period.get("comparablePeriodId")
        if not comparable_id:
            continue
        comparable = period_by_id.get(comparable_id)
        if not comparable:
            continue
        if periods_are_comparable(comparable, period):
            continue
        warnings.append(
            {
                "id": f"comparable-{period.get('id')}",
                "previousPeriodId": comparable.get("id"),
                "currentPeriodId": period.get("id"),
                "previousLabel": comparable.get("label") or comparable.get("id"),
                "currentLabel": period.get("label") or period.get("id"),
                "warning": (
                    "Interim comparable period length or basis differs from the referenced period."
                ),
            }
        )

    return warnings


def has_three_full_year_periods(payload: dict[str, Any]) -> bool:
    full_years = [
        period
        for period in get_full_year_periods(payload)
        if str(period.get("label") or "").strip()
        and str(period.get("startDate") or "").strip()
        and str(period.get("endDate") or "").strip()
    ]
    distinct_labels = {str(period.get("label") or "").strip() for period in full_years}
    return len(distinct_labels) >= 3


def get_latest_period(payload: dict[str, Any]) -> dict[str, Any] | None:
    periods = [
        period
        for period in get_financial_periods(payload)
        if str(period.get("endDate") or "").strip()
    ]
    if not periods:
        return None
    return max(periods, key=lambda period: str(period.get("endDate") or ""))
