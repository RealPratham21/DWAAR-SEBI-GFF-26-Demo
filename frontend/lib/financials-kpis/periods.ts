/**
 * Shared reporting-period helpers.
 *
 * All period-based financial grids read from the central registry in section 1.
 */

import type { FinancialPeriod, FinancialsKpisPayload } from '@/lib/schemas/financials-kpis';
import { isFilledDecimal } from '@/lib/financials-kpis/decimal';

export type PeriodDeletionDependency = {
  section: string;
  count: number;
  description: string;
};

export type PeriodDeletionValidation = {
  canDelete: boolean;
  dependencies: PeriodDeletionDependency[];
  message: string;
};

export type PeriodComparisonWarning = {
  id: string;
  previousPeriodId: string;
  currentPeriodId: string;
  previousLabel: string;
  currentLabel: string;
  warning: string;
};

export function getFinancialPeriods(payload: FinancialsKpisPayload): FinancialPeriod[] {
  return payload.reportingScopePeriodsAndAuditorReadiness.financialPeriods;
}

export function getFinancialPeriodById(
  payload: FinancialsKpisPayload,
  periodId: string,
): FinancialPeriod | undefined {
  return getFinancialPeriods(payload).find((period) => period.id === periodId);
}

export function getFullYearPeriods(payload: FinancialsKpisPayload): FinancialPeriod[] {
  return getFinancialPeriods(payload).filter((period) => period.fullYearOrInterim === 'full-year');
}

export function getInterimPeriods(payload: FinancialsKpisPayload): FinancialPeriod[] {
  return getFinancialPeriods(payload).filter((period) => period.fullYearOrInterim === 'interim');
}

export function isInterimPeriod(period: FinancialPeriod): boolean {
  return period.fullYearOrInterim === 'interim';
}

export function isFullYearPeriod(period: FinancialPeriod): boolean {
  return period.fullYearOrInterim === 'full-year';
}

export function countPeriodReferences(payload: FinancialsKpisPayload, periodId: string): PeriodDeletionDependency[] {
  const deps: PeriodDeletionDependency[] = [];

  const plCount = payload.restatedStatementOfProfitAndLoss.plLineValues.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (plCount > 0) {
    deps.push({
      section: 'restated-statement-of-profit-and-loss',
      count: plCount,
      description: 'P&L line values',
    });
  }

  const exceptionalCount = payload.restatedStatementOfProfitAndLoss.exceptionalItems.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (exceptionalCount > 0) {
    deps.push({
      section: 'restated-statement-of-profit-and-loss',
      count: exceptionalCount,
      description: 'Exceptional items',
    });
  }

  const perShareCount = payload.restatedStatementOfProfitAndLoss.perShareByPeriod.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (perShareCount > 0) {
    deps.push({
      section: 'restated-statement-of-profit-and-loss',
      count: perShareCount,
      description: 'Per-share information',
    });
  }

  const bsCount = payload.assetsLiabilitiesEquityAndCashFlows.balanceSheetLineValues.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (bsCount > 0) {
    deps.push({
      section: 'assets-liabilities-equity-and-cash-flows',
      count: bsCount,
      description: 'Balance sheet line values',
    });
  }

  const cfCount = payload.assetsLiabilitiesEquityAndCashFlows.cashFlowLineValues.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (cfCount > 0) {
    deps.push({
      section: 'assets-liabilities-equity-and-cash-flows',
      count: cfCount,
      description: 'Cash flow line values',
    });
  }

  const equityCount = payload.assetsLiabilitiesEquityAndCashFlows.changesInEquityLineValues.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (equityCount > 0) {
    deps.push({
      section: 'assets-liabilities-equity-and-cash-flows',
      count: equityCount,
      description: 'Changes in equity line values',
    });
  }

  const adjustmentCount =
    payload.restatementAdjustmentsPoliciesAndAuditorMatters.restatementAdjustments.filter(
      (row) => row.periodId === periodId,
    ).length;
  if (adjustmentCount > 0) {
    deps.push({
      section: 'restatement-adjustments-policies-and-auditor-matters',
      count: adjustmentCount,
      description: 'Restatement adjustments',
    });
  }

  const auditMatterCount =
    payload.restatementAdjustmentsPoliciesAndAuditorMatters.auditReportMatters.filter(
      (row) => row.periodId === periodId,
    ).length;
  if (auditMatterCount > 0) {
    deps.push({
      section: 'restatement-adjustments-policies-and-auditor-matters',
      count: auditMatterCount,
      description: 'Audit report matters',
    });
  }

  const segmentCount = payload.otherFinancialInformation.segmentRecords.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (segmentCount > 0) {
    deps.push({
      section: 'other-financial-information',
      count: segmentCount,
      description: 'Segment records',
    });
  }

  const rpCount = payload.otherFinancialInformation.relatedPartyTransactions.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (rpCount > 0) {
    deps.push({
      section: 'other-financial-information',
      count: rpCount,
      description: 'Related-party transactions',
    });
  }

  const wcCount = payload.otherFinancialInformation.workingCapitalSummaries.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (wcCount > 0) {
    deps.push({
      section: 'other-financial-information',
      count: wcCount,
      description: 'Working capital summaries',
    });
  }

  const taxCount = payload.otherFinancialInformation.taxByPeriod.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (taxCount > 0) {
    deps.push({
      section: 'other-financial-information',
      count: taxCount,
      description: 'Tax information',
    });
  }

  const dividendCount = payload.otherFinancialInformation.dividendRecords.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (dividendCount > 0) {
    deps.push({
      section: 'other-financial-information',
      count: dividendCount,
      description: 'Dividend records',
    });
  }

  const smeCount = payload.ratiosCapitalisationAndIssuePriceMetrics.smeEligibilityByPeriod.filter(
    (row) => row.periodId === periodId,
  ).length;
  if (smeCount > 0) {
    deps.push({
      section: 'ratios-capitalisation-and-issue-price-metrics',
      count: smeCount,
      description: 'SME eligibility records',
    });
  }

  const comparableRefs = getFinancialPeriods(payload).filter(
    (period) => period.comparablePeriodId === periodId,
  ).length;
  if (comparableRefs > 0) {
    deps.push({
      section: 'reporting-scope-periods-and-auditor-readiness',
      count: comparableRefs,
      description: 'Comparable period references',
    });
  }

  return deps;
}

