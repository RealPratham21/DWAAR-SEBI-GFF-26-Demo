import { describe, expect, it } from 'vitest';
import {
  addDecimals,
  assessIntermediariesFiling,
  buildOverviewSummary,
  calculateIntermediariesFilingProgress,
  compareMerchantBankerOwnAccount,
  compareUnderwritingCoverage,
  computeIntermediariesFilingModel,
  computePreliminaryTPlus3,
  computeUnderwritingTotals,
  countDocumentVersionReferences,
  countFilingReferences,
  countIntermediaryReferences,
  createEmptyFilingRecord,
  createEmptyIntermediaryRecord,
  createEmptyIntermediariesFilingPayload,
  createEmptyLinkedWorkstreamReferences,
  createEmptyOfferDocumentVersionRecord,
  createEmptyUnderwritingCommitmentRecord,
  getFilingStageOrder,
  IF_CRITERION_STATES,
  IF_SECTION_IDS,
  intermediariesFilingPayloadSchema,
  isStageAtLeast,
  MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE,
  SECTION_PAYLOAD_KEYS,
  SME_UNDERWRITING_REQUIRED_PERCENTAGE,
  subtractDecimals,
} from '@/lib/intermediaries-filing';

describe('Intermediaries & Filing foundation (IF1)', () => {
  it('parses empty payload with schemaVersion 1', () => {
    const empty = createEmptyIntermediariesFilingPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(intermediariesFilingPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defines eight section IDs mapped to payload keys', () => {
    expect(IF_SECTION_IDS).toHaveLength(8);
    expect(Object.keys(SECTION_PAYLOAD_KEYS)).toHaveLength(8);
    for (const sectionId of IF_SECTION_IDS) {
      expect(SECTION_PAYLOAD_KEYS[sectionId]).toBeTruthy();
    }
  });

  it('assigns stable IDs to repeatable intermediary, filing and document version records', () => {
    const intermediary = createEmptyIntermediaryRecord();
    const intermediary2 = createEmptyIntermediaryRecord();
    const filing = createEmptyFilingRecord();
    const filing2 = createEmptyFilingRecord();
    const version = createEmptyOfferDocumentVersionRecord();
    const version2 = createEmptyOfferDocumentVersionRecord();

    expect(intermediary.intermediaryId).not.toBe(intermediary2.intermediaryId);
    expect(filing.filingId).not.toBe(filing2.filingId);
    expect(version.documentVersionId).not.toBe(version2.documentVersionId);
  });

  it('tracks intermediary references for deletion protection', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    const intermediary = createEmptyIntermediaryRecord();
    intermediary.legalName = 'Example Merchant Banker';
    intermediary.roles = ['lead_manager'];
    payload.issueTeamAndIntermediaryMaster.intermediaries = [intermediary];

    payload.filingAndRegulatoryMilestoneTracker.filings = [
      {
        ...createEmptyFilingRecord(),
        responsibleLeadManagerIntermediaryId: intermediary.intermediaryId,
      },
    ];

    const deps = countIntermediaryReferences(payload, intermediary.intermediaryId);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('tracks filing and document version references for deletion protection', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    const filing = createEmptyFilingRecord();
    const version = createEmptyOfferDocumentVersionRecord();
    filing.linkedDocumentVersionId = version.documentVersionId;
    payload.filingAndRegulatoryMilestoneTracker.filings = [filing];
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness.offerDocumentVersions =
      [version];

    payload.filingAndRegulatoryMilestoneTracker.exchangeQueries = [
      {
        queryId: crypto.randomUUID(),
        filingId: filing.filingId,
        queryRound: '1',
        queryReferenceNumber: 'Q-001',
        queryDate: '2026-08-01',
        category: 'financials',
        questionRequest: 'Clarify revenue recognition',
        responsibleDwaarWorkstream: 'financials-kpis',
        responsibleOwner: 'CFO',
        responsibleLeadManagerIntermediaryId: '',
        responseDueDate: '2026-08-10',
        status: 'open',
        responseDate: '',
        responseSummary: '',
        offerDocumentChangeRequired: '',
        affectedChapterSection: '',
        supportingCertificateRequired: '',
        linkedCertificateId: '',
        closedByExchange: '',
        closureDate: '',
        notes: '',
      },
    ];

    expect(countFilingReferences(payload, filing.filingId).length).toBeGreaterThan(0);
    expect(
      countDocumentVersionReferences(payload, version.documentVersionId).length,
    ).toBeGreaterThan(0);
  });

  it('uses stage-aware progress with not_yet_due for early filing stages', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    payload.issueConfigurationAndFilingSnapshot.filingSnapshot.filingStage = 'exchange_vetting';

    const progress = calculateIntermediariesFilingProgress(payload);
    expect(progress.sections['issue-programme-allotment-listing-and-post-issue-execution']).toBe(
      'not_started',
    );

    payload.issueConfigurationAndFilingSnapshot.filingSnapshot.filingStage = 'issue_closed';
    payload.issueProgrammeAllotmentListingAndPostIssueExecution.subscriptionRows = [
      {
        subscriptionId: crypto.randomUUID(),
        category: 'retail',
        sharesOffered: '1000',
        applicationCount: '10',
        sharesBidApplied: '5000',
        bidApplicationAmount: '500000',
        validApplicationCount: '9',
        validDemand: '4500',
        rejectedApplicationCount: '1',
        withdrawalCancellationCount: '0',
        subscriptionMultiple: '4.5',
        notes: '',
      },
    ];

    const laterProgress = calculateIntermediariesFilingProgress(payload);
    expect(laterProgress.sections['issue-programme-allotment-listing-and-post-issue-execution']).toBe(
      'in_progress',
    );
  });

  it('computes preliminary T+3 using working-day logic', () => {
    const schedule = computePreliminaryTPlus3('2026-08-07');
    expect(schedule.t).toBe('2026-08-07');
    expect(schedule.tPlus1).toBe('2026-08-10');
    expect(schedule.tPlus2).toBe('2026-08-11');
    expect(schedule.tPlus3).toBe('2026-08-12');
    expect(schedule.disclaimer).toContain('Exchange holidays');
  });

  it('derives assessment states and overview without throwing', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    const linked = createEmptyLinkedWorkstreamReferences();

    const assessment = assessIntermediariesFiling(payload, linked);
    expect(assessment.criteria.length).toBeGreaterThan(0);
    expect(assessment.result).toBeTruthy();
    expect(IF_CRITERION_STATES).toHaveLength(18);

    const overview = buildOverviewSummary(payload, linked);
    expect(overview.intermediaryCount).toBe(0);
    expect(overview.filingCount).toBe(0);
  });

  it('calculates underwriting totals and rule comparisons', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    payload.underwritingMarketMakingAndDistributionArrangements.underwritingSummary.issueShares =
      '1000';
    payload.underwritingMarketMakingAndDistributionArrangements.underwritingCommitments = [
      {
        ...createEmptyUnderwritingCommitmentRecord(),
        sharesUnderwritten: '600',
        amountUnderwritten: '600000',
        ownAccount: 'yes',
      },
      {
        ...createEmptyUnderwritingCommitmentRecord(),
        sharesUnderwritten: '500',
        amountUnderwritten: '500000',
      },
    ];

    const totals = computeUnderwritingTotals(payload);
    expect(addDecimals('600', '500')).toBe('1100');
    expect(totals.totalShares).toBe('1100');
    expect(subtractDecimals('1000', totals.totalShares)).toBe('-100');

    expect(compareUnderwritingCoverage('100')).toBe('meets_threshold');
    expect(compareUnderwritingCoverage('90')).toBe('below_threshold');
    expect(compareMerchantBankerOwnAccount(MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE)).toBe(
      'meets_threshold',
    );
    expect(SME_UNDERWRITING_REQUIRED_PERCENTAGE).toBe('100');
  });

  it('exposes filing stage sequencing helpers', () => {
    expect(getFilingStageOrder().length).toBeGreaterThan(10);
    expect(isStageAtLeast('issue_closed', 'issue_open')).toBe(true);
    expect(isStageAtLeast('exchange_vetting', 'issue_closed')).toBe(false);
  });

  it('builds compute model aggregates', () => {
    const payload = createEmptyIntermediariesFilingPayload();
    const model = computeIntermediariesFilingModel(payload, createEmptyLinkedWorkstreamReferences());
    expect(model.intermediaryAggregates.totalCount).toBe(0);
    expect(model.reconciliation.totalMismatchCount).toBe(0);
  });
});
