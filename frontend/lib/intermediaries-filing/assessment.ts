/**
 * Deterministic Filing Readiness assessment (IF1, frontend-only).
 *
 * Process-focused: never returns IPO approved, safe to launch or regulator cleared.
 */

import {
  computeIntermediariesFilingModel,
} from '@/lib/intermediaries-filing/compute';
import { getFilings } from '@/lib/intermediaries-filing/filings';
import { getLeadManagers, getIntermediaries } from '@/lib/intermediaries-filing/intermediaries';
import { calculateIntermediariesFilingProgress } from '@/lib/intermediaries-filing/progress';
import { IF_CONFIRMATION_FIELDS } from '@/lib/intermediaries-filing/options';
import { isStageAtLeast } from '@/lib/intermediaries-filing/rules';
import type { LinkedWorkstreamReferences } from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

export const IF_CRITERION_STATES = [
  'ready',
  'potential_concern',
  'missing_information',
  'appointment_pending',
  'agreement_pending',
  'certificate_pending',
  'consent_pending',
  'exchange_query_pending',
  'filing_pending',
  'approval_pending',
  'underwriting_pending',
  'market_making_pending',
  'issue_infrastructure_pending',
  'listing_action_pending',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'not_applicable',
  'not_yet_due',
] as const;

export type IfCriterionState = (typeof IF_CRITERION_STATES)[number];

export const IF_ASSESSMENT_GROUPS = [
  'intermediary_readiness',
  'issue_configuration',
  'filing_readiness',
  'due_diligence_signoffs',
  'issue_infrastructure',
  'underwriting_market_making',
  'issue_listing_programme',
  'final_offer_document_readiness',
] as const;

export type IfAssessmentGroup = (typeof IF_ASSESSMENT_GROUPS)[number];

export const IF_CRITERION_STATE_LABELS: Record<IfCriterionState, string> = {
  ready: 'Ready',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  appointment_pending: 'Appointment pending',
  agreement_pending: 'Agreement pending',
  certificate_pending: 'Certificate pending',
  consent_pending: 'Consent pending',
  exchange_query_pending: 'Exchange query pending',
  filing_pending: 'Filing pending',
  approval_pending: 'Approval pending',
  underwriting_pending: 'Underwriting pending',
  market_making_pending: 'Market making pending',
  issue_infrastructure_pending: 'Issue infrastructure pending',
  listing_action_pending: 'Listing action pending',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
  not_yet_due: 'Not yet due',
};

export const IF_ASSESSMENT_GROUP_LABELS: Record<IfAssessmentGroup, string> = {
  intermediary_readiness: 'Intermediary readiness',
  issue_configuration: 'Issue configuration',
  filing_readiness: 'Filing readiness',
  due_diligence_signoffs: 'Due diligence & sign-offs',
  issue_infrastructure: 'Issue infrastructure',
  underwriting_market_making: 'Underwriting & Market Making',
  issue_listing_programme: 'Issue / listing programme',
  final_offer_document_readiness: 'Final offer-document readiness',
};

export const IF_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'preparation_in_progress',
  'intermediary_actions_pending',
  'due_diligence_pending',
  'exchange_review_in_progress',
  'filing_actions_pending',
  'issue_infrastructure_pending',
  'underwriting_or_market_making_pending',
  'pre_issue_readiness',
  'issue_execution_in_progress',
  'listing_actions_pending',
  'broadly_ready_for_current_stage',
  'professional_confirmation_required',
] as const;

export type IfAssessmentResultState = (typeof IF_ASSESSMENT_RESULT_STATES)[number];

export type IfAssessmentCriterion = {
  id: string;
  group: IfAssessmentGroup;
  label: string;
  state: IfCriterionState;
  reason: string;
  relatedSection: IntermediariesFilingSectionId;
};

export type IfAssessmentGroupResult = {
  group: IfAssessmentGroup;
  label: string;
  headlineState: IfCriterionState;
  criteria: IfAssessmentCriterion[];
};

