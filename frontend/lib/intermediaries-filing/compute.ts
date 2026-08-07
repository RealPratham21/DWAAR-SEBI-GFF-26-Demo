/**
 * Derived model for Intermediaries & Filing (IF1, frontend-only).
 */

import {
  addDecimals,
  divideDecimals,
  isFilledDecimal,
  parseDecimal,
  subtractDecimals,
} from '@/lib/intermediaries-filing/decimal';
import {
  getAuthoritativeVersion,
  getAuthoritativeVersionConflictCount,
  getFilings,
  getOfferDocumentVersions,
} from '@/lib/intermediaries-filing/filings';
import {
  getIntermediaries,
  getLeadManagers,
  hasLeadManagerRole,
} from '@/lib/intermediaries-filing/intermediaries';
import { buildReconciliationPreview, type IfReconciliationPreview } from '@/lib/intermediaries-filing/reconciliation';
import {
  compareMerchantBankerOwnAccount,
  compareUnderwritingCoverage,
  MARKET_MAKING_MINIMUM_DAYS,
} from '@/lib/intermediaries-filing/rules';
import { computePreliminaryTPlus3 } from '@/lib/intermediaries-filing/working-days';
import type { LinkedWorkstreamReferences } from '@/lib/intermediaries-filing/types';
import type { IntermediariesFilingPayload, FilingStage } from '@/lib/schemas/intermediaries-filing';

export type IntermediaryAggregates = {
  totalCount: number;
  leadManagerCount: number;
  activeCount: number;
  agreementPendingCount: number;
  registrationsPendingReview: number;
};

export type FilingAggregates = {
  filingCount: number;
  openQueryCount: number;
  overdueQueryCount: number;
  closedQueryCount: number;
  resubmissionCount: number;
  latestFilingDate: string;
};

export type CertificateConsentAggregates = {
  certificateCount: number;
  signedCertificateCount: number;
  certificatesPending: number;
  consentCount: number;
  consentsReceived: number;
  consentsWithdrawn: number;
  chapterSignoffsComplete: number;
  chapterSignoffsTotal: number;
};

export type DueDiligenceAggregates = {
  areaCount: number;
  startedCount: number;
  signedOffCount: number;
  unresolvedMaterialCount: number;
};

export type InfrastructureAggregates = {
  isinStatus: string;
  configuredBankRoles: number;
  requiredBankRoles: number;
  sponsorBankReady: boolean;
  upiReady: boolean;
  asbaReady: boolean;
};

export type UnderwritingAggregates = {
  totalSharesCommitted: string;
  totalAmountCommitted: string;
  totalUnderwritingPercentage: string;
  uncoveredShares: string;
  uncoveredAmount: string;
  ownAccountPercentage: string;
  ownAccountComparison: ReturnType<typeof compareMerchantBankerOwnAccount>;
  coverageComparison: ReturnType<typeof compareUnderwritingCoverage>;
  overlappingCommitmentWarning: boolean;
};

export type MarketMakingAggregates = {
  marketMakerAppointed: boolean;
  agreementExecuted: boolean;
  reservationShares: string;
  configuredMinimumDays: number;
  reservationDiscrepancy: string;
};

export type ProgrammeAggregates = {
  issueOpeningDate: string;
  issueClosingDate: string;
  preliminaryTPlus3ListingDate: string;
  subscriptionRowCount: number;
  postIssueActionsComplete: number;
  postIssueActionsTotal: number;
};

export type FinalDocumentAggregates = {
  versionCount: number;
  authoritativeVersionLabel: string;
  authoritativeVersionConflict: boolean;
  openPlaceholderCount: number;
  inspectionItemsPending: number;
  issueAgreementsPending: number;
  publicCommunicationsPending: number;
};

export type IntermediariesFilingModel = {
  intermediaryAggregates: IntermediaryAggregates;
  filingAggregates: FilingAggregates;
  certificateConsentAggregates: CertificateConsentAggregates;
  dueDiligenceAggregates: DueDiligenceAggregates;
  infrastructureAggregates: InfrastructureAggregates;
  underwritingAggregates: UnderwritingAggregates;
  marketMakingAggregates: MarketMakingAggregates;
  programmeAggregates: ProgrammeAggregates;
  finalDocumentAggregates: FinalDocumentAggregates;
  reconciliation: IfReconciliationPreview;
  currentFilingStage: FilingStage | '';
};

