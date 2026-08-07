/**
 * Intermediary Master helpers — single canonical intermediary namespace.
 */

import type {
  IntermediariesFilingPayload,
  IntermediaryRecord,
  IntermediaryRole,
} from '@/lib/schemas/intermediaries-filing';

const LEAD_MANAGER_ROLES: ReadonlySet<IntermediaryRole> = new Set([
  'lead_manager',
  'book_running_lead_manager',
  'additional_lead_manager',
]);

export function getIntermediaries(payload: IntermediariesFilingPayload): IntermediaryRecord[] {
  return payload.issueTeamAndIntermediaryMaster.intermediaries;
}

export function getIntermediaryById(
  payload: IntermediariesFilingPayload,
  intermediaryId: string,
): IntermediaryRecord | undefined {
  if (!intermediaryId) return undefined;
  return getIntermediaries(payload).find(
    (intermediary) => intermediary.intermediaryId === intermediaryId,
  );
}

export function formatIntermediaryLabel(
  intermediary: IntermediaryRecord | undefined,
  fallbackId = '',
): string {
  if (!intermediary) {
    return fallbackId ? `Unknown intermediary (${fallbackId.slice(0, 8)})` : 'Unknown intermediary';
  }

  const display = intermediary.displayName.trim() || intermediary.legalName.trim();
  const roles = intermediary.roles.map((role) => role.replaceAll('_', ' ')).join(', ');
  const parts = [display, roles].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : intermediary.intermediaryId.slice(0, 8);
}

export function hasLeadManagerRole(intermediary: IntermediaryRecord | undefined): boolean {
  if (!intermediary) return false;
  return intermediary.roles.some((role) => LEAD_MANAGER_ROLES.has(role));
}

export function getLeadManagers(payload: IntermediariesFilingPayload): IntermediaryRecord[] {
  return getIntermediaries(payload).filter(hasLeadManagerRole);
}
