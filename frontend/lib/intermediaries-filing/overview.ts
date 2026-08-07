/**
 * Overview summary derived from the in-memory Intermediaries & Filing draft (IF1).
 */

import {
  assessIntermediariesFiling,
  type IfAssessmentResponse,
} from '@/lib/intermediaries-filing/assessment';
import {
  computeIntermediariesFilingModel,
  type IntermediariesFilingModel,
} from '@/lib/intermediaries-filing/compute';
import { IF_SECTION_LABELS } from '@/lib/intermediaries-filing/options';
import { calculateIntermediariesFilingProgress } from '@/lib/intermediaries-filing/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type IfProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

export type IntermediariesFilingOverviewSummary = {
  sectionStatuses: IfProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: IfProgress['overallStatus'];
  currentFilingStage: string;
  targetSmePlatform: string;
  issueMethod: string;
  freshIssueAmount: string;
  ofsAmount: string;
  totalOfferAmount: string;
  currentPriceBandStatus: string;
  authoritativeDocumentVersion: string;
  intermediaryCount: number;
  leadManagerCount: number;
  activeIntermediaryCount: number;
  agreementsPendingCount: number;
  registrationsPendingReview: number;
  ddAreasSignedOff: number;
  ddAreasTotal: number;
  openDdAreas: number;
  certificatesReady: number;
  certificatesPending: number;
  consentsRequired: number;
  consentsReceived: number;
  chapterSignoffsComplete: number;
  chapterSignoffsTotal: number;
  filingCount: number;
  openExchangeQueries: number;
  overdueExchangeQueries: number;
  inPrincipleStatus: string;
  sebiSmeFilingStatus: string;
  rocFilingStatus: string;
  isinStatus: string;
  sponsorBankReady: boolean;
  upiReady: boolean;
  asbaReady: boolean;
  bankRolesReady: number;
  bankRolesTotal: number;
  underwritingCoverage: string;
  uncoveredShares: string;
  merchantBankerOwnAccountPercentage: string;
  marketMakerAppointed: boolean;
  marketMakingAgreementExecuted: boolean;
  marketMakingReservationStatus: string;
  issueOpeningDate: string;
  issueClosingDate: string;
  preliminaryTPlus3ListingDate: string;
  basisStatus: string;
  dematStatus: string;
  listingStatus: string;
  unresolvedPlaceholders: number;
  inspectionItemsPending: number;
  issueAgreementsPending: number;
  advertisementsPending: number;
  repositoryReadiness: string;
  reconciliationMismatchCount: number;
  assessmentConcerns: number;
  pendingProfessionalConfirmations: number;
  assessmentResult: IfAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: IntermediariesFilingSectionId; label: string }>;
};

