/**
 * Deterministic Group & RPT Assessment (GR1, frontend-only).
 */

import { computeGroupEntitiesModel } from '@/lib/group-entities-related-parties/compute';
import { getEntityById, getEntities } from '@/lib/group-entities-related-parties/entities';
import { calculateGroupEntitiesProgress } from '@/lib/group-entities-related-parties/progress';
import { GROUP_ENTITIES_CONFIRMATION_FIELDS } from '@/lib/group-entities-related-parties/options';
import type { LinkedWorkstreamReferences } from '@/lib/group-entities-related-parties/types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export const GROUP_CRITERION_STATES = [
  'reconciled',
  'potential_concern',
  'missing_information',
  'unresolved_relationship',
  'classification_review_required',
  'financial_reconciliation_pending',
  'pending_entity_information',
  'pending_linked_workstream',
  'pending_board_determination',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type GroupCriterionState = (typeof GROUP_CRITERION_STATES)[number];

export const GROUP_ASSESSMENT_GROUPS = [
  'group_structure',
  'ownership_control',
  'regulatory_classifications',
  'related_party_completeness',
  'rpt_reconciliation',
  'common_pursuits_conflicts',
  'group_company_information',
  'cross_workstream_consistency',
  'final_readiness',
] as const;

export type GroupAssessmentGroup = (typeof GROUP_ASSESSMENT_GROUPS)[number];

export const GROUP_CRITERION_STATE_LABELS: Record<GroupCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  unresolved_relationship: 'Unresolved relationship',
  classification_review_required: 'Classification review required',
  financial_reconciliation_pending: 'Financial reconciliation pending',
  pending_entity_information: 'Pending entity information',
  pending_linked_workstream: 'Pending linked workstream',
  pending_board_determination: 'Pending Board determination',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const GROUP_ASSESSMENT_GROUP_LABELS: Record<GroupAssessmentGroup, string> = {
  group_structure: 'Group structure',
  ownership_control: 'Ownership/control relationships',
  regulatory_classifications: 'Regulatory classifications',
  related_party_completeness: 'Related-party completeness',
  rpt_reconciliation: 'RPT reconciliation',
  common_pursuits_conflicts: 'Common pursuits and conflicts',
  group_company_information: 'Group Company information',
  cross_workstream_consistency: 'Cross-workstream consistency',
  final_readiness: 'Final readiness',
};

export const GROUP_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'readiness_in_progress',
  'classification_gaps_identified',
  'rpt_gaps_identified',
  'entity_information_gaps',
  'professional_confirmation_required',
  'pending_linked_workstream',
] as const;

export type GroupAssessmentResultState = (typeof GROUP_ASSESSMENT_RESULT_STATES)[number];

export type GroupAssessmentCriterion = {
  id: string;
  group: GroupAssessmentGroup;
  label: string;
  state: GroupCriterionState;
  reason: string;
  relatedSection: GroupEntitiesSectionId;
};

export type GroupAssessmentGroupResult = {
  group: GroupAssessmentGroup;
  label: string;
  headlineState: GroupCriterionState;
  criteria: GroupAssessmentCriterion[];
};

export type GroupAssessmentResponse = {
  result: GroupAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: GroupAssessmentCriterion[];
  groups: GroupAssessmentGroupResult[];
  counts: Record<
    | 'reconciled'
    | 'potentialConcern'
    | 'missingInformation'
    | 'unresolvedRelationship'
    | 'classificationReviewRequired'
    | 'financialReconciliationPending'
    | 'pendingEntityInformation'
    | 'pendingLinkedWorkstream'
    | 'pendingBoardDetermination'
    | 'pendingProfessionalConfirmation'
    | 'notApplicable',
    number
  >;
  metrics: {
    entityCount: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    rptTransactionCount: number;
    pendingBoardDeterminations: number;
    potentialConcerns: number;
  };
};

