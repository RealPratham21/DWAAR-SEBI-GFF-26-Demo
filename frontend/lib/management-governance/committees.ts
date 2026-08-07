/**
 * Committee validation helpers for Management & Governance.
 */

import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';
import { getDirectorById } from '@/lib/management-governance/directors';

export type CommitteeMemberRefValidation = {
  valid: boolean;
  invalidDirectorIds: string[];
  messages: string[];
};

export type CommitteeDeletionValidation = {
  canDelete: boolean;
  dependencies: string[];
};

export function validateCommitteeMemberRefs(
  payload: ManagementGovernancePayload,
  committeeId: string,
): CommitteeMemberRefValidation {
  const committee = payload.boardCommitteesAndGovernanceBodies.committees.find(
    (c) => c.id === committeeId,
  );
  if (!committee) {
    return { valid: true, invalidDirectorIds: [], messages: [] };
  }

  const invalidDirectorIds: string[] = [];
  const messages: string[] = [];

  if (committee.chairpersonDirectorId.trim()) {
    const chair = getDirectorById(payload, committee.chairpersonDirectorId);
    if (!chair) {
      invalidDirectorIds.push(committee.chairpersonDirectorId);
      messages.push('Chairperson references a director that does not exist.');
    }
  }

  for (const member of committee.members) {
    if (!member.directorId.trim()) continue;
    const director = getDirectorById(payload, member.directorId);
    if (!director) {
      invalidDirectorIds.push(member.directorId);
      messages.push(`Member references missing director ID: ${member.directorId}`);
    }
  }

  return {
    valid: invalidDirectorIds.length === 0,
    invalidDirectorIds: [...new Set(invalidDirectorIds)],
    messages,
  };
}

export function validateCommitteeDeletion(
  _payload: ManagementGovernancePayload,
  _committeeId: string,
): CommitteeDeletionValidation {
  return { canDelete: true, dependencies: [] };
}
