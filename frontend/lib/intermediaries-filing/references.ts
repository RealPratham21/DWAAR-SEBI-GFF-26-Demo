/**
 * Cross-record reference integrity for Intermediaries & Filing.
 */

import { formatDocumentVersionLabel, formatFilingLabel, getFilingById } from '@/lib/intermediaries-filing/filings';
import {
  formatIntermediaryLabel,
  getIntermediaryById,
} from '@/lib/intermediaries-filing/intermediaries';
import { IF_SECTION_LABELS } from '@/lib/intermediaries-filing/options';
import type { IfDependency, IfDependencyCategory } from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

function push(
  deps: IfDependency[],
  category: IfDependencyCategory,
  recordId: string,
  sectionId: IntermediariesFilingSectionId,
  label: string,
) {
  deps.push({ category, recordId, sectionId, label });
}

export function countIntermediaryReferences(
  payload: IntermediariesFilingPayload,
  intermediaryId: string,
): IfDependency[] {
  if (!intermediaryId) return [];
  const deps: IfDependency[] = [];

  const section1 = payload.issueTeamAndIntermediaryMaster;
  for (const responsibility of section1.interSeResponsibilities) {
    if (responsibility.intermediaryId === intermediaryId) {
      push(
        deps,
        'inter-se-responsibility',
        responsibility.responsibilityId,
        'issue-team-and-intermediary-master',
        'Inter-se responsibility → Intermediary',
      );
    }
  }

  if (section1.interSeAgreement.coordinatingLeadManagerIntermediaryId === intermediaryId) {
    push(
      deps,
      'inter-se-responsibility',
      section1.interSeAgreement.coordinatingLeadManagerIntermediaryId,
      'issue-team-and-intermediary-master',
      'Inter-se agreement coordinating Lead Manager → Intermediary',
    );
  }

  for (const intermediary of section1.intermediaries) {
    if (intermediary.appointment.replacementIntermediaryId === intermediaryId) {
      push(
        deps,
        'inter-se-responsibility',
        intermediary.intermediaryId,
        'issue-team-and-intermediary-master',
        'Replacement intermediary reference → Intermediary',
      );
    }
  }

  const section3 = payload.filingAndRegulatoryMilestoneTracker;
  for (const filing of section3.filings) {
    if (filing.responsibleLeadManagerIntermediaryId === intermediaryId) {
      push(
        deps,
        'filing-record',
        filing.filingId,
        'filing-and-regulatory-milestone-tracker',
        'Filing → responsible Lead Manager',
      );
    }
  }

  for (const query of section3.exchangeQueries) {
    if (query.responsibleLeadManagerIntermediaryId === intermediaryId) {
      push(
        deps,
        'exchange-query',
        query.queryId,
        'filing-and-regulatory-milestone-tracker',
        'Exchange query → responsible Lead Manager',
      );
    }
  }

  const section4 = payload.dueDiligenceCertificatesConsentsAndSignoffs;
  for (const area of section4.dueDiligenceAreas) {
    if (area.responsibleProfessionalIntermediaryId === intermediaryId) {
      push(
        deps,
        'certificate',
        area.dueDiligenceAreaId,
        'due-diligence-certificates-consents-and-signoffs',
        'DD area → responsible professional',
      );
    }
  }

  for (const certificate of section4.certificates) {
    if (certificate.linkedIntermediaryId === intermediaryId) {
      push(
        deps,
        'certificate',
        certificate.certificateId,
        'due-diligence-certificates-consents-and-signoffs',
        'Certificate → Intermediary',
      );
    }
  }

  for (const consent of section4.consents) {
    if (consent.linkedPersonIntermediaryId === intermediaryId) {
      push(
        deps,
        'consent',
        consent.consentId,
        'due-diligence-certificates-consents-and-signoffs',
        'Consent → Intermediary/person',
      );
    }
  }

  for (const signoff of section4.chapterSignoffs) {
    if (signoff.responsibleAdviserIntermediaryId === intermediaryId) {
      push(
        deps,
        'chapter-signoff',
        signoff.signoffId,
        'due-diligence-certificates-consents-and-signoffs',
        'Chapter sign-off → adviser Intermediary',
      );
    }
  }

  const section5 = payload.depositoriesBankingAsbaUpiAndIssueInfrastructure;
  for (const agreement of [section5.depositoryAgreements.nsdl, section5.depositoryAgreements.cdsl]) {
    if (agreement.registrarIntermediaryId === intermediaryId) {
      push(
        deps,
        'issue-bank-role',
        agreement.registrarIntermediaryId,
        'depositories-banking-asba-upi-and-issue-infrastructure',
        'Depository agreement → Registrar Intermediary',
      );
    }
  }

  for (const bankRole of section5.issueBankRoles) {
    if (bankRole.intermediaryId === intermediaryId) {
      push(
        deps,
        'issue-bank-role',
        bankRole.bankRoleId,
        'depositories-banking-asba-upi-and-issue-infrastructure',
        'Issue bank role → Intermediary',
      );
    }
  }

  if (section5.sponsorBankUpiReadiness.intermediaryId === intermediaryId) {
    push(
      deps,
      'issue-bank-role',
      section5.sponsorBankUpiReadiness.intermediaryId,
      'depositories-banking-asba-upi-and-issue-infrastructure',
      'Sponsor Bank readiness → Intermediary',
    );
  }

  const section6 = payload.underwritingMarketMakingAndDistributionArrangements;
  for (const commitment of section6.underwritingCommitments) {
    if (commitment.intermediaryId === intermediaryId) {
      push(
        deps,
        'underwriting-commitment',
        commitment.underwritingCommitmentId,
        'underwriting-market-making-and-distribution-arrangements',
        'Underwriting commitment → Intermediary',
      );
    }
  }

  for (const investor of section6.nominatedInvestors) {
    if (investor.linkedIntermediaryEntityId === intermediaryId) {
      push(
        deps,
        'nominated-investor',
        investor.nominatedInvestorId,
        'underwriting-market-making-and-distribution-arrangements',
        'Nominated investor → linked entity',
      );
    }
  }

  if (section6.marketMakerConfiguration.marketMakerIntermediaryId === intermediaryId) {
    push(
      deps,
      'underwriting-commitment',
      section6.marketMakerConfiguration.marketMakerIntermediaryId,
      'underwriting-market-making-and-distribution-arrangements',
      'Market Maker configuration → Intermediary',
    );
  }

  const section7 = payload.issueProgrammeAllotmentListingAndPostIssueExecution;
  for (const action of section7.postIssueActions) {
    if (action.responsibleIntermediaryId === intermediaryId) {
      push(
        deps,
        'post-issue-action',
        action.postIssueActionId,
        'issue-programme-allotment-listing-and-post-issue-execution',
        'Post-issue action → responsible Intermediary',
      );
    }
  }

  const section8 =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;
  if (
    section8.merchantBankerDdRepositoryReadiness.responsibleLeadManagerIntermediaryId ===
    intermediaryId
  ) {
    push(
      deps,
      'certificate',
      section8.merchantBankerDdRepositoryReadiness.responsibleLeadManagerIntermediaryId,
      'final-offer-document-advertisements-material-documents-and-filing-readiness',
      'DD repository readiness → responsible Lead Manager',
    );
  }

  for (const agreement of section8.issueAgreements) {
    if (agreement.linkedIntermediaryIds.includes(intermediaryId)) {
      push(
        deps,
        'issue-agreement',
        agreement.issueAgreementId,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
        'Issue agreement → Intermediary',
      );
    }
  }

  return deps;
}

