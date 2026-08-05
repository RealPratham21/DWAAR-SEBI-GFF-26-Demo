import { describe, expect, it } from 'vitest';
import { displayToRupees, formatIndianNumber, rupeesToDisplay } from '@/lib/ipo-setup/format';
import { createEmptyIpoSetupPayload } from '@/lib/ipo-setup/defaults';
import { computeOfferStructure } from '@/lib/ipo-setup/offer-compute';
import { assessIpoEligibility } from '@/lib/ipo-setup/assessment';

describe('IPO Setup format and OFS capital rules', () => {
  it('formats Indian groupings and converts lakh/crore display units', () => {
    expect(formatIndianNumber(12_34_567)).toBe('12,34,567');
    expect(displayToRupees('2.5', 'crore')).toBe(2_50_00_000);
    expect(rupeesToDisplay(1_00_000, 'lakh')).toBe('1');
  });

  it('keeps OFS from increasing post-issue paid-up capital', () => {
    const offer = createEmptyIpoSetupPayload().offerStructure;
    const computed = computeOfferStructure(
      {
        ...offer,
        faceValuePerEquityShare: 10,
        existingIssuedEquityShares: 1_000_000,
        existingPaidUpEquityShareCapital: 10_000_000,
        proposedOfsShares: 250_000,
        proposedOfsAmount: 25_000_000,
      },
      'offer-for-sale',
    );
    expect(computed.includesOfs).toBe(true);
    expect(computed.includesFreshIssue).toBe(false);
    expect(computed.proposedPostIssueShares).toBe(1_000_000);
    expect(computed.proposedPostIssuePaidUpCapital).toBe(10_000_000);
    expect(computed.paidUpCapitalIncreaseFromOffer).toBe(0);
  });

  it('leaves post-issue paid-up unknown until fresh-issue shares are provided', () => {
    const offer = createEmptyIpoSetupPayload().offerStructure;
    const computed = computeOfferStructure(
      {
        ...offer,
        faceValuePerEquityShare: 10,
        existingPaidUpEquityShareCapital: 10_000_000,
        proposedFreshIssueShares: null,
      },
      'fresh-issue',
    );
    expect(computed.proposedPostIssuePaidUpCapital).toBeNull();
  });

  it('treats unanswered declarations as missing information, not No', () => {
    const payload = createEmptyIpoSetupPayload();
    const assessment = assessIpoEligibility(payload);
    expect(assessment.metrics.unresolvedAdverseDeclarations).toBe(0);
    expect(assessment.criteria.find((item) => item.id === 'adverse-declarations')).toBeUndefined();
    const completeness = assessment.criteria.find(
      (item) => item.id === 'declarations-completeness',
    );
    expect(completeness?.state).toBe('missing_information');
  });
});