export function buildOverviewSummary(
  payload: IntermediariesFilingPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): IntermediariesFilingOverviewSummary {
  const progress = calculateIntermediariesFilingProgress(payload);
  const model = computeIntermediariesFilingModel(payload, linkedReferences);
  const assessment = assessIntermediariesFiling(payload, linkedReferences);
  const config = payload.issueConfigurationAndFilingSnapshot;
  const section3 = payload.filingAndRegulatoryMilestoneTracker;
  const section8 =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [IntermediariesFilingSectionId, IfProgress['sections'][IntermediariesFilingSectionId]]
    >
  ).filter(([, status]) => status !== 'complete' && status !== 'not_applicable');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${IF_SECTION_LABELS[sectionId]}`,
  }));

  const assessmentConcerns =
    assessment.counts.potentialConcern +
    assessment.counts.exchangeQueryPending +
    assessment.counts.underwritingPending +
    assessment.counts.marketMakingPending +
    assessment.counts.issueInfrastructurePending +
    assessment.counts.listingActionPending;

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    currentFilingStage: progress.currentFilingStage,
    targetSmePlatform:
      config.ipoSetupLinkedSnapshot.targetSmePlatform ||
      linkedReferences.ipoSetup.targetSmePlatform ||
      '',
    issueMethod:
      config.ipoSetupLinkedSnapshot.issueMethod || linkedReferences.ipoSetup.issueMethod || '',
    freshIssueAmount: config.filingSnapshotReconciliation.freshIssueAmount,
    ofsAmount: config.filingSnapshotReconciliation.ofsAmount,
    totalOfferAmount: config.filingSnapshotReconciliation.totalOfferAmount,
    currentPriceBandStatus: config.pricing.priceBand || config.pricing.finalIssuePrice,
    authoritativeDocumentVersion: model.finalDocumentAggregates.authoritativeVersionLabel,
    intermediaryCount: model.intermediaryAggregates.totalCount,
    leadManagerCount: model.intermediaryAggregates.leadManagerCount,
    activeIntermediaryCount: model.intermediaryAggregates.activeCount,
    agreementsPendingCount: model.intermediaryAggregates.agreementPendingCount,
    registrationsPendingReview: model.intermediaryAggregates.registrationsPendingReview,
    ddAreasSignedOff: model.dueDiligenceAggregates.signedOffCount,
    ddAreasTotal: model.dueDiligenceAggregates.areaCount,
    openDdAreas:
      model.dueDiligenceAggregates.areaCount - model.dueDiligenceAggregates.signedOffCount,
    certificatesReady: model.certificateConsentAggregates.signedCertificateCount,
    certificatesPending: model.certificateConsentAggregates.certificatesPending,
    consentsRequired: model.certificateConsentAggregates.consentCount,
    consentsReceived: model.certificateConsentAggregates.consentsReceived,
    chapterSignoffsComplete: model.certificateConsentAggregates.chapterSignoffsComplete,
    chapterSignoffsTotal: model.certificateConsentAggregates.chapterSignoffsTotal,
    filingCount: model.filingAggregates.filingCount,
    openExchangeQueries: model.filingAggregates.openQueryCount,
    overdueExchangeQueries: model.filingAggregates.overdueQueryCount,
    inPrincipleStatus: section3.inPrincipleApproval.approvalReceived,
    sebiSmeFilingStatus: section3.sebiSmeFiling.status,
    rocFilingStatus: section3.rocFiling.filingComplete,
    isinStatus: model.infrastructureAggregates.isinStatus,
    sponsorBankReady: model.infrastructureAggregates.sponsorBankReady,
    upiReady: model.infrastructureAggregates.upiReady,
    asbaReady: model.infrastructureAggregates.asbaReady,
    bankRolesReady: model.infrastructureAggregates.configuredBankRoles,
    bankRolesTotal: model.infrastructureAggregates.requiredBankRoles,
    underwritingCoverage: model.underwritingAggregates.totalUnderwritingPercentage,
    uncoveredShares: model.underwritingAggregates.uncoveredShares,
    merchantBankerOwnAccountPercentage: model.underwritingAggregates.ownAccountPercentage,
    marketMakerAppointed: model.marketMakingAggregates.marketMakerAppointed,
    marketMakingAgreementExecuted: model.marketMakingAggregates.agreementExecuted,
    marketMakingReservationStatus:
      payload.underwritingMarketMakingAndDistributionArrangements.marketMakerReservation
        .allocationStatus,
    issueOpeningDate: model.programmeAggregates.issueOpeningDate,
    issueClosingDate: model.programmeAggregates.issueClosingDate,
    preliminaryTPlus3ListingDate: model.programmeAggregates.preliminaryTPlus3ListingDate,
    basisStatus:
      payload.issueProgrammeAllotmentListingAndPostIssueExecution.basisOfAllotment.basisPrepared,
    dematStatus:
      payload.issueProgrammeAllotmentListingAndPostIssueExecution.dematCredit.sharesCredited,
    listingStatus:
      payload.issueProgrammeAllotmentListingAndPostIssueExecution.listing.listingCompletionStatus,
    unresolvedPlaceholders: model.finalDocumentAggregates.openPlaceholderCount,
    inspectionItemsPending: model.finalDocumentAggregates.inspectionItemsPending,
    issueAgreementsPending: model.finalDocumentAggregates.issueAgreementsPending,
    advertisementsPending: model.finalDocumentAggregates.publicCommunicationsPending,
    repositoryReadiness:
      section8.merchantBankerDdRepositoryReadiness.uploadComplete === 'yes'
        ? 'complete'
        : section8.merchantBankerDdRepositoryReadiness.uploadProcessStarted === 'yes'
          ? 'in_progress'
          : 'not_started',
    reconciliationMismatchCount: model.reconciliation.totalMismatchCount,
    assessmentConcerns,
    pendingProfessionalConfirmations: assessment.counts.pendingProfessionalConfirmation,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
  };
}

export type { IntermediariesFilingModel };
