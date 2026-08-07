/**
 * Director master helpers for Management & Governance.
 */

import type { DirectorRecord, ManagementGovernancePayload } from '@/lib/schemas/management-governance';

export type DirectorCategoryCounts = {
  total: number;
  current: number;
  proposed: number;
  executive: number;
  nonExecutive: number;
  independent: number;
  nominee: number;
  promoter: number;
  women: number;
  resident: number;
};

export type DirectorshipCounts = {
  totalCurrent: number;
  currentPublicCompany: number;
};

export type DirectorDeletionValidation = {
  canDelete: boolean;
  dependencies: string[];
};

export function getDirectors(payload: ManagementGovernancePayload): DirectorRecord[] {
  return payload.directorsProfilesAppointmentsAndEligibility.directors;
}

export function getDirectorById(
  payload: ManagementGovernancePayload,
  directorId: string,
): DirectorRecord | undefined {
  return getDirectors(payload).find((director) => director.id === directorId);
}

function isCurrentDirector(director: DirectorRecord): boolean {
  return director.appointmentStatus === 'current' || director.appointmentStatus === '';
}

function isIndependentDirector(director: DirectorRecord): boolean {
  return (
    director.designation === 'independent-director' ||
    director.independentStatus === 'yes'
  );
}

function isWomanDirector(director: DirectorRecord): boolean {
  return director.gender === 'female';
}

function isResidentDirector(director: DirectorRecord): boolean {
  const residence = director.countryOfResidence.trim().toLowerCase();
  return residence === 'india' || residence === 'in';
}

export function countByCategory(payload: ManagementGovernancePayload): DirectorCategoryCounts {
  const directors = getDirectors(payload);
  const currentDirectors = directors.filter(isCurrentDirector);

  return {
    total: directors.length,
    current: currentDirectors.length,
    proposed: directors.filter((d) => d.appointmentStatus.startsWith('proposed')).length,
    executive: currentDirectors.filter((d) => d.executiveNonExecutive === 'executive').length,
    nonExecutive: currentDirectors.filter((d) => d.executiveNonExecutive === 'non-executive')
      .length,
    independent: currentDirectors.filter(isIndependentDirector).length,
    nominee: currentDirectors.filter(
      (d) => d.designation === 'nominee-director' || d.nomineeStatus === 'yes',
    ).length,
    promoter: currentDirectors.filter((d) => d.promoterStatus === 'yes').length,
    women: currentDirectors.filter(isWomanDirector).length,
    resident: currentDirectors.filter(isResidentDirector).length,
  };
}

export function computeDirectorshipCounts(director: DirectorRecord): DirectorshipCounts {
  const current = director.otherDirectorships.filter((d) => d.currentOrCeased === 'current');
  return {
    totalCurrent: current.length,
    currentPublicCompany: current.filter(
      (d) =>
        d.entityListingStatus === 'public-listed' || d.entityListingStatus === 'public-unlisted',
    ).length,
  };
}

export function computeAgeFromDob(dateOfBirth: string): string {
  if (!dateOfBirth.trim()) return '';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return String(age);
}

export function validateDirectorDeletion(
  payload: ManagementGovernancePayload,
  directorId: string,
): DirectorDeletionValidation {
  const dependencies: string[] = [];
  const board = payload.boardStructureAndIpoGovernanceReadiness;

  if (board.leadership.chairmanDirectorId === directorId) {
    dependencies.push('Board leadership — Chairman');
  }
  if (board.leadership.managingDirectorDirectorId === directorId) {
    dependencies.push('Board leadership — Managing Director');
  }
  if (board.leadership.ceoDirectorId === directorId) {
    dependencies.push('Board leadership — CEO');
  }
  if (board.leadership.leadIndependentDirectorId === directorId) {
    dependencies.push('Board leadership — Lead Independent Director');
  }
  if (board.leadership.wholeTimeDirectorIds.includes(directorId)) {
    dependencies.push('Board leadership — Whole-Time Director');
  }
  if (board.ipoCommittee.chairpersonDirectorId === directorId) {
    dependencies.push('IPO Committee — Chairperson');
  }
  if (board.ipoCommittee.memberDirectorIds.includes(directorId)) {
    dependencies.push('IPO Committee — Member');
  }

  for (const committee of payload.boardCommitteesAndGovernanceBodies.committees) {
    if (committee.chairpersonDirectorId === directorId) {
      dependencies.push(`Committee "${committee.name || committee.committeeType}" — Chairperson`);
    }
    for (const member of committee.members) {
      if (member.directorId === directorId) {
        dependencies.push(`Committee "${committee.name || committee.committeeType}" — Member`);
      }
    }
  }

  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.directorRemuneration) {
    if (row.directorId === directorId) dependencies.push('Director remuneration record');
  }
  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.executiveAppointmentTerms) {
    if (row.directorId === directorId) dependencies.push('Executive appointment terms');
  }
  for (const row of payload.interestsConflictsAndManagementRelationships.directorOfferDocumentInterests) {
    if (row.directorId === directorId) dependencies.push('Director offer-document interests');
  }
  for (const row of payload.changesContinuityAndSuccession.boardChanges) {
    if (row.directorId === directorId) dependencies.push('Board change record');
  }

  const kmpLinked = payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords.some(
    (k) => k.linkedDirectorId === directorId,
  );
  if (kmpLinked) dependencies.push('Linked KMP/SMP record');

  return {
    canDelete: dependencies.length === 0,
    dependencies: [...new Set(dependencies)],
  };
}
