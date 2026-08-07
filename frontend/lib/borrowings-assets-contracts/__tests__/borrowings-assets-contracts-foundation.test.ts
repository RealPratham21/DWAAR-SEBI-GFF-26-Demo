import { describe, expect, it } from 'vitest';
import {
  addDecimals,
  assessBorrowingsAssetsContracts,
  BAC_SECTION_IDS,
  borrowingsAssetsContractsPayloadSchema,
  buildOverviewSummary,
  calculateBorrowingsAssetsContractsProgress,
  computeBorrowingsAssetsContractsModel,
  countFacilityReferences,
  createEmptyBorrowingsAssetsContractsPayload,
  createEmptyCovenantRecord,
  createEmptyFacilityRecord,
  createEmptyLinkedWorkstreamReferences,
  SECTION_PAYLOAD_KEYS,
  subtractDecimals,
} from '@/lib/borrowings-assets-contracts';

describe('Borrowings, Assets & Contracts foundation (BAC1)', () => {
  it('parses empty payload with schemaVersion 1', () => {
    const empty = createEmptyBorrowingsAssetsContractsPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(borrowingsAssetsContractsPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defines eight section IDs mapped to payload keys', () => {
    expect(BAC_SECTION_IDS).toHaveLength(8);
    expect(Object.keys(SECTION_PAYLOAD_KEYS)).toHaveLength(8);
    for (const sectionId of BAC_SECTION_IDS) {
      expect(SECTION_PAYLOAD_KEYS[sectionId]).toBeTruthy();
    }
  });

  it('assigns stable IDs to repeatable facility records', () => {
    const facility = createEmptyFacilityRecord();
    const facility2 = createEmptyFacilityRecord();
    expect(facility.id).not.toBe(facility2.id);
    expect(facility.id.length).toBeGreaterThan(10);
  });

  it('tracks facility references for deletion protection', () => {
    const payload = createEmptyBorrowingsAssetsContractsPayload();
    const facility = createEmptyFacilityRecord();
    facility.lender.lenderName = 'Test Bank Ltd';
    payload.financialIndebtednessAndFacilityMaster.facilities = [facility];

    const covenant = createEmptyCovenantRecord();
    covenant.linkedFacilityId = facility.id;
    payload.covenantsDefaultsWaiversAndLenderConsents.covenants = [covenant];

    const deps = countFacilityReferences(payload, facility.id);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('calculates decimal totals deterministically', () => {
    expect(addDecimals('100', '50.5')).toBe('150.5');
    expect(subtractDecimals('100', '40')).toBe('60');
    expect(addDecimals('', '')).toBe('');
  });

  it('derives progress, assessment states and overview without throwing', () => {
    const payload = createEmptyBorrowingsAssetsContractsPayload();
    const linked = createEmptyLinkedWorkstreamReferences();
    const progress = calculateBorrowingsAssetsContractsProgress(payload);
    expect(progress.totalSections).toBe(8);
    expect(progress.overallStatus).toBe('not_started');

    const assessment = assessBorrowingsAssetsContracts(payload, linked);
    expect(assessment.criteria.length).toBeGreaterThan(0);
    expect(assessment.result).toBeTruthy();
    expect(assessment.counts.missingInformation).toBeGreaterThan(0);

    const overview = buildOverviewSummary(payload, linked);
    expect(overview.facilityCount).toBe(0);

    const model = computeBorrowingsAssetsContractsModel(payload, linked);
    expect(model.facilityCount).toBe(0);
  });

  it('aggregates facility outstanding in compute model', () => {
    const payload = createEmptyBorrowingsAssetsContractsPayload();
    const facility = createEmptyFacilityRecord();
    facility.sanctionAndUtilisation.principalOutstanding = '100';
    facility.sanctionAndUtilisation.totalOutstanding = '110';
    facility.sanctionAndUtilisation.currency = 'INR';
    facility.securedUnsecured = 'secured';
    payload.financialIndebtednessAndFacilityMaster.facilities = [facility];

    const model = computeBorrowingsAssetsContractsModel(
      payload,
      createEmptyLinkedWorkstreamReferences(),
    );
    expect(model.facilityCount).toBe(1);
    expect(model.currencyTotals[0]?.totalOutstanding).toBe('110');
    expect(model.currencyTotals[0]?.securedDebt).toBe('110');
  });
});
