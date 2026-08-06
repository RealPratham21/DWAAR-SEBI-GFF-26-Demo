/**
 * Deterministic Capital Assessment for Capital & Ownership (frontend-only).
 *
 * The assessment is intentionally NON-BINARY: it never returns pass/fail. Each criterion lands
 * in one of six states, and the overall result describes the quality of the record rather than
 * eligibility. An unanswered question is `missing_information`, never a negative answer.
 *
 * Keep the rules here so the backend increment can mirror them exactly.
 */

import {
  computeCapitalOwnershipModel,
  type CapitalOwnershipModel,
  type ReconciliationCheck,
  type ReconciliationGroup,
} from '@/lib/capital-ownership/compute';
import { isFilledDecimal, isPositive } from '@/lib/capital-ownership/decimal';
import { CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS } from '@/lib/capital-ownership/options';
import { calculateCapitalOwnershipProgress } from '@/lib/capital-ownership/progress';
import type {
  CapitalOwnershipPayload,
  IpoSetupReference,
  YesNoNotSureOrEmpty,
} from '@/lib/capital-ownership/types';

export const CAPITAL_CRITERION_STATES = [
  'reconciled',
  'potential_inconsistency',
  'missing_information',
  'pending_linked_workstream',
  'pending_professional_confirmation',
  'not_applicable',
] as const;

export type CapitalCriterionState = (typeof CAPITAL_CRITERION_STATES)[number];

export const CAPITAL_ASSESSMENT_GROUPS = [
  'capital_reconciliation',
  'ownership_reconciliation',
  'offer_reconciliation',
  'promoter_lock_in_readiness',
] as const;

export type CapitalAssessmentGroup = (typeof CAPITAL_ASSESSMENT_GROUPS)[number];

export const CAPITAL_ASSESSMENT_GROUP_LABELS: Record<CapitalAssessmentGroup, string> = {
  capital_reconciliation: 'Capital reconciliation',
  ownership_reconciliation: 'Ownership reconciliation',
  offer_reconciliation: 'Offer reconciliation',
  promoter_lock_in_readiness: 'Promoter contribution & lock-in readiness',
};

export const CAPITAL_CRITERION_STATE_LABELS: Record<CapitalCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_inconsistency: 'Potential inconsistency',
  missing_information: 'Missing information',
  pending_linked_workstream: 'Pending linked workstream',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

export const CAPITAL_ASSESSMENT_RESULT_STATES = [
  'insufficient_information',
  'appears_reconciled',
  'inconsistencies_identified',
  'pending_linked_workstream',
  'professional_confirmation_required',
] as const;

export type CapitalAssessmentResultState = (typeof CAPITAL_ASSESSMENT_RESULT_STATES)[number];

export type CapitalAssessmentCriterion = {
  id: string;
  group: CapitalAssessmentGroup;
  label: string;
  state: CapitalCriterionState;
  reason: string;
  expected?: string;
  actual?: string;
  difference?: string;
};

export type CapitalAssessmentGroupSummary = {
  group: CapitalAssessmentGroup;
  label: string;
  criteria: CapitalAssessmentCriterion[];
  counts: Record<CapitalCriterionState, number>;
  headlineState: CapitalCriterionState;
};

export type CapitalAssessment = {
  result: CapitalAssessmentResultState;
  resultLabel: string;
  summary: string;
  criteria: CapitalAssessmentCriterion[];
  groups: CapitalAssessmentGroupSummary[];
  counts: Record<CapitalCriterionState, number>;
  metrics: {
    currentEquityShares: string;
    paidUpEquityCapital: string;
    postIssueEquityShares: string;
    promoterPreIssuePercentage: string;
    promoterPostIssuePercentage: string;
    promoterDilutionPercentagePoints: string;
    totalSharesOfferedForSale: string;
    minimumContributionRequiredShares: string;
    eligibleContributionShares: string;
    contributionShortfallShares: string;
    potentialDilutionFromConvertibles: string;
    unreconciledChecks: number;
    unansweredConfirmations: number;
    sectionsComplete: number;
  };
  model: CapitalOwnershipModel;
};

