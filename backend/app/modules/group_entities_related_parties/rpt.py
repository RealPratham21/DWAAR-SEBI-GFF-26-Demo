"""RPT calculation helpers — decimal-safe."""

from __future__ import annotations

from typing import Any

from app.modules.group_entities_related_parties import decimal_utils as dm

SALES_TYPES = frozenset(
    {
        "sale-of-goods-materials",
        "sale-of-services",
        "property-sale",
        "lease-rent-received",
        "licence-royalty",
        "dividend",
    }
)

PURCHASE_TYPES = frozenset(
    {
        "purchase-of-goods-materials",
        "purchase-receipt-of-services",
        "property-purchase",
        "lease-rent-paid",
        "management-services",
    }
)

LOAN_GIVEN_TYPES = frozenset({"loan-given", "advance-given"})
LOAN_RECEIVED_TYPES = frozenset({"loan-received", "advance-received"})
GUARANTEE_TYPES = frozenset({"guarantee", "corporate-guarantee", "collateral-security"})

RECEIVABLE_BALANCE_TYPES = frozenset(
    {"receivable", "loan-receivable", "advance", "accrued-income"}
)
PAYABLE_BALANCE_TYPES = frozenset(
    {"payable", "loan-payable", "accrued-expense", "commitment"}
)


def _party_key(tx: dict[str, Any]) -> str:
    return (
        str(tx.get("linkedEntityId") or "")
        or str(tx.get("linkedPersonId") or "")
        or str(tx.get("relatedPartyRelationshipId") or "")
        or "unknown"
    )


def _sum_transactions(
    transactions: list[dict[str, Any]],
    predicate,
) -> str:
    values = [
        str(tx.get("transactionValue") or "")
        for tx in transactions
        if isinstance(tx, dict) and predicate(tx)
    ]
    return dm.sum_decimals(values)


def _sum_balances(balances: list[dict[str, Any]], types: frozenset[str]) -> str:
    values = [
        str(balance.get("closingBalance") or "")
        for balance in balances
        if isinstance(balance, dict) and balance.get("balanceType") in types
    ]
    return dm.sum_decimals(values)


def _abs_difference(a: str, b: str) -> str | None:
    parsed_a = dm.parse_decimal(a)
    parsed_b = dm.parse_decimal(b)
    if parsed_a is None or parsed_b is None:
        return None
    return str(abs(parsed_a - parsed_b))


def calculate_rpt_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    rpt_section = payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}
    transactions = [tx for tx in (rpt_section.get("transactions") or []) if isinstance(tx, dict)]
    balances = [b for b in (rpt_section.get("balances") or []) if isinstance(b, dict)]

    total_by_party: dict[str, str] = {}
    total_by_type: dict[str, str] = {}
    total_by_financial_year: dict[str, str] = {}

    for tx in transactions:
        key = _party_key(tx)
        total_by_party[key] = dm.sum_decimals([total_by_party.get(key, ""), str(tx.get("transactionValue") or "")])
        tx_type = str(tx.get("transactionType") or "")
        if tx_type:
            total_by_type[tx_type] = dm.sum_decimals(
                [total_by_type.get(tx_type, ""), str(tx.get("transactionValue") or "")]
            )
        financial_period = str(tx.get("financialPeriod") or "")
        if financial_period:
            total_by_financial_year[financial_period] = dm.sum_decimals(
                [
                    total_by_financial_year.get(financial_period, ""),
                    str(tx.get("transactionValue") or ""),
                ]
            )

    rpt_sales = _sum_transactions(transactions, lambda tx: tx.get("transactionType") in SALES_TYPES)
    rpt_purchases = _sum_transactions(
        transactions,
        lambda tx: tx.get("transactionType") in PURCHASE_TYPES,
    )
    rpt_loans_given = _sum_transactions(
        transactions,
        lambda tx: tx.get("transactionType") in LOAN_GIVEN_TYPES,
    )
    rpt_loans_received = _sum_transactions(
        transactions,
        lambda tx: tx.get("transactionType") in LOAN_RECEIVED_TYPES,
    )
    guarantees = _sum_transactions(
        transactions,
        lambda tx: tx.get("transactionType") in GUARANTEE_TYPES,
    )

    closing_receivables = _sum_balances(balances, RECEIVABLE_BALANCE_TYPES)
    closing_payables = _sum_balances(balances, PAYABLE_BALANCE_TYPES)
    closing_loans = dm.sum_decimals(
        [
            _sum_balances(balances, frozenset({"loan-receivable"})),
            _sum_balances(balances, frozenset({"loan-payable"})),
        ]
    )

    financial_years = sorted(total_by_financial_year.keys())
    latest_financial_year = financial_years[-1] if financial_years else ""
    latest_financial_year_total = (
        total_by_financial_year.get(latest_financial_year, "") if latest_financial_year else ""
    )

    fin = linked_references.get("financialsKpis") or {}
    revenue_from_operations = str(fin.get("revenueFromOperations") or "")
    total_purchases = str(fin.get("totalPurchases") or "")
    total_receivables = str(fin.get("totalReceivables") or "")
    total_payables = str(fin.get("totalPayables") or "")
    rpt_revenue_total = str(fin.get("rptRevenueTotal") or "")
    rpt_purchases_total = str(fin.get("rptPurchasesTotal") or "")

    fin_available = bool(fin.get("available"))

    rpt_revenue_percent = (
        dm.percentage_of(rpt_sales, revenue_from_operations)
        if fin_available and dm.is_filled(revenue_from_operations)
        else None
    )
    rpt_purchases_percent = (
        dm.percentage_of(rpt_purchases, total_purchases)
        if fin_available and dm.is_filled(total_purchases)
        else None
    )
    rpt_receivables_percent = (
        dm.percentage_of(closing_receivables, total_receivables)
        if fin_available and dm.is_filled(total_receivables)
        else None
    )
    rpt_payables_percent = (
        dm.percentage_of(closing_payables, total_payables)
        if fin_available and dm.is_filled(total_payables)
        else None
    )

    financials_revenue_difference = None
    if fin_available and dm.is_filled(rpt_revenue_total) and dm.is_filled(rpt_sales):
        financials_revenue_difference = _abs_difference(rpt_revenue_total, rpt_sales)

    financials_purchases_difference = None
    if fin_available and dm.is_filled(rpt_purchases_total) and dm.is_filled(rpt_purchases):
        financials_purchases_difference = _abs_difference(rpt_purchases_total, rpt_purchases)

    return {
        "totalByParty": total_by_party,
        "totalByType": total_by_type,
        "totalByFinancialYear": total_by_financial_year,
        "rptSales": rpt_sales,
        "rptPurchases": rpt_purchases,
        "rptLoansGiven": rpt_loans_given,
        "rptLoansReceived": rpt_loans_received,
        "guarantees": guarantees,
        "closingReceivables": closing_receivables,
        "closingPayables": closing_payables,
        "closingLoans": closing_loans,
        "latestFinancialYearTotal": latest_financial_year_total,
        "rptRevenuePercent": rpt_revenue_percent,
        "rptPurchasesPercent": rpt_purchases_percent,
        "rptReceivablesPercent": rpt_receivables_percent,
        "rptPayablesPercent": rpt_payables_percent,
        "financialsRevenueDifference": financials_revenue_difference,
        "financialsPurchasesDifference": financials_purchases_difference,
    }
