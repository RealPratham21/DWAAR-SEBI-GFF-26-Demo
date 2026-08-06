/**
 * Section completion for Capital & Ownership.
 *
 * Mirrors the IPO Setup progress model: each section resolves to
 * `not_started | in_progress | complete`, and an unanswered ternary is never treated as "no".
 */

import { isFilledDecimal } from '@/lib/capital-ownership/decimal';
import { CAPITAL_OWNERSHIP_SECTION_LABELS } from '@/lib/capital-ownership/options';
import type {
  CapitalOwnershipPayload,
  CapitalOwnershipProgress,
  CapitalOwnershipSectionId,
  SectionStatus,
} from '@/lib/capital-ownership/types';

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

export function evaluateCurrentCapitalStructureStatus(
  payload: CapitalOwnershipPayload,
): SectionStatus {
  const section = payload.currentCapitalStructure;
  const equityRowsEntered = section.equityClasses.filter(
    (item) => filled(item.className) || isFilledDecimal(item.issuedShares),
  );

  const core = [
    filled(section.asOnDate),
    equityRowsEntered.length > 0,
    isFilledDecimal(section.authorisedEquityShareCapital),
    isFilledDecimal(section.issuedEquityShareCapital),
    isFilledDecimal(section.paidUpEquityShareCapital),
    filled(section.allSharesFullyPaidUp),
    filled(section.shareCapitalMatchesMcaRecords),
    filled(section.dematStatusOverall),
  ];
  const answered = core.filter(Boolean).length;

  const classesComplete = equityRowsEntered.every(
    (item) =>
      isFilledDecimal(item.faceValuePerShare) &&
      isFilledDecimal(item.issuedShares) &&
      isFilledDecimal(item.paidUpShares),
  );
  const discrepancyExplained =
    section.shareCapitalMatchesMcaRecords !== 'no' ||
    filled(section.discrepancyWithMcaRecordsExplanation);
  const partlyPaidExplained =
    section.partlyPaidSharesOutstanding !== 'yes' || filled(section.partlyPaidSharesDetails);

  return statusFrom(
    answered,
    core.length,
    classesComplete && discrepancyExplained && partlyPaidExplained,
  );
}

export function evaluateShareCapitalHistoryStatus(payload: CapitalOwnershipPayload): SectionStatus {
  const section = payload.shareCapitalHistory;
  const core = [
    filled(section.historyCoversPeriodSinceIncorporation),
    section.capitalEvents.length > 0,
    filled(section.allHistoricalAllotmentsDocumented),
    filled(section.historyReconciledWithMcaFilings),
    filled(section.bonusIssueInLastTwelveMonths),
    filled(section.sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths),
    filled(section.anyPendingAllotments),
  ];
  const answered = core.filter(Boolean).length;

  const eventsComplete = section.capitalEvents.every(
    (event) =>
      filled(event.eventDate) &&
      filled(event.eventType) &&
      (isFilledDecimal(event.numberOfShares) || event.eventType === 'increase-in-authorised-capital'),
  );
  const gapsExplained =
    section.allHistoricalAllotmentsDocumented !== 'no' || filled(section.gapsInHistoryExplanation);
  const pendingExplained =
    section.anyPendingAllotments !== 'yes' || filled(section.pendingAllotmentDetails);

  return statusFrom(answered, core.length, eventsComplete && gapsExplained && pendingExplained);
}

export function evaluateShareholdersStatus(payload: CapitalOwnershipPayload): SectionStatus {
  const section = payload.shareholdersAndBeneficialOwnership;
  const core = [
    filled(section.shareholdingAsOnDate),
    section.shareholders.length > 0,
    isFilledDecimal(section.totalNumberOfShareholders),
    filled(section.registerOfMembersMaintained),
    filled(section.significantBeneficialOwnerDeterminationCompleted),
    filled(section.foreignShareholdingExists),
    filled(section.anyShareholderAgreementsWithInvestors),
  ];
  const answered = core.filter(Boolean).length;

  const shareholdersComplete = section.shareholders.every(
    (item) => filled(item.name) && filled(item.category) && isFilledDecimal(item.equitySharesHeld),
  );
  const sboComplete =
    section.significantBeneficialOwnerDeterminationCompleted !== 'yes' ||
    section.beneficialOwners.length > 0;
  const foreignComplete =
    section.foreignShareholdingExists !== 'yes' ||
    filled(section.foreignDirectInvestmentComplianceConfirmed);

  return statusFrom(answered, core.length, shareholdersComplete && sboComplete && foreignComplete);
}