export type IfAssessmentResponse = {
  result: IfAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: IfAssessmentCriterion[];
  groups: IfAssessmentGroupResult[];
  counts: Record<
    | 'ready'
    | 'potentialConcern'
    | 'missingInformation'
    | 'appointmentPending'
    | 'agreementPending'
    | 'certificatePending'
    | 'consentPending'
    | 'exchangeQueryPending'
    | 'filingPending'
    | 'approvalPending'
    | 'underwritingPending'
    | 'marketMakingPending'
    | 'issueInfrastructurePending'
    | 'listingActionPending'
    | 'pendingLinkedWorkstream'
    | 'pendingProfessionalConfirmation'
    | 'notApplicable'
    | 'notYetDue',
    number
  >;
  metrics: {
    intermediaryCount: number;
    filingCount: number;
    openQueryCount: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    reconciliationMismatchCount: number;
    potentialConcerns: number;
  };
  rulesVersion?: string;
  rulesAsOf?: string;
};

function worstState(states: IfCriterionState[]): IfCriterionState {
  const priority: IfCriterionState[] = [
    'potential_concern',
    'exchange_query_pending',
    'underwriting_pending',
    'market_making_pending',
    'issue_infrastructure_pending',
    'listing_action_pending',
    'approval_pending',
    'certificate_pending',
    'consent_pending',
    'agreement_pending',
    'appointment_pending',
    'filing_pending',
    'pending_linked_workstream',
    'pending_professional_confirmation',
    'missing_information',
    'ready',
    'not_yet_due',
    'not_applicable',
  ];
  for (const state of priority) {
    if (states.includes(state)) return state;
  }
  return 'missing_information';
}

function criterion(
  id: string,
  group: IfAssessmentGroup,
  label: string,
  state: IfCriterionState,
  reason: string,
  relatedSection: IntermediariesFilingSectionId,
): IfAssessmentCriterion {
  return { id, group, label, state, reason, relatedSection };
}

function filled(value: string): boolean {
  return value.trim().length > 0;
}

