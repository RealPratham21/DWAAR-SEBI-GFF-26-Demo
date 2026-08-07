/**
 * Section completion for Financials & KPIs.
 */

import { isFilledDecimal } from '@/lib/financials-kpis/decimal';
import {
  FINANCIALS_KPIS_CONFIRMATION_FIELDS,
  FINANCIALS_KPIS_SECTION_LABELS,
} from '@/lib/financials-kpis/options';
import { hasThreeFullYearPeriods } from '@/lib/financials-kpis/periods';
import type {
  FinancialsKpisPayload,
  FinancialsKpisProgress,
  FinancialsKpisSectionId,
  SectionStatus,
} from '@/lib/financials-kpis/types';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateReportingScopeStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.reportingScopePeriodsAndAuditorReadiness;
  const basis = section.reportingBasis;
  const core = [
    filled(basis.financialYearEnd),
    filled(basis.accountingFramework),
    filled(basis.financialPresentation),
    filled(basis.currency),
    filled(basis.displayUnit),
    filled(basis.ociApplies),
    filled(basis.cashFlowAvailable),
    section.financialPeriods.length > 0,
    filled(section.auditorReadiness.currentStatutoryAuditor),
    filled(section.auditorReadiness.restatementExerciseStatus),
  ];
  const answered = core.filter(Boolean).length;
  const periodsComplete = section.financialPeriods.every(
    (period) =>
      filled(period.label) &&
      filled(period.startDate) &&
      filled(period.endDate) &&
      filled(period.fullYearOrInterim),
  );
  const threeYears = hasThreeFullYearPeriods(payload);
  return statusFrom(answered, core.length, periodsComplete && threeYears);
}

export function evaluatePlStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.restatedStatementOfProfitAndLoss;
  const core = [
    section.plLineValues.length > 0,
    section.perShareByPeriod.length > 0 || section.exceptionalItems.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const plComplete = section.plLineValues.every(
    (row) => filled(row.periodId) && filled(row.lineKey) && isFilledDecimal(row.amount),
  );
  const perShareComplete = section.perShareByPeriod.every(
    (row) => filled(row.periodId) && isFilledDecimal(row.weightedAvgBasicShares),
  );
  return statusFrom(answered, core.length, plComplete && perShareComplete);
}

export function evaluateBalanceSheetStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.assetsLiabilitiesEquityAndCashFlows;
  const core = [
    section.balanceSheetLineValues.length > 0,
    section.cashFlowLineValues.length > 0 || section.changesInEquityLineValues.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const bsComplete = section.balanceSheetLineValues.every(
    (row) => filled(row.periodId) && filled(row.lineKey) && isFilledDecimal(row.amount),
  );
  const cfComplete = section.cashFlowLineValues.every(
    (row) => filled(row.periodId) && filled(row.lineKey),
  );
  return statusFrom(answered, core.length, bsComplete && cfComplete);
}

export function evaluateRestatementStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.restatementAdjustmentsPoliciesAndAuditorMatters;
  const core = [
    section.restatementAdjustments.length > 0 ||
      section.accountingPolicies.length > 0 ||
      section.auditReportMatters.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const adjustmentsComplete = section.restatementAdjustments.every(
    (row) =>
      filled(row.periodId) &&
      filled(row.originalLineItem) &&
      isFilledDecimal(row.originalAuditedAmount),
  );
  const policiesComplete = section.accountingPolicies.every((row) => filled(row.policyCategory));
  const auditComplete = section.auditReportMatters.every(
    (row) => filled(row.periodId) && filled(row.auditOpinion),
  );
  return statusFrom(answered, core.length, adjustmentsComplete && policiesComplete && auditComplete);
}

export function evaluateOtherFinancialInfoStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.otherFinancialInformation;
  const core = [
    section.segmentRecords.length > 0 ||
      section.relatedPartyTransactions.length > 0 ||
      section.workingCapitalSummaries.length > 0,
    filled(section.indebtednessSummary.totalDebt) || filled(section.indebtednessSummary.notes),
    section.taxByPeriod.length > 0 || section.dividendRecords.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const segmentsComplete = section.segmentRecords.every(
    (row) => filled(row.periodId) && filled(row.segmentName),
  );
  const wcComplete = section.workingCapitalSummaries.every((row) => filled(row.periodId));
  return statusFrom(answered, core.length, segmentsComplete && wcComplete);
}

