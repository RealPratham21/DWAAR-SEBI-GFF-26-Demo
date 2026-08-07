/**
 * Deterministic Borrowings & Contracts Assessment (BAC1, frontend-only).
 */

import { computeBorrowingsAssetsContractsModel } from '@/lib/borrowings-assets-contracts/compute';
import { getFacilities } from '@/lib/borrowings-assets-contracts/facilities';
import { calculateBorrowingsAssetsContractsProgress } from '@/lib/borrowings-assets-contracts/progress';
import { BAC_CONFIRMATION_FIELDS } from '@/lib/borrowings-assets-contracts/options';
import type { LinkedWorkstreamReferences } from '@/lib/borrowings-assets-contracts/types';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export const BAC_CRITERION_STATES = [
  'reconciled',
  'potential_concern',
  'missing_information',
  'pending_charge_registration',
  'pending_lender_consent',
  'covenant_review_required',
  'financial_reconciliation_pending',
  'title_review_required',
  'contract_review_required',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type BacCriterionState = (typeof BAC_CRITERION_STATES)[number];

export const BAC_ASSESSMENT_GROUPS = [
  'financial_indebtedness',
  'security_and_charges',
  'borrowing_authority',
  'covenants_defaults',
  'ipo_lender_readiness',
  'properties_assets',
  'contracts',
  'cross_workstream_reconciliation',
] as const;

export type BacAssessmentGroup = (typeof BAC_ASSESSMENT_GROUPS)[number];

export const BAC_CRITERION_STATE_LABELS: Record<BacCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  pending_charge_registration: 'Pending charge registration',
  pending_lender_consent: 'Pending lender consent',
  covenant_review_required: 'Covenant review required',
  financial_reconciliation_pending: 'Financial reconciliation pending',
  title_review_required: 'Title review required',
  contract_review_required: 'Contract review required',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const BAC_ASSESSMENT_GROUP_LABELS: Record<BacAssessmentGroup, string> = {
  financial_indebtedness: 'Financial indebtedness',
  security_and_charges: 'Security and charges',
  borrowing_authority: 'Borrowing authority',
  covenants_defaults: 'Covenants/defaults',
  ipo_lender_readiness: 'IPO lender readiness',
  properties_assets: 'Properties/assets',
  contracts: 'Contracts',
  cross_workstream_reconciliation: 'Cross-workstream reconciliation',
};

export const BAC_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'readiness_in_progress',
  'borrowing_gaps_identified',
  'security_charge_gaps_identified',
  'contract_property_gaps_identified',
  'professional_confirmation_required',
  'pending_linked_workstream',
] as const;

export type BacAssessmentResultState = (typeof BAC_ASSESSMENT_RESULT_STATES)[number];

export type BacAssessmentCriterion = {
  id: string;
  group: BacAssessmentGroup;
  label: string;
  state: BacCriterionState;
  reason: string;
  relatedSection: BorrowingsAssetsContractsSectionId;
};

export type BacAssessmentGroupResult = {
  group: BacAssessmentGroup;
  label: string;
  headlineState: BacCriterionState;
  criteria: BacAssessmentCriterion[];
};

export type BacAssessmentResponse = {
  result: BacAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: BacAssessmentCriterion[];
  groups: BacAssessmentGroupResult[];
  counts: Record<
    | 'reconciled'
    | 'potentialConcern'
    | 'missingInformation'
    | 'pendingChargeRegistration'
    | 'pendingLenderConsent'
    | 'covenantReviewRequired'
    | 'financialReconciliationPending'
    | 'titleReviewRequired'
    | 'contractReviewRequired'
    | 'pendingLinkedWorkstream'
    | 'pendingProfessionalConfirmation'
    | 'notApplicable',
    number
  >;
  metrics: {
    facilityCount: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    consentPending: number;
    chargesPendingRegistration: number;
    potentialConcerns: number;
  };
};

