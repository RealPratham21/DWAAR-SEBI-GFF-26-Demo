/**
 * Derived Financials & KPIs computations.
 *
 * Nothing in this file is persisted. Every result is recomputed from the payload using
 * Decimal-safe string arithmetic.
 */

import {
  abs,
  add,
  compare,
  difference,
  differsBeyond,
  div,
  isFilledDecimal,
  isPositive,
  pct,
  subtract,
  sumDecimals,
  toDecimalString,
} from '@/lib/financials-kpis/decimal';
import { PL_DERIVED_TOTAL_KEYS, type PlLineKey } from '@/lib/financials-kpis/pl-lines';
import {
  getFinancialPeriods,
  getLatestPeriod,
  isInterimPeriod,
  type PeriodComparisonWarning,
  getPeriodComparisonWarnings,
} from '@/lib/financials-kpis/periods';
import type { FinancialsKpisPayload, PlLineValue } from '@/lib/schemas/financials-kpis';
import {
  createEmptyIpoSetupReference,
  type IpoSetupReference,
  type LinkedWorkstreamReferences,
} from '@/lib/financials-kpis/types';

export type ReconciliationStatus =
  | 'reconciled'
  | 'variance'
  | 'missing_information'
  | 'not_applicable';

export type ReconciliationCheck = {
  id: string;
  periodId: string;
  label: string;
  status: ReconciliationStatus;
  entered: string;
  calculated: string;
  variance: string;
  message: string;
};

export type PlPeriodSummary = {
  periodId: string;
  periodLabel: string;
  isInterim: boolean;
  revenueFromOperations: string;
  totalIncome: string;
  totalExpenses: string;
  profitBeforeTax: string;
  profitAfterTax: string;
  ebitda: string;
  ebit: string;
  ebitdaMargin: string;
  ebitMargin: string;
  patMargin: string;
  revenueGrowth: string;
};

export type BsPeriodSummary = {
  periodId: string;
  periodLabel: string;
  totalAssets: string;
  totalEquityAndLiabilities: string;
  totalEquity: string;
  totalLiabilities: string;
  assetsReconciles: boolean;
  variance: string;
};

export type CfPeriodSummary = {
  periodId: string;
  periodLabel: string;
  openingCash: string;
  netMovement: string;
  exchangeImpact: string;
  closingCash: string;
  calculatedClosing: string;
  reconciles: boolean;
  variance: string;
};

export type EquityPeriodSummary = {
  periodId: string;
  periodLabel: string;
  openingShareCapital: string;
  shareChanges: string;
  closingShareCapital: string;
  openingOtherEquity: string;
  closingOtherEquity: string;
  calculatedClosingOtherEquity: string;
  reconciles: boolean;
  variance: string;
};

export type RatioSummary = {
  periodId: string;
  periodLabel: string;
  basicEps: string;
  dilutedEps: string;
  currentRatio: string;
  quickRatio: string;
  debtEquityRatio: string;
  netDebtEquityRatio: string;
  interestCoverage: string;
  roe: string;
  roce: string;
  effectiveTaxRate: string;
  peRatio: string;
  navPerShare: string;
  issuePriceToNav: string;
  issuePricePending: boolean;
};

export const SME_ELIGIBILITY_STATES = [
  'appears_satisfied',
  'potential_concern',
  'missing_information',
  'pending_auditor_confirmation',
  'professional_confirmation_required',
] as const;

export type SmeEligibilityState = (typeof SME_ELIGIBILITY_STATES)[number];

export type SmeEligibilityAssessment = {
  periodId: string;
  periodLabel: string;
  operatingProfit: string;
  operatingProfitState: SmeEligibilityState;
  netWorth: string;
  netWorthState: SmeEligibilityState;
  fcfe: string;
  fcfeState: SmeEligibilityState;
};

export type RestatementAdjustmentCheck = {
  id: string;
  reconciles: boolean;
  originalAuditedAmount: string;
  adjustmentAmount: string;
  restatedAmount: string;
  calculatedRestated: string;
  variance: string;
};

export type FinancialsKpisModel = {
  plByPeriod: PlPeriodSummary[];
  bsByPeriod: BsPeriodSummary[];
  cfByPeriod: CfPeriodSummary[];
  equityByPeriod: EquityPeriodSummary[];
  ratiosByPeriod: RatioSummary[];
  smeEligibility: SmeEligibilityAssessment[];
  restatementChecks: RestatementAdjustmentCheck[];
  reconciliation: ReconciliationCheck[];
  periodComparisonWarnings: PeriodComparisonWarning[];
  displayUnit: string;
  latestPeriodLabel: string;
};