export function evaluatePromotersAndControlStatus(payload: CapitalOwnershipPayload): SectionStatus {
  const section = payload.promotersAndControl;
  const hasPromoter = section.companyHasIdentifiedPromoter === 'yes';
  const core = [
    filled(section.companyHasIdentifiedPromoter),
    hasPromoter ? section.promoters.length > 0 : filled(section.noPromoterExplanation),
    filled(section.promoterIdentificationComplete),
    filled(section.promoterGroupIdentificationComplete),
    filled(section.anyPersonExercisingControlWithoutShareholding),
    filled(section.changeInControlInLastThreeYears),
  ];
  const answered = core.filter(Boolean).length;

  const promotersComplete = section.promoters.every(
    (item) => filled(item.name) && filled(item.promoterType) && filled(item.basisOfPromoterStatus),
  );
  const groupComplete = section.promoterGroupMembers.every(
    (item) => filled(item.name) && filled(item.relationshipToPromoter),
  );
  const arrangementsComplete = section.controlArrangements.every(
    (item) => filled(item.arrangementType) && filled(item.partiesInvolved),
  );
  const controlExplained =
    section.anyPersonExercisingControlWithoutShareholding !== 'yes' ||
    filled(section.controlWithoutShareholdingDetails);
  const changeExplained =
    section.changeInControlInLastThreeYears !== 'yes' || filled(section.changeInControlDetails);

  return statusFrom(
    answered,
    core.length,
    promotersComplete && groupComplete && arrangementsComplete && controlExplained && changeExplained,
  );
}

export function evaluatePrePostIssueStatus(payload: CapitalOwnershipPayload): SectionStatus {
  const section = payload.preAndPostIssueOwnership;
  const hasOverlays = section.shareholderOverlays.length > 0;
  const core = [
    hasOverlays,
    filled(section.preIssueCapitalConfirmedWithLeadManager),
    filled(section.sellingShareholderConsentsObtained),
    filled(section.anyExpectedPreIssueTransfers),
  ];
  const answered = core.filter(Boolean).length;

  const overlaysComplete = section.shareholderOverlays.every(
    (overlay) =>
      filled(overlay.shareholderId) &&
      (isFilledDecimal(overlay.sharesOfferedForSale) ||
        isFilledDecimal(overlay.otherExpectedPreIssueTransfer)),
  );
  const sellersComplete =
    section.sellingShareholderConsentsObtained !== 'yes' ||
    filled(section.sellingShareholderEligibilityConfirmed);
  const transfersExplained =
    section.anyExpectedPreIssueTransfers !== 'yes' ||
    filled(section.expectedPreIssueTransferDetails);

  return statusFrom(
    answered,
    core.length,
    overlaysComplete && sellersComplete && transfersExplained,
  );
}