const GROUP_BY_RECONCILIATION: Record<ReconciliationGroup, CapitalAssessmentGroup> = {
  capital: 'capital_reconciliation',
  ownership: 'ownership_reconciliation',
  offer: 'offer_reconciliation',
  lock_in: 'promoter_lock_in_readiness',
};

function stateFromCheck(check: ReconciliationCheck): CapitalCriterionState {
  switch (check.status) {
    case 'reconciled':
      return 'reconciled';
    case 'variance':
      return 'potential_inconsistency';
    case 'not_applicable':
      return 'not_applicable';
    default:
      return 'missing_information';
  }
}

/** Map a ternary answer onto a criterion state without ever treating empty as "no". */
function stateFromTernary(
  answer: YesNoNotSureOrEmpty,
  options: { noState?: CapitalCriterionState } = {},
): CapitalCriterionState {
  switch (answer) {
    case 'yes':
      return 'reconciled';
    case 'no':
      return options.noState ?? 'potential_inconsistency';
    case 'not_sure':
      return 'pending_professional_confirmation';
    default:
      return 'missing_information';
  }
}

function emptyCounts(): Record<CapitalCriterionState, number> {
  return {
    reconciled: 0,
    potential_inconsistency: 0,
    missing_information: 0,
    pending_linked_workstream: 0,
    pending_professional_confirmation: 0,
    not_applicable: 0,
  };
}

function headlineStateFor(counts: Record<CapitalCriterionState, number>): CapitalCriterionState {
  if (counts.potential_inconsistency > 0) return 'potential_inconsistency';
  if (counts.missing_information > 0) return 'missing_information';
  if (counts.pending_linked_workstream > 0) return 'pending_linked_workstream';
  if (counts.pending_professional_confirmation > 0) return 'pending_professional_confirmation';
  if (counts.reconciled > 0) return 'reconciled';
  return 'not_applicable';
}

function labelForResult(result: CapitalAssessmentResultState): string {
  switch (result) {
    case 'insufficient_information':
      return 'Insufficient information';
    case 'appears_reconciled':
      return 'Capital and ownership appear reconciled';
    case 'inconsistencies_identified':
      return 'Potential inconsistencies identified';
    case 'pending_linked_workstream':
      return 'Pending linked workstream';
    case 'professional_confirmation_required':
      return 'Professional confirmation required';
    default:
      return 'Insufficient information';
  }
}

function summaryForResult(result: CapitalAssessmentResultState): string {
  switch (result) {
    case 'insufficient_information':
      return 'Too much of the capital and ownership record is still blank to draw a meaningful view. Blank answers are not read as negative.';
    case 'inconsistencies_identified':
      return 'One or more figures do not reconcile across sections. These are indicative differences, not conclusions — review the underlying records.';
    case 'pending_linked_workstream':
      return 'Key inputs depend on another workstream (usually IPO Setup & Eligibility) that is not yet complete.';
    case 'professional_confirmation_required':
      return 'Entries marked "not sure" or awaiting professional sign-off need confirmation before this view can be relied upon.';
    default:
      return 'On currently entered values the capital and ownership record reconciles. Registrar, depository and professional confirmation remain required.';
  }
}