function worstState(states: GroupCriterionState[]): GroupCriterionState {
  const priority: GroupCriterionState[] = [
    'potential_concern',
    'unresolved_relationship',
    'classification_review_required',
    'financial_reconciliation_pending',
    'pending_entity_information',
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
  group: GroupAssessmentGroup,
  label: string,
  state: GroupCriterionState,
  reason: string,
  relatedSection: GroupEntitiesSectionId,
): GroupAssessmentCriterion {
  return { id, group, label, state, reason, relatedSection };
}

export function assessGroupEntities(
  payload: GroupEntitiesRelatedPartiesPayload,
  linkedReferences: LinkedWorkstreamReferences,
): GroupAssessmentResponse {
  const progress = calculateGroupEntitiesProgress(payload);
  const model = computeGroupEntitiesModel(payload, linkedReferences);
  const criteria: GroupAssessmentCriterion[] = [];
  const entities = getEntities(payload);

  // Group structure
  criteria.push(
    criterion(
      'entity-master',
      'group_structure',
      'Entity Master created',
      entities.length > 0 ? 'reconciled' : 'missing_information',
      entities.length > 0
        ? `${entities.length} entity record(s) in the canonical Entity Master.`
        : 'No entities recorded in the Entity Master.',
      'group-structure-and-entity-master',
    ),
  );

  const snapshot = payload.groupStructureAndEntityMaster.groupSnapshot;
  criteria.push(
    criterion(
      'parent-identified',
      'group_structure',
      'Parent identified where applicable',
      snapshot.holdingParentCompanyExists === 'yes' && !entities.some((e) => e.classificationBadges.includes('parent'))
        ? 'missing_information'
        : snapshot.holdingParentCompanyExists === 'yes'
          ? 'reconciled'
          : snapshot.holdingParentCompanyExists === ''
            ? 'missing_information'
            : 'not_applicable',
      'Parent/holding company presence should align with Entity Master badges.',
      'group-structure-and-entity-master',
    ),
  );

  criteria.push(
    criterion(
      'subsidiaries-captured',
      'group_structure',
      'Subsidiaries captured',
      snapshot.subsidiariesExist === 'yes' && model.subsidiaryCount === 0
        ? 'missing_information'
        : snapshot.subsidiariesExist === 'yes'
          ? model.subsidiaryCount > 0
            ? 'reconciled'
            : 'missing_information'
          : 'not_applicable',
      'Subsidiary snapshot flag should align with subsidiary entities or classifications.',
      'group-structure-and-entity-master',
    ),
  );

  // Ownership
  const orphanRelationships = payload.ownershipControlAndRelationshipMapping.ownershipRelationships.filter(
    (rel) =>
      (rel.parentPartyEntityId && !getEntityById(payload, rel.parentPartyEntityId)) ||
      (rel.investeeEntityId && !getEntityById(payload, rel.investeeEntityId)),
  );
  criteria.push(
    criterion(
      'ownership-consistency',
      'ownership_control',
      'Ownership relationships internally consistent',
      orphanRelationships.length > 0 ? 'unresolved_relationship' : model.ownershipRelationshipCount > 0 ? 'reconciled' : 'missing_information',
      orphanRelationships.length > 0
        ? `${orphanRelationships.length} relationship(s) reference unknown Entity IDs.`
        : model.ownershipRelationshipCount > 0
          ? 'Ownership relationships reference valid Entity IDs.'
          : 'No ownership relationships recorded.',
      'ownership-control-and-relationship-mapping',
    ),
  );

  // Classifications
  const classificationsWithoutBasis =
    payload.groupCompanyAndMaterialityClassification.entityClassifications.filter(
      (c) => !c.basis.trim(),
    );
  criteria.push(
    criterion(
      'classification-basis',
      'regulatory_classifications',
      'Classifications have stated basis',
      classificationsWithoutBasis.length > 0
        ? 'classification_review_required'
        : payload.groupCompanyAndMaterialityClassification.entityClassifications.length > 0
          ? 'reconciled'
          : 'missing_information',
      classificationsWithoutBasis.length > 0
        ? `${classificationsWithoutBasis.length} classification(s) lack a basis.`
        : 'Classification basis captured where classifications exist.',
      'group-company-and-materiality-classification',
    ),
  );

  const icdrPending = payload.groupCompanyAndMaterialityClassification.icdrGroupCompanyDeterminations.filter(
    (d) => d.classificationState === 'pending_board_determination',
  );
  criteria.push(
    criterion(
      'icdr-board-determination',
      'regulatory_classifications',
      'ICDR Group Company Board determinations',
      icdrPending.length > 0
        ? 'pending_board_determination'
        : model.icdrGroupCompanyCount > 0
          ? 'reconciled'
          : 'missing_information',
      icdrPending.length > 0
        ? `${icdrPending.length} entity(ies) pending Board determination.`
        : 'ICDR Group Company candidates reviewed.',
      'group-company-and-materiality-classification',
    ),
  );

  const policy = payload.groupCompanyAndMaterialityClassification.materialityPolicy;
  criteria.push(
    criterion(
      'materiality-policy',
      'regulatory_classifications',
      'Group Company Materiality Policy captured',
      policy.policyExists === 'yes' && policy.adopted !== 'yes'
        ? 'classification_review_required'
        : policy.policyExists === 'yes'
          ? 'reconciled'
          : 'missing_information',
      policy.policyExists === 'yes'
        ? 'Materiality Policy recorded.'
        : 'Materiality Policy not yet captured.',
      'group-company-and-materiality-classification',
    ),
  );

  // Related parties
  const rpWithoutBasis = payload.relatedPartyUniverseAndClassification.relatedPartyRelationships.filter(
    (rp) => rp.frameworkClassifications.every((fc) => !fc.basisRationale.trim()),
  );
  criteria.push(
    criterion(
      'rp-classification-basis',
      'related_party_completeness',
      'Related-party classifications have rationale',
      rpWithoutBasis.length > 0 ? 'classification_review_required' : model.relatedPartyCount > 0 ? 'reconciled' : 'missing_information',
      rpWithoutBasis.length > 0
        ? `${rpWithoutBasis.length} related-party relationship(s) lack classification rationale.`
        : 'Related-party rationale captured where relationships exist.',
      'related-party-universe-and-classification',
    ),
  );

  if (!linkedReferences.managementGovernance.available) {
    criteria.push(
      criterion(
        'linked-mg',
        'related_party_completeness',
        'Directors/KMP from Management & Governance',
        'pending_linked_workstream',
        'Management & Governance linked data not yet available.',
        'related-party-universe-and-classification',
      ),
    );
  }

  // RPT
  const orphanTransactions =
    payload.relatedPartyTransactionsBalancesAndCommitments.transactions.filter(
      (tx) =>
        tx.relatedPartyRelationshipId &&
        !payload.relatedPartyUniverseAndClassification.relatedPartyRelationships.some(
          (rp) => rp.id === tx.relatedPartyRelationshipId,
        ),
    );
  criteria.push(
    criterion(
      'rpt-linked-parties',
      'rpt_reconciliation',
      'Transactions linked to valid related parties',
      orphanTransactions.length > 0 ? 'unresolved_relationship' : model.rptTransactionCount > 0 ? 'reconciled' : 'missing_information',
      orphanTransactions.length > 0
        ? `${orphanTransactions.length} transaction(s) reference unknown related-party IDs.`
        : 'RPT transactions reference valid related-party relationships.',
      'related-party-transactions-balances-and-commitments',
    ),
  );

  if (model.rptSummary.financialsRevenueDifference) {
    criteria.push(
      criterion(
        'rpt-financials-revenue',
        'rpt_reconciliation',
        'RPT revenue reconciles with Financials',
        'financial_reconciliation_pending',
        `Calculated RPT sales differ from Financials RPT revenue by ${model.rptSummary.financialsRevenueDifference}.`,
        'related-party-transactions-balances-and-commitments',
      ),
    );
  } else if (linkedReferences.financialsKpis.available && model.rptTransactionCount > 0) {
    criteria.push(
      criterion(
        'rpt-financials-revenue',
        'rpt_reconciliation',
        'RPT revenue reconciles with Financials',
        'reconciled',
        'No material revenue reconciliation difference detected.',
        'related-party-transactions-balances-and-commitments',
      ),
    );
  }

  // Common pursuits
  criteria.push(
    criterion(
      'common-pursuits-reviewed',
      'common_pursuits_conflicts',
      'Similar businesses reviewed',
      payload.commonPursuitsDependenciesAndConflicts.commonPursuitScreenings.length > 0
        ? 'reconciled'
        : entities.length > 1
          ? 'missing_information'
          : 'not_applicable',
      'Common-pursuit screening should cover relevant group entities.',
      'common-pursuits-dependencies-and-conflicts',
    ),
  );

  // Group company information
  criteria.push(
    criterion(
      'entity-information-gaps',
      'group_company_information',
      'Group Company information availability',
      model.pendingEntityInformationCount > 0
        ? 'pending_entity_information'
        : model.incompleteInformationCount > 0
          ? 'potential_concern'
          : payload.groupEntityFinancialRegulatoryAndLitigationReadiness.entityFinancialReadiness.length > 0
            ? 'reconciled'
            : 'missing_information',
      model.pendingEntityInformationCount > 0
        ? `${model.pendingEntityInformationCount} entity(ies) with pending/unavailable information.`
        : 'Entity information status captured.',
      'group-entity-financial-regulatory-and-litigation-readiness',
    ),
  );

  if (model.negativeNetWorthCount > 0) {
    criteria.push(
      criterion(
        'negative-net-worth',
        'group_company_information',
        'Negative net-worth entities disclosed',
        'potential_concern',
        `${model.negativeNetWorthCount} entity(ies) flagged with negative net worth.`,
        'group-entity-financial-regulatory-and-litigation-readiness',
      ),
    );
  }

  // Cross-workstream
  if (!linkedReferences.financialsKpis.available) {
    criteria.push(
      criterion(
        'linked-financials',
        'cross_workstream_consistency',
        'Financials & KPIs linked for RPT reconciliation',
        'pending_linked_workstream',
        'Financials & KPIs linked data not yet available.',
        'related-party-transactions-balances-and-commitments',
      ),
    );
  }

  // Final readiness
  const confirmations = payload.changesRptReadinessAndConfirmations.confirmations;
  const unansweredConfirmations = GROUP_ENTITIES_CONFIRMATION_FIELDS.filter(
    (field) => confirmations[field.key] === '',
  ).length;
  criteria.push(
    criterion(
      'issuer-confirmations',
      'final_readiness',
      'Issuer confirmations',
      unansweredConfirmations === 0
        ? 'reconciled'
        : unansweredConfirmations < GROUP_ENTITIES_CONFIRMATION_FIELDS.length
          ? 'missing_information'
          : 'missing_information',
      unansweredConfirmations === 0
        ? 'All issuer confirmations answered.'
        : `${unansweredConfirmations} confirmation(s) still unanswered.`,
      'changes-rpt-readiness-and-confirmations',
    ),
  );

  const rptReadiness = payload.changesRptReadinessAndConfirmations.rptReadiness;
  criteria.push(
    criterion(
      'rpt-readiness',
      'final_readiness',
      'RPT register readiness',
      rptReadiness.completeRptScheduleAvailable === 'yes' ? 'reconciled' : 'missing_information',
      rptReadiness.completeRptScheduleAvailable === 'yes'
        ? 'Complete RPT schedule indicated as available.'
        : 'RPT schedule completeness not yet confirmed.',
      'changes-rpt-readiness-and-confirmations',
    ),
  );

  const counts = {
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    unresolvedRelationship: 0,
    classificationReviewRequired: 0,
    financialReconciliationPending: 0,
    pendingEntityInformation: 0,
    pendingLinkedWorkstream: 0,
    pendingBoardDetermination: 0,
    pendingProfessionalConfirmation: 0,
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
      case 'unresolved_relationship':
        counts.unresolvedRelationship += 1;
        break;
      case 'classification_review_required':
        counts.classificationReviewRequired += 1;
        break;
      case 'financial_reconciliation_pending':
        counts.financialReconciliationPending += 1;
        break;
      case 'pending_entity_information':
        counts.pendingEntityInformation += 1;
        break;
      case 'pending_linked_workstream':
        counts.pendingLinkedWorkstream += 1;
        break;
      case 'pending_board_determination':
        counts.pendingBoardDetermination += 1;
        break;
      case 'pending_professional_confirmation':
        counts.pendingProfessionalConfirmation += 1;
        break;
      case 'not_applicable':
        counts.notApplicable += 1;
        break;
    }
  }

  const groups: GroupAssessmentGroupResult[] = GROUP_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: GROUP_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  }).filter((g) => g.criteria.length > 0);

  const potentialConcerns =
    counts.potentialConcern +
    counts.unresolvedRelationship +
    counts.classificationReviewRequired +
    counts.financialReconciliationPending;

  let result: GroupAssessmentResultState = 'readiness_in_progress';
  if (counts.pendingLinkedWorkstream > 0 && progress.sectionsComplete === 0) {
    result = 'pending_linked_workstream';
  } else if (counts.pendingBoardDetermination > 0 || counts.pendingProfessionalConfirmation > 0) {
    result = 'professional_confirmation_required';
  } else if (counts.pendingEntityInformation > 0) {
    result = 'entity_information_gaps';
  } else if (counts.financialReconciliationPending > 0 || counts.unresolvedRelationship > 0) {
    result = 'rpt_gaps_identified';
  } else if (counts.classificationReviewRequired > 0) {
    result = 'classification_gaps_identified';
  } else if (progress.sectionsComplete === 0) {
    result = 'insufficient_information';
  }

  const resultLabels: Record<GroupAssessmentResultState, string> = {
    insufficient_information: 'Insufficient information',
    readiness_in_progress: 'Disclosure readiness in progress',
    classification_gaps_identified: 'Classification gaps identified',
    rpt_gaps_identified: 'RPT gaps identified',
    entity_information_gaps: 'Entity information gaps identified',
    professional_confirmation_required: 'Professional confirmation required',
    pending_linked_workstream: 'Pending linked workstream data',
  };

  return {
    result,
    resultLabel: resultLabels[result],
    summary:
      'This is a disclosure readiness view derived from the current in-memory draft, not a compliant/non-compliant or investment-quality score. Unanswered questions are treated as missing information.',
    criteria,
    groups,
    counts,
    metrics: {
      entityCount: model.entityCount,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      rptTransactionCount: model.rptTransactionCount,
      pendingBoardDeterminations: model.icdrPendingBoardCount,
      potentialConcerns,
    },
  };
}
