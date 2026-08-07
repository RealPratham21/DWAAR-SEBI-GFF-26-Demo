/**
 * Facility Master helpers — single canonical facility namespace.
 */

import type {
  BorrowingsAssetsContractsPayload,
  FacilityRecord,
} from '@/lib/schemas/borrowings-assets-contracts';

export function getFacilities(payload: BorrowingsAssetsContractsPayload): FacilityRecord[] {
  return payload.financialIndebtednessAndFacilityMaster.facilities;
}

export function getFacilityById(
  payload: BorrowingsAssetsContractsPayload,
  facilityId: string,
): FacilityRecord | undefined {
  if (!facilityId) return undefined;
  return getFacilities(payload).find((facility) => facility.id === facilityId);
}

export function formatFacilityLabel(
  facility: FacilityRecord | undefined,
  fallbackId = '',
): string {
  if (!facility) {
    return fallbackId ? `Unknown facility (${fallbackId.slice(0, 8)})` : 'Unknown facility';
  }

  const lender = facility.lender.lenderName.trim();
  const borrower =
    facility.borrower.displayName.trim() ||
    facility.borrower.linkedGroupEntityId.trim() ||
    facility.borrower.borrowerType.replaceAll('-', ' ');
  const type = facility.facilityType.replaceAll('-', ' ');

  const parts = [lender, borrower, type].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : facility.id.slice(0, 8);
}
