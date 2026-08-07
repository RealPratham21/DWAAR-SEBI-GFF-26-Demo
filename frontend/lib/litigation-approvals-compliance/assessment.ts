/**
 * Deterministic Legal & Compliance Assessment (LAC1, frontend-only).
 *
 * Disclosure-focused: never returns compliant/non-compliant or investment-quality scores.
 */

import { computeLitigationApprovalsComplianceModel } from '@/lib/litigation-approvals-compliance/compute';
import { getApprovals } from '@/lib/litigation-approvals-compliance/approvals';
import { getMatters } from '@/lib/litigation-approvals-compliance/matters';
import { calculateLitigationApprovalsComplianceProgress } from '@/lib/litigation-approvals-compliance/progress';
import { LAC_CONFIRMATION_FIELDS } from '@/lib/litigation-approvals-compliance/options';
import type { LinkedWorkstreamReferences } from '@/lib/litigation-approvals-compliance/types';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export const LAC_CRITERION_STATES = [
  'reconciled',
  'potential_concern',
  'missing_information',
  'materiality_review_required',
  'pending_legal_review',
  'approval_renewal_review_required',
  'compliance_review_required',
  'financial_reconciliation_pending',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'pending_board_determination',
  'not_applicable',
] as const;

export type LacCriterionState = (typeof LAC_CRITERION_STATES)[number];

export const LAC_ASSESSMENT_GROUPS = [
  'legal_universe_materiality',
  'litigation_proceedings',
  'criminal_regulatory_tax',
  'approvals_master',
  'approval_conditions_renewal',
  'compliance_exceptions',
  'creditors_penalties_developments',
  'cross_workstream_reconciliation',
] as const;

export type LacAssessmentGroup = (typeof LAC_ASSESSMENT_GROUPS)[number];

export const LAC_CRITERION_STATE_LABELS: Record<LacCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  materiality_review_required: 'Materiality review required',
  pending_legal_review: 'Pending legal review',
  approval_renewal_review_required: 'Approval/renewal review required',
  compliance_review_required: 'Compliance review required',
  financial_reconciliation_pending: 'Financial reconciliation pending',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  pending_board_determination: 'Pending Board determination',
  not_applicable: 'Not applicable',
};

export const LAC_ASSESSMENT_GROUP_LABELS: Record<LacAssessmentGroup, string> = {
  legal_universe_materiality: 'Legal universe & materiality',
  litigation_proceedings: 'Litigation & proceedings',
  criminal_regulatory_tax: 'Criminal, regulatory & tax',
  approvals_master: 'Approvals master',
  approval_conditions_renewal: 'Approval conditions & renewal',
  compliance_exceptions: 'Compliance exceptions',
  creditors_penalties_developments: 'Creditors, penalties & developments',
  cross_workstream_reconciliation: 'Cross-workstream reconciliation',
};

export const LAC_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'broadly_reconciled',
  'litigation_disclosure_gaps_identified',
  'approval_compliance_gaps_identified',
  'materiality_review_required',
  'professional_confirmation_required',
  'pending_linked_workstream',
] as const;

export type LacAssessmentResultState = (typeof LAC_ASSESSMENT_RESULT_STATES)[number];

export type LacAssessmentCriterion = {
  id: string;
  group: LacAssessmentGroup;
  label: string;
  state: LacCriterionState;
  reason: string;
  relatedSection: LitigationApprovalsComplianceSectionId;
};

export type LacAssessmentGroupResult = {
  group: LacAssessmentGroup;
  label: string;
  headlineState: LacCriterionState;
  criteria: LacAssessmentCriterion[];
};

