/**
 * Balance sheet, cash flow and changes-in-equity line keys and labels.
 */

import {
  BS_LINE_KEY_VALUES,
  CF_LINE_KEY_VALUES,
  EQUITY_LINE_KEY_VALUES,
  type BsLineKey,
  type CfLineKey,
  type EquityLineKey,
} from '@/lib/schemas/financials-kpis';

export const BS_LINE_KEYS = BS_LINE_KEY_VALUES;
export const CF_LINE_KEYS = CF_LINE_KEY_VALUES;
export const EQUITY_LINE_KEYS = EQUITY_LINE_KEY_VALUES;
export type { BsLineKey, CfLineKey, EquityLineKey };

export const BS_NON_CURRENT_ASSET_KEYS = [
  'propertyPlantAndEquipment',
  'capitalWorkInProgress',
  'rightOfUseAssets',
  'investmentProperty',
  'goodwill',
  'otherIntangibleAssets',
  'intangiblesUnderDevelopment',
  'investmentsNonCurrent',
  'loansNonCurrent',
  'otherFinancialAssetsNonCurrent',
  'deferredTaxAssets',
  'nonCurrentTaxAssets',
  'otherNonCurrentAssets',
  'totalNonCurrentAssets',
] as const satisfies readonly BsLineKey[];

export const BS_CURRENT_ASSET_KEYS = [
  'inventories',
  'tradeReceivables',
  'cashAndCashEquivalents',
  'otherBankBalances',
  'currentInvestments',
  'loansCurrent',
  'otherFinancialAssetsCurrent',
  'currentTaxAssets',
  'otherCurrentAssets',
  'assetsHeldForSale',
  'totalCurrentAssets',
  'totalAssets',
] as const satisfies readonly BsLineKey[];

export const BS_EQUITY_KEYS = [
  'equityShareCapital',
  'preferenceShareCapital',
  'securitiesPremium',
  'retainedEarnings',
  'capitalReserve',
  'generalReserve',
  'otherReserves',
  'ociReserve',
  'totalOtherEquity',
  'nonControllingInterests',
  'totalEquity',
] as const satisfies readonly BsLineKey[];

export const BS_LIABILITY_KEYS = [
  'nonCurrentBorrowings',
  'leaseLiabilitiesNonCurrent',
  'otherFinancialLiabilitiesNonCurrent',
  'longTermProvisions',
  'deferredTaxLiabilities',
  'otherNonCurrentLiabilities',
  'totalNonCurrentLiabilities',
  'currentBorrowings',
  'currentMaturitiesLongTermDebt',
  'leaseLiabilitiesCurrent',
  'tradePayablesMsme',
  'otherTradePayables',
  'otherFinancialLiabilitiesCurrent',
  'employeeLiabilities',
  'currentTaxLiabilities',
  'shortTermProvisions',
  'otherCurrentLiabilities',
  'liabilitiesHeldForSale',
  'totalCurrentLiabilities',
  'totalLiabilities',
  'totalEquityAndLiabilities',
] as const satisfies readonly BsLineKey[];

