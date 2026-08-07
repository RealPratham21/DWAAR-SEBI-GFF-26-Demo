/**
 * Cross-payload reference counting for director and person IDs.
 */

import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';

export type IdReferenceCounts = {
  directorId: string;
  total: number;
  locations: string[];
};

export type PersonReferenceCounts = {
  personId: string;
  total: number;
  locations: string[];
};

function pushCount(map: Map<string, { total: number; locations: string[] }>, id: string, location: string) {
  if (!id.trim()) return;
  const existing = map.get(id) ?? { total: 0, locations: [] };
  existing.total += 1;
  existing.locations.push(location);
  map.set(id, existing);
}

export function countDirectorReferences(
  payload: ManagementGovernancePayload,
  directorId: string,
): IdReferenceCounts {
  const map = new Map<string, { total: number; locations: string[] }>();
  const board = payload.boardStructureAndIpoGovernanceReadiness;

  if (board.leadership.chairmanDirectorId === directorId) {
    pushCount(map, directorId, 'Board leadership — Chairman');
  }
  if (board.leadership.managingDirectorDirectorId === directorId) {
    pushCount(map, directorId, 'Board leadership — Managing Director');
  }
  if (board.leadership.ceoDirectorId === directorId) {
    pushCount(map, directorId, 'Board leadership — CEO');
  }
  if (board.leadership.managerDirectorId === directorId) {
    pushCount(map, directorId, 'Board leadership — Manager');
  }
  if (board.leadership.leadIndependentDirectorId === directorId) {
    pushCount(map, directorId, 'Board leadership — Lead Independent Director');
  }
  for (const wtdId of board.leadership.wholeTimeDirectorIds) {
    if (wtdId === directorId) pushCount(map, directorId, 'Board leadership — Whole-Time Director');
  }
  if (board.ipoCommittee.chairpersonDirectorId === directorId) {
    pushCount(map, directorId, 'IPO Committee — Chairperson');
  }
  for (const memberId of board.ipoCommittee.memberDirectorIds) {
    if (memberId === directorId) pushCount(map, directorId, 'IPO Committee — Member');
  }

  for (const committee of payload.boardCommitteesAndGovernanceBodies.committees) {
    if (committee.chairpersonDirectorId === directorId) {
      pushCount(map, directorId, `Committee — ${committee.name || committee.committeeType} chair`);
    }
    for (const member of committee.members) {
      if (member.directorId === directorId) {
        pushCount(map, directorId, `Committee — ${committee.name || committee.committeeType} member`);
      }
    }
  }

  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.directorRemuneration) {
    if (row.directorId === directorId) pushCount(map, directorId, 'Director remuneration');
  }
  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.executiveAppointmentTerms) {
    if (row.directorId === directorId) pushCount(map, directorId, 'Executive appointment terms');
  }
  for (const row of payload.interestsConflictsAndManagementRelationships.directorOfferDocumentInterests) {
    if (row.directorId === directorId) pushCount(map, directorId, 'Offer-document interests');
  }
  for (const row of payload.changesContinuityAndSuccession.boardChanges) {
    if (row.directorId === directorId) pushCount(map, directorId, 'Board change record');
  }

  const entry = map.get(directorId);
  return {
    directorId,
    total: entry?.total ?? 0,
    locations: entry?.locations ?? [],
  };
}

export function countPersonReferences(
  payload: ManagementGovernancePayload,
  personId: string,
): PersonReferenceCounts {
  const map = new Map<string, { total: number; locations: string[] }>();

  for (const node of payload.kmpSeniorManagementAndOrganisationStructure.organisationStructure) {
    if (node.personId === personId) pushCount(map, personId, 'Organisation structure node');
    if (node.reportsToPersonId === personId) {
      pushCount(map, personId, 'Organisation structure — reports-to');
    }
    for (const reportId of node.directReports) {
      if (reportId === personId) pushCount(map, personId, 'Organisation structure — direct report');
    }
  }

  for (const kmp of payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords) {
    if (kmp.id === personId) pushCount(map, personId, 'KMP/SMP record');
    if (kmp.reportsToPersonId === personId) pushCount(map, personId, 'KMP/SMP — reports-to');
  }

  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.kmpSmpRemuneration) {
    if (row.personId === personId) pushCount(map, personId, 'KMP/SMP remuneration');
  }
  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.incentiveArrangements) {
    if (row.participantPersonId === personId) pushCount(map, personId, 'Incentive arrangement');
  }
  for (const row of payload.remunerationServiceContractsEsopsAndBenefits.serviceContractsAndBenefits) {
    if (row.personId === personId) pushCount(map, personId, 'Service contract / benefits');
  }

  for (const row of payload.interestsConflictsAndManagementRelationships.interestsInIssuer) {
    if (row.personId === personId) pushCount(map, personId, 'Interest in issuer');
  }
  for (const row of payload.interestsConflictsAndManagementRelationships.outsideInterests) {
    if (row.personId === personId) pushCount(map, personId, 'Outside interest');
  }
  for (const row of payload.interestsConflictsAndManagementRelationships.appointmentArrangements) {
    if (row.personId === personId) pushCount(map, personId, 'Appointment arrangement');
  }
  for (const row of payload.interestsConflictsAndManagementRelationships.financialArrangements) {
    if (row.personId === personId) pushCount(map, personId, 'Financial arrangement');
  }

  for (const row of payload.changesContinuityAndSuccession.kmpSmpChanges) {
    if (row.personId === personId) pushCount(map, personId, 'KMP/SMP change record');
  }
  for (const row of payload.changesContinuityAndSuccession.keyPersonDependencies) {
    if (row.personId === personId) pushCount(map, personId, 'Key-person dependency');
  }

  for (const rel of payload.kmpSeniorManagementAndOrganisationStructure.familyRelationships) {
    if (rel.personOneId === personId || rel.personTwoId === personId) {
      pushCount(map, personId, 'Family relationship');
    }
  }

  const entry = map.get(personId);
  return {
    personId,
    total: entry?.total ?? 0,
    locations: entry?.locations ?? [],
  };
}

export function countAllDirectorReferences(payload: ManagementGovernancePayload): IdReferenceCounts[] {
  const directorIds = new Set(
    payload.directorsProfilesAppointmentsAndEligibility.directors.map((d) => d.id),
  );
  return [...directorIds].map((id) => countDirectorReferences(payload, id));
}

export function countAllPersonReferences(payload: ManagementGovernancePayload): PersonReferenceCounts[] {
  const personIds = new Set(
    payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords.map((k) => k.id),
  );
  return [...personIds].map((id) => countPersonReferences(payload, id));
}