export type LacAssessmentResponse = {
  result: LacAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: LacAssessmentCriterion[];
  groups: LacAssessmentGroupResult[];
  counts: Record<
    | 'reconciled'
    | 'potentialConcern'
    | 'missingInformation'
    | 'materialityReviewRequired'
    | 'pendingLegalReview'
    | 'approvalRenewalReviewRequired'
    | 'complianceReviewRequired'
    | 'financialReconciliationPending'
    | 'pendingLinkedWorkstream'
    | 'pendingProfessionalConfirmation'
    | 'pendingBoardDetermination'
    | 'notApplicable',
    number
  >;
  metrics: {
    matterCount: number;
    approvalCount: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    expiringApprovals30Days: number;
    delayedStatutoryDues: number;
    potentialConcerns: number;
  };
};

function worstState(states: LacCriterionState[]): LacCriterionState {
  const priority: LacCriterionState[] = [
    'potential_concern',
    'materiality_review_required',
    'pending_legal_review',
    'approval_renewal_review_required',
    'compliance_review_required',
    'financial_reconciliation_pending',
    'pending_board_determination',
    'pending_linked_workstream',
    'pending_professional_confirmation',
    'missing_information',
    'reconciled',
    'not_applicable',
  ];
  for (const state of priority) {
    if (states.includes(state)) return state;
  }
  return 'missing_information';
}

function criterion(
  id: string,
  group: LacAssessmentGroup,
  label: string,
  state: LacCriterionState,
  reason: string,
  relatedSection: LitigationApprovalsComplianceSectionId,
): LacAssessmentCriterion {
  return { id, group, label, state, reason, relatedSection };
}

