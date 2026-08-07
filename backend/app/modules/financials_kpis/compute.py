"""Derived Financials & KPIs computations — ports frontend compute.ts."""

from __future__ import annotations

from typing import Any

from app.modules.financials_kpis import decimal_math as dm
from app.modules.financials_kpis.constants import (
    RECONCILIATION_TOLERANCE,
    SME_NET_WORTH_MINIMUM,
    SME_OPERATING_PROFIT_THRESHOLD,
)
from app.modules.financials_kpis.periods import (
    get_financial_periods,
    get_latest_period,
    get_period_comparison_warnings,
    is_interim_period,
)
from app.modules.financials_kpis.pl_lines import PL_DERIVED_TOTAL_KEYS


def _line_amount(rows: list[Any], period_id: str, line_key: str) -> str:
    for row in rows:
        if row.get("periodId") == period_id and row.get("lineKey") == line_key:
            return dm.to_decimal_string(row.get("amount"))
    return ""


def _bs_amount(payload: dict[str, Any], period_id: str, line_key: str) -> str:
    section = payload.get("assetsLiabilitiesEquityAndCashFlows") or {}
    for row in section.get("balanceSheetLineValues") or []:
        if row.get("periodId") == period_id and row.get("lineKey") == line_key:
            return dm.to_decimal_string(row.get("amount"))
    return ""


def _cf_amount(payload: dict[str, Any], period_id: str, line_key: str) -> str:
    section = payload.get("assetsLiabilitiesEquityAndCashFlows") or {}
    for row in section.get("cashFlowLineValues") or []:
        if row.get("periodId") == period_id and row.get("lineKey") == line_key:
            return dm.to_decimal_string(row.get("amount"))
    return ""


def _equity_amount(payload: dict[str, Any], period_id: str, line_key: str) -> str:
    section = payload.get("assetsLiabilitiesEquityAndCashFlows") or {}
    for row in section.get("changesInEquityLineValues") or []:
        if row.get("periodId") == period_id and row.get("lineKey") == line_key:
            return dm.to_decimal_string(row.get("amount"))
    return ""


def _derived_total(rows: list[Any], period_id: str, total_key: str) -> str:
    entered = _line_amount(rows, period_id, total_key)
    if dm.is_filled(entered):
        return entered
    components = PL_DERIVED_TOTAL_KEYS.get(total_key)
    if not components:
        return ""
    return dm.sum_decimals([_line_amount(rows, period_id, key) for key in components])


def _compute_ebitda(
    profit_before_tax: str, finance_costs: str, depreciation: str, amortisation: str
) -> str:
    if not dm.is_filled(profit_before_tax):
        return ""
    return dm.sum_decimals([profit_before_tax, finance_costs, depreciation, amortisation])


def _compute_ebit(profit_before_tax: str, finance_costs: str) -> str:
    if not dm.is_filled(profit_before_tax):
        return ""
    return dm.sum_decimals([profit_before_tax, finance_costs])


def _growth_rate(current: str, previous: str) -> str:
    if not dm.is_filled(current) or not dm.is_filled(previous):
        return ""
    cmp = dm.compare(previous, "0")
    if cmp is None or cmp == 0:
        return ""
    return dm.pct(dm.difference(current, previous), dm.abs_decimal(previous), 2)


def _sme_state_for_operating_profit(value: str, source_status: str) -> str:
    if not dm.is_filled(value):
        return "missing_information"
    if source_status == "pending_confirmation":
        return "pending_auditor_confirmation"
    if source_status in {"management_estimate", "management_accounts"}:
        return "professional_confirmation_required"
    cmp = dm.compare(value, SME_OPERATING_PROFIT_THRESHOLD)
    if cmp is not None and cmp <= 0:
        return "appears_satisfied"
    return "potential_concern"


