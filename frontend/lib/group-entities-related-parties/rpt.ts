/**
 * RPT calculation helpers — frontend-only, decimal-safe.
 */

import { addDecimals, isFilledDecimal, parseDecimal, percentageOf } from '@/lib/group-entities-related-parties/decimal';
import type { LinkedWorkstreamReferences } from '@/lib/group-entities-related-parties/types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  RptBalanceRecord,
  RptTransactionRecord,
} from '@/lib/schemas/group-entities-related-parties';

const SALES_TYPES = new Set([
  'sale-of-goods-materials',
  'sale-of-services',
  'property-sale',
  'lease-rent-received',
  'licence-royalty',
  'dividend',
]);

const PURCHASE_TYPES = new Set([
  'purchase-of-goods-materials',
  'purchase-receipt-of-services',
  'property-purchase',
  'lease-rent-paid',
  'management-services',
]);

const LOAN_GIVEN_TYPES = new Set(['loan-given', 'advance-given']);
const LOAN_RECEIVED_TYPES = new Set(['loan-received', 'advance-received']);
const GUARANTEE_TYPES = new Set(['guarantee', 'corporate-guarantee', 'collateral-security']);

export type RptSummary = {
  totalByParty: Record<string, string>;
  totalByType: Record<string, string>;
  totalByFinancialYear: Record<string, string>;
  rptSales: string;
  rptPurchases: string;
  rptLoansGiven: string;
  rptLoansReceived: string;
  guarantees: string;
  closingReceivables: string;
  closingPayables: string;
  closingLoans: string;
  latestFinancialYearTotal: string;
  rptRevenuePercent: string | null;
  rptPurchasesPercent: string | null;
  rptReceivablesPercent: string | null;
  rptPayablesPercent: string | null;
  financialsRevenueDifference: string | null;
  financialsPurchasesDifference: string | null;
};

function partyKey(tx: RptTransactionRecord): string {
  return tx.linkedEntityId || tx.linkedPersonId || tx.relatedPartyRelationshipId || 'unknown';
}

function sumTransactions(
  transactions: RptTransactionRecord[],
  filter: (tx: RptTransactionRecord) => boolean,
): string {
  const values = transactions.filter(filter).map((tx) => tx.transactionValue);
  return addDecimals(...values);
}

function sumBalances(balances: RptBalanceRecord[], types: Set<string>): string {
  const values = balances
    .filter((balance) => types.has(balance.balanceType))
    .map((balance) => balance.closingBalance);
  return addDecimals(...values);
}

export function calculateRptSummary(
  payload: GroupEntitiesRelatedPartiesPayload,
  linkedReferences: LinkedWorkstreamReferences,
): RptSummary {
  const transactions = payload.relatedPartyTransactionsBalancesAndCommitments.transactions;
  const balances = payload.relatedPartyTransactionsBalancesAndCommitments.balances;

  const totalByParty: Record<string, string> = {};
  const totalByType: Record<string, string> = {};
  const totalByFinancialYear: Record<string, string> = {};

  for (const tx of transactions) {
    const key = partyKey(tx);
    totalByParty[key] = addDecimals(totalByParty[key] ?? '', tx.transactionValue);
    if (tx.transactionType) {
      totalByType[tx.transactionType] = addDecimals(
        totalByType[tx.transactionType] ?? '',
        tx.transactionValue,
      );
    }
    if (tx.financialPeriod) {
      totalByFinancialYear[tx.financialPeriod] = addDecimals(
        totalByFinancialYear[tx.financialPeriod] ?? '',
        tx.transactionValue,
      );
    }
  }

  const rptSales = sumTransactions(transactions, (tx) => SALES_TYPES.has(tx.transactionType));
  const rptPurchases = sumTransactions(transactions, (tx) => PURCHASE_TYPES.has(tx.transactionType));
  const rptLoansGiven = sumTransactions(transactions, (tx) => LOAN_GIVEN_TYPES.has(tx.transactionType));
  const rptLoansReceived = sumTransactions(transactions, (tx) =>
    LOAN_RECEIVED_TYPES.has(tx.transactionType),
  );
  const guarantees = sumTransactions(transactions, (tx) => GUARANTEE_TYPES.has(tx.transactionType));

  const closingReceivables = sumBalances(
    balances,
    new Set(['receivable', 'loan-receivable', 'advance', 'accrued-income']),
  );
  const closingPayables = sumBalances(
    balances,
    new Set(['payable', 'loan-payable', 'accrued-expense', 'commitment']),
  );
  const closingLoans = addDecimals(
    sumBalances(balances, new Set(['loan-receivable'])),
    sumBalances(balances, new Set(['loan-payable'])),
  );

  const financialYears = Object.keys(totalByFinancialYear).sort();
  const latestFinancialYear = financialYears.at(-1) ?? '';
  const latestFinancialYearTotal = latestFinancialYear
    ? totalByFinancialYear[latestFinancialYear]
    : '';

  const fin = linkedReferences.financialsKpis;
  const revenueFromOperations = fin.revenueFromOperations ?? '';
  const totalPurchases = fin.totalPurchases ?? '';
  const totalReceivables = fin.totalReceivables ?? '';
  const totalPayables = fin.totalPayables ?? '';
  const rptRevenueTotal = fin.rptRevenueTotal ?? '';
  const rptPurchasesTotal = fin.rptPurchasesTotal ?? '';

  const rptRevenuePercent =
    fin.available && isFilledDecimal(revenueFromOperations)
      ? percentageOf(rptSales, revenueFromOperations)
      : null;
  const rptPurchasesPercent =
    fin.available && isFilledDecimal(totalPurchases)
      ? percentageOf(rptPurchases, totalPurchases)
      : null;
  const rptReceivablesPercent =
    fin.available && isFilledDecimal(totalReceivables)
      ? percentageOf(closingReceivables, totalReceivables)
      : null;
  const rptPayablesPercent =
    fin.available && isFilledDecimal(totalPayables)
      ? percentageOf(closingPayables, totalPayables)
      : null;

  let financialsRevenueDifference: string | null = null;
  if (fin.available && isFilledDecimal(rptRevenueTotal) && isFilledDecimal(rptSales)) {
    const finVal = parseDecimal(rptRevenueTotal)!;
    const calcVal = parseDecimal(rptSales)!;
    financialsRevenueDifference = String(Math.abs(finVal - calcVal));
  }

  let financialsPurchasesDifference: string | null = null;
  if (fin.available && isFilledDecimal(rptPurchasesTotal) && isFilledDecimal(rptPurchases)) {
    const finVal = parseDecimal(rptPurchasesTotal)!;
    const calcVal = parseDecimal(rptPurchases)!;
    financialsPurchasesDifference = String(Math.abs(finVal - calcVal));
  }

  return {
    totalByParty,
    totalByType,
    totalByFinancialYear,
    rptSales,
    rptPurchases,
    rptLoansGiven,
    rptLoansReceived,
    guarantees,
    closingReceivables,
    closingPayables,
    closingLoans,
    latestFinancialYearTotal,
    rptRevenuePercent,
    rptPurchasesPercent,
    rptReceivablesPercent,
    rptPayablesPercent,
    financialsRevenueDifference,
    financialsPurchasesDifference,
  };
}