export function assessIntermediariesFiling(
  payload: IntermediariesFilingPayload,
  linkedReferences: LinkedWorkstreamReferences,
): IfAssessmentResponse {
  const progress = calculateIntermediariesFilingProgress(payload);
  const model = computeIntermediariesFilingModel(payload, linkedReferences);
  const criteria: IfAssessmentCriterion[] = [];
  const snapshot = payload.issueTeamAndIntermediaryMaster.issueTeamSnapshot;
  const stage = progress.currentFilingStage;
  const filings = getFilings(payload);
  const leadManagers = getLeadManagers(payload);

  // 1. Intermediary readiness
  criteria.push(
    criterion(
      'lead-manager',
      'intermediary_readiness',
      'Lead Manager appointed',
      leadManagers.length > 0 || snapshot.leadManagerAppointed === 'no'
        ? leadManagers.length > 0
          ? 'ready'
          : snapshot.leadManagerAppointed === 'no'
            ? 'not_applicable'
            : 'missing_information'
        : snapshot.leadManagerAppointed === 'yes'
          ? 'appointment_pending'
          : 'missing_information',
      leadManagers.length > 0
        ? `${leadManagers.length} Lead Manager record(s) in Intermediary Master.`
        : 'Lead Manager appointment not yet reflected in Intermediary Master.',
      'issue-team-and-intermediary-master',
    ),
  );

  criteria.push(
    criterion(
      'registrar',
      'intermediary_readiness',
      'Registrar appointed',
      getIntermediaries(payload).some((intermediary) =>
        intermediary.roles.includes('registrar_to_issue'),
      )
        ? 'ready'
        : snapshot.registrarAppointed === 'yes'
          ? 'appointment_pending'
          : snapshot.registrarAppointed === 'no'
            ? 'not_applicable'
            : 'missing_information',
      'Registrar appointment status reviewed against Intermediary Master.',
      'issue-team-and-intermediary-master',
    ),
  );

  if (model.intermediaryAggregates.agreementPendingCount > 0) {
    criteria.push(
      criterion(
        'intermediary-agreements',
        'intermediary_readiness',
        'Intermediary agreements pending',
        'agreement_pending',
        `${model.intermediaryAggregates.agreementPendingCount} intermediary appointment(s) with agreement pending.`,
        'issue-team-and-intermediary-master',
      ),
    );
  }

  if (leadManagers.length > 1) {
    const interSe = payload.issueTeamAndIntermediaryMaster.interSeAgreement;
    criteria.push(
      criterion(
        'inter-se-agreement',
        'intermediary_readiness',
        'Inter-se agreement and responsibilities',
        interSe.interSeAgreementExecuted === 'yes' ? 'ready' : 'agreement_pending',
        interSe.interSeAgreementExecuted
          ? `Inter-se agreement executed: ${interSe.interSeAgreementExecuted}.`
          : 'Multiple Lead Managers recorded; inter-se agreement/responsibilities require review.',
        'issue-team-and-intermediary-master',
      ),
    );
  }

  // 2. Issue configuration
  criteria.push(
    criterion(
      'ipo-setup-reconciliation',
      'issue_configuration',
      'IPO Setup reconciliation',
      !linkedReferences.ipoSetup.available
        ? 'pending_linked_workstream'
        : model.reconciliation.ipoSetup.mismatchCount > 0
          ? 'potential_concern'
          : 'ready',
      linkedReferences.ipoSetup.available
        ? `${model.reconciliation.ipoSetup.status}: ${model.reconciliation.ipoSetup.detail}`
        : 'IPO Setup linked data not yet available.',
      'issue-configuration-and-filing-snapshot',
    ),
  );

  criteria.push(
    criterion(
      'capital-reconciliation',
      'issue_configuration',
      'Capital reconciliation',
      !linkedReferences.capitalOwnership.available
        ? 'pending_linked_workstream'
        : model.reconciliation.capitalOwnership.mismatchCount > 0
          ? 'potential_concern'
          : 'ready',
      linkedReferences.capitalOwnership.available
        ? `${model.reconciliation.capitalOwnership.status}: ${model.reconciliation.capitalOwnership.detail}`
        : 'Capital & Ownership linked data not yet available.',
      'issue-configuration-and-filing-snapshot',
    ),
  );

  // 3. Filing readiness
  criteria.push(
    criterion(
      'authoritative-document',
      'filing_readiness',
      'Current authoritative document version',
      model.finalDocumentAggregates.authoritativeVersionConflict
        ? 'potential_concern'
        : model.finalDocumentAggregates.authoritativeVersionLabel
          ? 'ready'
          : 'filing_pending',
      model.finalDocumentAggregates.authoritativeVersionConflict
        ? 'More than one document version marked as current authoritative.'
        : model.finalDocumentAggregates.authoritativeVersionLabel
          ? `Authoritative version: ${model.finalDocumentAggregates.authoritativeVersionLabel}.`
          : 'No authoritative offer-document version marked yet.',
      'filing-and-regulatory-milestone-tracker',
    ),
  );

  if (model.filingAggregates.openQueryCount > 0) {
    criteria.push(
      criterion(
        'open-exchange-queries',
        'filing_readiness',
        'Open Exchange queries',
        'exchange_query_pending',
        `${model.filingAggregates.openQueryCount} open Exchange query round(s); ${model.filingAggregates.overdueQueryCount} overdue.`,
        'filing-and-regulatory-milestone-tracker',
      ),
    );
  }

  if (filings.length === 0 && isStageAtLeast(stage, 'exchange_draft_filing')) {
    criteria.push(
      criterion(
        'filing-records',
        'filing_readiness',
        'Filing records captured',
        'filing_pending',
        'Filing stage indicates Exchange filing activity but no Filing records captured.',
        'filing-and-regulatory-milestone-tracker',
      ),
    );
  }

  const inPrinciple = payload.filingAndRegulatoryMilestoneTracker.inPrincipleApproval;
  if (inPrinciple.applied === 'yes' && inPrinciple.approvalReceived !== 'yes') {
    criteria.push(
      criterion(
        'in-principle-approval',
        'filing_readiness',
        'In-principle approval',
        'approval_pending',
        'In-principle approval applied but approval not yet recorded as received.',
        'filing-and-regulatory-milestone-tracker',
      ),
    );
  }

  // 4. Due diligence & sign-offs
  criteria.push(
    criterion(
      'dd-areas',
      'due_diligence_signoffs',
      'Due-diligence area tracker',
      model.dueDiligenceAggregates.areaCount > 0 ? 'ready' : 'missing_information',
      model.dueDiligenceAggregates.areaCount > 0
        ? `${model.dueDiligenceAggregates.areaCount} DD area(s); ${model.dueDiligenceAggregates.signedOffCount} signed off.`
        : 'No due-diligence areas captured yet.',
      'due-diligence-certificates-consents-and-signoffs',
    ),
  );

  if (model.certificateConsentAggregates.certificatesPending > 0) {
    criteria.push(
      criterion(
        'certificates-pending',
        'due_diligence_signoffs',
        'Certificates pending',
        'certificate_pending',
        `${model.certificateConsentAggregates.certificatesPending} certificate(s) not yet final/signed.`,
        'due-diligence-certificates-consents-and-signoffs',
      ),
    );
  }

  if (model.certificateConsentAggregates.consentCount > 0) {
    const pendingConsents =
      model.certificateConsentAggregates.consentCount -
      model.certificateConsentAggregates.consentsReceived;
    if (pendingConsents > 0) {
      criteria.push(
        criterion(
          'consents-pending',
          'due_diligence_signoffs',
          'Consents pending',
          'consent_pending',
          `${pendingConsents} consent(s) not yet received.`,
          'due-diligence-certificates-consents-and-signoffs',
        ),
      );
    }
  }

  if (model.dueDiligenceAggregates.unresolvedMaterialCount > 0) {
    criteria.push(
      criterion(
        'dd-unresolved',
        'due_diligence_signoffs',
        'Unresolved material DD issues',
        'potential_concern',
        `${model.dueDiligenceAggregates.unresolvedMaterialCount} DD area(s) with material unresolved issues.`,
        'due-diligence-certificates-consents-and-signoffs',
      ),
    );
  }

  // 5. Issue infrastructure
  criteria.push(
    criterion(
      'isin-readiness',
      'issue_infrastructure',
      'ISIN readiness',
      payload.depositoriesBankingAsbaUpiAndIssueInfrastructure.depositoryReadiness.isinStatus ===
      'active'
        ? 'ready'
        : 'issue_infrastructure_pending',
      `ISIN status: ${model.infrastructureAggregates.isinStatus || 'not captured'}.`,
      'depositories-banking-asba-upi-and-issue-infrastructure',
    ),
  );

  if (!model.infrastructureAggregates.sponsorBankReady) {
    criteria.push(
      criterion(
        'sponsor-bank',
        'issue_infrastructure',
        'Sponsor Bank readiness',
        payload.depositoriesBankingAsbaUpiAndIssueInfrastructure.sponsorBankUpiReadiness
          .sponsorBankAppointed === 'no'
          ? 'not_applicable'
          : 'issue_infrastructure_pending',
      'Sponsor Bank appointment/agreement readiness requires review.',
        'depositories-banking-asba-upi-and-issue-infrastructure',
      ),
    );
  }

  // 6. Underwriting & Market Making
  if (model.underwritingAggregates.coverageComparison === 'below_threshold') {
    criteria.push(
      criterion(
        'underwriting-coverage',
        'underwriting_market_making',
        'Underwriting coverage',
        'underwriting_pending',
        `Underwriting coverage ${model.underwritingAggregates.totalUnderwritingPercentage || '—'}% below applicable SME preview threshold.`,
        'underwriting-market-making-and-distribution-arrangements',
      ),
    );
  }

  if (model.underwritingAggregates.ownAccountComparison === 'below_threshold') {
    criteria.push(
      criterion(
        'merchant-banker-own-account',
        'underwriting_market_making',
        'Merchant banker own-account commitment',
        'underwriting_pending',
        `Own-account ${model.underwritingAggregates.ownAccountPercentage || '—'}% below preview minimum threshold.`,
        'underwriting-market-making-and-distribution-arrangements',
      ),
    );
  }

  if (model.underwritingAggregates.overlappingCommitmentWarning) {
    criteria.push(
      criterion(
        'duplicate-underwriting',
        'underwriting_market_making',
        'Duplicate underwriting commitments',
        'potential_concern',
        'Potential overlapping underwriting commitment entries detected.',
        'underwriting-market-making-and-distribution-arrangements',
      ),
    );
  }

  if (
    snapshot.marketMakerAppointed === 'yes' &&
    !model.marketMakingAggregates.marketMakerAppointed
  ) {
    criteria.push(
      criterion(
        'market-maker',
        'underwriting_market_making',
        'Market Maker appointed',
        'market_making_pending',
        'Market Maker indicated in issue team snapshot but not linked in configuration.',
        'underwriting-market-making-and-distribution-arrangements',
      ),
    );
  }

  // 7. Issue / listing programme (stage-aware)
  if (!isStageAtLeast(stage, 'issue_closed')) {
    criteria.push(
      criterion(
        'basis-of-allotment',
        'issue_listing_programme',
        'Basis of Allotment',
        'not_yet_due',
        'Issue not yet closed; Basis of Allotment is not yet due at current filing stage.',
        'issue-programme-allotment-listing-and-post-issue-execution',
      ),
    );
    criteria.push(
      criterion(
        'listing-application',
        'issue_listing_programme',
        'Listing application',
        'not_yet_due',
        'Listing application actions are not yet due at current filing stage.',
        'issue-programme-allotment-listing-and-post-issue-execution',
      ),
    );
  } else {
    const basis = payload.issueProgrammeAllotmentListingAndPostIssueExecution.basisOfAllotment;
    criteria.push(
      criterion(
        'basis-of-allotment',
        'issue_listing_programme',
        'Basis of Allotment',
        basis.allotmentFinalized === 'yes' ? 'ready' : 'listing_action_pending',
        basis.allotmentFinalized === 'yes'
          ? 'Allotment finalized.'
          : 'Basis of Allotment/allotment actions pending after issue close.',
        'issue-programme-allotment-listing-and-post-issue-execution',
      ),
    );
  }

  if (filled(model.programmeAggregates.issueClosingDate)) {
    criteria.push(
      criterion(
        'preliminary-t3',
        'issue_listing_programme',
        'Preliminary T+3 schedule',
        'ready',
        `Preliminary T+3 listing date: ${model.programmeAggregates.preliminaryTPlus3ListingDate || '—'} (working-day estimate).`,
        'issue-programme-allotment-listing-and-post-issue-execution',
      ),
    );
  }

  // 8. Final offer-document readiness
  if (model.finalDocumentAggregates.openPlaceholderCount > 0) {
    criteria.push(
      criterion(
        'open-placeholders',
        'final_offer_document_readiness',
        'Unresolved placeholders',
        'potential_concern',
        `${model.finalDocumentAggregates.openPlaceholderCount} open placeholder(s) in register.`,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
      ),
    );
  }

  if (model.finalDocumentAggregates.inspectionItemsPending > 0) {
    criteria.push(
      criterion(
        'inspection-items',
        'final_offer_document_readiness',
        'Inspection items pending review',
        'missing_information',
        `${model.finalDocumentAggregates.inspectionItemsPending} inspection item(s) pending review.`,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
      ),
    );
  }

  const confirmations =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
      .finalConfirmations;
  const unansweredConfirmations = IF_CONFIRMATION_FIELDS.filter(
    (field) => confirmations[field.key] === '',
  ).length;
  criteria.push(
    criterion(
      'issuer-confirmations',
      'final_offer_document_readiness',
      'Final issuer confirmations',
      unansweredConfirmations === 0 ? 'ready' : 'missing_information',
      unansweredConfirmations === 0
        ? 'All final issuer confirmations answered.'
        : `${unansweredConfirmations} final confirmation(s) still unanswered.`,
      'final-offer-document-advertisements-material-documents-and-filing-readiness',
    ),
  );

  // Cross-workstream linked checks
  const linkedChecks: Array<{
    id: string;
    group: IfAssessmentGroup;
    label: string;
    available: boolean;
    mismatchCount: number;
    status: string;
    section: IntermediariesFilingSectionId;
  }> = [
    {
      id: 'linked-objects',
      group: 'issue_configuration',
      label: 'Objects reconciliation',
      available: linkedReferences.objectsOfIssue.available,
      mismatchCount: model.reconciliation.objectsOfIssue.mismatchCount,
      status: model.reconciliation.objectsOfIssue.status,
      section: 'issue-configuration-and-filing-snapshot',
    },
    {
      id: 'linked-financials',
      group: 'due_diligence_signoffs',
      label: 'Financials reconciliation',
      available: linkedReferences.financialsKpis.available,
      mismatchCount: model.reconciliation.financialsKpis.mismatchCount,
      status: model.reconciliation.financialsKpis.status,
      section: 'due-diligence-certificates-consents-and-signoffs',
    },
    {
      id: 'linked-lac',
      group: 'filing_readiness',
      label: 'LAC filing cut-off',
      available: linkedReferences.litigationApprovalsCompliance.available,
      mismatchCount: model.reconciliation.litigationApprovalsCompliance.mismatchCount,
      status: model.reconciliation.litigationApprovalsCompliance.status,
      section: 'filing-and-regulatory-milestone-tracker',
    },
    {
      id: 'linked-bac',
      group: 'final_offer_document_readiness',
      label: 'BAC inspection reconciliation',
      available: linkedReferences.borrowingsAssetsContracts.available,
      mismatchCount: model.reconciliation.borrowingsAssetsContracts.mismatchCount,
      status: model.reconciliation.borrowingsAssetsContracts.status,
      section: 'final-offer-document-advertisements-material-documents-and-filing-readiness',
    },
  ];

  for (const check of linkedChecks) {
    criteria.push(
      criterion(
        check.id,
        check.group,
        check.label,
        !check.available
          ? 'pending_linked_workstream'
          : check.mismatchCount > 0
            ? 'potential_concern'
            : check.status === 'Reconciled'
              ? 'ready'
              : 'pending_professional_confirmation',
        check.available
          ? `${check.label}: ${check.status}.`
          : `${check.label} linked data not yet available.`,
        check.section,
      ),
    );
  }

  const counts = {
    ready: 0,
    potentialConcern: 0,
    missingInformation: 0,
    appointmentPending: 0,
    agreementPending: 0,
    certificatePending: 0,
    consentPending: 0,
    exchangeQueryPending: 0,
    filingPending: 0,
    approvalPending: 0,
    underwritingPending: 0,
    marketMakingPending: 0,
    issueInfrastructurePending: 0,
    listingActionPending: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
    notYetDue: 0,
  };

  for (const entry of criteria) {
    switch (entry.state) {
      case 'ready':
        counts.ready += 1;
        break;
      case 'potential_concern':
        counts.potentialConcern += 1;
        break;
      case 'missing_information':
        counts.missingInformation += 1;
        break;
      case 'appointment_pending':
        counts.appointmentPending += 1;
        break;
      case 'agreement_pending':
        counts.agreementPending += 1;
        break;
      case 'certificate_pending':
        counts.certificatePending += 1;
        break;
      case 'consent_pending':
        counts.consentPending += 1;
        break;
      case 'exchange_query_pending':
        counts.exchangeQueryPending += 1;
        break;
      case 'filing_pending':
        counts.filingPending += 1;
        break;
      case 'approval_pending':
        counts.approvalPending += 1;
        break;
      case 'underwriting_pending':
        counts.underwritingPending += 1;
        break;
      case 'market_making_pending':
        counts.marketMakingPending += 1;
        break;
      case 'issue_infrastructure_pending':
        counts.issueInfrastructurePending += 1;
        break;
      case 'listing_action_pending':
        counts.listingActionPending += 1;
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
      case 'not_yet_due':
        counts.notYetDue += 1;
        break;
    }
  }

  const groups: IfAssessmentGroupResult[] = IF_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((entry) => entry.group === group);
    return {
      group,
      label: IF_ASSESSMENT_GROUP_LABELS[group],
      headlineState: worstState(groupCriteria.map((entry) => entry.state)),
      criteria: groupCriteria,
    };
  }).filter((group) => group.criteria.length > 0);

  const potentialConcerns =
    counts.potentialConcern +
    counts.exchangeQueryPending +
    counts.underwritingPending +
    counts.marketMakingPending;

  let result: IfAssessmentResultState = 'broadly_ready_for_current_stage';
  if (counts.pendingLinkedWorkstream > 0 && progress.sectionsComplete === 0) {
    result = 'insufficient_information';
  } else if (counts.pendingProfessionalConfirmation > 0) {
    result = 'professional_confirmation_required';
  } else if (counts.exchangeQueryPending > 0) {
    result = 'exchange_review_in_progress';
  } else if (counts.appointmentPending > 0 || counts.agreementPending > 0) {
    result = 'intermediary_actions_pending';
  } else if (
    counts.certificatePending > 0 ||
    counts.consentPending > 0 ||
    model.dueDiligenceAggregates.unresolvedMaterialCount > 0
  ) {
    result = 'due_diligence_pending';
  } else if (counts.filingPending > 0 || counts.approvalPending > 0) {
    result = 'filing_actions_pending';
  } else if (counts.issueInfrastructurePending > 0) {
    result = 'issue_infrastructure_pending';
  } else if (counts.underwritingPending > 0 || counts.marketMakingPending > 0) {
    result = 'underwriting_or_market_making_pending';
  } else if (isStageAtLeast(stage, 'issue_open') && !isStageAtLeast(stage, 'listed')) {
    result = 'issue_execution_in_progress';
  } else if (counts.listingActionPending > 0) {
    result = 'listing_actions_pending';
  } else if (progress.sectionsComplete === 0) {
    result = 'insufficient_information';
  } else if (progress.overallStatus === 'in_progress') {
    result = 'preparation_in_progress';
  } else if (isStageAtLeast(stage, 'pre_issue_filing') && potentialConcerns === 0) {
    result = 'pre_issue_readiness';
  }

  const resultLabels: Record<IfAssessmentResultState, string> = {
    insufficient_information: 'Insufficient information',
    preparation_in_progress: 'Preparation in progress',
    intermediary_actions_pending: 'Intermediary actions pending',
    due_diligence_pending: 'Due diligence pending',
    exchange_review_in_progress: 'Exchange review in progress',
    filing_actions_pending: 'Filing actions pending',
    issue_infrastructure_pending: 'Issue infrastructure pending',
    underwriting_or_market_making_pending: 'Underwriting or Market Making pending',
    pre_issue_readiness: 'Pre-issue readiness',
    issue_execution_in_progress: 'Issue execution in progress',
    listing_actions_pending: 'Listing actions pending',
    broadly_ready_for_current_stage: 'Broadly ready for current stage',
    professional_confirmation_required: 'Professional confirmation required',
  };

  return {
    result,
    resultLabel: resultLabels[result],
    summary:
      'This is a filing readiness view derived from the current in-memory draft, not a regulatory approval or safe-to-launch determination. Unanswered questions are treated as missing information.',
    criteria,
    groups,
    counts,
    metrics: {
      intermediaryCount: model.intermediaryAggregates.totalCount,
      filingCount: model.filingAggregates.filingCount,
      openQueryCount: model.filingAggregates.openQueryCount,
      sectionsComplete: progress.sectionsComplete,
      unansweredConfirmations,
      reconciliationMismatchCount: model.reconciliation.totalMismatchCount,
      potentialConcerns,
    },
  };
}
