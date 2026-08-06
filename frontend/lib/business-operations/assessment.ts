/**
 * Deterministic Business Assessment for Business & Operations (frontend-only).
 *
 * Disclosure-focused: never returns strong/weak or investment-quality scores.
 * An unanswered question is `missing_information`, never a negative answer.
 */

import {
  computeBusinessOperationsModel,
  type BusinessOperationsModel,
  type ReconciliationCheck,
} from '@/lib/business-operations/compute';
import { BUSINESS_OPERATIONS_CONFIRMATION_FIELDS } from '@/lib/business-operations/options';
import { calculateBusinessOperationsProgress } from '@/lib/business-operations/progress';
import type {
  BusinessOperationsPayload,
  LinkedWorkstreamReferences,
  YesNoNotSureOrEmpty,
} from '@/lib/business-operations/types';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/business-operations/types';

export const BUSINESS_CRITERION_STATES = [
  'substantiated',
  'potential_inconsistency',
  'missing_information',
  'pending_linked_workstream',
  'pending_supporting_source',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type BusinessCriterionState = (typeof BUSINESS_CRITERION_STATES)[number];

export const BUSINESS_ASSESSMENT_GROUPS = [
  'business_model_coverage',
  'products_and_revenue',
  'customers_and_sales',
  'suppliers_and_procurement',
  'facilities_and_capacity',
  'technology_quality_ip',
  'workforce_insurance_continuity',
  'strategy_substantiation',
] as const;

export type BusinessAssessmentGroup = (typeof BUSINESS_ASSESSMENT_GROUPS)[number];

export const BUSINESS_ASSESSMENT_GROUP_LABELS: Record<BusinessAssessmentGroup, string> = {
  business_model_coverage: 'Business-model coverage',
  products_and_revenue: 'Products and revenue',
  customers_and_sales: 'Customers and sales',
  suppliers_and_procurement: 'Suppliers and procurement',
  facilities_and_capacity: 'Facilities and capacity',
  technology_quality_ip: 'Technology, quality and IP',
  workforce_insurance_continuity: 'Workforce, insurance and continuity',
  strategy_substantiation: 'Strategy substantiation',
};

export const BUSINESS_CRITERION_STATE_LABELS: Record<BusinessCriterionState, string> = {
  substantiated: 'Substantiated',
  potential_inconsistency: 'Potential inconsistency',
  missing_information: 'Missing information',
  pending_linked_workstream: 'Pending linked workstream',
  pending_supporting_source: 'Pending supporting source',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const BUSINESS_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'broadly_substantiated',
  'inconsistencies_identified',
  'professional_confirmation_required',
  'pending_supporting_source',
] as const;

export type BusinessAssessmentResultState = (typeof BUSINESS_ASSESSMENT_RESULT_STATES)[number];

export type BusinessAssessmentCriterion = {
  id: string;
  group: BusinessAssessmentGroup;
  label: string;
  state: BusinessCriterionState;
  reason: string;
};

export type BusinessAssessmentGroupSummary = {
  group: BusinessAssessmentGroup;
  label: string;
  criteria: BusinessAssessmentCriterion[];
  counts: Record<BusinessCriterionState, number>;
  headlineState: BusinessCriterionState;
};

export type BusinessAssessment = {
  result: BusinessAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: BusinessAssessmentCriterion[];
  groups: BusinessAssessmentGroupSummary[];
  counts: Record<BusinessCriterionState, number>;
  metrics: {
    products: number;
    facilities: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    unreconciledChecks: number;
    largestSegmentLabel: string;
    latestHeadcount: string;
  };
  model: BusinessOperationsModel;
};

function stateFromCheck(check: ReconciliationCheck): BusinessCriterionState {
  switch (check.status) {
    case 'reconciled':
      return 'substantiated';
    case 'variance':
      return 'potential_inconsistency';
    case 'not_applicable':
      return 'not_applicable';
    default:
      return 'missing_information';
  }
}

function stateFromTernary(
  answer: YesNoNotSureOrEmpty,
  options: { noState?: BusinessCriterionState } = {},
): BusinessCriterionState {
  switch (answer) {
    case 'yes':
      return 'substantiated';
    case 'no':
      return options.noState ?? 'potential_inconsistency';
    case 'not_sure':
      return 'pending_professional_confirmation';
    default:
      return 'missing_information';
  }
}

function emptyCounts(): Record<BusinessCriterionState, number> {
  return {
    substantiated: 0,
    potential_inconsistency: 0,
    missing_information: 0,
    pending_linked_workstream: 0,
    pending_supporting_source: 0,
    pending_professional_confirmation: 0,
    not_applicable: 0,
  };
}

function headlineStateFor(counts: Record<BusinessCriterionState, number>): BusinessCriterionState {
  if (counts.potential_inconsistency > 0) return 'potential_inconsistency';
  if (counts.missing_information > 0) return 'missing_information';
  if (counts.pending_linked_workstream > 0) return 'pending_linked_workstream';
  if (counts.pending_supporting_source > 0) return 'pending_supporting_source';
  if (counts.pending_professional_confirmation > 0) return 'pending_professional_confirmation';
  if (counts.substantiated > 0) return 'substantiated';
  return 'not_applicable';
}

function labelForResult(result: BusinessAssessmentResultState): string {
  switch (result) {
    case 'insufficient_information':
      return 'Insufficient information';
    case 'inconsistencies_identified':
      return 'Potential inconsistencies identified';
    case 'professional_confirmation_required':
      return 'Professional confirmation required';
    case 'pending_supporting_source':
      return 'Pending supporting source';
    default:
      return 'Broadly substantiated on current entries';
  }
}

function summaryForResult(result: BusinessAssessmentResultState): string {
  switch (result) {
    case 'insufficient_information':
      return 'Too much of the business and operations record is still blank to draw a meaningful disclosure view. Blank answers are not read as negative.';
    case 'inconsistencies_identified':
      return 'One or more figures or claims do not reconcile across sections. These are indicative differences, not conclusions — review the underlying records.';
    case 'professional_confirmation_required':
      return 'Entries marked "not sure" or awaiting professional sign-off need confirmation before this view can be relied upon.';
    case 'pending_supporting_source':
      return 'Material claims or figures still need a supporting source or linked workstream input.';
    default:
      return 'On currently entered values the business and operations disclosure appears broadly substantiated. Professional confirmation remains required.';
  }
}

const CHECK_GROUP: Record<string, BusinessAssessmentGroup> = {
  'primary-activity-revenue-model': 'business_model_coverage',
  'revenue-mix-reconcile': 'products_and_revenue',
  'material-products-represented': 'products_and_revenue',
  'customer-concentration': 'customers_and_sales',
  'supplier-concentration': 'suppliers_and_procurement',
  'geographic-revenue': 'customers_and_sales',
  'order-book-source': 'customers_and_sales',
  'facilities-recorded': 'facilities_and_capacity',
  'capacity-utilisation': 'facilities_and_capacity',
  'strength-sources': 'strategy_substantiation',
  'strategy-projections': 'strategy_substantiation',
};

export function assessBusinessOperations(
  payload: BusinessOperationsPayload,
  linked: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): BusinessAssessment {
  const model = computeBusinessOperationsModel(payload);
  const progress = calculateBusinessOperationsProgress(payload);
  const profile = payload.businessProfileAndOperatingModel;
  const tech = payload.technologyQualityResearchAndIntellectualProperty;
  const workforce = payload.workforceCollaborationsInsuranceAndContinuity;
  const strategy = payload.competitiveStrengthsStrategyDependenciesAndConfirmations;

  const criteria: BusinessAssessmentCriterion[] = [];

  for (const check of model.reconciliation) {
    criteria.push({
      id: check.id,
      group: CHECK_GROUP[check.id] ?? 'business_model_coverage',
      label: check.label,
      state: stateFromCheck(check),
      reason: check.message,
    });
  }

  criteria.push({
    id: 'company-identity-link',
    group: 'business_model_coverage',
    label: 'Company legal identity available from linked workstream',
    state: linked.company.available
      ? 'substantiated'
      : 'pending_linked_workstream',
    reason: linked.company.available
      ? `Linked company identity: ${linked.company.legalName ?? 'available'}.`
      : 'Company & Incorporation identity is not yet linked for this session.',
  });

  criteria.push({
    id: 'third-party-dependence-disclosed',
    group: 'business_model_coverage',
    label: 'Material third-party dependence is disclosed',
    state: stateFromTernary(profile.materialThirdPartyDependence, {
      noState: 'substantiated',
    }),
    reason:
      profile.materialThirdPartyDependence === ''
        ? 'Whether the business has material third-party dependence has not been answered.'
        : profile.materialThirdPartyDependence === 'yes'
          ? profile.materialThirdPartyDependenceDetails ||
            'Material third-party dependence is reported.'
          : 'Issuer indicates no material third-party dependence.',
  });

  criteria.push({
    id: 'certifications-and-ip',
    group: 'technology_quality_ip',
    label: 'Material certifications and IP are recorded',
    state:
      tech.certifications.length === 0 && tech.intellectualPropertyRecords.length === 0
        ? tech.rdFunctionExists === 'no'
          ? 'not_applicable'
          : 'missing_information'
        : 'substantiated',
    reason:
      tech.certifications.length === 0 && tech.intellectualPropertyRecords.length === 0
        ? 'No certifications or intellectual-property records have been added yet.'
        : `${tech.certifications.length} certification(s) and ${tech.intellectualPropertyRecords.length} IP record(s) captured.`,
  });

  criteria.push({
    id: 'technology-dependence',
    group: 'technology_quality_ip',
    label: 'Third-party technology dependence is disclosed',
    state: stateFromTernary(tech.thirdPartyTechnologyDependence, {
      noState: 'substantiated',
    }),
    reason:
      tech.thirdPartyTechnologyDependence === ''
        ? 'Third-party technology dependence has not been answered.'
        : tech.thirdPartyTechnologyDependence === 'yes'
          ? tech.thirdPartyTechnologyDependenceDetails ||
            'Third-party technology dependence is reported.'
          : 'Issuer indicates no material third-party technology dependence.',
  });

  criteria.push({
    id: 'quality-recalls',
    group: 'technology_quality_ip',
    label: 'Quality incidents and recalls are disclosed',
    state: stateFromTernary(tech.materialRecallDeclaration, {
      noState: 'substantiated',
    }),
    reason:
      tech.materialRecallDeclaration === ''
        ? 'Material recall declaration has not been answered.'
        : tech.materialRecallDeclaration === 'yes'
          ? tech.materialRecallDetails || 'A material recall is reported.'
          : 'Issuer indicates no material recall declaration.',
  });

  criteria.push({
    id: 'insurance-adequacy',
    group: 'workforce_insurance_continuity',
    label: 'Insurance coverage adequacy considered',
    state: stateFromTernary(workforce.managementConsidersCoverageAdequate),
    reason:
      workforce.managementConsidersCoverageAdequate === ''
        ? 'Whether management considers insurance coverage adequate has not been answered.'
        : workforce.managementConsidersCoverageAdequate === 'yes'
          ? 'Management considers coverage adequate.'
          : 'Insurance coverage adequacy needs attention or confirmation.',
  });

  criteria.push({
    id: 'continuity-plans',
    group: 'workforce_insurance_continuity',
    label: 'Business continuity and disaster recovery',
    state:
      workforce.businessContinuityPlanExists === '' ||
      workforce.disasterRecoveryPlanExists === ''
        ? 'missing_information'
        : workforce.businessContinuityPlanExists === 'not_sure' ||
            workforce.disasterRecoveryPlanExists === 'not_sure'
          ? 'pending_professional_confirmation'
          : workforce.businessContinuityPlanExists === 'yes' &&
              workforce.disasterRecoveryPlanExists === 'yes'
            ? 'substantiated'
            : 'potential_inconsistency',
    reason:
      workforce.businessContinuityPlanExists === '' ||
      workforce.disasterRecoveryPlanExists === ''
        ? 'Continuity or disaster-recovery plan status has not been answered.'
        : 'Continuity and disaster-recovery responses recorded.',
  });

  const strengthsPendingSource = strategy.competitiveStrengths.filter(
    (item) => item.title.trim() && !item.supportingSource.trim(),
  ).length;
  if (strengthsPendingSource > 0) {
    criteria.push({
      id: 'strength-supporting-source-pending',
      group: 'strategy_substantiation',
      label: 'Strength claims pending supporting source',
      state: 'pending_supporting_source',
      reason: `${strengthsPendingSource} strength claim(s) still need a supporting source.`,
    });
  }

  const confirmationsChecked = BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.filter(
    (field) => strategy.confirmations[field.key],
  ).length;
  const unansweredConfirmations =
    BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.length - confirmationsChecked;
  criteria.push({
    id: 'issuer-confirmations',
    group: 'strategy_substantiation',
    label: 'Issuer confirmations',
    state: unansweredConfirmations === 0 ? 'substantiated' : 'missing_information',
    reason:
      unansweredConfirmations === 0
        ? 'All issuer confirmations are acknowledged.'
        : `${unansweredConfirmations} confirmation(s) remain unchecked, so this view stays preliminary.`,
  });

  if (strategy.confirmations.professionalReviewRemainsRequired) {
    criteria.push({
      id: 'professional-review-flag',
      group: 'strategy_substantiation',
      label: 'Professional review remains required',
      state: 'pending_professional_confirmation',
      reason: 'The issuer has confirmed that professional review of this workstream remains required.',
    });
  }

  const counts = emptyCounts();
  for (const criterion of criteria) counts[criterion.state] += 1;

  const groups: BusinessAssessmentGroupSummary[] = BUSINESS_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((criterion) => criterion.group === group);
    const groupCounts = emptyCounts();
    for (const criterion of groupCriteria) groupCounts[criterion.state] += 1;
    return {
      group,
      label: BUSINESS_ASSESSMENT_GROUP_LABELS[group],
      criteria: groupCriteria,
      counts: groupCounts,
      headlineState: headlineStateFor(groupCounts),
    };
  });

  // Insufficient information wins while the workspace is still mostly blank so a single
  // inconsistency cannot dominate the headline before enough sections exist to judge.
  let result: BusinessAssessmentResultState = 'broadly_substantiated';
  if (counts.missing_information >= 6 || progress.sectionsComplete < 2) {
    result = 'insufficient_information';
  } else if (counts.potential_inconsistency > 0) {
    result = 'inconsistencies_identified';
  } else if (counts.pending_professional_confirmation > 0) {
    result = 'professional_confirmation_required';
  } else if (
    counts.pending_supporting_source > 0 ||
    counts.pending_linked_workstream > 0
  ) {
    result = 'pending_supporting_source';
  } else if (counts.missing_information > 0) {
    result = 'insufficient_information';
  }

  return {
    result,
    resultLabel: labelForResult(result),
    summary: summaryForResult(result),
    criteria,
    groups,
    counts,
    metrics: {
      products: model.counts.products,
      facilities: model.counts.facilities,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      unreconciledChecks: model.reconciliation.filter((check) => check.status === 'variance')
        .length,
      largestSegmentLabel: model.largestSegment?.label ?? '',
      latestHeadcount: model.workforceLatest?.totalHeadcount ?? '',
    },
    model,
  };
}