export function countFilingReferences(
  payload: IntermediariesFilingPayload,
  filingId: string,
): IfDependency[] {
  if (!filingId) return [];
  const deps: IfDependency[] = [];
  const section3 = payload.filingAndRegulatoryMilestoneTracker;

  for (const query of section3.exchangeQueries) {
    if (query.filingId === filingId) {
      push(
        deps,
        'exchange-query',
        query.queryId,
        'filing-and-regulatory-milestone-tracker',
        'Exchange query → Filing',
      );
    }
  }

  for (const resubmission of section3.resubmissions) {
    if (resubmission.linkedFilingId === filingId || resubmission.newFilingId === filingId) {
      push(
        deps,
        'resubmission',
        resubmission.resubmissionId,
        'filing-and-regulatory-milestone-tracker',
        'Resubmission → Filing',
      );
    }
  }

  for (const filing of section3.filings) {
    if (filing.supersededByFilingId === filingId) {
      push(
        deps,
        'filing-record',
        filing.filingId,
        'filing-and-regulatory-milestone-tracker',
        'Filing superseded-by reference → Filing',
      );
    }
  }

  if (section3.sebiSmeFiling.linkedFilingId === filingId) {
    push(
      deps,
      'filing-record',
      section3.sebiSmeFiling.linkedFilingId,
      'filing-and-regulatory-milestone-tracker',
      'SEBI SME filing → linked Filing',
    );
  }

  return deps;
}