export const BS_LINE_LABELS: Record<BsLineKey, string> = {
  propertyPlantAndEquipment: 'Property, plant and equipment',
  capitalWorkInProgress: 'Capital work in progress',
  rightOfUseAssets: 'Right-of-use assets',
  investmentProperty: 'Investment property',
  goodwill: 'Goodwill',
  otherIntangibleAssets: 'Other intangible assets',
  intangiblesUnderDevelopment: 'Intangibles under development',
  investmentsNonCurrent: 'Investments (non-current)',
  loansNonCurrent: 'Loans (non-current)',
  otherFinancialAssetsNonCurrent: 'Other financial assets (non-current)',
  deferredTaxAssets: 'Deferred tax assets',
  nonCurrentTaxAssets: 'Non-current tax assets',
  otherNonCurrentAssets: 'Other non-current assets',
  totalNonCurrentAssets: 'Total non-current assets',
  inventories: 'Inventories',
  tradeReceivables: 'Trade receivables',
  cashAndCashEquivalents: 'Cash and cash equivalents',
  otherBankBalances: 'Other bank balances',
  currentInvestments: 'Current investments',
  loansCurrent: 'Loans (current)',
  otherFinancialAssetsCurrent: 'Other financial assets (current)',
  currentTaxAssets: 'Current tax assets',
  otherCurrentAssets: 'Other current assets',
  assetsHeldForSale: 'Assets held for sale',
  totalCurrentAssets: 'Total current assets',
  totalAssets: 'Total assets',
  equityShareCapital: 'Equity share capital',
  preferenceShareCapital: 'Preference share capital',
  securitiesPremium: 'Securities premium',
  retainedEarnings: 'Retained earnings',
  capitalReserve: 'Capital reserve',
  generalReserve: 'General reserve',
  otherReserves: 'Other reserves',
  ociReserve: 'OCI reserve',
  totalOtherEquity: 'Total other equity',
  nonControllingInterests: 'Non-controlling interests',
  totalEquity: 'Total equity',
  nonCurrentBorrowings: 'Non-current borrowings',
  leaseLiabilitiesNonCurrent: 'Lease liabilities (non-current)',
  otherFinancialLiabilitiesNonCurrent: 'Other financial liabilities (non-current)',
  longTermProvisions: 'Long-term provisions',
  deferredTaxLiabilities: 'Deferred tax liabilities',
  otherNonCurrentLiabilities: 'Other non-current liabilities',
  totalNonCurrentLiabilities: 'Total non-current liabilities',
  currentBorrowings: 'Current borrowings',
  currentMaturitiesLongTermDebt: 'Current maturities of long-term debt',
  leaseLiabilitiesCurrent: 'Lease liabilities (current)',
  tradePayablesMsme: 'Trade payables to MSMEs',
  otherTradePayables: 'Other trade payables',
  otherFinancialLiabilitiesCurrent: 'Other financial liabilities (current)',
  employeeLiabilities: 'Employee liabilities',
  currentTaxLiabilities: 'Current tax liabilities',
  shortTermProvisions: 'Short-term provisions',
  otherCurrentLiabilities: 'Other current liabilities',
  liabilitiesHeldForSale: 'Liabilities held for sale',
  totalCurrentLiabilities: 'Total current liabilities',
  totalLiabilities: 'Total liabilities',
  totalEquityAndLiabilities: 'Total equity and liabilities',
};

export const CF_LINE_LABELS: Record<CfLineKey, string> = {
  cashFlowFromOperatingActivities: 'Cash flow from operating activities',
  cashFlowFromInvestingActivities: 'Cash flow from investing activities',
  cashFlowFromFinancingActivities: 'Cash flow from financing activities',
  netIncreaseDecreaseInCash: 'Net increase / decrease in cash',
  openingCashAndCashEquivalents: 'Opening cash and cash equivalents',
  exchangeRateImpact: 'Exchange rate impact',
  closingCashAndCashEquivalents: 'Closing cash and cash equivalents',
  profitBeforeTax: 'Profit before tax',
  nonCashAdjustments: 'Non-cash adjustments',
  workingCapitalMovements: 'Working capital movements',
  taxPaid: 'Tax paid',
  capex: 'Capital expenditure',
  investmentPurchasesSales: 'Investment purchases / sales',
  borrowingProceeds: 'Borrowing proceeds',
  borrowingRepayments: 'Borrowing repayments',
  interestPaid: 'Interest paid',
  dividendsPaid: 'Dividends paid',
  shareIssueProceeds: 'Share issue proceeds',
};

export const EQUITY_LINE_LABELS: Record<EquityLineKey, string> = {
  openingShareCapital: 'Opening share capital',
  sharesIssuedCancelledAdjusted: 'Shares issued / cancelled / adjusted',
  closingShareCapital: 'Closing share capital',
  openingOtherEquity: 'Opening other equity',
  profitForPeriod: 'Profit for the period',
  oci: 'Other comprehensive income',
  dividends: 'Dividends',
  shareBasedPayments: 'Share-based payments',
  otherCapitalTransactions: 'Other capital transactions',
  restatementAdjustments: 'Restatement adjustments',
  closingOtherEquity: 'Closing other equity',
};

export function bsLineLabel(key: BsLineKey | ''): string {
  if (!key) return '';
  return BS_LINE_LABELS[key] ?? key;
}

export function cfLineLabel(key: CfLineKey | ''): string {
  if (!key) return '';
  return CF_LINE_LABELS[key] ?? key;
}

export function equityLineLabel(key: EquityLineKey | ''): string {
  if (!key) return '';
  return EQUITY_LINE_LABELS[key] ?? key;
}
