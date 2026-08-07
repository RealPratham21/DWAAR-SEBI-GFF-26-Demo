/**
 * Overview summary derived from the in-memory Financials & KPIs draft (F1).
 */

import {
  computeFinancialsKpisModel,
  type FinancialsKpisModel,
  type ReconciliationCheck,
} from '@/lib/financials-kpis/compute';
import { calculateFinancialsKpisProgress } from '@/lib/financials-kpis/progress';
import { getFinancialPeriods } from '@/lib/financials-kpis/periods';
import { buildFinancialAssessment, type FinancialAssessmentResponse } from '@/lib/financials-kpis/assessment';
import {
  createEmptyLinkedWorkstreamReferences,
  type FinancialsKpisProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/financials-kpis/types';
import type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';
import { FINANCIALS_KPIS_SECTION_LABELS } from '@/lib/financials-kpis/options';

export type ReconciliationConcern = {
  id: string;
  label: string;
  message: string;
  periodLabel: string;
};

export type FinancialsKpisOverviewSummary = {
  sectionStatuses: FinancialsKpisProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: FinancialsKpisProgress['overallStatus'];
  periodLabels: string[];
  latestPeriodLabel: string;
  displayUnit: string;
  fullYearPeriodCount: number;
  interimPeriodCount: number;
  entityCount: number;
  plLineCount: number;
  kpiCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  reconciliationConcerns: ReconciliationConcern[];
  periodComparisonWarnings: FinancialsKpisModel['periodComparisonWarnings'];
  assessmentResult: FinancialAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: FinancialsKpisSectionId; label: string }>;
  latestRevenue: string;
  latestProfitAfterTax: string;
  latestEbitda: string;
};

function reconciliationConcernsFrom(checks: ReconciliationCheck[]): ReconciliationConcern[] {
  return checks
    .filter((check) => check.status === 'variance' || check.status === 'missing_information')
    .map((check) => ({
      id: check.id,
      label: check.label,
      message: check.message,
      periodLabel: check.periodId,
    }));
}

export function buildOverviewSummary(
  payload: FinancialsKpisPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): FinancialsKpisOverviewSummary {
  const progress = calculateFinancialsKpisProgress(payload);
  const model = computeFinancialsKpisModel(payload, linkedReferences);
  const assessment = buildFinancialAssessment(payload, model, progress, linkedReferences);

  const periods = getFinancialPeriods(payload);
  const latestPl = model.plByPeriod[model.plByPeriod.length - 1];

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const reconciledChecksCount = model.reconciliation.filter((c) => c.status === 'reconciled').length;
  const varianceChecksCount = model.reconciliation.filter((c) => c.status === 'variance').length;
  const missingInformationChecksCount = model.reconciliation.filter(
    (c) => c.status === 'missing_information',
  ).length;

  const incompleteSections = (Object.entries(progress.sections) as Array<
    [FinancialsKpisSectionId, typeof progress.sections[FinancialsKpisSectionId]]
  >).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${FINANCIALS_KPIS_SECTION_LABELS[sectionId]}`,
  }));

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    periodLabels: periods.map((p) => p.label).filter((label) => label.trim() !== ''),
    latestPeriodLabel: model.latestPeriodLabel,
    displayUnit: model.displayUnit,
    fullYearPeriodCount: periods.filter((p) => p.fullYearOrInterim === 'full-year').length,
    interimPeriodCount: periods.filter((p) => p.fullYearOrInterim === 'interim').length,
    entityCount: payload.reportingScopePeriodsAndAuditorReadiness.reportingEntities.length,
    plLineCount: payload.restatedStatementOfProfitAndLoss.plLineValues.length,
    kpiCount: payload.kpiSelectionGovernanceAndPeerComparison.kpiRegister.length,
    reconciledChecksCount,
    varianceChecksCount,
    missingInformationChecksCount,
    reconciliationConcerns: reconciliationConcernsFrom(model.reconciliation),
    periodComparisonWarnings: model.periodComparisonWarnings,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
    latestRevenue: latestPl?.revenueFromOperations ?? '',
    latestProfitAfterTax: latestPl?.profitAfterTax ?? '',
    latestEbitda: latestPl?.ebitda ?? '',
  };
}

/** Alias used by barrels and external imports. */
export const buildFinancialsKpisOverviewSummary = buildOverviewSummary;