export function evaluatePromoterContributionStatus(
  payload: CapitalOwnershipPayload,
): SectionStatus {
  const section = payload.promoterContributionLockInAndEncumbrances;
  const applicable = section.minimumPromoterContributionApplicable !== 'no';
  const core = [
    filled(section.minimumPromoterContributionApplicable),
    applicable
      ? section.contributionLots.length > 0
      : filled(section.exemptionFromMinimumContributionClaimed),
    filled(section.contributionBroughtInBeforeIssueOpening),
    filled(section.anyEncumbranceOnPromoterShares),
    filled(section.entirePreIssueCapitalLockInUnderstood),
    filled(section.sharesIneligibleForContributionExist),
  ];
  const answered = core.filter(Boolean).length;

  const lotsComplete = section.contributionLots.every(
    (lot) =>
      isFilledDecimal(lot.numberOfShares) &&
      filled(lot.dateOfAcquisition) &&
      filled(lot.modeOfAcquisition) &&
      filled(lot.eligibleForMinimumPromoterContribution),
  );
  const encumbrancesComplete = section.encumbrances.every(
    (item) => filled(item.encumbranceType) && isFilledDecimal(item.numberOfSharesEncumbered),
  );
  const encumbranceAnswered =
    section.anyEncumbranceOnPromoterShares !== 'yes' || section.encumbrances.length > 0;
  const ineligibleExplained =
    section.sharesIneligibleForContributionExist !== 'yes' ||
    filled(section.ineligibleSharesDetails);
  const exemptionExplained =
    section.exemptionFromMinimumContributionClaimed !== 'yes' || filled(section.exemptionBasis);

  return statusFrom(
    answered,
    core.length,
    lotsComplete &&
      encumbrancesComplete &&
      encumbranceAnswered &&
      ineligibleExplained &&
      exemptionExplained,
  );
}

export function evaluateOutstandingSecuritiesStatus(
  payload: CapitalOwnershipPayload,
): SectionStatus {
  const section = payload.outstandingSecuritiesTransactionsAndConfirmations;
  const confirmations = Object.values(section.confirmations);
  const confirmationsChecked = confirmations.filter(Boolean).length;

  const core = [
    filled(section.anyOutstandingConvertibleInstruments),
    filled(section.anyTransactionsInLastEighteenMonths),
    filled(section.allSharesDematerialisedBeforeFiling),
    filled(section.anyPendingShareTransfers),
    filled(section.anyDisputesOverTitleToShares),
    confirmationsChecked > 0,
  ];
  const answered = core.filter(Boolean).length;

  const instrumentsComplete =
    section.anyOutstandingConvertibleInstruments !== 'yes' ||
    (section.outstandingInstruments.length > 0 &&
      section.outstandingInstruments.every(
        (item) =>
          filled(item.instrumentType) &&
          isFilledDecimal(item.potentialEquitySharesOnConversion),
      ));
  const transactionsComplete =
    section.anyTransactionsInLastEighteenMonths !== 'yes' ||
    (section.recentTransactions.length > 0 &&
      section.recentTransactions.every(
        (item) =>
          filled(item.transactionDate) &&
          filled(item.transactionType) &&
          isFilledDecimal(item.numberOfShares),
      ));
  const pendingExplained =
    section.anyPendingShareTransfers !== 'yes' || filled(section.pendingShareTransferDetails);
  const disputesExplained =
    section.anyDisputesOverTitleToShares !== 'yes' || filled(section.titleDisputeDetails);
  const confirmationsComplete = confirmationsChecked === confirmations.length;

  return statusFrom(
    answered,
    core.length,
    instrumentsComplete &&
      transactionsComplete &&
      pendingExplained &&
      disputesExplained &&
      confirmationsComplete,
  );
}

export function calculateCapitalOwnershipProgress(
  payload: CapitalOwnershipPayload,
): CapitalOwnershipProgress {
  const sections: Record<CapitalOwnershipSectionId, SectionStatus> = {
    'current-capital-structure': evaluateCurrentCapitalStructureStatus(payload),
    'share-capital-history': evaluateShareCapitalHistoryStatus(payload),
    'shareholders-beneficial-ownership': evaluateShareholdersStatus(payload),
    'promoters-and-control': evaluatePromotersAndControlStatus(payload),
    'pre-post-issue-ownership': evaluatePrePostIssueStatus(payload),
    'promoter-contribution-lock-in': evaluatePromoterContributionStatus(payload),
    'outstanding-securities-confirmations': evaluateOutstandingSecuritiesStatus(payload),
  };

  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listIncompleteCapitalOwnershipSections(
  payload: CapitalOwnershipPayload,
): string[] {
  const progress = calculateCapitalOwnershipProgress(payload);
  const incomplete: string[] = [];
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [CapitalOwnershipSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      incomplete.push(`${CAPITAL_OWNERSHIP_SECTION_LABELS[id]} incomplete`);
    }
  }
  return incomplete;
}