function worstState(states: BacCriterionState[]): BacCriterionState {
  const priority: BacCriterionState[] = [
    'potential_concern',
    'pending_charge_registration',
    'pending_lender_consent',
    'covenant_review_required',
    'financial_reconciliation_pending',
    'title_review_required',
    'contract_review_required',
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
  group: BacAssessmentGroup,
  label: string,
  state: BacCriterionState,
  reason: string,
  relatedSection: BorrowingsAssetsContractsSectionId,
): BacAssessmentCriterion {
  return { id, group, label, state, reason, relatedSection };
}

export function assessBorrowingsAssetsContracts(
  payload: BorrowingsAssetsContractsPayload,
  linkedReferences: LinkedWorkstreamReferences,
): BacAssessmentResponse {
  const progress = calculateBorrowingsAssetsContractsProgress(payload);
  const model = computeBorrowingsAssetsContractsModel(payload, linkedReferences);
  const criteria: BacAssessmentCriterion[] = [];
  const facilities = getFacilities(payload);

  // Financial indebtedness
  criteria.push(
    criterion(
      'facilities-identified',
      'financial_indebtedness',
      'Facilities identified',
      facilities.length > 0 ? 'reconciled' : 'missing_information',
      facilities.length > 0
        ? `${facilities.length} facility record(s) in the Facility Master.`
        : 'No facilities recorded in the Facility Master.',
      'financial-indebtedness-and-facility-master',
    ),
  );

  const incompleteFacilities = facilities.filter(
    (f) => !f.lender.lenderName.trim() || !f.sanctionAndUtilisation.principalOutstanding.trim(),
  ).length;
  criteria.push(
    criterion(
      'facility-amounts',
      'financial_indebtedness',
      'Sanctioned/outstanding amounts captured',
      incompleteFacilities === 0 && facilities.length > 0
        ? 'reconciled'
        : facilities.length === 0
          ? 'not_applicable'
          : 'missing_information',
      incompleteFacilities === 0
        ? 'Lender and outstanding amounts captured for all facilities.'
        : `${incompleteFacilities} facility(ies) missing lender or outstanding amounts.`,
      'financial-indebtedness-and-facility-master',
    ),
  );

  if (model.interestVarianceCount > 0) {
    criteria.push(
      criterion(
        'interest-variance',
        'financial_indebtedness',
        'Interest rate variance reviewed',
        'potential_concern',
        `${model.interestVarianceCount} floating-rate facility(ies) show calculated vs entered rate variance.`,
        'financial-indebtedness-and-facility-master',
      ),
    );
  }

  const financialsStatus =
    payload.reconciliationChangesAndIssuerConfirmations.financialsReconciliation
      .reconciliationStatus;
  criteria.push(
    criterion(
      'financials-reconciliation',
      'financial_indebtedness',
      'Financials debt reconciliation',
      !linkedReferences.financialsKpis.available
        ? 'pending_linked_workstream'
        : financialsStatus === 'reconciled'
          ? 'reconciled'
          : financialsStatus === 'potential-inconsistency'
            ? 'financial_reconciliation_pending'
            : financialsStatus === 'pending-professional-confirmation'
              ? 'pending_professional_confirmation'
              : facilities.length > 0
                ? 'financial_reconciliation_pending'
                : 'missing_information',
      model.reconciliation.financials.detail,
      'reconciliation-changes-and-issuer-confirmations',
    ),
  );

  // Security and charges
  const securities = payload.securityChargesGuaranteesAndBorrowingPowers.securities;
  criteria.push(
    criterion(
      'security-linked',
      'security_and_charges',
      'Security linked to facilities',
      securities.length === 0
        ? payload.financialIndebtednessAndFacilityMaster.borrowingSnapshot.securedBorrowingsExist ===
          'yes'
          ? 'missing_information'
          : 'not_applicable'
        : securities.every((s) => s.linkedFacilityId)
          ? 'reconciled'
          : 'missing_information',
      securities.length > 0
        ? `${securities.length} security record(s) captured.`
        : 'No security records captured yet.',
      'security-charges-guarantees-and-borrowing-powers',
    ),
  );

  criteria.push(
    criterion(
      'charge-registration',
      'security_and_charges',
      'RoC charge registration status',
      model.chargesPendingRegistration > 0
        ? 'pending_charge_registration'
        : model.chargeCount > 0
          ? 'reconciled'
          : payload.securityChargesGuaranteesAndBorrowingPowers.charges.length === 0 &&
              payload.financialIndebtednessAndFacilityMaster.borrowingSnapshot
                .securedBorrowingsExist === 'yes'
            ? 'missing_information'
            : 'not_applicable',
      model.chargesPendingRegistration > 0
        ? `${model.chargesPendingRegistration} charge(s) pending registration or professional confirmation.`
        : model.chargeCount > 0
          ? `${model.chargesRegistered} of ${model.chargeCount} charge(s) recorded as registered.`
          : 'No charge records captured.',
      'security-charges-guarantees-and-borrowing-powers',
    ),
  );

  if (model.personalGuaranteeCount + model.corporateGuaranteeCount > 0) {
    criteria.push(
      criterion(
        'guarantees-disclosed',
        'security_and_charges',
        'Guarantees captured',
        'reconciled',
        `${model.personalGuaranteeCount} personal and ${model.corporateGuaranteeCount} corporate/issuer guarantee(s) recorded.`,
        'security-charges-guarantees-and-borrowing-powers',
      ),
    );
  }

  // Borrowing authority
  const powers = payload.securityChargesGuaranteesAndBorrowingPowers.borrowingPowers;
  criteria.push(
    criterion(
      'borrowing-authority',
      'borrowing_authority',
      'Board/shareholder borrowing authority',
      powers.authorityState === 'potential-concern'
        ? 'potential_concern'
        : powers.authorityState === 'pending-professional-confirmation'
          ? 'pending_professional_confirmation'
          : powers.boardBorrowingResolutionExists === 'yes' ||
              powers.shareholderBorrowingApprovalExists === 'yes'
            ? 'reconciled'
            : powers.boardBorrowingResolutionExists === ''
              ? 'missing_information'
              : 'not_applicable',
      powers.authorityState
        ? `Borrowing authority state: ${powers.authorityState.replaceAll('-', ' ')}.`
        : 'Borrowing powers/resolutions not yet captured.',
      'security-charges-guarantees-and-borrowing-powers',
    ),
  );

  // Covenants/defaults
  criteria.push(
    criterion(
      'financial-covenants',
      'covenants_defaults',
      'Financial covenants captured',
      model.financialCovenantCount > 0
        ? model.covenantsRequiringReview > 0
          ? 'covenant_review_required'
          : 'reconciled'
        : payload.covenantsDefaultsWaiversAndLenderConsents.covenants.length > 0
          ? 'reconciled'
          : 'missing_information',
      model.covenantsRequiringReview > 0
        ? `${model.covenantsRequiringReview} financial covenant(s) require review.`
        : `${model.financialCovenantCount} financial covenant(s) captured.`,
      'covenants-defaults-waivers-and-lender-consents',
    ),
  );

  if (model.recordedBreaches > 0) {
    criteria.push(
      criterion(
        'defaults-breaches',
        'covenants_defaults',
        'Defaults/delays disclosed',
        model.waiversPending > 0 ? 'covenant_review_required' : 'reconciled',
        `${model.recordedBreaches} default/delay event(s) recorded; ${model.waiversPending} waiver(s) pending.`,
        'covenants-defaults-waivers-and-lender-consents',
      ),
    );
  }

  // IPO lender readiness
  criteria.push(
    criterion(
      'lender-consents',
      'ipo_lender_readiness',
      'IPO/change-of-control lender consents',
      model.consentCounts.consentPending > 0
        ? 'pending_lender_consent'
        : model.consentCounts.consentRequired > 0
          ? 'reconciled'
          : model.consentCounts.facilitiesReviewed > 0
            ? 'reconciled'
            : 'missing_information',
      model.consentCounts.consentPending > 0
        ? `${model.consentCounts.consentPending} required consent(s) still pending.`
        : `${model.consentCounts.consentReceived} of ${model.consentCounts.consentRequired} required consent(s) received.`,
      'covenants-defaults-waivers-and-lender-consents',
    ),
  );

  const objectsUnresolved = model.reconciliation.objects.unresolvedCount;
  criteria.push(
    criterion(
      'objects-repayment',
      'ipo_lender_readiness',
      'Objects debt repayment reconciliation',
      !linkedReferences.objectsOfIssue.available && model.reconciliation.objects.repaymentItemCount > 0
        ? 'pending_linked_workstream'
        : objectsUnresolved > 0
          ? 'potential_concern'
          : model.reconciliation.objects.repaymentItemCount > 0
            ? 'reconciled'
            : 'not_applicable',
      model.reconciliation.objects.detail,
      'reconciliation-changes-and-issuer-confirmations',
    ),
  );

  // Properties/assets
  criteria.push(
    criterion(
      'properties-captured',
      'properties_assets',
      'Material properties captured',
      model.propertyCount > 0 ? 'reconciled' : 'missing_information',
      model.propertyCount > 0
        ? `${model.propertyCount} property record(s) (${model.ownedPropertyCount} owned, ${model.leasedPropertyCount} leased/licensed).`
        : 'No properties recorded in the Property Master.',
      'immovable-properties-and-occupancy-rights',
    ),
  );

  if (model.titleOccupancyReviewItems > 0) {
    criteria.push(
      criterion(
        'title-occupancy-issues',
        'properties_assets',
        'Title/occupancy issues reviewed',
        'title_review_required',
        `${model.titleOccupancyReviewItems} title/occupancy issue(s) recorded for review.`,
        'immovable-properties-and-occupancy-rights',
      ),
    );
  }

  criteria.push(
    criterion(
      'material-assets',
      'properties_assets',
      'Material assets and encumbrance',
      model.materialAssetCount > 0 ? 'reconciled' : 'not_applicable',
      model.materialAssetCount > 0
        ? `${model.materialAssetCount} material asset(s); ${model.encumberedMaterialAssetCount} encumbered.`
        : 'No material assets recorded yet.',
      'material-assets-encumbrance-and-insurance-linkage',
    ),
  );

  // Contracts
  criteria.push(
    criterion(
      'material-contracts',
      'contracts',
      'Material contracts identified',
      model.contractCount > 0 ? 'reconciled' : 'missing_information',
      model.contractCount > 0
        ? `${model.contractCount} contract(s) in the Contract Master.`
        : 'No material contracts recorded yet.',
      'material-business-strategic-and-other-contracts',
    ),
  );

  if (model.materialContractReviewItems > 0) {
    criteria.push(
      criterion(
        'contract-review',
        'contracts',
        'Contract materiality/breach review',
        'contract_review_required',
        `${model.materialContractReviewItems} contract review item(s) flagged.`,
        'contract-materiality-expiry-and-inspection-readiness',
      ),
    );
  }

  if (model.contractsExpiringWithin12Months.length > 0) {
    criteria.push(
      criterion(
        'contract-expiry',
        'contracts',
        'Contracts expiring within 12 months',
        'contract_review_required',
        `${model.contractsExpiringWithin12Months.length} contract(s) expiring within 12 months.`,
        'contract-materiality-expiry-and-inspection-readiness',
      ),
    );
  }

  // Cross-workstream reconciliation
  const linkedChecks: Array<{
    id: string;
    label: string;
    available: boolean;
    status: string;
    section: BorrowingsAssetsContractsSectionId;
  }> = [
    {
      id: 'linked-group-entities',
      label: 'Group Entities reconciliation',
      available: linkedReferences.groupEntities.available,
      status: model.reconciliation.groupEntities.status,
      section: 'reconciliation-changes-and-issuer-confirmations',
    },
    {
      id: 'linked-capital',
      label: 'Capital & Ownership reconciliation',
      available: linkedReferences.capitalOwnership.available,
      status: model.reconciliation.capitalOwnership.status,
      section: 'reconciliation-changes-and-issuer-confirmations',
    },
    {
      id: 'linked-business',
      label: 'Business & Operations reconciliation',
      available: linkedReferences.businessOperations.available,
      status: model.reconciliation.businessOperations.status,
      section: 'reconciliation-changes-and-issuer-confirmations',
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
                : 'missing_information',
        check.available
          ? `${check.label}: ${check.status}.`
          : `${check.label} linked data not yet available.`,
        check.section,
      ),
    );
  }

  const confirmations = payload.reconciliationChangesAndIssuerConfirmations.confirmations;
  const unansweredConfirmations = BAC_CONFIRMATION_FIELDS.filter(
    (field) => confirmations[field.key] === '',
  ).length;
  criteria.push(
    criterion(
      'issuer-confirmations',
      'cross_workstream_reconciliation',
      'Issuer confirmations',
      unansweredConfirmations === 0
        ? 'reconciled'
        : 'missing_information',
      unansweredConfirmations === 0
        ? 'All issuer confirmations answered.'
        : `${unansweredConfirmations} confirmation(s) still unanswered.`,
      'reconciliation-changes-and-issuer-confirmations',
    ),
  );

  const counts = {
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    pendingChargeRegistration: 0,
    pendingLenderConsent: 0,
    covenantReviewRequired: 0,
    financialReconciliationPending: 0,
    titleReviewRequired: 0,
    contractReviewRequired: 0,
    pendingLinkedWorkstream: 0,
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
      case 'pending_charge_registration':
        counts.pendingChargeRegistration += 1;
        break;
      case 'pending_lender_consent':
        counts.pendingLenderConsent += 1;
        break;
      case 'covenant_review_required':
        counts.covenantReviewRequired += 1;
        break;
      case 'financial_reconciliation_pending':
        counts.financialReconciliationPending += 1;
        break;
      case 'title_review_required':
        counts.titleReviewRequired += 1;
        break;
      case 'contract_review_required':
        counts.contractReviewRequired += 1;
        break;
      case 'pending_linked_workstream':
        counts.pendingLinkedWorkstream += 1;
        break;
      case 'pending_professional_confirmation':
        counts.pendingProfessionalConfirmation += 1;
        break;
      case 'not_applicable':
        counts.notApplicable += 1;
        break;
    }
  }

  const groups: BacAssessmentGroupResult[] = BAC_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((c) => c.group === group);
    return {
      group,
      label: BAC_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((c) => c.state)),
      criteria: groupCriteria,
    };
  }).filter((g) => g.criteria.length > 0);

  const potentialConcerns =
    counts.potentialConcern +
    counts.pendingChargeRegistration +
    counts.covenantReviewRequired +
    counts.titleReviewRequired +
    counts.contractReviewRequired;

  let result: BacAssessmentResultState = 'readiness_in_progress';
  if (counts.pendingLinkedWorkstream > 0 && progress.sectionsComplete === 0) {
    result = 'pending_linked_workstream';
  } else if (
    counts.pendingProfessionalConfirmation > 0 ||
    counts.pendingLenderConsent > 0
  ) {
    result = 'professional_confirmation_required';
  } else if (
    counts.contractReviewRequired > 0 ||
    counts.titleReviewRequired > 0
  ) {
    result = 'contract_property_gaps_identified';
  } else if (
    counts.pendingChargeRegistration > 0 ||
    counts.financialReconciliationPending > 0
  ) {
    result = 'security_charge_gaps_identified';
  } else if (counts.missingInformation > 0 && facilities.length === 0) {
    result = 'insufficient_information';
  } else if (counts.potentialConcern > 0 || counts.financialReconciliationPending > 0) {
    result = 'borrowing_gaps_identified';
  } else if (progress.sectionsComplete === 0) {
    result = 'insufficient_information';
  }

  const resultLabels: Record<BacAssessmentResultState, string> = {
    insufficient_information: 'Insufficient information',
    readiness_in_progress: 'Disclosure readiness in progress',
    borrowing_gaps_identified: 'Borrowing gaps identified',
    security_charge_gaps_identified: 'Security/charge gaps identified',
    contract_property_gaps_identified: 'Contract/property gaps identified',
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
      facilityCount: model.facilityCount,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      consentPending: model.consentCounts.consentPending,
      chargesPendingRegistration: model.chargesPendingRegistration,
      potentialConcerns,
    },
  };
}