const RECONCILIATION_TOLERANCE = '1';
const SME_OPERATING_PROFIT_THRESHOLD = '1500000000';
const SME_NET_WORTH_MINIMUM = '0';

function lineAmount(
  rows: PlLineValue[],
  periodId: string,
  lineKey: PlLineKey,
): string {
  const match = rows.find((row) => row.periodId === periodId && row.lineKey === lineKey);
  return toDecimalString(match?.amount);
}

function bsAmount(
  payload: FinancialsKpisPayload,
  periodId: string,
  lineKey: string,
): string {
  const match = payload.assetsLiabilitiesEquityAndCashFlows.balanceSheetLineValues.find(
    (row) => row.periodId === periodId && row.lineKey === lineKey,
  );
  return toDecimalString(match?.amount);
}

function cfAmount(payload: FinancialsKpisPayload, periodId: string, lineKey: string): string {
  const match = payload.assetsLiabilitiesEquityAndCashFlows.cashFlowLineValues.find(
    (row) => row.periodId === periodId && row.lineKey === lineKey,
  );
  return toDecimalString(match?.amount);
}

function equityAmount(payload: FinancialsKpisPayload, periodId: string, lineKey: string): string {
  const match = payload.assetsLiabilitiesEquityAndCashFlows.changesInEquityLineValues.find(
    (row) => row.periodId === periodId && row.lineKey === lineKey,
  );
  return toDecimalString(match?.amount);
}

function derivedTotal(
  rows: PlLineValue[],
  periodId: string,
  totalKey: PlLineKey,
): string {
  const entered = lineAmount(rows, periodId, totalKey);
  if (isFilledDecimal(entered)) return entered;
  const components = PL_DERIVED_TOTAL_KEYS[totalKey];
  if (!components) return '';
  return sumDecimals(components.map((key) => lineAmount(rows, periodId, key)));
}

function computeEbitda(
  profitBeforeTax: string,
  financeCosts: string,
  depreciation: string,
  amortisation: string,
): string {
  if (!isFilledDecimal(profitBeforeTax)) return '';
  return sumDecimals([
    profitBeforeTax,
    financeCosts,
    depreciation,
    amortisation,
  ]);
}

function computeEbit(profitBeforeTax: string, financeCosts: string): string {
  if (!isFilledDecimal(profitBeforeTax)) return '';
  return sumDecimals([profitBeforeTax, financeCosts]);
}

function growthRate(current: string, previous: string): string {
  if (!isFilledDecimal(current) || !isFilledDecimal(previous)) return '';
  const cmp = compare(previous, '0');
  if (cmp === null || cmp === 0) return '';
  return pct(difference(current, previous), abs(previous), 2);
}

function smeStateForOperatingProfit(value: string, sourceStatus: string): SmeEligibilityState {
  if (!isFilledDecimal(value)) return 'missing_information';
  if (sourceStatus === 'pending_confirmation') return 'pending_auditor_confirmation';
  if (sourceStatus === 'management_estimate' || sourceStatus === 'management_accounts') {
    return 'professional_confirmation_required';
  }
  const cmp = compare(value, SME_OPERATING_PROFIT_THRESHOLD);
  if (cmp !== null && cmp <= 0) return 'appears_satisfied';
  return 'potential_concern';
}

function smeStateForNetWorth(value: string, sourceStatus: string): SmeEligibilityState {
  if (!isFilledDecimal(value)) return 'missing_information';
  if (sourceStatus === 'pending_confirmation') return 'pending_auditor_confirmation';
  if (sourceStatus === 'management_estimate' || sourceStatus === 'management_accounts') {
    return 'professional_confirmation_required';
  }
  const cmp = compare(value, SME_NET_WORTH_MINIMUM);
  if (cmp !== null && cmp > 0) return 'appears_satisfied';
  return 'potential_concern';
}

function smeStateForFcfe(value: string, sourceStatus: string): SmeEligibilityState {
  if (!isFilledDecimal(value)) return 'missing_information';
  if (sourceStatus === 'pending_confirmation') return 'pending_auditor_confirmation';
  if (sourceStatus === 'management_estimate' || sourceStatus === 'management_accounts') {
    return 'professional_confirmation_required';
  }
  if (isPositive(value)) return 'appears_satisfied';
  return 'potential_concern';
}

