/**
 * Claims Register helpers — derived status and unsupported wording detection.
 */

import { isFilledDecimal } from '@/lib/industry-market/decimal';
import { getSourceById } from '@/lib/industry-market/sources';
import type {
  ClaimRecord,
  ClaimStatus,
  IndustryMarketPayload,
} from '@/lib/schemas/industry-market';

const UNSUPPORTED_WORDING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bmarket leader\b/i, label: 'market leader' },
  { pattern: /\blargest\b/i, label: 'largest' },
  { pattern: /\bfastest[- ]growing\b/i, label: 'fastest-growing' },
  { pattern: /\bleading\b/i, label: 'leading' },
  { pattern: /\btop\s+\d+\b/i, label: 'top X' },
  { pattern: /\bonly player\b/i, label: 'only player' },
  { pattern: /\bonly\b/i, label: 'only' },
  { pattern: /\b\d+(\.\d+)?%\s*market share\b/i, label: 'explicit market-share percentage' },
];

export function detectUnsupportedClaimWording(text: string): string[] {
  if (!text.trim()) return [];
  const detected: string[] = [];
  for (const { pattern, label } of UNSUPPORTED_WORDING_PATTERNS) {
    if (pattern.test(text)) detected.push(label);
  }
  return [...new Set(detected)];
}

function hasRequiredSubstantiationFields(claim: ClaimRecord): boolean {
  return (
    claim.metric.trim() !== '' &&
    claim.geography.trim() !== '' &&
    claim.marketDefinition.trim() !== '' &&
    claim.periodDate.trim() !== '' &&
    claim.comparatorUniverse.trim() !== ''
  );
}

export function deriveClaimStatus(
  claim: ClaimRecord,
  payload: IndustryMarketPayload,
): ClaimStatus {
  const wordingFlags = detectUnsupportedClaimWording(claim.exactProposedWording);
  const source = getSourceById(payload, claim.sourceId);

  if (claim.conflictingSourceExists === 'yes') {
    return 'contradictory_sources';
  }

  if (!claim.sourceId.trim()) {
    if (wordingFlags.length > 0 || claim.claimType !== 'other') {
      return 'do_not_use';
    }
    return 'insufficient_source';
  }

  if (!source) {
    return 'insufficient_source';
  }

  if (
    source.sourceReadinessStatus === 'potentially_stale' ||
    source.sourceReadinessStatus === 'superseded' ||
    claim.currentFreshEnough === 'no'
  ) {
    return 'stale_source';
  }

  if (source.sourceReadinessStatus === 'professional_confirmation_required') {
    return 'professional_confirmation_required';
  }

  if (source.sourceType === 'commissioned-industry-report') {
    const commissioned = source.commissionedReportDetails;
    if (
      commissioned.independenceConfirmed !== 'yes' ||
      commissioned.consentNoObjectionStatus.trim() === ''
    ) {
      return 'professional_confirmation_required';
    }
  }

  if (wordingFlags.length > 0 && !hasRequiredSubstantiationFields(claim)) {
    return 'do_not_use';
  }

  const substantiationComplete =
    hasRequiredSubstantiationFields(claim) &&
    (claim.calculation.trim() !== '' || isFilledDecimal(claim.metric));

  if (substantiationComplete && claim.sourceId.trim() !== '') {
    if (claim.independentSource === 'yes' || claim.commissionedReportSource === 'no') {
      return 'substantiated';
    }
    return 'potentially_substantiated';
  }

  if (claim.sourceId.trim() !== '') {
    return 'potentially_substantiated';
  }

  return 'insufficient_source';
}