def _sme_state_for_net_worth(value: str, source_status: str) -> str:
    if not dm.is_filled(value):
        return "missing_information"
    if source_status == "pending_confirmation":
        return "pending_auditor_confirmation"
    if source_status in {"management_estimate", "management_accounts"}:
        return "professional_confirmation_required"
    cmp = dm.compare(value, SME_NET_WORTH_MINIMUM)
    if cmp is not None and cmp > 0:
        return "appears_satisfied"
    return "potential_concern"


def _sme_state_for_fcfe(value: str, source_status: str) -> str:
    if not dm.is_filled(value):
        return "missing_information"
    if source_status == "pending_confirmation":
        return "pending_auditor_confirmation"
    if source_status in {"management_estimate", "management_accounts"}:
        return "professional_confirmation_required"
    if dm.is_positive(value):
        return "appears_satisfied"
    return "potential_concern"


def _reconciliation_check(
    check_id: str,
    period_id: str,
    label: str,
    entered: str,
    calculated: str,
) -> dict[str, Any]:
    if not dm.is_filled(entered) and not dm.is_filled(calculated):
        return {
            "id": check_id,
            "periodId": period_id,
            "label": label,
            "status": "missing_information",
            "entered": entered,
            "calculated": calculated,
            "variance": "",
            "message": "Neither entered nor calculated value is available.",
        }
    if not dm.is_filled(entered) or not dm.is_filled(calculated):
        return {
            "id": check_id,
            "periodId": period_id,
            "label": label,
            "status": "missing_information",
            "entered": entered,
            "calculated": calculated,
            "variance": dm.difference(entered, calculated),
            "message": "One side of the reconciliation is missing.",
        }
    variance = dm.difference(entered, calculated)
    reconciles = not dm.differs_beyond(entered, calculated, RECONCILIATION_TOLERANCE)
    return {
        "id": check_id,
        "periodId": period_id,
        "label": label,
        "status": "reconciled" if reconciles else "variance",
        "entered": entered,
        "calculated": calculated,
        "variance": variance,
        "message": (
            "Entered and calculated values reconcile within tolerance."
            if reconciles
            else "Entered total differs from calculated total."
        ),
    }


