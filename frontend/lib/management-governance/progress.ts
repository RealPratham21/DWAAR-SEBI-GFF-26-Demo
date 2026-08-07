/**
 * Section completion for Management & Governance.
 */

import {
  MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS,
  MANAGEMENT_GOVERNANCE_SECTION_LABELS,
} from '@/lib/management-governance/options';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceProgress,
  ManagementGovernanceSectionId,
  SectionStatus,
} from '@/lib/management-governance/types';

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

export function evaluateBoardStructureStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.boardStructureAndIpoGovernanceReadiness;
  const core = [
    filled(section.boardSnapshot.asOfDate),
    filled(section.boardSnapshot.companyStatus),
    filled(section.leadership.chairmanDirectorId) || filled(section.leadership.managingDirectorDirectorId),
    filled(section.governanceReadiness.publicCompanyConversion),
    filled(section.governanceReadiness.independentDirectorAppointments),
    filled(section.governanceReadiness.womanDirectorAppointment),
  ];
  const answered = core.filter(Boolean).length;
  const readinessComplete = Object.values(section.governanceReadiness).some(
    (v) => typeof v === 'string' && v.trim() !== '',
  );
  return statusFrom(answered, core.length, readinessComplete);
}

export function evaluateDirectorsStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.directorsProfilesAppointmentsAndEligibility;
  const core = [section.directors.length > 0];
  const answered = core.filter(Boolean).length;
  const directorsComplete = section.directors.every(
    (d) => filled(d.fullLegalName) && filled(d.designation) && filled(d.appointmentStatus),
  );
  const eligibilityComplete = section.directors.every(
    (d) =>
      filled(d.eligibility.dinActive) &&
      (d.designation !== 'independent-director' ||
        filled(d.independentDirectorDetails.independenceDeclarationReceived)),
  );
  return statusFrom(answered, core.length, directorsComplete && eligibilityComplete);
}

export function evaluateKmpStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.kmpSeniorManagementAndOrganisationStructure;
  const core = [
    section.kmpSmpRecords.length > 0,
    filled(section.kmpRoleReadiness.cfo) || filled(section.kmpRoleReadiness.companySecretary),
    section.organisationStructure.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const kmpComplete = section.kmpSmpRecords.every(
    (k) => filled(k.fullName) && filled(k.classification) && filled(k.designation),
  );
  const readinessComplete = [
    section.kmpRoleReadiness.mdCeoManagerWtd,
    section.kmpRoleReadiness.cfo,
    section.kmpRoleReadiness.companySecretary,
  ].every(filled);
  return statusFrom(answered, core.length, kmpComplete && readinessComplete);
}

export function evaluateCommitteesStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.boardCommitteesAndGovernanceBodies;
  const core = [section.committees.length > 0];
  const answered = core.filter(Boolean).length;
  const committeesComplete = section.committees.every(
    (c) => filled(c.committeeType) && filled(c.applicability) && c.members.length > 0,
  );
  return statusFrom(answered, core.length, committeesComplete);
}

export function evaluateRemunerationStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.remunerationServiceContractsEsopsAndBenefits;
  const core = [
    section.directorRemuneration.length > 0 ||
      section.kmpSmpRemuneration.length > 0 ||
      filled(section.esopGovernance.esopSchemeExists),
    section.executiveAppointmentTerms.length > 0 || section.incentiveArrangements.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const remunerationComplete = section.directorRemuneration.every(
    (r) => filled(r.directorId) && filled(r.financialYear),
  );
  return statusFrom(answered, core.length, remunerationComplete);
}

export function evaluateInterestsStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.interestsConflictsAndManagementRelationships;
  const core = [
    section.interestsInIssuer.length > 0 ||
      section.outsideInterests.length > 0 ||
      section.appointmentArrangements.length > 0,
    section.directorOfferDocumentInterests.length > 0 || section.financialArrangements.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  return statusFrom(answered, core.length, answered === core.length);
}

export function evaluateContinuityStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.changesContinuityAndSuccession;
  const core = [
    section.boardChanges.length > 0 || section.kmpSmpChanges.length > 0,
    filled(section.successionReadiness.formalSuccessionPlan),
    section.keyPersonDependencies.length > 0 || filled(section.successionReadiness.criticalRolesIdentified),
  ];
  const answered = core.filter(Boolean).length;
  const changesComplete = section.boardChanges.every(
    (c) => filled(c.directorId) && filled(c.event) && filled(c.effectiveDate),
  );
  return statusFrom(answered, core.length, changesComplete);
}

export function evaluateGovernancePoliciesStatus(payload: ManagementGovernancePayload): SectionStatus {
  const section = payload.governancePoliciesRptOversightAndConfirmations;
  const confirmationsChecked = MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS.filter(
    (field) => section.confirmations[field.key],
  ).length;
  const core = [
    section.governancePolicies.length > 0,
    filled(section.rptGovernance.regulation23ApplicabilityStatus),
    filled(section.boardProcessReadiness.boardMeetingCalendar),
    confirmationsChecked > 0,
  ];
  const answered = core.filter(Boolean).length;
  const policiesComplete = section.governancePolicies.every(
    (p) => filled(p.policyType) && filled(p.adoptedStatus),
  );
  const confirmationsComplete =
    confirmationsChecked === MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS.length;
  return statusFrom(answered, core.length, policiesComplete && confirmationsComplete);
}

export function calculateManagementGovernanceProgress(
  payload: ManagementGovernancePayload,
): ManagementGovernanceProgress {
  const sections: Record<ManagementGovernanceSectionId, SectionStatus> = {
    'board-structure-and-ipo-governance-readiness': evaluateBoardStructureStatus(payload),
    'directors-profiles-appointments-and-eligibility': evaluateDirectorsStatus(payload),
    'kmp-senior-management-and-organisation-structure': evaluateKmpStatus(payload),
    'board-committees-and-governance-bodies': evaluateCommitteesStatus(payload),
    'remuneration-service-contracts-esops-and-benefits': evaluateRemunerationStatus(payload),
    'interests-conflicts-and-management-relationships': evaluateInterestsStatus(payload),
    'changes-continuity-and-succession': evaluateContinuityStatus(payload),
    'governance-policies-rpt-oversight-and-confirmations': evaluateGovernancePoliciesStatus(payload),
  };

  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listIncompleteManagementGovernanceSections(payload: ManagementGovernancePayload): string[] {
  const progress = calculateManagementGovernanceProgress(payload);
  const incomplete: string[] = [];
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [ManagementGovernanceSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      incomplete.push(`${MANAGEMENT_GOVERNANCE_SECTION_LABELS[id]} incomplete`);
    }
  }
  return incomplete;
}
