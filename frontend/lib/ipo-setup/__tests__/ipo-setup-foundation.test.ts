import { describe, expect, it } from 'vitest';
import { assessIpoEligibility } from '@/lib/ipo-setup/assessment';
import { createEmptyIpoSetupPayload, createEmptyFinancialYearRow } from '@/lib/ipo-setup/defaults';
import { computeOfferStructure } from '@/lib/ipo-setup/offer-compute';
import {
  calculateIpoSetupProgress,
  evaluateOfferStructureStatus,
} from '@/lib/ipo-setup/progress';
import {
  IPO_SETUP_INFORMATION_SECTIONS,
  IPO_SETUP_TABS,
} from '@/lib/ipo-setup/options';
import { IPO_SETUP_SCHEMA_VERSION, ipoSetupPayloadSchema } from '@/lib/schemas/ipo-setup';
import { getWorkstreamBySlug } from '@/lib/workstreams-config';

describe('IPO Setup I1 foundation', () => {
  it('registers the workstream slug used by dashboard cards', () => {
    const workstream = getWorkstreamBySlug('ipo-setup-eligibility');
    expect(workstream?.title).toBe('IPO Setup & Eligibility');
    expect(workstream?.sequence).toBe(2);
  });

  it('exposes three tabs and six information sections', () => {
    expect(IPO_SETUP_TABS.map((tab) => tab.id)).toEqual([
      'overview',
      'information',
      'eligibility-assessment',
    ]);
    expect(IPO_SETUP_INFORMATION_SECTIONS).toHaveLength(6);
  });

  it('freezes schema version 1 empty payload', () => {
    const payload = createEmptyIpoSetupPayload();
    expect(payload.schemaVersion).toBe(IPO_SETUP_SCHEMA_VERSION);
    expect(ipoSetupPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.eligibilityDeclarations.admittedIbcAgainstIssuer).toBe('');
    expect(payload.trackRecordAndFinancialEligibility.financialYears).toHaveLength(3);
  });

  it('does not treat unanswered declarations as No in progress', () => {
    const payload = createEmptyIpoSetupPayload();
    const progress = calculateIpoSetupProgress(payload);
    expect(progress.sections['eligibility-declarations']).toBe('not_started');
  });

  it('computes offer values and keeps OFS out of paid-up capital', () => {
    const payload = createEmptyIpoSetupPayload();
    payload.ipoDirection.proposedOfferType = 'fresh-and-ofs';
    payload.offerStructure = {
      ...payload.offerStructure,
      faceValuePerEquityShare: 10,
      existingIssuedEquityShares: 1_000_000,
      existingPaidUpEquityShareCapital: 10_000_000,
      proposedFreshIssueShares: 200_000,
      proposedFreshIssueAmount: 20_000_000,
      proposedOfsShares: 100_000,
      proposedOfsAmount: 10_000_000,
      proposedIssuePriceStatus: 'indicative',
      proposedIssuePrice: 100,
      preIpoPlacementBeingConsidered: 'no',
      sellerConsentsObtained: 'yes',
      numberOfSellingShareholders: 2,
    };

    const computed = computeOfferStructure(
      payload.offerStructure,
      payload.ipoDirection.proposedOfferType,
    );
    expect(computed.totalSharesOffered).toBe(300_000);
    expect(computed.proposedPostIssueShares).toBe(1_200_000);
    expect(computed.proposedPostIssuePaidUpCapital).toBe(12_000_000);
    expect(computed.paidUpCapitalIncreaseFromOffer).toBe(2_000_000);
    expect(computed.ofsPercentageOfOffer).toBeCloseTo(33.333, 2);
    expect(evaluateOfferStructureStatus(payload)).toBe('complete');
  });

  it('shows fresh-issue fields only when offer type includes fresh issue', () => {
    const ofsOnly = computeOfferStructure(createEmptyIpoSetupPayload().offerStructure, 'offer-for-sale');
    expect(ofsOnly.includesFreshIssue).toBe(false);
    expect(ofsOnly.includesOfs).toBe(true);

    const fresh = computeOfferStructure(createEmptyIpoSetupPayload().offerStructure, 'fresh-issue');
    expect(fresh.includesFreshIssue).toBe(true);
    expect(fresh.includesOfs).toBe(false);
  });

  it('assesses Nivara-like incomplete form as insufficient or concern without binary eligibility', () => {
    const payload = createEmptyIpoSetupPayload();
    payload.ipoDirection.preparationStage = 'preparing-internally';
    payload.ipoDirection.targetSmePlatform = 'nse-emerge';
    payload.ipoDirection.eligibilityProfile = 'standard-sme-ipo';
    payload.ipoDirection.proposedOfferType = 'fresh-issue';
    payload.ipoDirection.proposedPricingMethod = 'book-built';
    payload.ipoDirection.publicCompanyConversionStatus = 'not-started';
    payload.ipoDirection.referencedCompanyClass = 'private';

    const assessment = assessIpoEligibility(payload);
    expect(assessment.result).not.toBe('preliminary_criteria_appear_satisfied');
    expect(['insufficient_information', 'professional_assessment_required', 'eligibility_concerns_identified']).toContain(
      assessment.result,
    );
    expect(assessment.criteria.some((item) => item.id === 'public-company-status')).toBe(true);
  });

  it('flags Yes declarations as potential concerns without deciding materiality', () => {
    const payload = createEmptyIpoSetupPayload();
    for (const field of [
      'admittedIbcAgainstIssuer',
      'admittedIbcAgainstPromotingCompany',
      'admittedWindingUpPetition',
      'issuerDebarredFromCapitalMarkets',
      'promoterDirectorSellingShareholderDebarred',
      'promoterDirectorAssociatedWithDebarredCompany',
      'wilfulDefaulterOrFraudulentBorrower',
      'fugitiveEconomicOffender',
      'materialRegulatoryOrDisciplinaryAction',
      'seriousCriminalProceedingsInvolvingDirector',
      'materialFinancialDefaultDuringRelevantPeriod',
      'materialUnresolvedEligibilityLitigation',
      'proceedsIncludeRelatedPartyLoanRepayment',
    ] as const) {
      payload.eligibilityDeclarations[field] = 'no';
    }
    payload.eligibilityDeclarations.admittedIbcAgainstIssuer = 'yes';
    payload.eligibilityDeclarations.admittedIbcAgainstIssuerDetails = [
      {
        id: 'd1',
        personOrEntityInvolved: 'Issuer',
        authorityOrForum: 'NCLT',
        date: '2024-01-01',
        currentStatus: 'Pending',
        explanation: 'Test',
      },
    ];

    const assessment = assessIpoEligibility(payload);
    const adverse = assessment.criteria.find((item) => item.id === 'adverse-declarations');
    expect(adverse?.state).toBe('potential_concern');
    expect(assessment.metrics.unresolvedAdverseDeclarations).toBe(1);
  });

  it('counts operating-profit and FCFE years from the financial grid', () => {
    const payload = createEmptyIpoSetupPayload();
    payload.trackRecordAndFinancialEligibility.operatingTrackRecordBasis = 'issuer-company';
    payload.trackRecordAndFinancialEligibility.threeCompleteFinancialYearsAvailable = 'yes';
    payload.trackRecordAndFinancialEligibility.financialYears = [
      {
        ...createEmptyFinancialYearRow('y1'),
        financialYearEnding: '2023',
        operatingProfitFromOperations: 1_50_00_000,
        netWorth: 5_00_00_000,
        freeCashFlowToEquity: 10_00_000,
        auditedStatus: 'audited',
        sourceType: 'audited-financial-statements',
      },
      {
        ...createEmptyFinancialYearRow('y2'),
        financialYearEnding: '2024',
        operatingProfitFromOperations: 2_00_00_000,
        netWorth: 6_00_00_000,
        freeCashFlowToEquity: -1,
        auditedStatus: 'audited',
        sourceType: 'audited-financial-statements',
      },
      {
        ...createEmptyFinancialYearRow('y3'),
        financialYearEnding: '2025',
        operatingProfitFromOperations: 50_00_000,
        netWorth: 7_00_00_000,
        freeCashFlowToEquity: 5_00_000,
        auditedStatus: 'audited',
        sourceType: 'management-estimate',
      },
    ];

    const assessment = assessIpoEligibility(payload);
    expect(assessment.metrics.yearsMeetingOperatingProfitThreshold).toBe(2);
    expect(assessment.metrics.yearsWithPositiveFcfe).toBe(2);
    expect(assessment.metrics.positiveNetWorthAvailable).toBe(true);
    expect(
      assessment.criteria.some((item) => item.id === 'management-estimates'),
    ).toBe(true);
  });

  it('marks conversion conditional fields via progress rules', () => {
    const payload = createEmptyIpoSetupPayload();
    payload.ipoDirection.preparationStage = 'preparing-internally';
    payload.ipoDirection.targetSmePlatform = 'bse-sme';
    payload.ipoDirection.eligibilityProfile = 'standard-sme-ipo';
    payload.ipoDirection.proposedOfferType = 'fresh-issue';
    payload.ipoDirection.proposedPricingMethod = 'fixed-price';
    payload.ipoDirection.publicCompanyConversionStatus = 'completed';
    let progress = calculateIpoSetupProgress(payload);
    expect(progress.sections['ipo-direction']).toBe('in_progress');

    payload.ipoDirection.actualConversionDate = '2025-01-15';
    payload.ipoDirection.freshCertificateOfIncorporationAvailable = 'yes';
    progress = calculateIpoSetupProgress(payload);
    expect(progress.sections['ipo-direction']).toBe('complete');
  });
});