export function countDocumentVersionReferences(
  payload: IntermediariesFilingPayload,
  documentVersionId: string,
): IfDependency[] {
  if (!documentVersionId) return [];
  const deps: IfDependency[] = [];

  for (const filing of payload.filingAndRegulatoryMilestoneTracker.filings) {
    if (filing.linkedDocumentVersionId === documentVersionId) {
      push(
        deps,
        'filing-record',
        filing.filingId,
        'filing-and-regulatory-milestone-tracker',
        'Filing → document version',
      );
    }
  }

  const section4 = payload.dueDiligenceCertificatesConsentsAndSignoffs;
  for (const certificate of section4.certificates) {
    if (certificate.linkedOfferDocumentVersionId === documentVersionId) {
      push(
        deps,
        'certificate',
        certificate.certificateId,
        'due-diligence-certificates-consents-and-signoffs',
        'Certificate → document version',
      );
    }
  }

  for (const consent of section4.consents) {
    if (consent.linkedOfferDocumentVersionId === documentVersionId) {
      push(
        deps,
        'consent',
        consent.consentId,
        'due-diligence-certificates-consents-and-signoffs',
        'Consent → document version',
      );
    }
  }

  const section8 =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;

  for (const version of section8.offerDocumentVersions) {
    if (version.supersedesDocumentVersionId === documentVersionId) {
      push(
        deps,
        'placeholder',
        version.documentVersionId,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
        'Document version supersedes reference → document version',
      );
    }
  }

  for (const placeholder of section8.placeholders) {
    if (placeholder.documentVersionId === documentVersionId) {
      push(
        deps,
        'placeholder',
        placeholder.placeholderId,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
        'Placeholder → document version',
      );
    }
  }

  for (const communication of section8.publicCommunications) {
    if (communication.linkedDocumentVersionId === documentVersionId) {
      push(
        deps,
        'public-communication',
        communication.communicationId,
        'final-offer-document-advertisements-material-documents-and-filing-readiness',
        'Public communication → document version',
      );
    }
  }

  if (section8.audiovisualPresentation.linkedOfferDocumentVersionId === documentVersionId) {
    push(
      deps,
      'public-communication',
      section8.audiovisualPresentation.linkedOfferDocumentVersionId,
      'final-offer-document-advertisements-material-documents-and-filing-readiness',
      'Audiovisual presentation → document version',
    );
  }

  return deps;
}

export function formatIntermediaryDependencyMessage(
  payload: IntermediariesFilingPayload,
  intermediaryId: string,
  deps: IfDependency[],
): string {
  if (deps.length === 0) return '';
  const intermediary = getIntermediaryById(payload, intermediaryId);
  const label = formatIntermediaryLabel(intermediary, intermediaryId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => IF_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatFilingDependencyMessage(
  payload: IntermediariesFilingPayload,
  filingId: string,
  deps: IfDependency[],
): string {
  if (deps.length === 0) return '';
  const filing = getFilingById(payload, filingId);
  const label = formatFilingLabel(filing, filingId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => IF_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatDocumentVersionDependencyMessage(
  payload: IntermediariesFilingPayload,
  documentVersionId: string,
  deps: IfDependency[],
): string {
  if (deps.length === 0) return '';
  const version = payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness.offerDocumentVersions.find(
    (record) => record.documentVersionId === documentVersionId,
  );
  const label = formatDocumentVersionLabel(version, documentVersionId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => IF_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}