export function validatePeriodDeletion(
  payload: FinancialsKpisPayload,
  periodId: string,
): PeriodDeletionValidation {
  const dependencies = countPeriodReferences(payload, periodId);
  const totalRefs = dependencies.reduce((sum, dep) => sum + dep.count, 0);
  if (totalRefs === 0) {
    return { canDelete: true, dependencies: [], message: 'No financial data references this period.' };
  }
  const summary = dependencies.map((dep) => `${dep.count} ${dep.description}`).join('; ');
  return {
    canDelete: false,
    dependencies,
    message: `This period is referenced by ${summary}. Remove or reassign those records before deleting.`,
  };
}

export function periodMonths(period: FinancialPeriod): string {
  if (isFilledDecimal(period.months)) return period.months;
  return '';
}

export function periodsAreComparable(
  previous: FinancialPeriod,
  current: FinancialPeriod,
): boolean {
  if (previous.fullYearOrInterim !== current.fullYearOrInterim) return false;
  const prevMonths = periodMonths(previous);
  const currMonths = periodMonths(current);
  if (isFilledDecimal(prevMonths) && isFilledDecimal(currMonths) && prevMonths !== currMonths) {
    return false;
  }
  return true;
}

export function getPeriodComparisonWarnings(
  payload: FinancialsKpisPayload,
): PeriodComparisonWarning[] {
  const warnings: PeriodComparisonWarning[] = [];
  const periods = getFinancialPeriods(payload);
  const periodById = new Map(periods.map((period) => [period.id, period]));

  for (const variance of payload.mdaTrendsMaterialDevelopmentsAndConfirmations.varianceAnalyses) {
    const previous = periodById.get(variance.previousPeriodId);
    const current = periodById.get(variance.currentPeriodId);
    if (!previous || !current) continue;
    if (periodsAreComparable(previous, current)) continue;
    warnings.push({
      id: variance.id,
      previousPeriodId: variance.previousPeriodId,
      currentPeriodId: variance.currentPeriodId,
      previousLabel: previous.label || previous.id,
      currentLabel: current.label || current.id,
      warning:
        'Comparing periods with different lengths or full-year vs interim basis without adjustment may mislead.',
    });
  }

  for (const period of periods) {
    if (!period.comparablePeriodId) continue;
    const comparable = periodById.get(period.comparablePeriodId);
    if (!comparable) continue;
    if (periodsAreComparable(comparable, period)) continue;
    warnings.push({
      id: `comparable-${period.id}`,
      previousPeriodId: comparable.id,
      currentPeriodId: period.id,
      previousLabel: comparable.label || comparable.id,
      currentLabel: period.label || period.id,
      warning:
        'Interim comparable period length or basis differs from the referenced period.',
    });
  }

  return warnings;
}

export function hasThreeFullYearPeriods(payload: FinancialsKpisPayload): boolean {
  const fullYears = getFullYearPeriods(payload).filter(
    (period) => period.label.trim() && period.startDate.trim() && period.endDate.trim(),
  );
  const distinctLabels = new Set(fullYears.map((period) => period.label.trim()));
  return distinctLabels.size >= 3;
}

export function getLatestPeriod(payload: FinancialsKpisPayload): FinancialPeriod | null {
  const periods = getFinancialPeriods(payload).filter((period) => period.endDate.trim());
  if (periods.length === 0) return null;
  return [...periods].sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null;
}
