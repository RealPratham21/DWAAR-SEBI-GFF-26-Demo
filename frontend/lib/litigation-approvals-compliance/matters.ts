/**
 * Matter Master helpers — single canonical matter namespace.
 */

import type {
  LitigationApprovalsCompliancePayload,
  MatterCategory,
  MatterRecord,
} from '@/lib/schemas/litigation-approvals-compliance';

const CRIMINAL_MATTER_CATEGORIES: ReadonlySet<MatterCategory> = new Set([
  'criminal',
  'economic-offence',
]);

const TAX_MATTER_CATEGORIES: ReadonlySet<MatterCategory> = new Set(['tax']);

export function getMatters(payload: LitigationApprovalsCompliancePayload): MatterRecord[] {
  return payload.litigationAndProceedingsMaster.matters;
}

export function getMatterById(
  payload: LitigationApprovalsCompliancePayload,
  matterId: string,
): MatterRecord | undefined {
  if (!matterId) return undefined;
  return getMatters(payload).find((matter) => matter.matterId === matterId);
}

export function formatMatterLabel(matter: MatterRecord | undefined, fallbackId = ''): string {
  if (!matter) {
    return fallbackId ? `Unknown matter (${fallbackId.slice(0, 8)})` : 'Unknown matter';
  }

  const title = matter.identity.matterTitle.trim() || matter.identity.internalShortName.trim();
  const reference = matter.identity.caseReferenceNumber.trim();
  const category = matter.identity.category.replaceAll('-', ' ');

  const parts = [title, reference, category].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : matter.matterId.slice(0, 8);
}

export function isTaxMatter(matter: MatterRecord | undefined): boolean {
  if (!matter?.identity.category) return false;
  return TAX_MATTER_CATEGORIES.has(matter.identity.category);
}

export function isCriminalMatter(matter: MatterRecord | undefined): boolean {
  if (!matter?.identity.category) return false;
  return CRIMINAL_MATTER_CATEGORIES.has(matter.identity.category);
}