def compute_financials_kpis_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
    ipo_reference: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    periods = get_financial_periods(payload)
    pl_rows = (payload.get("restatedStatementOfProfitAndLoss") or {}).get("plLineValues") or []
    scope = payload.get("reportingScopePeriodsAndAuditorReadiness") or {}
    display_unit = (scope.get("reportingBasis") or {}).get("displayUnit") or "rupees"
    latest_period = get_latest_period(payload)

    primary_ipo = ipo_reference or linked.get("ipoSetup") or {}
    issue_price = ""
    if primary_ipo.get("available") and dm.is_filled(primary_ipo.get("proposedIssuePrice")):
        issue_price = dm.to_decimal_string(primary_ipo.get("proposedIssuePrice"))

    pl_by_period: list[dict[str, Any]] = []
    sorted_periods = sorted(periods, key=lambda period: str(period.get("endDate") or ""))

    for index, period in enumerate(sorted_periods):
        previous = sorted_periods[index - 1] if index > 0 else None
        period_id = str(period.get("id") or "")

        revenue_from_operations = _line_amount(pl_rows, period_id, "revenueFromOperations")
        total_income_entered = _line_amount(pl_rows, period_id, "totalIncome")
        total_income = (
            total_income_entered
            if dm.is_filled(total_income_entered)
            else _derived_total(pl_rows, period_id, "totalIncome")
        )
        total_expenses_entered = _line_amount(pl_rows, period_id, "totalExpenses")
        total_expenses = (
            total_expenses_entered
            if dm.is_filled(total_expenses_entered)
            else _derived_total(pl_rows, period_id, "totalExpenses")
        )
        profit_before_tax_entered = _line_amount(pl_rows, period_id, "profitBeforeTax")
        if dm.is_filled(profit_before_tax_entered):
            profit_before_tax = profit_before_tax_entered
        elif dm.is_filled(total_income) and dm.is_filled(total_expenses):
            profit_before_tax = dm.subtract(total_income, total_expenses)
        else:
            profit_before_tax = ""
        profit_after_tax = _line_amount(pl_rows, period_id, "profitAfterTax")
        finance_costs = _line_amount(pl_rows, period_id, "financeCosts")
        depreciation = _line_amount(pl_rows, period_id, "depreciation")
        amortisation = _line_amount(pl_rows, period_id, "amortisation")
        ebitda = _compute_ebitda(profit_before_tax, finance_costs, depreciation, amortisation)
        ebit = _compute_ebit(profit_before_tax, finance_costs)

        prev_revenue = (
            _line_amount(pl_rows, str(previous.get("id") or ""), "revenueFromOperations")
            if previous
            else ""
        )

        pl_by_period.append(
            {
                "periodId": period_id,
                "periodLabel": period.get("label") or period_id,
                "isInterim": is_interim_period(period),
                "revenueFromOperations": revenue_from_operations,
                "totalIncome": total_income,
                "totalExpenses": total_expenses,
                "profitBeforeTax": profit_before_tax,
                "profitAfterTax": profit_after_tax,
                "ebitda": ebitda,
                "ebit": ebit,
                "ebitdaMargin": dm.pct(ebitda, revenue_from_operations, 2),
                "ebitMargin": dm.pct(ebit, revenue_from_operations, 2),
                "patMargin": dm.pct(profit_after_tax, revenue_from_operations, 2),
                "revenueGrowth": _growth_rate(revenue_from_operations, prev_revenue),
            }
        )

    bs_by_period: list[dict[str, Any]] = []
    for period in periods:
        period_id = str(period.get("id") or "")
        total_assets = _bs_amount(payload, period_id, "totalAssets")
        total_equity_and_liabilities = _bs_amount(payload, period_id, "totalEquityAndLiabilities")
        total_equity = _bs_amount(payload, period_id, "totalEquity")
        total_liabilities = _bs_amount(payload, period_id, "totalLiabilities")
        variance = dm.difference(total_assets, total_equity_and_liabilities)
        assets_reconciles = (
            not dm.is_filled(total_assets)
            or not dm.is_filled(total_equity_and_liabilities)
            or not dm.differs_beyond(total_assets, total_equity_and_liabilities, RECONCILIATION_TOLERANCE)
        )
        bs_by_period.append(
            {
                "periodId": period_id,
                "periodLabel": period.get("label") or period_id,
                "totalAssets": total_assets,
                "totalEquityAndLiabilities": total_equity_and_liabilities,
                "totalEquity": total_equity,
                "totalLiabilities": total_liabilities,
                "assetsReconciles": assets_reconciles,
                "variance": variance,
            }
        )

    cf_by_period: list[dict[str, Any]] = []
    for period in periods:
        period_id = str(period.get("id") or "")
        opening_cash = _cf_amount(payload, period_id, "openingCashAndCashEquivalents")
        net_movement = _cf_amount(payload, period_id, "netIncreaseDecreaseInCash")
        exchange_impact = _cf_amount(payload, period_id, "exchangeRateImpact")
        closing_cash = _cf_amount(payload, period_id, "closingCashAndCashEquivalents")
        calculated_closing = (
            dm.sum_decimals([opening_cash, net_movement, exchange_impact])
            if dm.is_filled(opening_cash)
            else ""
        )
        variance = dm.difference(closing_cash, calculated_closing)
        reconciles = (
            not dm.is_filled(closing_cash)
            or not dm.is_filled(calculated_closing)
            or not dm.differs_beyond(closing_cash, calculated_closing, RECONCILIATION_TOLERANCE)
        )
        cf_by_period.append(
            {
                "periodId": period_id,
                "periodLabel": period.get("label") or period_id,
                "openingCash": opening_cash,
                "netMovement": net_movement,
                "exchangeImpact": exchange_impact,
                "closingCash": closing_cash,
                "calculatedClosing": calculated_closing,
                "reconciles": reconciles,
                "variance": variance,
            }
        )

    equity_by_period: list[dict[str, Any]] = []
    for period in periods:
        period_id = str(period.get("id") or "")
        opening_share_capital = _equity_amount(payload, period_id, "openingShareCapital")
        share_changes = _equity_amount(payload, period_id, "sharesIssuedCancelledAdjusted")
        closing_share_capital = _equity_amount(payload, period_id, "closingShareCapital")
        opening_other_equity = _equity_amount(payload, period_id, "openingOtherEquity")
        closing_other_equity = _equity_amount(payload, period_id, "closingOtherEquity")
        profit_for_period = _equity_amount(payload, period_id, "profitForPeriod")
        oci = _equity_amount(payload, period_id, "oci")
        dividends = _equity_amount(payload, period_id, "dividends")
        share_based = _equity_amount(payload, period_id, "shareBasedPayments")
        other_capital = _equity_amount(payload, period_id, "otherCapitalTransactions")
        restatement = _equity_amount(payload, period_id, "restatementAdjustments")
        calculated_closing_other_equity = (
            dm.sum_decimals(
                [
                    opening_other_equity,
                    profit_for_period,
                    oci,
                    dm.subtract("0", dividends),
                    share_based,
                    other_capital,
                    restatement,
                ]
            )
            if dm.is_filled(opening_other_equity)
            else ""
        )
        variance = dm.difference(closing_other_equity, calculated_closing_other_equity)
        reconciles = (
            not dm.is_filled(closing_other_equity)
            or not dm.is_filled(calculated_closing_other_equity)
            or not dm.differs_beyond(
                closing_other_equity, calculated_closing_other_equity, RECONCILIATION_TOLERANCE
            )
        )
        equity_by_period.append(
            {
                "periodId": period_id,
                "periodLabel": period.get("label") or period_id,
                "openingShareCapital": opening_share_capital,
                "shareChanges": share_changes,
                "closingShareCapital": closing_share_capital,
                "openingOtherEquity": opening_other_equity,
                "closingOtherEquity": closing_other_equity,
                "calculatedClosingOtherEquity": calculated_closing_other_equity,
                "reconciles": reconciles,
                "variance": variance,
            }
        )

    ratios_by_period: list[dict[str, Any]] = []
    per_share_rows = (payload.get("restatedStatementOfProfitAndLoss") or {}).get("perShareByPeriod") or []
    for period in periods:
        period_id = str(period.get("id") or "")
        pl = next((row for row in pl_by_period if row["periodId"] == period_id), None)
        per_share = next((row for row in per_share_rows if row.get("periodId") == period_id), None)
        current_assets = _bs_amount(payload, period_id, "totalCurrentAssets")
        current_liabilities = _bs_amount(payload, period_id, "totalCurrentLiabilities")
        inventories = _bs_amount(payload, period_id, "inventories")
        total_equity = _bs_amount(payload, period_id, "totalEquity")
        total_debt = dm.sum_decimals(
            [
                _bs_amount(payload, period_id, "nonCurrentBorrowings"),
                _bs_amount(payload, period_id, "currentBorrowings"),
                _bs_amount(payload, period_id, "currentMaturitiesLongTermDebt"),
            ]
        )
        cash = _bs_amount(payload, period_id, "cashAndCashEquivalents")
        net_debt = dm.subtract(total_debt, cash) if dm.is_filled(total_debt) else ""
        finance_costs = _line_amount(pl_rows, period_id, "financeCosts")
        profit_before_tax = (pl or {}).get("profitBeforeTax", "")
        profit_after_tax = (pl or {}).get("profitAfterTax", "")
        basic_eps = dm.to_decimal_string((per_share or {}).get("basicEps"))
        equity_share_capital = _bs_amount(payload, period_id, "equityShareCapital")
        total_other_equity = _bs_amount(payload, period_id, "totalOtherEquity")
        shareholders_funds = dm.sum_decimals([equity_share_capital, total_other_equity])
        weighted_shares = dm.to_decimal_string((per_share or {}).get("weightedAvgBasicShares"))
        nav_per_share = (
            dm.div(shareholders_funds, weighted_shares, 4)
            if dm.is_filled(shareholders_funds) and dm.is_filled(weighted_shares)
            else ""
        )
        issue_price_pending = not dm.is_filled(issue_price)
        pe_ratio = (
            ""
            if issue_price_pending or not dm.is_filled(basic_eps) or not dm.is_positive(basic_eps)
            else dm.div(issue_price, basic_eps, 2)
        )
        issue_price_to_nav = (
            ""
            if issue_price_pending or not dm.is_filled(nav_per_share) or not dm.is_positive(nav_per_share)
            else dm.div(issue_price, nav_per_share, 2)
        )
        ebitda = (pl or {}).get("ebitda", "")
        ratios_by_period.append(
            {
                "periodId": period_id,
                "periodLabel": period.get("label") or period_id,
                "basicEps": basic_eps,
                "dilutedEps": dm.to_decimal_string((per_share or {}).get("dilutedEps")),
                "currentRatio": (
                    dm.div(current_assets, current_liabilities, 2)
                    if dm.is_filled(current_assets) and dm.is_filled(current_liabilities)
                    else ""
                ),
                "quickRatio": (
                    dm.div(dm.subtract(current_assets, inventories), current_liabilities, 2)
                    if dm.is_filled(current_assets) and dm.is_filled(current_liabilities)
                    else ""
                ),
                "debtEquityRatio": (
                    dm.div(total_debt, total_equity, 2)
                    if dm.is_filled(total_debt) and dm.is_filled(total_equity)
                    else ""
                ),
                "netDebtEquityRatio": (
                    dm.div(net_debt, total_equity, 2)
                    if dm.is_filled(net_debt) and dm.is_filled(total_equity)
                    else ""
                ),
                "interestCoverage": (
                    dm.div(ebitda, finance_costs, 2)
                    if dm.is_filled(ebitda) and dm.is_filled(finance_costs)
                    else ""
                ),
                "roe": (
                    dm.pct(profit_after_tax, total_equity, 2)
                    if dm.is_filled(profit_after_tax) and dm.is_filled(total_equity)
                    else ""
                ),
                "roce": (
                    dm.pct(profit_before_tax, shareholders_funds, 2)
                    if dm.is_filled(profit_before_tax) and dm.is_filled(shareholders_funds)
                    else ""
                ),
                "effectiveTaxRate": (
                    dm.pct(_line_amount(pl_rows, period_id, "currentTax"), profit_before_tax, 2)
                    if dm.is_filled(_line_amount(pl_rows, period_id, "currentTax"))
                    and dm.is_filled(profit_before_tax)
                    else ""
                ),
                "peRatio": pe_ratio,
                "navPerShare": nav_per_share,
                "issuePriceToNav": issue_price_to_nav,
                "issuePricePending": issue_price_pending,
            }
        )

    ratios_section = payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
    sme_eligibility: list[dict[str, Any]] = []
    for row in ratios_section.get("smeEligibilityByPeriod") or []:
        period = next((item for item in periods if item.get("id") == row.get("periodId")), None)
        sme_eligibility.append(
            {
                "periodId": row.get("periodId"),
                "periodLabel": (period or {}).get("label") or row.get("periodId"),
                "operatingProfit": row.get("operatingProfit", ""),
                "operatingProfitState": _sme_state_for_operating_profit(
                    row.get("operatingProfit", ""), row.get("sourceStatus", "")
                ),
                "netWorth": row.get("netWorth", ""),
                "netWorthState": _sme_state_for_net_worth(
                    row.get("netWorth", ""), row.get("sourceStatus", "")
                ),
                "fcfe": row.get("fcfe", ""),
                "fcfeState": _sme_state_for_fcfe(row.get("fcfe", ""), row.get("sourceStatus", "")),
            }
        )

    restatement_section = payload.get("restatementAdjustmentsPoliciesAndAuditorMatters") or {}
    restatement_checks: list[dict[str, Any]] = []
    for row in restatement_section.get("restatementAdjustments") or []:
        calculated_restated = dm.sum_decimals(
            [row.get("originalAuditedAmount"), row.get("adjustmentAmount")]
        )
        variance = dm.difference(row.get("restatedAmount"), calculated_restated)
        reconciles = (
            not dm.is_filled(row.get("restatedAmount"))
            or not dm.is_filled(calculated_restated)
            or not dm.differs_beyond(
                row.get("restatedAmount"), calculated_restated, RECONCILIATION_TOLERANCE
            )
        )
        restatement_checks.append(
            {
                "id": row.get("id"),
                "reconciles": reconciles,
                "originalAuditedAmount": row.get("originalAuditedAmount", ""),
                "adjustmentAmount": row.get("adjustmentAmount", ""),
                "restatedAmount": row.get("restatedAmount", ""),
                "calculatedRestated": calculated_restated,
                "variance": variance,
            }
        )

    reconciliation: list[dict[str, Any]] = []
    for period in periods:
        period_id = str(period.get("id") or "")
        total_income_entered = _line_amount(pl_rows, period_id, "totalIncome")
        total_income_calculated = _derived_total(pl_rows, period_id, "totalIncome")
        if dm.is_filled(total_income_entered):
            reconciliation.append(
                _reconciliation_check(
                    f"pl-total-income-{period_id}",
                    period_id,
                    "P&L total income",
                    total_income_entered,
                    total_income_calculated,
                )
            )

        total_expenses_entered = _line_amount(pl_rows, period_id, "totalExpenses")
        total_expenses_calculated = _derived_total(pl_rows, period_id, "totalExpenses")
        if dm.is_filled(total_expenses_entered):
            reconciliation.append(
                _reconciliation_check(
                    f"pl-total-expenses-{period_id}",
                    period_id,
                    "P&L total expenses",
                    total_expenses_entered,
                    total_expenses_calculated,
                )
            )

        bs = next((row for row in bs_by_period if row["periodId"] == period_id), None)
        if bs and dm.is_filled(bs["totalAssets"]) and dm.is_filled(bs["totalEquityAndLiabilities"]):
            reconciliation.append(
                _reconciliation_check(
                    f"bs-balance-{period_id}",
                    period_id,
                    "Total assets vs total equity and liabilities",
                    bs["totalAssets"],
                    bs["totalEquityAndLiabilities"],
                )
            )

        cf = next((row for row in cf_by_period if row["periodId"] == period_id), None)
        if cf and dm.is_filled(cf["closingCash"]) and dm.is_filled(cf["calculatedClosing"]):
            reconciliation.append(
                _reconciliation_check(
                    f"cf-closing-{period_id}",
                    period_id,
                    "Cash flow closing cash",
                    cf["closingCash"],
                    cf["calculatedClosing"],
                )
            )

    capital = linked.get("capitalOwnership") or {}
    linked_equity = capital.get("equityShareCapital")
    if capital.get("available") and dm.is_filled(linked_equity) and latest_period:
        entered = _bs_amount(payload, str(latest_period.get("id") or ""), "equityShareCapital")
        reconciliation.append(
            _reconciliation_check(
                "share-capital-linked",
                str(latest_period.get("id") or ""),
                "Share capital vs Capital & Ownership",
                entered,
                linked_equity or "",
            )
        )

    return {
        "plByPeriod": pl_by_period,
        "bsByPeriod": bs_by_period,
        "cfByPeriod": cf_by_period,
        "equityByPeriod": equity_by_period,
        "ratiosByPeriod": ratios_by_period,
        "smeEligibility": sme_eligibility,
        "restatementChecks": restatement_checks,
        "reconciliation": reconciliation,
        "periodComparisonWarnings": get_period_comparison_warnings(payload),
        "displayUnit": display_unit,
        "latestPeriodLabel": (latest_period or {}).get("label") or "",
    }
