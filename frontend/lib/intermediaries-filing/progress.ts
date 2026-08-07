/**
 * Stage-aware section completion for Intermediaries & Filing.
 */

import { IF_CONFIRMATION_FIELDS } from '@/lib/intermediaries-filing/options';
import { isStageAtLeast } from '@/lib/intermediaries-filing/rules';
import type {
  IfProgress,
  IntermediariesFilingSectionId,
  SectionStatus,
} from '@/lib/intermediaries-filing/types';
import type { IntermediariesFilingPayload, FilingStage } from '@/lib/schemas/intermediaries-filing';

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

function getCurrentFilingStage(payload: IntermediariesFilingPayload): FilingStage | '' {
  return payload.issueConfigurationAndFilingSnapshot.filingSnapshot.filingStage;
}

export function evaluateIssueTeamStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section = payload.issueTeamAndIntermediaryMaster;
  const snapshot = section.issueTeamSnapshot;
  const core = [
    filled(snapshot.teamAsOfDate),
    filled(snapshot.leadManagerAppointed),
    section.intermediaries.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const intermediariesComplete = section.intermediaries.every(
    (intermediary) => filled(intermediary.legalName) || filled(intermediary.displayName),
  );
  return statusFrom(answered, core.length, intermediariesComplete);
}

export function evaluateIssueConfigurationStatus(
  payload: IntermediariesFilingPayload,
): SectionStatus {
  const section = payload.issueConfigurationAndFilingSnapshot;
  const core = [
    filled(section.filingSnapshot.snapshotDate),
    filled(section.filingSnapshot.filingStage),
    filled(section.filingSnapshot.currentOfferDocumentForm),
    filled(section.filingSnapshotReconciliation.filingConfirmationStatus),
  ];
  const answered = core.filter(Boolean).length;
  return statusFrom(answered, core.length);
}

export function evaluateFilingTrackerStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section = payload.filingAndRegulatoryMilestoneTracker;
  const hasData =
    section.filings.length > 0 ||
    filled(section.exchangeDraftFiling.exchange) ||
    filled(section.inPrincipleApproval.applied) ||
    filled(section.sebiSmeFiling.filingApplicability) ||
    filled(section.rocFiling.filingDate);
  if (!hasData) return 'not_started';

  const filingsComplete = section.filings.every(
    (filing) => filled(filing.documentType) || filled(filing.filingDate),
  );
  return filingsComplete ? 'complete' : 'in_progress';
}

export function evaluateDueDiligenceStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section = payload.dueDiligenceCertificatesConsentsAndSignoffs;
  const hasData =
    section.dueDiligenceAreas.length > 0 ||
    section.certificates.length > 0 ||
    section.consents.length > 0 ||
    section.chapterSignoffs.length > 0;
  if (!hasData) return 'not_started';

  const certificatesComplete = section.certificates.every(
    (certificate) => filled(certificate.certificateType) || filled(certificate.provider),
  );
  return certificatesComplete ? 'complete' : 'in_progress';
}

export function evaluateInfrastructureStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section = payload.depositoriesBankingAsbaUpiAndIssueInfrastructure;
  const core = [
    filled(section.depositoryReadiness.isinStatus),
    filled(section.sponsorBankUpiReadiness.sponsorBankAppointed),
    filled(section.asbaConfiguration.asbaApplicable),
    section.issueBankRoles.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  if (answered === 0) return 'not_started';
  return statusFrom(answered, core.length);
}

export function evaluateUnderwritingStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section = payload.underwritingMarketMakingAndDistributionArrangements;
  const summary = section.underwritingSummary;
  const hasData =
    filled(summary.issueShares) ||
    filled(summary.totalUnderwritingCommitment) ||
    section.underwritingCommitments.length > 0 ||
    filled(section.marketMakerConfiguration.marketMakerIntermediaryId);
  if (!hasData) return 'not_started';

  const commitmentsComplete = section.underwritingCommitments.every(
    (commitment) => filled(commitment.intermediaryId) || filled(commitment.sharesUnderwritten),
  );
  return commitmentsComplete ? 'complete' : 'in_progress';
}

export function evaluateIssueProgrammeStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const stage = getCurrentFilingStage(payload);
  const section = payload.issueProgrammeAllotmentListingAndPostIssueExecution;

  if (!isStageAtLeast(stage, 'issue_open')) {
    const calendarStarted =
      filled(section.issueCalendar.issueOpeningDate) ||
      filled(section.issueCalendar.issueClosingDate);
    return calendarStarted ? 'in_progress' : 'not_started';
  }

  if (!isStageAtLeast(stage, 'issue_closed')) {
    const openingReadiness = section.issueOpeningReadiness;
    const answered = [
      openingReadiness.rhpProspectusRocFilingReady,
      openingReadiness.pricingFinalized,
      openingReadiness.registrarReady,
    ].filter((value) => value !== '').length;
    return answered === 0 ? 'not_started' : answered < 3 ? 'in_progress' : 'complete';
  }

  if (!isStageAtLeast(stage, 'allotment')) {
    return section.subscriptionRows.length > 0 ? 'in_progress' : 'not_yet_due';
  }

  if (!isStageAtLeast(stage, 'listing_application')) {
    const basis = section.basisOfAllotment;
    const answered = [basis.basisPrepared, basis.allotmentFinalized, basis.exchangeApprovalReceived]
      .filter((value) => value !== '').length;
    return answered === 0 ? 'not_yet_due' : answered < 3 ? 'in_progress' : 'complete';
  }

  const listingStarted =
    filled(section.listing.finalListingApplicationSubmitted) ||
    filled(section.listing.listingDate);
  return listingStarted ? 'in_progress' : 'not_yet_due';
}

export function evaluateFinalDocumentStatus(payload: IntermediariesFilingPayload): SectionStatus {
  const section =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;
  const confirmations = section.finalConfirmations;
  const answered = IF_CONFIRMATION_FIELDS.filter((field) => confirmations[field.key] !== '').length;
  if (answered === 0 && section.offerDocumentVersions.length === 0) return 'not_started';
  if (answered < IF_CONFIRMATION_FIELDS.length) return 'in_progress';
  return 'complete';
}

const SECTION_EVALUATORS: Record<
  IntermediariesFilingSectionId,
  (payload: IntermediariesFilingPayload) => SectionStatus
> = {
  'issue-team-and-intermediary-master': evaluateIssueTeamStatus,
  'issue-configuration-and-filing-snapshot': evaluateIssueConfigurationStatus,
  'filing-and-regulatory-milestone-tracker': evaluateFilingTrackerStatus,
  'due-diligence-certificates-consents-and-signoffs': evaluateDueDiligenceStatus,
  'depositories-banking-asba-upi-and-issue-infrastructure': evaluateInfrastructureStatus,
  'underwriting-market-making-and-distribution-arrangements': evaluateUnderwritingStatus,
  'issue-programme-allotment-listing-and-post-issue-execution': evaluateIssueProgrammeStatus,
  'final-offer-document-advertisements-material-documents-and-filing-readiness':
    evaluateFinalDocumentStatus,
};

function deriveOverallStatus(sections: Record<IntermediariesFilingSectionId, SectionStatus>): SectionStatus {
  const values = Object.values(sections);
  const actionable = values.filter(
    (status) => status !== 'not_yet_due' && status !== 'not_applicable',
  );
  if (actionable.length === 0) return 'not_started';
  const completeCount = actionable.filter((status) => status === 'complete').length;
  if (completeCount === 0) return 'not_started';
  if (completeCount === actionable.length) return 'complete';
  return 'in_progress';
}

export function calculateIntermediariesFilingProgress(
  payload: IntermediariesFilingPayload,
): IfProgress {
  const sections = Object.fromEntries(
    (Object.keys(SECTION_EVALUATORS) as IntermediariesFilingSectionId[]).map((sectionId) => [
      sectionId,
      SECTION_EVALUATORS[sectionId](payload),
    ]),
  ) as IfProgress['sections'];

  const sectionsComplete = Object.values(sections).filter((status) => status === 'complete').length;

  return {
    sections,
    sectionsComplete,
    totalSections: Object.keys(sections).length,
    overallStatus: deriveOverallStatus(sections),
    currentFilingStage: getCurrentFilingStage(payload),
  };
}