export function assessLitigationApprovalsCompliance(
  payload: LitigationApprovalsCompliancePayload,
  linkedReferences: LinkedWorkstreamReferences,
): LacAssessmentResponse {
  const progress = calculateLitigationApprovalsComplianceProgress(payload);
  const model = computeLitigationApprovalsComplianceModel(payload, linkedReferences);
  const criteria: LacAssessmentCriterion[] = [];
  const matters = getMatters(payload);
  const approvals = getApprovals(payload);
  const snapshot = payload.legalUniverseMaterialityPolicyAndPartyMapping.legalDdSnapshot;

  // Legal universe & materiality
  criteria.push(
    criterion(
      'legal-dd-snapshot',
      'legal_universe_materiality',
      'Legal DD snapshot captured',
      filled(snapshot.legalDdAsOfDate) ? 'reconciled' : 'missing_information',
      filled(snapshot.legalDdAsOfDate)
        ? `Legal DD as-of date: ${snapshot.legalDdAsOfDate}.`
        : 'Legal DD snapshot dates not yet captured.',
      'legal-universe-materiality-policy-and-party-mapping',
    ),
  );

  criteria.push(
    criterion(
      'party-review-register',
      'legal_universe_materiality',
      'Relevant party review register',
      payload.legalUniverseMaterialityPolicyAndPartyMapping.legalPartyReviews.length > 0
        ? 'reconciled'
        : snapshot.litigationExists === 'yes'
          ? 'missing_information'
          : 'not_applicable',
      payload.legalUniverseMaterialityPolicyAndPartyMapping.legalPartyReviews.length > 0
        ? `${payload.legalUniverseMaterialityPolicyAndPartyMapping.legalPartyReviews.length} party review record(s) captured.`
        : 'No party review records captured yet.',
      'legal-universe-materiality-policy-and-party-mapping',
    ),
  );

  const materialityPolicy =
    payload.legalUniverseMaterialityPolicyAndPartyMapping.litigationMaterialityPolicy;
  criteria.push(
    criterion(
      'materiality-policy',
      'legal_universe_materiality',
      'Litigation materiality policy',
      materialityPolicy.policyExists === 'yes' && materialityPolicy.adopted !== 'no'
        ? 'reconciled'
        : materialityPolicy.policyExists === 'yes'
          ? 'pending_board_determination'
          : matters.length > 0
            ? 'materiality_review_required'
            : 'missing_information',
      materialityPolicy.policyExists
        ? `Policy exists: ${materialityPolicy.policyExists}; adopted: ${materialityPolicy.adopted || 'not answered'}.`
        : 'Board-approved litigation materiality policy not yet captured.',
      'legal-universe-materiality-policy-and-party-mapping',
    ),
  );

  // Litigation & proceedings
  criteria.push(
    criterion(
      'matter-master',
      'litigation_proceedings',
      'Matter Master populated',
      matters.length > 0 ? 'reconciled' : snapshot.litigationExists === 'yes' ? 'missing_information' : 'not_applicable',
      matters.length > 0
        ? `${matters.length} matter record(s) in the Matter Master.`
        : 'No matters recorded in the Matter Master.',
      'litigation-and-proceedings-master',
    ),
  );

  const pendingMateriality = matters.filter(
    (matter) =>
      matter.materiality.readinessState === 'pending-board-determination' ||
      matter.materiality.readinessState === 'mandatory-category-review' ||
      matter.materiality.readinessState === 'missing-information',
  ).length;
  if (pendingMateriality > 0 || matters.some((m) => m.materiality.professionalReview === 'pending')) {
    criteria.push(
      criterion(
        'matter-materiality',
        'litigation_proceedings',
        'Matter materiality assessments',
        pendingMateriality > 0 ? 'materiality_review_required' : 'pending_professional_confirmation',
        `${pendingMateriality} matter(s) require materiality or professional review.`,
        'litigation-and-proceedings-master',
      ),
    );
  }

  // Criminal, regulatory & tax
  const section3 = payload.criminalRegulatoryTaxAndEnforcementReadiness;
  if (snapshot.criminalMattersExist === 'yes' || model.criminalMatterCount > 0) {
    criteria.push(
      criterion(
        'criminal-screening',
        'criminal_regulatory_tax',
        'Criminal screening captured',
        section3.criminalScreenings.length > 0 ? 'reconciled' : 'missing_information',
        section3.criminalScreenings.length > 0
          ? `${section3.criminalScreenings.length} criminal screening record(s) captured.`
          : 'Criminal matters indicated but screening records not captured.',
        'criminal-regulatory-tax-and-enforcement-readiness',
      ),
    );
  }

  criteria.push(
    criterion(
      'regulatory-actions',
      'criminal_regulatory_tax',
      'Regulatory/statutory actions',
      section3.regulatoryActions.length > 0 || snapshot.regulatoryStatutoryActionsExist !== 'yes'
        ? section3.regulatoryActions.length > 0
          ? 'reconciled'
          : snapshot.regulatoryStatutoryActionsExist === 'yes'
            ? 'missing_information'
            : 'not_applicable'
        : 'missing_information',
      section3.regulatoryActions.length > 0
        ? `${section3.regulatoryActions.length} regulatory action record(s) captured.`
        : 'Regulatory actions not yet captured.',
      'criminal-regulatory-tax-and-enforcement-readiness',
    ),
  );

  criteria.push(
    criterion(
      'tax-proceedings',
      'criminal_regulatory_tax',
      'Tax proceedings and aggregates',
      model.taxAggregates.proceedingCount > 0 || model.taxMatterCount > 0
        ? 'reconciled'
        : snapshot.taxDisputesExist === 'yes'
          ? 'missing_information'
          : 'not_applicable',
      model.taxAggregates.proceedingCount > 0
        ? `${model.taxAggregates.proceedingCount} tax proceeding detail(s); aggregate demand ${model.taxAggregates.totalDemand || '—'}.`
        : 'Tax proceedings not yet captured.',
      'criminal-regulatory-tax-and-enforcement-readiness',
    ),
  );

  // Approvals master
  criteria.push(
    criterion(
      'approval-master',
      'approvals_master',
      'Approval Master populated',
      approvals.length > 0 ? 'reconciled' : snapshot.materialApprovalsPending === 'yes' ? 'missing_information' : 'not_applicable',
      approvals.length > 0
        ? `${approvals.length} approval record(s) in the Approval Master.`
        : 'No approvals recorded in the Approval Master.',
      'government-regulatory-and-business-approvals-master',
    ),
  );

  if (model.expiredApprovalCount > 0 || model.renewalPendingCount > 0) {
    criteria.push(
      criterion(
        'approval-status-review',
        'approvals_master',
        'Expired/renewal-pending approvals',
        'approval_renewal_review_required',
        `${model.expiredApprovalCount} expired and ${model.renewalPendingCount} renewal/application-pending approval(s) recorded.`,
        'government-regulatory-and-business-approvals-master',
      ),
    );
  }

  // Approval conditions & renewal
  if (model.approvalExpiryWindows.within90Days.length > 0) {
    criteria.push(
      criterion(
        'approval-expiry-windows',
        'approval_conditions_renewal',
        'Approvals expiring within 90 days',
        'approval_renewal_review_required',
        `${model.approvalExpiryWindows.within90Days.length} approval(s) expiring within 90 days (${model.approvalExpiryWindows.within30Days.length} within 30 days).`,
        'approval-conditions-facility-compliance-and-renewal-readiness',
      ),
    );
  }

  if (model.complianceCounts.approvalConditionsOutstanding > 0) {
    criteria.push(
      criterion(
        'approval-conditions',
        'approval_conditions_renewal',
        'Outstanding approval conditions',
        'compliance_review_required',
        `${model.complianceCounts.approvalConditionsOutstanding} approval condition(s) pending, delayed or not sure.`,
        'approval-conditions-facility-compliance-and-renewal-readiness',
      ),
    );
  }

  // Compliance exceptions
  criteria.push(
    criterion(
      'compliance-exceptions',
      'compliance_exceptions',
      'Compliance exceptions register',
      model.complianceCounts.complianceIssueCount > 0 ||
        snapshot.knownComplianceExceptionsExist === 'yes'
        ? model.complianceCounts.complianceIssueCount > 0
          ? 'reconciled'
          : 'missing_information'
        : snapshot.knownComplianceExceptionsExist === ''
          ? 'missing_information'
          : 'not_applicable',
      model.complianceCounts.complianceIssueCount > 0
        ? `${model.complianceCounts.complianceIssueCount} compliance issue(s); ${model.complianceCounts.continuingIssues} continuing.`
        : 'No compliance exceptions captured yet.',
      'corporate-statutory-and-operational-compliance-exceptions',
    ),
  );

  if (model.complianceCounts.delayedStatutoryDues > 0) {
    criteria.push(
      criterion(
        'statutory-dues-delays',
        'compliance_exceptions',
        'Statutory due delays',
        'compliance_review_required',
        `${model.complianceCounts.delayedStatutoryDues} statutory due record(s) with delay.`,
        'corporate-statutory-and-operational-compliance-exceptions',
      ),
    );
  }

  // Creditors, penalties & developments
  criteria.push(
    criterion(
      'material-creditors',
      'creditors_penalties_developments',
      'Material creditors captured',
      model.creditorTotals.materialCreditorCount > 0 ||
        snapshot.materialCreditorDuesExist === 'yes'
        ? model.creditorTotals.materialCreditorCount > 0
          ? 'reconciled'
          : 'missing_information'
        : 'not_applicable',
      model.creditorTotals.materialCreditorCount > 0
        ? `${model.creditorTotals.materialCreditorCount} material creditor(s); outstanding ${model.creditorTotals.materialOutstanding || '—'}.`
        : 'Material creditors not yet captured.',
      'material-creditors-penalties-and-material-developments',
    ),
  );

  criteria.push(
    criterion(
      'material-developments',
      'creditors_penalties_developments',
      'Material developments since latest financials',
      payload.materialCreditorsPenaltiesAndMaterialDevelopments.materialDevelopments.length > 0 ||
        snapshot.materialDevelopmentsSinceLatestFinancialsExist !== 'yes'
        ? payload.materialCreditorsPenaltiesAndMaterialDevelopments.materialDevelopments.length > 0
          ? 'reconciled'
          : snapshot.materialDevelopmentsSinceLatestFinancialsExist === 'yes'
            ? 'missing_information'
            : 'not_applicable'
        : 'missing_information',
      payload.materialCreditorsPenaltiesAndMaterialDevelopments.materialDevelopments.length > 0
        ? `${payload.materialCreditorsPenaltiesAndMaterialDevelopments.materialDevelopments.length} material development(s) recorded.`
        : 'Material developments not yet captured.',
      'material-creditors-penalties-and-material-developments',
    ),
  );

  // Cross-workstream reconciliation
  const linkedChecks: Array<{
    id: string;
    label: string;
    available: boolean;
    status: string;
    section: LitigationApprovalsComplianceSectionId;
  }> = [
    {
      id: 'linked-financials',
      label: 'Financials reconciliation',
      available: linkedReferences.financialsKpis.available,
      status: model.reconciliation.financials.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-group-entities',
      label: 'Group Entities reconciliation',
      available: linkedReferences.groupEntities.available,
      status: model.reconciliation.groupEntities.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-management',
      label: 'Management & Governance reconciliation',
      available: linkedReferences.managementGovernance.available,
      status: model.reconciliation.managementGovernance.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-bac',
      label: 'Borrowings, Assets & Contracts reconciliation',
      available: linkedReferences.borrowingsAssetsContracts.available,
      status: model.reconciliation.bac.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-business',
      label: 'Business & Operations reconciliation',
      available: linkedReferences.businessOperations.available,
      status: model.reconciliation.businessOperations.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-objects',
      label: 'Objects of the Issue reconciliation',
      available: linkedReferences.objectsOfIssue.available,
      status: model.reconciliation.objectsOfIssue.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
    {
      id: 'linked-ipo',
      label: 'IPO Setup reconciliation',
      available: linkedReferences.ipoSetup.available,
      status: model.reconciliation.ipoSetup.status,
      section: 'reconciliation-remediation-and-issuer-confirmations',
    },
  ];

  for (const check of linkedChecks) {
    criteria.push(
      criterion(
        check.id,
        'cross_workstream_reconciliation',
        check.label,
        !check.available
          ? 'pending_linked_workstream'
          : check.status === 'Reconciled'
            ? 'reconciled'
            : check.status === 'Potential inconsistency'
              ? 'potential_concern'
              : check.status === 'Pending professional confirmation'
                ? 'pending_professional_confirmation'
                : check.status === 'Missing information'
                  ? 'missing_information'
                  : 'financial_reconciliation_pending',
        check.available
          ? `${check.label}: ${check.status}.`
          : `${check.label} linked data not yet available.`,
        check.section,
      ),
    );
  }

  const confirmations = payload.reconciliationRemediationAndIssuerConfirmations.confirmations;
  const unansweredConfirmations = LAC_CONFIRMATION_FIELDS.filter(
    (field) => confirmations[field.key] === '',
  ).length;
  criteria.push(
    criterion(
      'issuer-confirmations',
      'cross_workstream_reconciliation',
      'Issuer confirmations',
      unansweredConfirmations === 0 ? 'reconciled' : 'missing_information',
      unansweredConfirmations === 0
        ? 'All issuer confirmations answered.'
        : `${unansweredConfirmations} confirmation(s) still unanswered.`,
      'reconciliation-remediation-and-issuer-confirmations',
    ),
  );

  if (model.remediationOpenCount > 0) {
    criteria.push(
      criterion(
        'remediation-actions',
        'cross_workstream_reconciliation',
        'Open remediation actions',
        'pending_legal_review',
        `${model.remediationOpenCount} remediation action(s) open, in progress or blocked.`,
        'reconciliation-remediation-and-issuer-confirmations',
      ),
    );
  }

  const counts = {
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    materialityReviewRequired: 0,
    pendingLegalReview: 0,
    approvalRenewalReviewRequired: 0,
    complianceReviewRequired: 0,
    financialReconciliationPending: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    pendingBoardDetermination: 0,
    notApplicable: 0,
  };

  for (const c of criteria) {
    switch (c.state) {
      case 'reconciled':
        counts.reconciled += 1;
        break;
      case 'potential_concern':
        counts.potentialConcern += 1;
        break;
      case 'missing_information':
        counts.missingInformation += 1;
        break;
      case 'materiality_review_required':
        counts.materialityReviewRequired += 1;
        break;
      case 'pending_legal_review':
        counts.pendingLegalReview += 1;
        break;
      case 'approval_renewal_review_required':
        counts.approvalRenewalReviewRequired += 1;
        break;
      case 'compliance_review_required':
        counts.complianceReviewRequired += 1;
        break;
      case 'financial_reconciliation_pending':
        counts.financialReconciliationPending += 1;
        break;
      case 'pending_linked_workstream':
        counts.pendingLinkedWorkstream += 1;
        break;
      case 'pending_professional_confirmation':
        counts.pendingProfessionalConfirmation += 1;
        break;
      case 'pending_board_determination':
        counts.pendingBoardDetermination += 1;
        break;
      case 'not_applicable':
        counts.notApplicable += 1;
        break;
    }
  }

  const groups: LacAssessmentGroupResult[] = LAC_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: LAC_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  }).filter((g) => g.criteria.length > 0);

  const potentialConcerns =
    counts.potentialConcern +
    counts.materialityReviewRequired +
    counts.approvalRenewalReviewRequired +
    counts.complianceReviewRequired +
    counts.pendingLegalReview;

  let result: LacAssessmentResultState = 'broadly_reconciled';
  if (counts.pendingLinkedWorkstream > 0 && progress.sectionsComplete === 0) {
    result = 'pending_linked_workstream';
  } else if (
    counts.pendingProfessionalConfirmation > 0 ||
    counts.pendingBoardDetermination > 0
  ) {
    result = 'professional_confirmation_required';
  } else if (counts.materialityReviewRequired > 0) {
    result = 'materiality_review_required';
  } else if (
    counts.approvalRenewalReviewRequired > 0 ||
    counts.complianceReviewRequired > 0
  ) {
    result = 'approval_compliance_gaps_identified';
  } else if (counts.missingInformation > 0 && matters.length === 0 && approvals.length === 0) {
    result = 'insufficient_information';
  } else if (counts.potentialConcern > 0 || counts.financialReconciliationPending > 0) {
    result = 'litigation_disclosure_gaps_identified';
  } else if (progress.sectionsComplete === 0) {
    result = 'insufficient_information';
  }

  const resultLabels: Record<LacAssessmentResultState, string> = {
    insufficient_information: 'Insufficient information',
    broadly_reconciled: 'Broadly reconciled',
    litigation_disclosure_gaps_identified: 'Litigation disclosure gaps identified',
    approval_compliance_gaps_identified: 'Approval/compliance gaps identified',
    materiality_review_required: 'Materiality review required',
    professional_confirmation_required: 'Professional confirmation required',
    pending_linked_workstream: 'Pending linked workstream data',
  };

  return {
    result,
    resultLabel: resultLabels[result],
    summary:
      'This is a disclosure readiness view derived from the current in-memory draft, not a legal opinion or compliant/non-compliant determination. Unanswered questions are treated as missing information.',
    criteria,
    groups,
    counts,
    metrics: {
      matterCount: model.matterCount,
      approvalCount: model.approvalCount,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      expiringApprovals30Days: model.approvalExpiryWindows.within30Days.length,
      delayedStatutoryDues: model.complianceCounts.delayedStatutoryDues,
      potentialConcerns,
    },
  };
}

function filled(value: string): boolean {
  return value.trim().length > 0;
}
