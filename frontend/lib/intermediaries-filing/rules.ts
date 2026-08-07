/**
 * Versioned frontend rules for Intermediaries & Filing preview logic (IF1).
 *
 * Authoritative rule evaluation moves to the backend in IF2.
 */

import type { FilingStage } from '@/lib/schemas/intermediaries-filing';

export const IF_RULES_VERSION = 'if1-preview-2026-08-07';
export const IF_RULES_AS_OF = '2026-08-07';

/** SME issues typically require 100% underwriting coverage (preview helper). */
export const SME_UNDERWRITING_REQUIRED_PERCENTAGE = '100';

/** Merchant banker / Lead Manager minimum own-account commitment (preview helper). */
export const MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE = '15';

/** Minimum market-making period in calendar days (preview helper; ~3 years). */
export const MARKET_MAKING_MINIMUM_DAYS = 1095;

const FILING_STAGE_SEQUENCE: readonly FilingStage[] = [
  'preparation',
  'internal_due_diligence',
  'adviser_review',
  'board_approval',
  'exchange_draft_filing',
  'exchange_vetting',
  'revision',
  'in_principle_stage',
  'pre_issue_filing',
  'roc_filing',
  'issue_open',
  'issue_closed',
  'allotment',
  'listing_application',
  'listed',
  'other',
] as const;

const STAGE_ORDER = new Map<FilingStage, number>(
  FILING_STAGE_SEQUENCE.map((stage, index) => [stage, index]),
);

export function getFilingStageOrder(): readonly FilingStage[] {
  return FILING_STAGE_SEQUENCE;
}

export function getFilingStageIndex(stage: FilingStage | ''): number | null {
  if (!stage) return null;
  const index = STAGE_ORDER.get(stage);
  return index === undefined ? null : index;
}

export function isStageAtLeast(
  currentStage: FilingStage | '',
  minimumStage: FilingStage,
): boolean {
  const currentIndex = getFilingStageIndex(currentStage);
  const minimumIndex = STAGE_ORDER.get(minimumStage);
  if (currentIndex === null || minimumIndex === undefined) return false;
  if (currentStage === 'other') return false;
  return currentIndex >= minimumIndex;
}

export function compareUnderwritingCoverage(
  totalUnderwritingPercentage: string,
): 'meets_threshold' | 'below_threshold' | 'unknown' {
  const total = Number(totalUnderwritingPercentage);
  const required = Number(SME_UNDERWRITING_REQUIRED_PERCENTAGE);
  if (!Number.isFinite(total)) return 'unknown';
  return total >= required ? 'meets_threshold' : 'below_threshold';
}

export function compareMerchantBankerOwnAccount(
  ownAccountPercentage: string,
): 'meets_threshold' | 'below_threshold' | 'unknown' {
  const own = Number(ownAccountPercentage);
  const required = Number(MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE);
  if (!Number.isFinite(own)) return 'unknown';
  return own >= required ? 'meets_threshold' : 'below_threshold';
}
