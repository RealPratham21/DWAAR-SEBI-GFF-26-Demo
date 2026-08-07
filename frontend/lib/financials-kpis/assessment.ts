/**
 * Deterministic Financial Assessment for Financials & KPIs (F1, frontend-only).
 *
 * Disclosure-focused: never returns strong/weak or investment-quality scores.
 */

import {
  computeFinancialsKpisModel,
  type FinancialsKpisModel,
} from '@/lib/financials-kpis/compute';
import { FINANCIALS_KPIS_CONFIRMATION_FIELDS } from '@/lib/financials-kpis/options';
import { calculateFinancialsKpisProgress } from '@/lib/financials-kpis/progress';
import { getFinancialPeriods } from '@/lib/financials-kpis/periods';
import {
  createEmptyLinkedWorkstreamReferences,
  type FinancialsKpisProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/financials-kpis/types';
import type { FinancialsKpisPayload } from '@/lib/schemas/financials-kpis';

export const FINANCIAL_CRITERION_STATES = [
  'reconciled',
  'potential_inconsistency',
  'missing_information',
  'pending_restatement',
  'pending_auditor_confirmation',
  'pending_linked_workstream',
  'pending_kpi_certification',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type FinancialCriterionState = (typeof FINANCIAL_CRITERION_STATES)[number];

export const FINANCIAL_ASSESSMENT_GROUPS = [
  'reporting_scope_and_periods',
  'financial_statements',
  'restatement_and_audit',
  'other_disclosures',
  'ratios_and_metrics',
  'kpi_governance',
  'mda_and_confirmations',
] as const;

export type FinancialAssessmentGroup = (typeof FINANCIAL_ASSESSMENT_GROUPS)[number];

export const FINANCIAL_CRITERION_STATE_LABELS: Record<FinancialCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_inconsistency: 'Potential inconsistency',
  missing_information: 'Missing information',
  pending_restatement: 'Pending restatement',
  pending_auditor_confirmation: 'Pending auditor confirmation',
  pending_linked_workstream: 'Pending linked workstream',
  pending_kpi_certification: 'Pending KPI certification',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const FINANCIAL_ASSESSMENT_GROUP_LABELS: Record<FinancialAssessmentGroup, string> = {
  reporting_scope_and_periods: 'Reporting scope and periods',
  financial_statements: 'Financial statements',
  restatement_and_audit: 'Restatement and audit',
  other_disclosures: 'Other disclosures',
  ratios_and_metrics: 'Ratios and metrics',
  kpi_governance: 'KPI governance',
  mda_and_confirmations: 'MD&A and confirmations',
};

export const FINANCIAL_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'broadly_reconciled',
  'inconsistencies_identified',
  'professional_confirmation_required',
  'pending_restatement',
] as const;

export type FinancialAssessmentResultState = (typeof FINANCIAL_ASSESSMENT_RESULT_STATES)[number];

export type FinancialAssessmentCriterion = {
  id: string;
  group: FinancialAssessmentGroup;
  label: string;
  state: FinancialCriterionState;
  reason: string;
};

export type FinancialAssessmentGroupResult = {
  group: FinancialAssessmentGroup;
  label: string;
  headlineState: FinancialCriterionState;
  criteria: FinancialAssessmentCriterion[];
};

export type FinancialAssessmentResponse = {
  result: FinancialAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: FinancialAssessmentCriterion[];
  groups: FinancialAssessmentGroupResult[];
  counts: {
    reconciled: number;
    potentialInconsistency: number;
    missingInformation: number;
    pendingRestatement: number;
    pendingAuditorConfirmation: number;
    pendingLinkedWorkstream: number;
    pendingKpiCertification: number;
    pendingProfessionalConfirmation: number;
    notApplicable: number;
  };
  metrics: {
    periods: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    unreconciledChecks: number;
    blockingConcerns: number;
  };
};

function worstState(states: FinancialCriterionState[]): FinancialCriterionState {
  const priority: FinancialCriterionState[] = [
    'potential_inconsistency',
    'missing_information',
    'pending_restatement',
    'pending_auditor_confirmation',
    'pending_linked_workstream',
    'pending_kpi_certification',
    'pending_professional_confirmation',
    'reconciled',
    'not_applicable',
  ];
  for (const state of priority) {
    if (states.includes(state)) return state;
  }
  return 'missing_information';
}

function deriveResult(
  criteria: FinancialAssessmentCriterion[],
): { result: FinancialAssessmentResultState; resultLabel: string; summary: string } {
  const hasInconsistency = criteria.some((c) => c.state === 'potential_inconsistency');
  const hasPendingRestatement = criteria.some((c) => c.state === 'pending_restatement');
  const hasProfessional = criteria.some(
    (c) =>
      c.state === 'pending_professional_confirmation' ||
      c.state === 'pending_auditor_confirmation' ||
      c.state === 'pending_kpi_certification',
  );
  const missingCount = criteria.filter((c) => c.state === 'missing_information').length;

  if (hasInconsistency) {
    return {
      result: 'inconsistencies_identified',
      resultLabel: 'Inconsistencies identified',
      summary:
        'One or more reconciliation or cross-workstream checks show a difference that needs review.',
    };
  }
  if (hasPendingRestatement) {
    return {
      result: 'pending_restatement',
      resultLabel: 'Pending restatement',
      summary: 'Restated financial information is still being prepared or reviewed.',
    };
  }
  if (hasProfessional) {
    return {
      result: 'professional_confirmation_required',
      resultLabel: 'Professional confirmation required',
      summary: 'Some items still need auditor, KPI or other professional confirmation.',
    };
  }
  if (missingCount > criteria.length / 2) {
    return {
      result: 'insufficient_information',
      resultLabel: 'Disclosure readiness in progress',
      summary: 'Much of the financial and KPI record is still blank or unanswered.',
    };
  }
  return {
    result: 'broadly_reconciled',
    resultLabel: 'Broadly reconciled',
    summary: 'Entered information is largely consistent; remaining gaps are noted below.',
  };
}

export function buildFinancialAssessment(
  payload: FinancialsKpisPayload,
  model: FinancialsKpisModel,
  progress: FinancialsKpisProgress,
  linkedReferences: LinkedWorkstreamReferences,
): FinancialAssessmentResponse {
  const criteria: FinancialAssessmentCriterion[] = [];
  const periods = getFinancialPeriods(payload);
  const scope = payload.reportingScopePeriodsAndAuditorReadiness;

  criteria.push({
    id: 'periods-defined',
    group: 'reporting_scope_and_periods',
    label: 'Financial periods defined',
    state: periods.length >= 3 ? 'reconciled' : periods.length > 0 ? 'missing_information' : 'missing_information',
    reason:
      periods.length >= 3
        ? `${periods.length} period(s) in the shared registry.`
        : 'At least three full-year periods plus interim are expected for DRHP financials.',
  });

  criteria.push({
    id: 'auditor-readiness',
    group: 'reporting_scope_and_periods',
    label: 'Auditor readiness captured',
    state:
      scope.auditorReadiness.currentStatutoryAuditor.trim() !== ''
        ? 'reconciled'
        : 'missing_information',
    reason:
      scope.auditorReadiness.currentStatutoryAuditor.trim() !== ''
        ? 'Current statutory auditor is recorded.'
        : 'Current statutory auditor is not recorded yet.',
  });

  for (const check of model.reconciliation) {
    criteria.push({
      id: check.id,
      group: 'financial_statements',
      label: check.label,
      state:
        check.status === 'reconciled'
          ? 'reconciled'
          : check.status === 'variance'
            ? 'potential_inconsistency'
            : check.status === 'missing_information'
              ? 'missing_information'
              : 'not_applicable',
      reason: check.message,
    });
  }

  if (scope.auditorReadiness.restatementExerciseStatus === 'under-preparation') {
    criteria.push({
      id: 'restatement-in-progress',
      group: 'restatement_and_audit',
      label: 'Restatement exercise in progress',
      state: 'pending_restatement',
      reason: 'Restated financial information is still under preparation.',
    });
  }

  if (!linkedReferences.capitalOwnership.available) {
    criteria.push({
      id: 'capital-ownership-link',
      group: 'other_disclosures',
      label: 'Capital & Ownership link',
      state: 'pending_linked_workstream',
      reason: 'Share capital cross-check awaits Capital & Ownership (F2 wiring).',
    });
  }

  if (!linkedReferences.ipoSetup.available) {
    criteria.push({
      id: 'ipo-setup-link',
      group: 'ratios_and_metrics',
      label: 'Issue price vs IPO Setup',
      state: 'pending_linked_workstream',
      reason: 'IPO Setup issue price is not yet available for P/E and price/NAV metrics.',
    });
  }

  for (const row of model.smeEligibility) {
    const states = [row.operatingProfitState, row.netWorthState, row.fcfeState];
    const state = states.includes('potential_concern')
      ? 'potential_inconsistency'
      : states.includes('missing_information')
        ? 'missing_information'
        : states.includes('pending_auditor_confirmation')
          ? 'pending_auditor_confirmation'
          : states.includes('professional_confirmation_required')
            ? 'pending_professional_confirmation'
            : 'reconciled';
    criteria.push({
      id: `sme-${row.periodId}`,
      group: 'ratios_and_metrics',
      label: `SME eligibility — ${row.periodLabel}`,
      state,
      reason: `Operating profit: ${row.operatingProfitState}; net worth: ${row.netWorthState}; FCFE: ${row.fcfeState}.`,
    });
  }

  if (model.periodComparisonWarnings.length > 0) {
    criteria.push({
      id: 'period-comparison-warnings',
      group: 'mda_and_confirmations',
      label: 'Invalid period comparisons flagged',
      state: 'potential_inconsistency',
      reason: `${model.periodComparisonWarnings.length} variance or comparable-period warning(s) require review.`,
    });
  }

  const unansweredConfirmations = FINANCIALS_KPIS_CONFIRMATION_FIELDS.filter(
    (field) => !payload.mdaTrendsMaterialDevelopmentsAndConfirmations.confirmations[field.key],
  ).length;

  for (const field of FINANCIALS_KPIS_CONFIRMATION_FIELDS) {
    criteria.push({
      id: `confirmation-${field.key}`,
      group: 'mda_and_confirmations',
      label: field.label,
      state: payload.mdaTrendsMaterialDevelopmentsAndConfirmations.confirmations[field.key]
        ? 'reconciled'
        : 'missing_information',
      reason: payload.mdaTrendsMaterialDevelopmentsAndConfirmations.confirmations[field.key]
        ? 'Confirmed.'
        : 'Not confirmed yet.',
    });
  }

  const groups: FinancialAssessmentGroupResult[] = FINANCIAL_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: FINANCIAL_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  });

  const counts = {
    reconciled: criteria.filter((c) => c.state === 'reconciled').length,
    potentialInconsistency: criteria.filter((c) => c.state === 'potential_inconsistency').length,
    missingInformation: criteria.filter((c) => c.state === 'missing_information').length,
    pendingRestatement: criteria.filter((c) => c.state === 'pending_restatement').length,
    pendingAuditorConfirmation: criteria.filter(
      (c) => c.state === 'pending_auditor_confirmation',
    ).length,
    pendingLinkedWorkstream: criteria.filter((c) => c.state === 'pending_linked_workstream').length,
    pendingKpiCertification: criteria.filter((c) => c.state === 'pending_kpi_certification').length,
    pendingProfessionalConfirmation: criteria.filter(
      (c) => c.state === 'pending_professional_confirmation',
    ).length,
    notApplicable: criteria.filter((c) => c.state === 'not_applicable').length,
  };

  const { result, resultLabel, summary } = deriveResult(criteria);

  return {
    result,
    resultLabel,
    summary,
    criteria,
    groups,
    counts,
    metrics: {
      periods: periods.length,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      unreconciledChecks: model.reconciliation.filter((c) => c.status !== 'reconciled').length,
      blockingConcerns: counts.potentialInconsistency,
    },
  };
}

export function buildFinancialAssessmentFromPayload(
  payload: FinancialsKpisPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): FinancialAssessmentResponse {
  const progress = calculateFinancialsKpisProgress(payload);
  const model = computeFinancialsKpisModel(payload, linkedReferences);
  return buildFinancialAssessment(payload, model, progress, linkedReferences);
}

/** Alias used by tests and UI barrels. */
export const assessFinancialsKpis = buildFinancialAssessmentFromPayload;

export type FinancialAssessment = FinancialAssessmentResponse;
