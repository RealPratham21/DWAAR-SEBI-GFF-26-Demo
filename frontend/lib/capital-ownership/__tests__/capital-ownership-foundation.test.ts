import { describe, expect, it } from 'vitest';

import { assessCapitalOwnership } from '@/lib/capital-ownership/assessment';
import {
  computeCapTable,
  computeCapitalHistoryCumulative,
  computeCapitalOwnershipModel,
  computeCurrentCapitalTotals,
  computeLockInReadiness,
  computePrePostIssue,
} from '@/lib/capital-ownership/compute';
import { add, div, mul, pct, sumDecimals, toDecimalString } from '@/lib/capital-ownership/decimal';
import {
  createEmptyCapitalEvent,
  createEmptyCapitalOwnershipPayload,
  createEmptyPromoterContributionLot,
  createEmptyShareholder,
  createEmptyShareholderOfferOverlay,
} from '@/lib/capital-ownership/defaults';
import { formatIndianDecimal, formatMoney } from '@/lib/capital-ownership/format';
import { calculateCapitalOwnershipProgress } from '@/lib/capital-ownership/progress';
import { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
import {
  CAPITAL_OWNERSHIP_SCHEMA_VERSION,
  capitalOwnershipPayloadSchema,
} from '@/lib/schemas/capital-ownership';

describe('decimal helpers', () => {
  it('keeps precision that binary floating point would lose', () => {
    expect(add('0.1', '0.2')).toBe('0.3');
    expect(mul('1000000.05', '3')).toBe('3000000.15');
    expect(div('1', '3', 6)).toBe('0.333333');
  });

  it('handles share counts beyond the safe integer range', () => {
    expect(add('9007199254740993', '1')).toBe('9007199254740994');
  });

  it('treats blanks as absent rather than zero', () => {
    expect(add('', '10')).toBe('');
    expect(sumDecimals(['', '', ''])).toBe('');
    expect(sumDecimals(['10', '', '5'])).toBe('15');
    expect(toDecimalString('1,00,000')).toBe('100000');
  });

  it('computes percentages as strings', () => {
    expect(pct('25', '200', 2)).toBe('12.5');
  });
});

describe('formatting', () => {
  it('groups digits in the Indian system', () => {
    expect(formatIndianDecimal('10000000')).toBe('1,00,00,000');
    expect(formatMoney('10000000', 'crore')).toBe('₹1.00 crore');
  });
});

describe('empty payload', () => {
  it('validates against the schema and stores strings, not numbers', () => {
    const payload = createEmptyCapitalOwnershipPayload();
    expect(payload.schemaVersion).toBe(CAPITAL_OWNERSHIP_SCHEMA_VERSION);
    expect(capitalOwnershipPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.currentCapitalStructure.paidUpEquityShareCapital).toBe('');
    expect(payload.currentCapitalStructure.equityClasses[0]?.id).toBeTruthy();
    expect(calculateCapitalOwnershipProgress(payload).overallStatus).toBe('not_started');
  });
});

describe('capital computations', () => {
  it('derives totals from the class-wise table', () => {
    const payload = createEmptyCapitalOwnershipPayload();
    payload.currentCapitalStructure.equityClasses[0] = {
      ...payload.currentCapitalStructure.equityClasses[0]!,
      faceValuePerShare: '10',
      authorisedShares: '2000000',
      issuedShares: '1000000',
      subscribedShares: '1000000',
      paidUpShares: '1000000',
      votingRightsPerShare: '1',
    };
    const totals = computeCurrentCapitalTotals(payload.currentCapitalStructure);
    expect(totals.paidUpEquityCapitalFromClasses).toBe('10000000');
    expect(totals.currentEquityShares).toBe('1000000');
    expect(totals.impliedEquityFaceValue).toBe('10');
  });

  it('runs a cumulative share capital history including a split', () => {
    const incorporation = {
      ...createEmptyCapitalEvent('a'),
      eventDate: '2020-04-01',
      eventType: 'incorporation-initial-subscription' as const,
      securityType: 'equity' as const,
      numberOfShares: '10000',
      faceValuePerShare: '10',
    };
    const bonus = {
      ...createEmptyCapitalEvent('b'),
      eventDate: '2022-06-01',
      eventType: 'bonus-issue' as const,
      securityType: 'equity' as const,
      numberOfShares: '90000',
      faceValuePerShare: '10',
    };
    const split = {
      ...createEmptyCapitalEvent('c'),
      eventDate: '2023-01-01',
      eventType: 'share-split-subdivision' as const,
      securityType: 'equity' as const,
      splitOrConsolidationRatioFrom: '1',
      splitOrConsolidationRatioTo: '10',
      postEventFaceValuePerShare: '1',
    };
    const history = computeCapitalHistoryCumulative([split, incorporation, bonus]);
    expect(history.rows.map((row) => row.eventId)).toEqual(['a', 'b', 'c']);
    expect(history.closingEquityShares).toBe('1000000');
    expect(history.closingPaidUpEquityCapital).toBe('1000000');
    expect(history.bonusSharesIssued).toBe('90000');
  });
});

describe('cap table and pre/post issue', () => {
  const promoter = {
    ...createEmptyShareholder('p1'),
    name: 'Promoter One',
    category: 'promoter' as const,
    equitySharesHeld: '700000',
  };
  const investor = {
    ...createEmptyShareholder('p2'),
    name: 'Investor',
    category: 'public' as const,
    equitySharesHeld: '300000',
  };

  it('computes category percentages', () => {
    const capTable = computeCapTable([promoter, investor], { currentEquityShares: '1000000' });
    expect(capTable.groups.promoterPercentage).toBe('70');
    expect(capTable.groups.publicPercentage).toBe('30');
    expect(capTable.registerVariance).toBe('0');
  });

  it('keeps an offer for sale from increasing capital', () => {
    const reference = {
      ...createEmptyIpoSetupReference(),
      available: true,
      proposedOfferType: 'fresh-and-ofs',
      proposedFreshIssueShares: '500000',
      proposedOfsShares: '100000',
    };
    const overlay = {
      ...createEmptyShareholderOfferOverlay('p1', 'o1'),
      sharesOfferedForSale: '100000',
    };
    const view = computePrePostIssue([promoter, investor], reference, [overlay], {
      preIssueTotalEquityShares: '1000000',
    });
    expect(view.postIssueShares).toBe('1500000');
    expect(view.capitalIncreaseShares).toBe('500000');
    expect(view.ofsIncreasesCapital).toBe(false);
    expect(view.rows[0]?.postIssueShares).toBe('600000');
    expect(view.rows[0]?.postIssuePercentage).toBe('40');
    expect(view.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });

  it('flags a seller offering more shares than held', () => {
    const reference = { ...createEmptyIpoSetupReference(), available: true };
    const overlay = {
      ...createEmptyShareholderOfferOverlay('p2', 'o2'),
      sharesOfferedForSale: '400000',
    };
    const view = computePrePostIssue([promoter, investor], reference, [overlay], {
      preIssueTotalEquityShares: '1000000',
    });
    expect(view.rows[1]?.offerExceedsHolding).toBe(true);
    expect(view.issues.some((issue) => issue.code === 'ofs_exceeds_holding')).toBe(true);
  });
});

describe('lock-in readiness', () => {
  it('measures eligible lots against the indicative 20% requirement', () => {
    const payload = createEmptyCapitalOwnershipPayload();
    payload.promoterContributionLockInAndEncumbrances.contributionLots = [
      {
        ...createEmptyPromoterContributionLot('l1'),
        numberOfShares: '200000',
        eligibleForMinimumPromoterContribution: 'yes',
      },
      {
        ...createEmptyPromoterContributionLot('l2'),
        numberOfShares: '50000',
        eligibleForMinimumPromoterContribution: 'no',
      },
    ];
    const lockIn = computeLockInReadiness(
      payload.promoterContributionLockInAndEncumbrances,
      '1500000',
    );
    expect(lockIn.requiredContributionShares).toBe('300000');
    expect(lockIn.eligibleShares).toBe('200000');
    expect(lockIn.shortfallShares).toBe('100000');
    expect(lockIn.meetsRequirement).toBe(false);
  });
});

describe('assessment', () => {
  it('never returns a binary result and treats blanks as missing information', () => {
    const payload = createEmptyCapitalOwnershipPayload();
    const assessment = assessCapitalOwnership(payload, createEmptyIpoSetupReference());
    expect(assessment.result).toBe('insufficient_information');
    expect(assessment.groups).toHaveLength(4);
    expect(assessment.counts.missing_information).toBeGreaterThan(0);
    expect(
      assessment.criteria.every((criterion) => criterion.state !== 'potential_inconsistency'),
    ).toBe(true);
  });

  it('reports a variance when the register does not match the capital table', () => {
    const payload = createEmptyCapitalOwnershipPayload();
    payload.currentCapitalStructure.equityClasses[0] = {
      ...payload.currentCapitalStructure.equityClasses[0]!,
      faceValuePerShare: '10',
      issuedShares: '1000000',
      paidUpShares: '1000000',
    };
    payload.shareholdersAndBeneficialOwnership.shareholders = [
      { ...createEmptyShareholder('s1'), name: 'Holder', category: 'promoter', equitySharesHeld: '900000' },
    ];
    const model = computeCapitalOwnershipModel(payload, createEmptyIpoSetupReference());
    const check = model.reconciliation.find((item) => item.id === 'register-vs-capital');
    expect(check?.status).toBe('variance');
    expect(check?.difference).toBe('100000');
  });
});
