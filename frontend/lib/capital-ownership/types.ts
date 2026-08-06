/**
 * Shared Capital & Ownership types.
 *
 * Persisted shapes live in `@/lib/schemas/capital-ownership` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references) and are never persisted.
 */

import type {
  CapitalOwnershipPayload,
  CapitalOwnershipSectionId,
} from '@/lib/schemas/capital-ownership';

export type {
  CapitalOwnershipPayload,
  CapitalOwnershipSectionId,
  CurrentCapitalStructure,
  EquityShareClass,
  PreferenceShareClass,
  ShareCapitalHistory,
  CapitalEvent,
  CapitalEventType,
  ShareholdersAndBeneficialOwnership,
  Shareholder,
  ShareholderCategory,
  HolderType,
  BeneficialOwner,
  PromotersAndControl,
  Promoter,
  PromoterGroupMember,
  ControlArrangement,
  PreAndPostIssueOwnership,
  ShareholderOfferOverlay,
  PromoterContributionLockInAndEncumbrances,
  PromoterContributionLot,
  Encumbrance,
  OutstandingSecuritiesTransactionsAndConfirmations,
  OutstandingInstrument,
  RecentTransaction,
  CapitalOwnershipConfirmations,
  CapitalAmountUnit,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/capital-ownership';

export type { CapitalOwnershipTabId } from '@/lib/capital-ownership/options';

/** Display unit for money entry. The payload always stores rupees. */
export type AmountUnit = 'rupees' | 'lakh' | 'crore';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type CapitalOwnershipProgress = {
  sections: Record<CapitalOwnershipSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

/**
 * Read-only mirror of the IPO Setup & Eligibility workstream.
 *
 * All quantities are Decimal-safe strings (`''` when unknown) so they can be combined with
 * Capital & Ownership values without passing through `number`. Capital & Ownership never
 * writes back to IPO Setup.
 */
export type IpoSetupReference = {
  available: boolean;
  proposedOfferType: string;
  faceValuePerEquityShare: string;
  existingIssuedEquityShares: string;
  existingPaidUpEquityShareCapital: string;
  proposedIssuePrice: string;
  proposedFreshIssueShares: string;
  proposedFreshIssueAmount: string;
  proposedOfsShares: string;
  proposedOfsAmount: string;
};

export function createEmptyIpoSetupReference(): IpoSetupReference {
  return {
    available: false,
    proposedOfferType: '',
    faceValuePerEquityShare: '',
    existingIssuedEquityShares: '',
    existingPaidUpEquityShareCapital: '',
    proposedIssuePrice: '',
    proposedFreshIssueShares: '',
    proposedFreshIssueAmount: '',
    proposedOfsShares: '',
    proposedOfsAmount: '',
  };
}

/** Convenience alias used by hooks and page components. */
export type CapitalOwnershipPayloadDraft = CapitalOwnershipPayload;
