/**
 * Filing and offer-document version helpers.
 */

import type {
  FilingRecord,
  IntermediariesFilingPayload,
  OfferDocumentVersionRecord,
} from '@/lib/schemas/intermediaries-filing';

export function getFilings(payload: IntermediariesFilingPayload): FilingRecord[] {
  return payload.filingAndRegulatoryMilestoneTracker.filings;
}

export function getFilingById(
  payload: IntermediariesFilingPayload,
  filingId: string,
): FilingRecord | undefined {
  if (!filingId) return undefined;
  return getFilings(payload).find((filing) => filing.filingId === filingId);
}

export function getOfferDocumentVersions(
  payload: IntermediariesFilingPayload,
): OfferDocumentVersionRecord[] {
  return payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness
    .offerDocumentVersions;
}

export function getOfferDocumentVersionById(
  payload: IntermediariesFilingPayload,
  documentVersionId: string,
): OfferDocumentVersionRecord | undefined {
  if (!documentVersionId) return undefined;
  return getOfferDocumentVersions(payload).find(
    (version) => version.documentVersionId === documentVersionId,
  );
}

export function getAuthoritativeVersion(
  payload: IntermediariesFilingPayload,
): OfferDocumentVersionRecord | undefined {
  const authoritative = getOfferDocumentVersions(payload).filter(
    (version) => version.currentAuthoritativeVersion === 'yes',
  );
  if (authoritative.length === 1) return authoritative[0];
  return undefined;
}

export function getAuthoritativeVersionConflictCount(payload: IntermediariesFilingPayload): number {
  return getOfferDocumentVersions(payload).filter(
    (version) => version.currentAuthoritativeVersion === 'yes',
  ).length;
}

export function formatFilingLabel(filing: FilingRecord | undefined, fallbackId = ''): string {
  if (!filing) {
    return fallbackId ? `Unknown filing (${fallbackId.slice(0, 8)})` : 'Unknown filing';
  }

  const parts = [
    filing.documentType.replaceAll('_', ' '),
    filing.filingDate.trim(),
    filing.referenceApplicationNumber.trim(),
    filing.status.replaceAll('_', ' '),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' — ') : filing.filingId.slice(0, 8);
}

export function formatDocumentVersionLabel(
  version: OfferDocumentVersionRecord | undefined,
  fallbackId = '',
): string {
  if (!version) {
    return fallbackId ? `Unknown version (${fallbackId.slice(0, 8)})` : 'Unknown version';
  }

  const parts = [
    version.type.replaceAll('_', ' '),
    version.versionLabel.trim(),
    version.date.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' — ') : version.documentVersionId.slice(0, 8);
}
