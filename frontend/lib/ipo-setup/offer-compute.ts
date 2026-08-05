import type { AmountUnit } from '@/lib/ipo-setup/types';
import type { IpoSetupPayload, OfferStructure } from '@/lib/schemas/ipo-setup';

export type OfferComputations = {
  includesFreshIssue: boolean;
  includesOfs: boolean;
  totalSharesOffered: number | null;
  totalOfferAmount: number | null;
  freshIssuePercentageOfOffer: number | null;
  ofsPercentageOfOffer: number | null;
  proposedPostIssueShares: number | null;
  proposedPostIssuePaidUpCapital: number | null;
  offerAsPercentageOfPostIssueCapital: number | null;
  /** OFS never increases paid-up capital; fresh issue does. */
  paidUpCapitalIncreaseFromOffer: number | null;
};

function num(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value;
}

export function offerTypeFlags(offerType: string): {
  includesFreshIssue: boolean;
  includesOfs: boolean;
} {
  return {
    includesFreshIssue: offerType === 'fresh-issue' || offerType === 'fresh-and-ofs',
    includesOfs: offerType === 'offer-for-sale' || offerType === 'fresh-and-ofs',
  };
}

export function computeOfferStructure(
  offer: OfferStructure,
  offerType: string,
): OfferComputations {
  const { includesFreshIssue, includesOfs } = offerTypeFlags(offerType);

  const freshShares = includesFreshIssue ? num(offer.proposedFreshIssueShares) : 0;
  const ofsShares = includesOfs ? num(offer.proposedOfsShares) : 0;
  const freshAmount = includesFreshIssue ? num(offer.proposedFreshIssueAmount) : 0;
  const ofsAmount = includesOfs ? num(offer.proposedOfsAmount) : 0;
  const existingShares = num(offer.existingIssuedEquityShares);
  const existingPaidUp = num(offer.existingPaidUpEquityShareCapital);
  const faceValue = num(offer.faceValuePerEquityShare);

  const totalSharesOffered =
    freshShares === null || ofsShares === null ? null : freshShares + ofsShares;
  const totalOfferAmount =
    freshAmount === null || ofsAmount === null ? null : freshAmount + ofsAmount;

  const freshIssuePercentageOfOffer =
    totalSharesOffered && totalSharesOffered > 0 && freshShares !== null
      ? (freshShares / totalSharesOffered) * 100
      : null;
  const ofsPercentageOfOffer =
    totalSharesOffered && totalSharesOffered > 0 && ofsShares !== null
      ? (ofsShares / totalSharesOffered) * 100
      : null;

  const proposedPostIssueShares =
    existingShares === null || freshShares === null
      ? null
      : existingShares + (freshShares ?? 0);

  // OFS does not increase paid-up capital — only fresh issue does.
  const paidUpCapitalIncreaseFromOffer = !includesFreshIssue
    ? 0
    : faceValue !== null && freshShares !== null
      ? faceValue * freshShares
      : null;

  const proposedPostIssuePaidUpCapital =
    existingPaidUp === null || paidUpCapitalIncreaseFromOffer === null
      ? null
      : existingPaidUp + paidUpCapitalIncreaseFromOffer;

  const offerAsPercentageOfPostIssueCapital =
    proposedPostIssueShares &&
    proposedPostIssueShares > 0 &&
    totalSharesOffered !== null
      ? (totalSharesOffered / proposedPostIssueShares) * 100
      : null;

  return {
    includesFreshIssue,
    includesOfs,
    totalSharesOffered,
    totalOfferAmount,
    freshIssuePercentageOfOffer,
    ofsPercentageOfOffer,
    proposedPostIssueShares,
    proposedPostIssuePaidUpCapital,
    offerAsPercentageOfPostIssueCapital,
    paidUpCapitalIncreaseFromOffer,
  };
}

export function computeOfferFromPayload(payload: IpoSetupPayload): OfferComputations {
  return computeOfferStructure(
    payload.offerStructure,
    payload.ipoDirection.proposedOfferType,
  );
}

export type { AmountUnit };