function reconciliationCheck(
  id: string,
  periodId: string,
  label: string,
  entered: string,
  calculated: string,
): ReconciliationCheck {
  if (!isFilledDecimal(entered) && !isFilledDecimal(calculated)) {
    return {
      id,
      periodId,
      label,
      status: 'missing_information',
      entered,
      calculated,
      variance: '',
      message: 'Neither entered nor calculated value is available.',
    };
  }
  if (!isFilledDecimal(entered) || !isFilledDecimal(calculated)) {
    return {
      id,
      periodId,
      label,
      status: 'missing_information',
      entered,
      calculated,
      variance: difference(entered, calculated),
      message: 'One side of the reconciliation is missing.',
    };
  }
  const variance = difference(entered, calculated);
  const reconciles = !differsBeyond(entered, calculated, RECONCILIATION_TOLERANCE);
  return {
    id,
    periodId,
    label,
    status: reconciles ? 'reconciled' : 'variance',
    entered,
    calculated,
    variance,
    message: reconciles
      ? 'Entered and calculated values reconcile within tolerance.'
      : 'Entered total differs from calculated total.',
  };
}

export function computeFinancialsKpisModel(
  payload: FinancialsKpisPayload,
  linkedReferences: LinkedWorkstreamReferences = {
    company: { available: false, legalName: null, companyClass: null, cin: null },
    capitalOwnership: { available: false, equityShareCapital: null, faceValue: null },
    ipoSetup: createEmptyIpoSetupReference(),
    businessOperations: { available: false, segmentIds: [] },
    objectsOfIssue: {
      available: false,
      workingCapitalRequirement: null,
      borrowingRepaymentTotal: null,
    },
    borrowings: { available: false },
    groupEntities: { available: false },
  },
  ipoReference?: IpoSetupReference,
): FinancialsKpisModel {
  const periods = getFinancialPeriods(payload);
  const plRows = payload.restatedStatementOfProfitAndLoss.plLineValues;
  const displayUnit =
    payload.reportingScopePeriodsAndAuditorReadiness.reportingBasis.displayUnit || 'rupees';
  const latestPeriod = getLatestPeriod(payload);
  const issuePrice =
    ipoReference?.available && isFilledDecimal(ipoReference.proposedIssuePrice)
      ? ipoReference.proposedIssuePrice
      : linkedReferences.ipoSetup.available &&
          isFilledDecimal(linkedReferences.ipoSetup.proposedIssuePrice)
        ? linkedReferences.ipoSetup.proposedIssuePrice
        : '';

  const plByPeriod: PlPeriodSummary[] = [];
  const sortedPeriods = [...periods].sort((a, b) => a.endDate.localeCompare(b.endDate));

  for (let index = 0; index < sortedPeriods.length; index += 1) {
    const period = sortedPeriods[index];
    const previous = index > 0 ? sortedPeriods[index - 1] : null;

    const revenueFromOperations = lineAmount(plRows, period.id, 'revenueFromOperations');
    const totalIncomeEntered = lineAmount(plRows, period.id, 'totalIncome');
    const totalIncome = isFilledDecimal(totalIncomeEntered)
      ? totalIncomeEntered
      : derivedTotal(plRows, period.id, 'totalIncome');
    const totalExpensesEntered = lineAmount(plRows, period.id, 'totalExpenses');
    const totalExpenses = isFilledDecimal(totalExpensesEntered)
      ? totalExpensesEntered
      : derivedTotal(plRows, period.id, 'totalExpenses');
    const profitBeforeTaxEntered = lineAmount(plRows, period.id, 'profitBeforeTax');
    const profitBeforeTax = isFilledDecimal(profitBeforeTaxEntered)
      ? profitBeforeTaxEntered
      : isFilledDecimal(totalIncome) && isFilledDecimal(totalExpenses)
        ? subtract(totalIncome, totalExpenses)
        : '';
    const profitAfterTax = lineAmount(plRows, period.id, 'profitAfterTax');
    const financeCosts = lineAmount(plRows, period.id, 'financeCosts');
    const depreciation = lineAmount(plRows, period.id, 'depreciation');
    const amortisation = lineAmount(plRows, period.id, 'amortisation');
    const ebitda = computeEbitda(profitBeforeTax, financeCosts, depreciation, amortisation);
    const ebit = computeEbit(profitBeforeTax, financeCosts);

    const prevRevenue = previous
      ? lineAmount(plRows, previous.id, 'revenueFromOperations')
      : '';

    plByPeriod.push({
      periodId: period.id,
      periodLabel: period.label || period.id,
      isInterim: isInterimPeriod(period),
      revenueFromOperations,
      totalIncome,
      totalExpenses,
      profitBeforeTax,
      profitAfterTax,
      ebitda,
      ebit,
      ebitdaMargin: pct(ebitda, revenueFromOperations, 2),
      ebitMargin: pct(ebit, revenueFromOperations, 2),
      patMargin: pct(profitAfterTax, revenueFromOperations, 2),
      revenueGrowth: growthRate(revenueFromOperations, prevRevenue),
    });
  }

  const bsByPeriod: BsPeriodSummary[] = periods.map((period) => {
    const totalAssets = bsAmount(payload, period.id, 'totalAssets');
    const totalEquityAndLiabilities = bsAmount(payload, period.id, 'totalEquityAndLiabilities');
    const totalEquity = bsAmount(payload, period.id, 'totalEquity');
    const totalLiabilities = bsAmount(payload, period.id, 'totalLiabilities');
    const variance = difference(totalAssets, totalEquityAndLiabilities);
    const assetsReconciles =
      !isFilledDecimal(totalAssets) ||
      !isFilledDecimal(totalEquityAndLiabilities) ||
      !differsBeyond(totalAssets, totalEquityAndLiabilities, RECONCILIATION_TOLERANCE);
    return {
      periodId: period.id,
      periodLabel: period.label || period.id,
      totalAssets,
      totalEquityAndLiabilities,
      totalEquity,
      totalLiabilities,
      assetsReconciles,
      variance,
    };
  });

  const cfByPeriod: CfPeriodSummary[] = periods.map((period) => {
    const openingCash = cfAmount(payload, period.id, 'openingCashAndCashEquivalents');
    const netMovement = cfAmount(payload, period.id, 'netIncreaseDecreaseInCash');
    const exchangeImpact = cfAmount(payload, period.id, 'exchangeRateImpact');
    const closingCash = cfAmount(payload, period.id, 'closingCashAndCashEquivalents');
    const calculatedClosing = isFilledDecimal(openingCash)
      ? sumDecimals([openingCash, netMovement, exchangeImpact])
      : '';
    const variance = difference(closingCash, calculatedClosing);
    const reconciles =
      !isFilledDecimal(closingCash) ||
      !isFilledDecimal(calculatedClosing) ||
      !differsBeyond(closingCash, calculatedClosing, RECONCILIATION_TOLERANCE);
    return {
      periodId: period.id,
      periodLabel: period.label || period.id,
      openingCash,
      netMovement,
      exchangeImpact,
      closingCash,
      calculatedClosing,
      reconciles,
      variance,
    };
  });

  const equityByPeriod: EquityPeriodSummary[] = periods.map((period) => {
    const openingShareCapital = equityAmount(payload, period.id, 'openingShareCapital');
    const shareChanges = equityAmount(payload, period.id, 'sharesIssuedCancelledAdjusted');
    const closingShareCapital = equityAmount(payload, period.id, 'closingShareCapital');
    const openingOtherEquity = equityAmount(payload, period.id, 'openingOtherEquity');
    const closingOtherEquity = equityAmount(payload, period.id, 'closingOtherEquity');
    const profitForPeriod = equityAmount(payload, period.id, 'profitForPeriod');
    const oci = equityAmount(payload, period.id, 'oci');
    const dividends = equityAmount(payload, period.id, 'dividends');
    const shareBased = equityAmount(payload, period.id, 'shareBasedPayments');
    const otherCapital = equityAmount(payload, period.id, 'otherCapitalTransactions');
    const restatement = equityAmount(payload, period.id, 'restatementAdjustments');
    const calculatedClosingOtherEquity = isFilledDecimal(openingOtherEquity)
      ? sumDecimals([
          openingOtherEquity,
          profitForPeriod,
          oci,
          subtract('0', dividends),
          shareBased,
          otherCapital,
          restatement,
        ])
      : '';
    const variance = difference(closingOtherEquity, calculatedClosingOtherEquity);
    const reconciles =
      !isFilledDecimal(closingOtherEquity) ||
      !isFilledDecimal(calculatedClosingOtherEquity) ||
      !differsBeyond(closingOtherEquity, calculatedClosingOtherEquity, RECONCILIATION_TOLERANCE);
    return {
      periodId: period.id,
      periodLabel: period.label || period.id,
      openingShareCapital,
      shareChanges,
      closingShareCapital,
      openingOtherEquity,
      closingOtherEquity,
      calculatedClosingOtherEquity,
      reconciles,
      variance,
    };
  });

  const ratiosByPeriod: RatioSummary[] = periods.map((period) => {
    const pl = plByPeriod.find((row) => row.periodId === period.id);
    const perShare = payload.restatedStatementOfProfitAndLoss.perShareByPeriod.find(
      (row) => row.periodId === period.id,
    );
    const currentAssets = bsAmount(payload, period.id, 'totalCurrentAssets');
    const currentLiabilities = bsAmount(payload, period.id, 'totalCurrentLiabilities');
    const inventories = bsAmount(payload, period.id, 'inventories');
    const totalEquity = bsAmount(payload, period.id, 'totalEquity');
    const totalDebt = sumDecimals([
      bsAmount(payload, period.id, 'nonCurrentBorrowings'),
      bsAmount(payload, period.id, 'currentBorrowings'),
      bsAmount(payload, period.id, 'currentMaturitiesLongTermDebt'),
    ]);
    const cash = bsAmount(payload, period.id, 'cashAndCashEquivalents');
    const netDebt = isFilledDecimal(totalDebt) ? subtract(totalDebt, cash) : '';
    const financeCosts = lineAmount(plRows, period.id, 'financeCosts');
    const profitBeforeTax = pl?.profitBeforeTax ?? '';
    const profitAfterTax = pl?.profitAfterTax ?? '';
    const basicEps = toDecimalString(perShare?.basicEps);
    const equityShareCapital = bsAmount(payload, period.id, 'equityShareCapital');
    const totalOtherEquity = bsAmount(payload, period.id, 'totalOtherEquity');
    const shareholdersFunds = sumDecimals([equityShareCapital, totalOtherEquity]);
    const weightedShares = toDecimalString(perShare?.weightedAvgBasicShares);
    const navPerShare =
      isFilledDecimal(shareholdersFunds) && isFilledDecimal(weightedShares)
        ? div(shareholdersFunds, weightedShares, 4)
        : '';
    const issuePricePending = !isFilledDecimal(issuePrice);
    const peRatio =
      issuePricePending || !isFilledDecimal(basicEps) || !isPositive(basicEps)
        ? ''
        : div(issuePrice, basicEps, 2);
    const issuePriceToNav =
      issuePricePending || !isFilledDecimal(navPerShare) || !isPositive(navPerShare)
        ? ''
        : div(issuePrice, navPerShare, 2);

    return {
      periodId: period.id,
      periodLabel: period.label || period.id,
      basicEps,
      dilutedEps: toDecimalString(perShare?.dilutedEps),
      currentRatio:
        isFilledDecimal(currentAssets) && isFilledDecimal(currentLiabilities)
          ? div(currentAssets, currentLiabilities, 2)
          : '',
      quickRatio:
        isFilledDecimal(currentAssets) && isFilledDecimal(currentLiabilities)
          ? div(subtract(currentAssets, inventories), currentLiabilities, 2)
          : '',
      debtEquityRatio:
        isFilledDecimal(totalDebt) && isFilledDecimal(totalEquity)
          ? div(totalDebt, totalEquity, 2)
          : '',
      netDebtEquityRatio:
        isFilledDecimal(netDebt) && isFilledDecimal(totalEquity)
          ? div(netDebt, totalEquity, 2)
          : '',
      interestCoverage:
        isFilledDecimal(pl?.ebitda ?? '') && isFilledDecimal(financeCosts)
          ? div(pl?.ebitda ?? '', financeCosts, 2)
          : '',
      roe:
        isFilledDecimal(profitAfterTax) && isFilledDecimal(totalEquity)
          ? pct(profitAfterTax, totalEquity, 2)
          : '',
      roce:
        isFilledDecimal(profitBeforeTax) && isFilledDecimal(shareholdersFunds)
          ? pct(profitBeforeTax, shareholdersFunds, 2)
          : '',
      effectiveTaxRate:
        isFilledDecimal(lineAmount(plRows, period.id, 'currentTax')) &&
        isFilledDecimal(profitBeforeTax)
          ? pct(lineAmount(plRows, period.id, 'currentTax'), profitBeforeTax, 2)
          : '',
      peRatio,
      navPerShare,
      issuePriceToNav,
      issuePricePending,
    };
  });

  const smeEligibility: SmeEligibilityAssessment[] =
    payload.ratiosCapitalisationAndIssuePriceMetrics.smeEligibilityByPeriod.map((row) => {
      const period = periods.find((item) => item.id === row.periodId);
      return {
        periodId: row.periodId,
        periodLabel: period?.label || row.periodId,
        operatingProfit: row.operatingProfit,
        operatingProfitState: smeStateForOperatingProfit(row.operatingProfit, row.sourceStatus),
        netWorth: row.netWorth,
        netWorthState: smeStateForNetWorth(row.netWorth, row.sourceStatus),
        fcfe: row.fcfe,
        fcfeState: smeStateForFcfe(row.fcfe, row.sourceStatus),
      };
    });

  const restatementChecks: RestatementAdjustmentCheck[] =
    payload.restatementAdjustmentsPoliciesAndAuditorMatters.restatementAdjustments.map((row) => {
      const calculatedRestated = sumDecimals([row.originalAuditedAmount, row.adjustmentAmount]);
      const variance = difference(row.restatedAmount, calculatedRestated);
      const reconciles =
        !isFilledDecimal(row.restatedAmount) ||
        !isFilledDecimal(calculatedRestated) ||
        !differsBeyond(row.restatedAmount, calculatedRestated, RECONCILIATION_TOLERANCE);
      return {
        id: row.id,
        reconciles,
        originalAuditedAmount: row.originalAuditedAmount,
        adjustmentAmount: row.adjustmentAmount,
        restatedAmount: row.restatedAmount,
        calculatedRestated,
        variance,
      };
    });

  const reconciliation: ReconciliationCheck[] = [];

  for (const period of periods) {
    const totalIncomeEntered = lineAmount(plRows, period.id, 'totalIncome');
    const totalIncomeCalculated = derivedTotal(plRows, period.id, 'totalIncome');
    if (isFilledDecimal(totalIncomeEntered)) {
      reconciliation.push(
        reconciliationCheck(
          `pl-total-income-${period.id}`,
          period.id,
          'P&L total income',
          totalIncomeEntered,
          totalIncomeCalculated,
        ),
      );
    }

    const totalExpensesEntered = lineAmount(plRows, period.id, 'totalExpenses');
    const totalExpensesCalculated = derivedTotal(plRows, period.id, 'totalExpenses');
    if (isFilledDecimal(totalExpensesEntered)) {
      reconciliation.push(
        reconciliationCheck(
          `pl-total-expenses-${period.id}`,
          period.id,
          'P&L total expenses',
          totalExpensesEntered,
          totalExpensesCalculated,
        ),
      );
    }

    const bs = bsByPeriod.find((row) => row.periodId === period.id);
    if (bs && isFilledDecimal(bs.totalAssets) && isFilledDecimal(bs.totalEquityAndLiabilities)) {
      reconciliation.push(
        reconciliationCheck(
          `bs-balance-${period.id}`,
          period.id,
          'Total assets vs total equity and liabilities',
          bs.totalAssets,
          bs.totalEquityAndLiabilities,
        ),
      );
    }

    const cf = cfByPeriod.find((row) => row.periodId === period.id);
    if (cf && isFilledDecimal(cf.closingCash) && isFilledDecimal(cf.calculatedClosing)) {
      reconciliation.push(
        reconciliationCheck(
          `cf-closing-${period.id}`,
          period.id,
          'Cash flow closing cash',
          cf.closingCash,
          cf.calculatedClosing,
        ),
      );
    }
  }

  const linkedEquity = linkedReferences.capitalOwnership.equityShareCapital;
  if (linkedReferences.capitalOwnership.available && isFilledDecimal(linkedEquity)) {
    const latest = latestPeriod;
    if (latest) {
      const entered = bsAmount(payload, latest.id, 'equityShareCapital');
      reconciliation.push(
        reconciliationCheck(
          'share-capital-linked',
          latest.id,
          'Share capital vs Capital & Ownership',
          entered,
          linkedEquity ?? '',
        ),
      );
    }
  }

  return {
    plByPeriod,
    bsByPeriod,
    cfByPeriod,
    equityByPeriod,
    ratiosByPeriod,
    smeEligibility,
    restatementChecks,
    reconciliation,
    periodComparisonWarnings: getPeriodComparisonWarnings(payload),
    displayUnit,
    latestPeriodLabel: latestPeriod?.label || '',
  };
}
