/**
 * Profit & Loss line keys and display labels.
 *
 * Keys are persisted in `plLineValues[].lineKey`; labels are presentation-only.
 */

import { PL_LINE_KEY_VALUES, type PlLineKey } from '@/lib/schemas/financials-kpis';

export const PL_LINE_KEYS = PL_LINE_KEY_VALUES;
export type { PlLineKey };

export const PL_INCOME_LINE_KEYS = [
  'revenueFromOperations',
  'saleOfProducts',
  'saleOfServices',
  'otherOperatingRevenue',
  'otherIncome',
  'financeIncome',
  'governmentGrants',
  'foreignExchangeIncome',
  'gainOnDisposal',
  'totalIncome',
] as const satisfies readonly PlLineKey[];

export const PL_EXPENSE_LINE_KEYS = [
  'costOfMaterialsConsumed',
  'purchasesOfStockInTrade',
  'changesInInventory',
  'manufacturingDirectOperatingExpenses',
  'employeeBenefitExpenses',
  'contractLabour',
  'sellingAndDistributionExpenses',
  'technologyHostingExpenses',
  'rentAndLeaseExpense',
  'otherOperatingExpenses',
  'financeCosts',
  'depreciation',
  'amortisation',
  'impairment',
  'otherExpenses',
  'totalExpenses',
] as const satisfies readonly PlLineKey[];

export const PL_PROFITABILITY_LINE_KEYS = [
  'profitBeforeExceptionalItemsAndTax',
  'exceptionalItems',
  'profitBeforeTax',
  'currentTax',
  'deferredTax',
  'earlierYearTaxAdjustment',
  'profitAfterTax',
  'otherComprehensiveIncome',
  'totalComprehensiveIncome',
  'profitAttributableToOwners',
  'profitAttributableToNci',
] as const satisfies readonly PlLineKey[];

export const PL_LINE_LABELS: Record<PlLineKey, string> = {
  revenueFromOperations: 'Revenue from operations',
  saleOfProducts: 'Sale of products',
  saleOfServices: 'Sale of services',
  otherOperatingRevenue: 'Other operating revenue',
  otherIncome: 'Other income',
  financeIncome: 'Finance income',
  governmentGrants: 'Government grants',
  foreignExchangeIncome: 'Foreign exchange income',
  gainOnDisposal: 'Gain on disposal of assets / investments',
  totalIncome: 'Total income',
  costOfMaterialsConsumed: 'Cost of materials consumed',
  purchasesOfStockInTrade: 'Purchases of stock-in-trade',
  changesInInventory: 'Changes in inventory',
  manufacturingDirectOperatingExpenses: 'Manufacturing / direct operating expenses',
  employeeBenefitExpenses: 'Employee benefit expenses',
  contractLabour: 'Contract labour',
  sellingAndDistributionExpenses: 'Selling and distribution expenses',
  technologyHostingExpenses: 'Technology / hosting expenses',
  rentAndLeaseExpense: 'Rent and lease expense',
  otherOperatingExpenses: 'Other operating expenses',
  financeCosts: 'Finance costs',
  depreciation: 'Depreciation',
  amortisation: 'Amortisation',
  impairment: 'Impairment',
  otherExpenses: 'Other expenses',
  totalExpenses: 'Total expenses',
  profitBeforeExceptionalItemsAndTax: 'Profit before exceptional items and tax',
  exceptionalItems: 'Exceptional items',
  profitBeforeTax: 'Profit before tax',
  currentTax: 'Current tax',
  deferredTax: 'Deferred tax',
  earlierYearTaxAdjustment: 'Earlier-year tax adjustment',
  profitAfterTax: 'Profit after tax',
  otherComprehensiveIncome: 'Other comprehensive income',
  totalComprehensiveIncome: 'Total comprehensive income',
  profitAttributableToOwners: 'Profit attributable to owners',
  profitAttributableToNci: 'Profit attributable to non-controlling interests',
};

/** Lines whose totals are derived from component lines when not explicitly entered. */
export const PL_DERIVED_TOTAL_KEYS: Partial<Record<PlLineKey, PlLineKey[]>> = {
  totalIncome: [
    'revenueFromOperations',
    'otherIncome',
    'financeIncome',
    'governmentGrants',
    'foreignExchangeIncome',
    'gainOnDisposal',
  ],
  totalExpenses: [
    'costOfMaterialsConsumed',
    'purchasesOfStockInTrade',
    'changesInInventory',
    'manufacturingDirectOperatingExpenses',
    'employeeBenefitExpenses',
    'contractLabour',
    'sellingAndDistributionExpenses',
    'technologyHostingExpenses',
    'rentAndLeaseExpense',
    'otherOperatingExpenses',
    'financeCosts',
    'depreciation',
    'amortisation',
    'impairment',
    'otherExpenses',
  ],
};

export const PL_EBITDA_COMPONENT_KEYS: PlLineKey[] = [
  'profitBeforeTax',
  'financeCosts',
  'depreciation',
  'amortisation',
];

export function plLineLabel(key: PlLineKey | ''): string {
  if (!key) return '';
  return PL_LINE_LABELS[key] ?? key;
}