export function assessCapitalOwnership(
  payload: CapitalOwnershipPayload,
  ipoReference: IpoSetupReference,
): CapitalAssessment {
  const model = computeCapitalOwnershipModel(payload, ipoReference);
  const progress = calculateCapitalOwnershipProgress(payload);
  const structure = payload.currentCapitalStructure;
  const history = payload.shareCapitalHistory;
  const ownership = payload.shareholdersAndBeneficialOwnership;
  const promoters = payload.promotersAndControl;
  const offer = payload.preAndPostIssueOwnership;
  const lockInSection = payload.promoterContributionLockInAndEncumbrances;
  const outstandingSection = payload.outstandingSecuritiesTransactionsAndConfirmations;

  const criteria: CapitalAssessmentCriterion[] = [];

  for (const check of model.reconciliation) {
    criteria.push({
      id: check.id,
      group: GROUP_BY_RECONCILIATION[check.group],
      label: check.label,
      state: stateFromCheck(check),
      reason: check.message,
      expected: check.expected,
      actual: check.actual,
      difference: check.difference,
    });
  }

  /* ---------------------------- Capital ---------------------------------- */

  criteria.push({
    id: 'mca-records-match',
    group: 'capital_reconciliation',
    label: 'Share capital agrees with MCA records',
    state: stateFromTernary(structure.shareCapitalMatchesMcaRecords),
    reason:
      structure.shareCapitalMatchesMcaRecords === 'no'
        ? structure.discrepancyWithMcaRecordsExplanation ||
          'A discrepancy with MCA records is reported but not explained.'
        : structure.shareCapitalMatchesMcaRecords === ''
          ? 'Whether share capital matches MCA records has not been answered.'
          : 'Issuer response recorded for agreement with MCA records.',
  });

  criteria.push({
    id: 'history-documented',
    group: 'capital_reconciliation',
    label: 'Historical allotments are documented',
    state: stateFromTernary(history.allHistoricalAllotmentsDocumented),
    reason:
      history.allHistoricalAllotmentsDocumented === 'no'
        ? history.gapsInHistoryExplanation || 'Gaps in the capital history are reported.'
        : history.allHistoricalAllotmentsDocumented === ''
          ? 'Documentation status of historical allotments has not been answered.'
          : 'Issuer indicates historical allotments are documented.',
  });

  if (model.history.eventsMissingShareCount > 0 || model.history.eventsWithUnknownType > 0) {
    criteria.push({
      id: 'history-event-completeness',
      group: 'capital_reconciliation',
      label: 'Capital events carry a type and share count',
      state: 'missing_information',
      reason: `${model.history.eventsWithUnknownType} event(s) have no type and ${model.history.eventsMissingShareCount} event(s) have no share count, so the running total cannot be completed.`,
    });
  }

  criteria.push({
    id: 'authorised-capital-sufficiency',
    group: 'capital_reconciliation',
    label: 'Authorised capital is sufficient for the proposed issue',
    state:
      structure.authorisedCapitalSufficientForProposedIssue === 'no'
        ? isFilledDecimal(structure.authorisedCapitalIncreaseRequiredAmount)
          ? 'potential_inconsistency'
          : 'missing_information'
        : stateFromTernary(structure.authorisedCapitalSufficientForProposedIssue),
    reason:
      structure.authorisedCapitalSufficientForProposedIssue === 'no'
        ? 'An increase in authorised capital is required before the fresh issue can be allotted.'
        : structure.authorisedCapitalSufficientForProposedIssue === ''
          ? 'Sufficiency of authorised capital for the proposed issue has not been answered.'
          : 'Issuer indicates authorised capital is sufficient for the proposed issue.',
  });

  const confirmationsChecked = CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS.filter(
    (field) => outstandingSection.confirmations[field.key],
  ).length;
  const unansweredConfirmations =
    CAPITAL_OWNERSHIP_CONFIRMATION_FIELDS.length - confirmationsChecked;
  criteria.push({
    id: 'issuer-confirmations',
    group: 'capital_reconciliation',
    label: 'Issuer confirmations',
    state: unansweredConfirmations === 0 ? 'reconciled' : 'missing_information',
    reason:
      unansweredConfirmations === 0
        ? 'All issuer confirmations are acknowledged.'
        : `${unansweredConfirmations} confirmation(s) remain unchecked, so this view stays preliminary.`,
  });

  /* --------------------------- Ownership --------------------------------- */

  criteria.push({
    id: 'register-of-members',
    group: 'ownership_reconciliation',
    label: 'Register of members is maintained and current',
    state:
      ownership.registerOfMembersMaintained === 'yes'
        ? stateFromTernary(ownership.registerOfMembersUpToDate)
        : stateFromTernary(ownership.registerOfMembersMaintained),
    reason:
      ownership.registerOfMembersMaintained === ''
        ? 'Whether the register of members is maintained has not been answered.'
        : ownership.registerOfMembersMaintained === 'no'
          ? 'The register of members is reported as not maintained.'
          : ownership.registerOfMembersUpToDate === 'yes'
            ? 'The register of members is maintained and reported as current.'
            : 'The register of members is maintained; its currency needs confirmation.',
  });

  criteria.push({
    id: 'sbo-determination',
    group: 'ownership_reconciliation',
    label: 'Significant beneficial owner determination',
    state:
      ownership.significantBeneficialOwnerDeterminationCompleted === 'yes' &&
      ownership.beneficialOwners.length === 0
        ? 'potential_inconsistency'
        : stateFromTernary(ownership.significantBeneficialOwnerDeterminationCompleted, {
            noState: 'missing_information',
          }),
    reason:
      ownership.significantBeneficialOwnerDeterminationCompleted === 'yes' &&
      ownership.beneficialOwners.length === 0
        ? 'The determination is marked complete but no significant beneficial owner has been recorded.'
        : ownership.significantBeneficialOwnerDeterminationCompleted === ''
          ? 'Significant beneficial owner determination status has not been answered.'
          : `${ownership.beneficialOwners.length} beneficial owner record(s) captured.`,
  });

  const sbosMissingFilings = ownership.beneficialOwners.filter(
    (item) => item.isSignificantBeneficialOwner === 'yes' && item.formBen2Filed !== 'yes',
  ).length;
  if (sbosMissingFilings > 0) {
    criteria.push({
      id: 'sbo-filings',
      group: 'ownership_reconciliation',
      label: 'Significant beneficial owner filings',
      state: 'missing_information',
      reason: `${sbosMissingFilings} significant beneficial owner(s) do not have Form BEN-2 recorded as filed.`,
    });
  }

  criteria.push({
    id: 'promoter-identification',
    group: 'ownership_reconciliation',
    label: 'Promoter identification is complete',
    state:
      promoters.companyHasIdentifiedPromoter === 'no'
        ? promoters.noPromoterExplanation
          ? 'pending_professional_confirmation'
          : 'missing_information'
        : promoters.companyHasIdentifiedPromoter === 'yes' && promoters.promoters.length === 0
          ? 'potential_inconsistency'
          : stateFromTernary(promoters.promoterIdentificationComplete, {
              noState: 'missing_information',
            }),
    reason:
      promoters.companyHasIdentifiedPromoter === 'no'
        ? 'The issuer reports no identified promoter. A promoter-less classification needs professional confirmation.'
        : promoters.companyHasIdentifiedPromoter === 'yes' && promoters.promoters.length === 0
          ? 'A promoter is reported but no promoter record has been added.'
          : promoters.promoterIdentificationComplete === ''
            ? 'Completeness of promoter identification has not been answered.'
            : `${promoters.promoters.length} promoter record(s) captured.`,
  });

  criteria.push({
    id: 'promoter-group-identification',
    group: 'ownership_reconciliation',
    label: 'Promoter group identification is complete',
    state: stateFromTernary(promoters.promoterGroupIdentificationComplete, {
      noState: 'missing_information',
    }),
    reason:
      promoters.promoterGroupIdentificationComplete === ''
        ? 'Completeness of promoter group identification has not been answered.'
        : `${promoters.promoterGroupMembers.length} promoter group member(s) captured.`,
  });

  const survivingArrangements = promoters.controlArrangements.filter(
    (item) => item.survivesPostListing === 'yes' && item.terminationOnListingAgreed !== 'yes',
  ).length;
  const unansweredArrangements = promoters.controlArrangements.filter(
    (item) => item.survivesPostListing === '' || item.survivesPostListing === 'not_sure',
  ).length;
  criteria.push({
    id: 'control-arrangements',
    group: 'ownership_reconciliation',
    label: 'Control arrangements are resolved before listing',
    state:
      promoters.controlArrangements.length === 0
        ? promoters.anyPersonExercisingControlWithoutShareholding === 'yes'
          ? 'potential_inconsistency'
          : 'missing_information'
        : survivingArrangements > 0
          ? 'potential_inconsistency'
          : unansweredArrangements > 0
            ? 'missing_information'
            : 'reconciled',
    reason:
      promoters.controlArrangements.length === 0
        ? promoters.anyPersonExercisingControlWithoutShareholding === 'yes'
          ? 'Control without shareholding is reported but no control arrangement has been recorded.'
          : 'No control arrangements have been recorded yet.'
        : survivingArrangements > 0
          ? `${survivingArrangements} arrangement(s) survive listing without an agreed termination.`
          : unansweredArrangements > 0
            ? `${unansweredArrangements} arrangement(s) do not state whether they survive listing.`
            : 'Recorded arrangements terminate on listing or do not survive it.',
  });

  criteria.push({
    id: 'foreign-investment-compliance',
    group: 'ownership_reconciliation',
    label: 'Foreign investment compliance',
    state:
      ownership.foreignShareholdingExists === 'no'
        ? 'not_applicable'
        : ownership.foreignShareholdingExists === ''
          ? 'missing_information'
          : stateFromTernary(ownership.foreignDirectInvestmentComplianceConfirmed),
    reason:
      ownership.foreignShareholdingExists === 'no'
        ? 'No foreign shareholding is reported.'
        : ownership.foreignShareholdingExists === ''
          ? 'Existence of foreign shareholding has not been answered.'
          : ownership.foreignDirectInvestmentComplianceConfirmed === 'yes'
            ? 'Foreign investment compliance is confirmed by the issuer.'
            : 'Foreign investment compliance has not been confirmed.',
  });

  if (model.capTable.shareholdersWithoutShareCount > 0) {
    criteria.push({
      id: 'shareholder-quantities',
      group: 'ownership_reconciliation',
      label: 'Shareholder quantities are complete',
      state: 'missing_information',
      reason: `${model.capTable.shareholdersWithoutShareCount} shareholder record(s) have no equity share count.`,
    });
  }
  if (model.capTable.shareholdersWithoutCategory > 0) {
    criteria.push({
      id: 'shareholder-categories',
      group: 'ownership_reconciliation',
      label: 'Shareholder categories are assigned',
      state: 'missing_information',
      reason: `${model.capTable.shareholdersWithoutCategory} shareholder record(s) have no category, so promoter and public splits are incomplete.`,
    });
  }

  /* ----------------------------- Offer ----------------------------------- */

  if (!ipoReference.available) {
    criteria.push({
      id: 'ipo-setup-linkage',
      group: 'offer_reconciliation',
      label: 'IPO Setup & Eligibility linkage',
      state: 'pending_linked_workstream',
      reason:
        'Offer sizing is governed by IPO Setup & Eligibility, which has not been completed. Pre/post-issue views remain indicative.',
    });
  } else {
    criteria.push({
      id: 'ipo-setup-linkage',
      group: 'offer_reconciliation',
      label: 'IPO Setup & Eligibility linkage',
      state:
        ipoReference.proposedOfferType === '' || ipoReference.proposedOfferType === 'undecided'
          ? 'pending_linked_workstream'
          : 'reconciled',
      reason:
        ipoReference.proposedOfferType === '' || ipoReference.proposedOfferType === 'undecided'
          ? 'The proposed offer type in IPO Setup is still undecided.'
          : 'Offer inputs are mirrored from IPO Setup & Eligibility.',
    });
  }

  for (const issue of model.prePost.issues) {
    if (issue.code === 'ofs_exceeds_holding' || issue.code === 'transfer_exceeds_holding') {
      criteria.push({
        id: `offer-issue-${issue.id}`,
        group: 'offer_reconciliation',
        label: 'Offer-for-sale quantity within holding',
        state: 'potential_inconsistency',
        reason: issue.message,
      });
    }
  }

  criteria.push({
    id: 'selling-shareholder-consents',
    group: 'offer_reconciliation',
    label: 'Selling shareholder consents and eligibility',
    state: isPositive(model.prePost.totalSharesOfferedForSale)
      ? offer.sellingShareholderConsentsObtained === 'yes'
        ? stateFromTernary(offer.sellingShareholderEligibilityConfirmed, {
            noState: 'potential_inconsistency',
          })
        : stateFromTernary(offer.sellingShareholderConsentsObtained)
      : 'not_applicable',
    reason: !isPositive(model.prePost.totalSharesOfferedForSale)
      ? 'No shares are currently marked for sale.'
      : offer.sellingShareholderConsentsObtained === ''
        ? 'Selling shareholder consents have not been confirmed.'
        : offer.sellingShareholderEligibilityConfirmed === 'yes'
          ? 'Consents are obtained and eligibility of the selling shareholders is confirmed.'
          : 'Consents are recorded; eligibility of the selling shareholders still needs confirmation.',
  });

  criteria.push({
    id: 'ofs-holding-period',
    group: 'offer_reconciliation',
    label: 'Offer-for-sale shares meet the holding-period requirement',
    state: isPositive(model.prePost.totalSharesOfferedForSale)
      ? stateFromTernary(offer.offerForSaleSharesHeldForRequiredPeriod)
      : 'not_applicable',
    reason: !isPositive(model.prePost.totalSharesOfferedForSale)
      ? 'No shares are currently marked for sale.'
      : offer.offerForSaleSharesHeldForRequiredPeriod === ''
        ? 'Whether the offered shares meet the holding-period requirement has not been answered.'
        : 'Issuer response recorded for the offer-for-sale holding-period requirement.',
  });

  criteria.push({
    id: 'outstanding-convertibles',
    group: 'offer_reconciliation',
    label: 'Outstanding convertible instruments before filing',
    state:
      outstandingSection.anyOutstandingConvertibleInstruments === 'no'
        ? 'not_applicable'
        : outstandingSection.anyOutstandingConvertibleInstruments === ''
          ? 'missing_information'
          : model.outstanding.instrumentsSurvivingFiling > 0
            ? 'potential_inconsistency'
            : model.outstanding.instrumentsWithUnknownSettlement > 0
              ? 'missing_information'
              : 'reconciled',
    reason:
      outstandingSection.anyOutstandingConvertibleInstruments === 'no'
        ? 'No outstanding convertible instruments are reported.'
        : outstandingSection.anyOutstandingConvertibleInstruments === ''
          ? 'Existence of outstanding convertible instruments has not been answered.'
          : model.outstanding.instrumentsSurvivingFiling > 0
            ? `${model.outstanding.instrumentsSurvivingFiling} instrument(s) are expected to remain outstanding at filing, which affects the offer structure.`
            : model.outstanding.instrumentsWithUnknownSettlement > 0
              ? `${model.outstanding.instrumentsWithUnknownSettlement} instrument(s) do not state whether they convert or lapse before filing.`
              : 'All recorded instruments are expected to convert or lapse before filing.',
  });

  criteria.push({
    id: 'dematerialisation-before-filing',
    group: 'offer_reconciliation',
    label: 'Shares dematerialised before filing',
    state: stateFromTernary(outstandingSection.allSharesDematerialisedBeforeFiling),
    reason:
      outstandingSection.allSharesDematerialisedBeforeFiling === ''
        ? 'Dematerialisation of all shares before filing has not been answered.'
        : outstandingSection.allSharesDematerialisedBeforeFiling === 'no'
          ? 'Not all shares are expected to be dematerialised before filing.'
          : 'Issuer expects all shares to be dematerialised before filing.',
  });

  /* -------------------- Promoter contribution & lock-in ------------------- */

  if (model.lockIn.lotsMissingEligibilityAnswer > 0) {
    criteria.push({
      id: 'contribution-lot-eligibility',
      group: 'promoter_lock_in_readiness',
      label: 'Contribution lots have an eligibility answer',
      state: 'missing_information',
      reason: `${model.lockIn.lotsMissingEligibilityAnswer} contribution lot(s) are unanswered or marked not sure for minimum-contribution eligibility.`,
    });
  }

  criteria.push({
    id: 'contribution-timing',
    group: 'promoter_lock_in_readiness',
    label: 'Contribution brought in before issue opening',
    state:
      lockInSection.minimumPromoterContributionApplicable === 'no'
        ? 'not_applicable'
        : stateFromTernary(lockInSection.contributionBroughtInBeforeIssueOpening),
    reason:
      lockInSection.minimumPromoterContributionApplicable === 'no'
        ? 'Minimum promoter contribution is reported as not applicable.'
        : lockInSection.contributionBroughtInBeforeIssueOpening === ''
          ? 'Whether the contribution will be brought in before issue opening has not been answered.'
          : 'Issuer response recorded for the timing of promoter contribution.',
  });

  criteria.push({
    id: 'lock-in-demat',
    group: 'promoter_lock_in_readiness',
    label: 'Lock-in shares will be held in dematerialised form',
    state:
      model.lockIn.lotsNotDematerialised > 0
        ? 'potential_inconsistency'
        : stateFromTernary(lockInSection.lockInSharesToBeHeldInDematerialisedForm),
    reason:
      model.lockIn.lotsNotDematerialised > 0
        ? `${model.lockIn.lotsNotDematerialised} contribution lot(s) are recorded as not dematerialised.`
        : lockInSection.lockInSharesToBeHeldInDematerialisedForm === ''
          ? 'Dematerialisation of lock-in shares has not been answered.'
          : 'Issuer expects lock-in shares to be held in dematerialised form.',
  });

  criteria.push({
    id: 'lock-in-professional-confirmation',
    group: 'promoter_lock_in_readiness',
    label: 'Lock-in compliance professionally confirmed',
    state:
      lockInSection.lockInComplianceProfessionallyConfirmed === 'yes'
        ? 'reconciled'
        : 'pending_professional_confirmation',
    reason:
      lockInSection.lockInComplianceProfessionallyConfirmed === 'yes'
        ? 'Lock-in compliance is confirmed by a professional adviser.'
        : 'Lock-in composition and periods still require professional confirmation.',
  });

  criteria.push({
    id: 'entire-pre-issue-lock-in',
    group: 'promoter_lock_in_readiness',
    label: 'Lock-in of the remaining pre-issue capital is understood',
    state: stateFromTernary(lockInSection.entirePreIssueCapitalLockInUnderstood, {
      noState: 'missing_information',
    }),
    reason:
      lockInSection.entirePreIssueCapitalLockInUnderstood === ''
        ? 'Understanding of lock-in on the remaining pre-issue capital has not been answered.'
        : 'Issuer response recorded for lock-in of the remaining pre-issue capital.',
  });

  /* ---------------------------- Aggregation ------------------------------- */

  const counts = emptyCounts();
  for (const criterion of criteria) counts[criterion.state] += 1;

  const groups: CapitalAssessmentGroupSummary[] = CAPITAL_ASSESSMENT_GROUPS.map((group) => {
    const groupCriteria = criteria.filter((criterion) => criterion.group === group);
    const groupCounts = emptyCounts();
    for (const criterion of groupCriteria) groupCounts[criterion.state] += 1;
    return {
      group,
      label: CAPITAL_ASSESSMENT_GROUP_LABELS[group],
      criteria: groupCriteria,
      counts: groupCounts,
      headlineState: headlineStateFor(groupCounts),
    };
  });

  // Insufficient information wins while the workspace is still mostly blank so a single
  // answered "no" cannot dominate the headline before enough sections exist to judge.
  let result: CapitalAssessmentResultState = 'appears_reconciled';
  if (counts.missing_information >= 6 || progress.sectionsComplete < 2) {
    result = 'insufficient_information';
  } else if (counts.potential_inconsistency > 0) {
    result = 'inconsistencies_identified';
  } else if (counts.pending_professional_confirmation > 0) {
    result = 'professional_confirmation_required';
  } else if (counts.pending_linked_workstream > 0) {
    result = 'pending_linked_workstream';
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
      currentEquityShares: model.totals.currentEquityShares,
      paidUpEquityCapital: model.totals.paidUpEquityCapitalFromClasses,
      postIssueEquityShares: model.prePost.postIssueShares,
      promoterPreIssuePercentage: model.dilution.promoterPreIssuePercentage,
      promoterPostIssuePercentage: model.dilution.promoterPostIssuePercentage,
      promoterDilutionPercentagePoints: model.dilution.promoterDilutionPercentagePoints,
      totalSharesOfferedForSale: model.prePost.totalSharesOfferedForSale,
      minimumContributionRequiredShares: model.lockIn.requiredContributionShares,
      eligibleContributionShares: model.lockIn.eligibleShares,
      contributionShortfallShares: model.lockIn.shortfallShares,
      potentialDilutionFromConvertibles: model.outstanding.potentialDilutionPercentage,
      unreconciledChecks: model.reconciliation.filter((check) => check.status === 'variance').length,
      unansweredConfirmations,
      sectionsComplete: progress.sectionsComplete,
    },
    model,
  };
}