export function evaluateRatiosStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.ratiosCapitalisationAndIssuePriceMetrics;
  const core = [
    section.formulaRecords.length > 0 || section.smeEligibilityByPeriod.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const formulasComplete = section.formulaRecords.every(
    (row) => filled(row.metricKey) && filled(row.definition),
  );
  const smeComplete = section.smeEligibilityByPeriod.every(
    (row) =>
      filled(row.periodId) &&
      (isFilledDecimal(row.operatingProfit) ||
        isFilledDecimal(row.netWorth) ||
        isFilledDecimal(row.fcfe)),
  );
  return statusFrom(answered, core.length, formulasComplete && smeComplete);
}

export function evaluateKpiGovernanceStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.kpiSelectionGovernanceAndPeerComparison;
  const core = [
    section.selectedDataCandidates.length > 0 || section.kpiRegister.length > 0,
    filled(section.managementCertification.status) ||
      filled(section.auditCommitteeGovernance.approvalStatus),
    filled(section.professionalCertification.certificationStatus),
  ];
  const answered = core.filter(Boolean).length;
  const candidatesComplete = section.selectedDataCandidates.every(
    (row) => filled(row.metricName) && filled(row.category),
  );
  const kpiComplete = section.kpiRegister.every(
    (row) => filled(row.name) && filled(row.plainEnglishDefinition),
  );
  const peersComplete = section.peerComparisons.every((row) => filled(row.companyName));
  return statusFrom(answered, core.length, candidatesComplete && kpiComplete && peersComplete);
}

export function evaluateMdaStatus(payload: FinancialsKpisPayload): SectionStatus {
  const section = payload.mdaTrendsMaterialDevelopmentsAndConfirmations;
  const confirmationsChecked = FINANCIALS_KPIS_CONFIRMATION_FIELDS.filter(
    (field) => section.confirmations[field.key],
  ).length;
  const core = [
    section.performanceFactors.length > 0 || section.varianceAnalyses.length > 0,
    filled(section.liquidityCapitalResources.principalLiquiditySources),
    section.trendsUncertainties.length > 0 || section.subsequentEvents.length > 0,
    confirmationsChecked > 0,
  ];
  const answered = core.filter(Boolean).length;
  const varianceComplete = section.varianceAnalyses.every(
    (row) =>
      filled(row.lineItem) &&
      filled(row.previousPeriodId) &&
      filled(row.currentPeriodId) &&
      filled(row.explanation),
  );
  const confirmationsComplete =
    confirmationsChecked === FINANCIALS_KPIS_CONFIRMATION_FIELDS.length;
  return statusFrom(answered, core.length, varianceComplete && confirmationsComplete);
}

export function calculateFinancialsKpisProgress(
  payload: FinancialsKpisPayload,
): FinancialsKpisProgress {
  const sections: Record<FinancialsKpisSectionId, SectionStatus> = {
    'reporting-scope-periods-and-auditor-readiness': evaluateReportingScopeStatus(payload),
    'restated-statement-of-profit-and-loss': evaluatePlStatus(payload),
    'assets-liabilities-equity-and-cash-flows': evaluateBalanceSheetStatus(payload),
    'restatement-adjustments-policies-and-auditor-matters': evaluateRestatementStatus(payload),
    'other-financial-information': evaluateOtherFinancialInfoStatus(payload),
    'ratios-capitalisation-and-issue-price-metrics': evaluateRatiosStatus(payload),
    'kpi-selection-governance-and-peer-comparison': evaluateKpiGovernanceStatus(payload),
    'mda-trends-material-developments-and-confirmations': evaluateMdaStatus(payload),
  };

  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listIncompleteFinancialsKpisSections(payload: FinancialsKpisPayload): string[] {
  const progress = calculateFinancialsKpisProgress(payload);
  const incomplete: string[] = [];
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [FinancialsKpisSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      incomplete.push(`${FINANCIALS_KPIS_SECTION_LABELS[id]} incomplete`);
    }
  }
  return incomplete;
}