function countOverlappingCommitments(payload: IntermediariesFilingPayload): boolean {
  const commitments = payload.underwritingMarketMakingAndDistributionArrangements.underwritingCommitments;
  const seen = new Set<string>();
  for (const commitment of commitments) {
    const key = `${commitment.intermediaryId}::${commitment.sharesUnderwritten}`;
    if (!commitment.intermediaryId || !commitment.sharesUnderwritten) continue;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function computeIntermediariesFilingModel(
  payload: IntermediariesFilingPayload,
  linkedReferences: LinkedWorkstreamReferences,
): IntermediariesFilingModel {
  const intermediaries = getIntermediaries(payload);
  const filings = getFilings(payload);
  const section3 = payload.filingAndRegulatoryMilestoneTracker;
  const section4 = payload.dueDiligenceCertificatesConsentsAndSignoffs;
  const section5 = payload.depositoriesBankingAsbaUpiAndIssueInfrastructure;
  const section6 = payload.underwritingMarketMakingAndDistributionArrangements;
  const section7 = payload.issueProgrammeAllotmentListingAndPostIssueExecution;
  const section8 =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;

  const underwritingSummary = section6.underwritingSummary;
  const totalSharesCommitted = addDecimals(
    ...section6.underwritingCommitments.map((commitment) => commitment.sharesUnderwritten),
  );
  const totalAmountCommitted = addDecimals(
    ...section6.underwritingCommitments.map((commitment) => commitment.amountUnderwritten),
  );
  const issueShares = underwritingSummary.issueShares;
  const totalUnderwritingPercentage =
    underwritingSummary.totalUnderwritingPercentage ||
    divideDecimals(totalSharesCommitted, issueShares) ||
    '';

  const ownAccountShares = addDecimals(
    ...section6.underwritingCommitments
      .filter((commitment) => commitment.ownAccount === 'yes')
      .map((commitment) => commitment.sharesUnderwritten),
    underwritingSummary.leadManagerOwnAccountCommitment,
  );
  const ownAccountPercentage =
    underwritingSummary.ownAccountPercentage ||
    divideDecimals(ownAccountShares, issueShares) ||
    '';

  const tPlus3 = computePreliminaryTPlus3(section7.issueCalendar.issueClosingDate);
  const authoritative = getAuthoritativeVersion(payload);

  const openQueries = section3.exchangeQueries.filter(
    (query) => query.status !== 'closed' && query.status !== 'superseded',
  );

  return {
    intermediaryAggregates: {
      totalCount: intermediaries.length,
      leadManagerCount: getLeadManagers(payload).length,
      activeCount: intermediaries.filter((intermediary) => intermediary.appointment.status === 'active')
        .length,
      agreementPendingCount: intermediaries.filter(
        (intermediary) => intermediary.appointment.status === 'agreement_pending',
      ).length,
      registrationsPendingReview: intermediaries.filter(
        (intermediary) =>
          intermediary.registration.registrationStatus === 'pending_verification' ||
          intermediary.registration.registrationStatus === 'professional_confirmation_required',
      ).length,
    },
    filingAggregates: {
      filingCount: filings.length,
      openQueryCount: openQueries.length,
      overdueQueryCount: openQueries.filter((query) => {
        if (!query.responseDueDate) return false;
        const due = Date.parse(query.responseDueDate);
        return !Number.isNaN(due) && due < Date.now();
      }).length,
      closedQueryCount: section3.exchangeQueries.filter((query) => query.status === 'closed').length,
      resubmissionCount: section3.resubmissions.length,
      latestFilingDate:
        filings
          .map((filing) => filing.filingDate)
          .filter(Boolean)
          .sort()
          .at(-1) ?? '',
    },
    certificateConsentAggregates: {
      certificateCount: section4.certificates.length,
      signedCertificateCount: section4.certificates.filter(
        (certificate) => certificate.status === 'signed' || certificate.signed === 'yes',
      ).length,
      certificatesPending: section4.certificates.filter(
        (certificate) =>
          certificate.status === 'not_started' ||
          certificate.status === 'draft' ||
          certificate.status === 'under_review',
      ).length,
      consentCount: section4.consents.length,
      consentsReceived: section4.consents.filter((consent) => consent.received === 'yes').length,
      consentsWithdrawn: section4.consents.filter((consent) => consent.withdrawn === 'yes').length,
      chapterSignoffsComplete: section4.chapterSignoffs.filter(
        (signoff) => signoff.finalSignOff === 'yes',
      ).length,
      chapterSignoffsTotal: section4.chapterSignoffs.length,
    },
    dueDiligenceAggregates: {
      areaCount: section4.dueDiligenceAreas.length,
      startedCount: section4.dueDiligenceAreas.filter(
        (area) => area.dueDiligenceStarted === 'yes',
      ).length,
      signedOffCount: section4.dueDiligenceAreas.filter((area) => area.finalSignOff === 'yes')
        .length,
      unresolvedMaterialCount: section4.dueDiligenceAreas.filter(
        (area) => area.materialUnresolvedIssue === 'yes',
      ).length,
    },
    infrastructureAggregates: {
      isinStatus: section5.depositoryReadiness.isinStatus,
      configuredBankRoles: section5.issueBankRoles.filter(
        (role) => role.accountSetupStatus === 'configured' || role.accountSetupStatus === 'ready',
      ).length,
      requiredBankRoles: section5.issueBankRoles.length,
      sponsorBankReady:
        section5.sponsorBankUpiReadiness.sponsorBankAppointed === 'yes' &&
        section5.sponsorBankUpiReadiness.agreementExecuted === 'yes',
      upiReady: section5.sponsorBankUpiReadiness.upiSetupComplete === 'yes',
      asbaReady: section5.asbaConfiguration.asbaApplicable === 'yes',
    },
    underwritingAggregates: {
      totalSharesCommitted: totalSharesCommitted || underwritingSummary.totalUnderwritingCommitment,
      totalAmountCommitted: totalAmountCommitted || underwritingSummary.totalUnderwritingCommitment,
      totalUnderwritingPercentage,
      uncoveredShares: subtractDecimals(issueShares, totalSharesCommitted || underwritingSummary.totalUnderwritingCommitment),
      uncoveredAmount: subtractDecimals(
        underwritingSummary.issueAmount,
        totalAmountCommitted || underwritingSummary.totalUnderwritingCommitment,
      ),
      ownAccountPercentage,
      ownAccountComparison: compareMerchantBankerOwnAccount(ownAccountPercentage),
      coverageComparison: compareUnderwritingCoverage(totalUnderwritingPercentage),
      overlappingCommitmentWarning: countOverlappingCommitments(payload),
    },
    marketMakingAggregates: {
      marketMakerAppointed: filledBoolean(section6.marketMakerConfiguration.marketMakerIntermediaryId),
      agreementExecuted: section6.marketMakerConfiguration.agreementExecuted === 'yes',
      reservationShares: section6.marketMakerReservation.reservedShares,
      configuredMinimumDays: MARKET_MAKING_MINIMUM_DAYS,
      reservationDiscrepancy: section6.marketMakerReservation.discrepancyWithIpoSetup,
    },
    programmeAggregates: {
      issueOpeningDate: section7.issueCalendar.issueOpeningDate,
      issueClosingDate: section7.issueCalendar.issueClosingDate,
      preliminaryTPlus3ListingDate: tPlus3.tPlus3,
      subscriptionRowCount: section7.subscriptionRows.length,
      postIssueActionsComplete: section7.postIssueActions.filter(
        (action) => action.status === 'complete',
      ).length,
      postIssueActionsTotal: section7.postIssueActions.length,
    },
    finalDocumentAggregates: {
      versionCount: getOfferDocumentVersions(payload).length,
      authoritativeVersionLabel: authoritative
        ? `${authoritative.type} ${authoritative.versionLabel}`.trim()
        : '',
      authoritativeVersionConflict: getAuthoritativeVersionConflictCount(payload) > 1,
      openPlaceholderCount: section8.placeholders.filter(
        (placeholder) => placeholder.status === 'open' || placeholder.status === 'in_progress',
      ).length,
      inspectionItemsPending: section8.inspectionItems.filter(
        (item) => item.inclusionStatus === 'pending_review',
      ).length,
      issueAgreementsPending: section8.issueAgreements.filter(
        (agreement) =>
          agreement.status !== 'executed' &&
          agreement.status !== 'not_applicable' &&
          agreement.status !== 'superseded',
      ).length,
      publicCommunicationsPending: section8.publicCommunications.filter(
        (communication) => communication.finalCopyAvailable !== 'yes',
      ).length,
    },
    reconciliation: buildReconciliationPreview(payload, linkedReferences),
    currentFilingStage: payload.issueConfigurationAndFilingSnapshot.filingSnapshot.filingStage,
  };
}

function filledBoolean(value: string): boolean {
  return value.trim().length > 0;
}

export function computeUnderwritingTotals(payload: IntermediariesFilingPayload): {
  totalShares: string;
  totalAmount: string;
  percentage: string;
} {
  const section = payload.underwritingMarketMakingAndDistributionArrangements;
  const totalShares = addDecimals(
    ...section.underwritingCommitments.map((commitment) => commitment.sharesUnderwritten),
  );
  const totalAmount = addDecimals(
    ...section.underwritingCommitments.map((commitment) => commitment.amountUnderwritten),
  );
  return {
    totalShares,
    totalAmount,
    percentage: divideDecimals(totalShares, section.underwritingSummary.issueShares) || '',
  };
}

export function hasApplicableLeadManager(payload: IntermediariesFilingPayload): boolean {
  return getIntermediaries(payload).some(hasLeadManagerRole);
}

export function isUnderwritingFullyCovered(model: IntermediariesFilingModel): boolean {
  const uncovered = parseDecimal(model.underwritingAggregates.uncoveredShares);
  return uncovered === null || uncovered <= 0;
}
