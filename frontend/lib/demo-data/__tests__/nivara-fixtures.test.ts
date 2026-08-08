import { afterEach, describe, expect, it, vi } from 'vitest';
import { companyIncorporationFormDataSchema } from '@/lib/schemas/company-incorporation';
import { ipoSetupPayloadSchema } from '@/lib/schemas/ipo-setup';
import { capitalOwnershipPayloadSchema } from '@/lib/schemas/capital-ownership';
import { businessOperationsPayloadSchema } from '@/lib/schemas/business-operations';
import { objectsOfIssuePayloadSchema } from '@/lib/schemas/objects-of-issue';
import { financialsKpisPayloadSchema } from '@/lib/schemas/financials-kpis';
import { managementGovernancePayloadSchema } from '@/lib/schemas/management-governance';
import { industryMarketPayloadSchema } from '@/lib/schemas/industry-market';
import { groupEntitiesRelatedPartiesPayloadSchema } from '@/lib/schemas/group-entities-related-parties';
import { borrowingsAssetsContractsPayloadSchema } from '@/lib/schemas/borrowings-assets-contracts';
import { litigationApprovalsCompliancePayloadSchema } from '@/lib/schemas/litigation-approvals-compliance';
import { intermediariesFilingPayloadSchema } from '@/lib/schemas/intermediaries-filing';
import {
  getNivaraWorkstreamSample,
  NIVARA_WORKSTREAM_KEYS,
} from '@/lib/demo-data/nivara';
import { createNivaraBorrowingsAssetsContractsPayload } from '@/lib/demo-data/nivara/borrowings-assets-contracts';
import {
  NIVARA_BORROWINGS,
  NIVARA_CAPITAL,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_ISSUER,
  NIVARA_PEOPLE,
} from '@/lib/demo-data/nivara/constants';
import { createNivaraCompanyIncorporationPayload } from '@/lib/demo-data/nivara/company-incorporation';
import { createNivaraIpoSetupPayload } from '@/lib/demo-data/nivara/ipo-setup';
import { createNivaraCapitalOwnershipPayload } from '@/lib/demo-data/nivara/capital-ownership';
import { createNivaraObjectsOfIssuePayload } from '@/lib/demo-data/nivara/objects-of-issue';
import { isNivaraSampleDataEnabled } from '@/lib/demo-data/config';

const SCHEMA_BY_KEY = {
  'company-incorporation': companyIncorporationFormDataSchema,
  'ipo-setup-eligibility': ipoSetupPayloadSchema,
  'capital-ownership': capitalOwnershipPayloadSchema,
  'business-operations': businessOperationsPayloadSchema,
  'objects-of-issue': objectsOfIssuePayloadSchema,
  'financials-kpis': financialsKpisPayloadSchema,
  'management-governance': managementGovernancePayloadSchema,
  'industry-market': industryMarketPayloadSchema,
  'group-entities-related-parties': groupEntitiesRelatedPartiesPayloadSchema,
  'borrowings-assets-contracts': borrowingsAssetsContractsPayloadSchema,
  'litigation-approvals-compliance': litigationApprovalsCompliancePayloadSchema,
  'intermediaries-filing': intermediariesFilingPayloadSchema,
} as const;

describe('Nivara demo fixtures', () => {
  it('defines exactly 12 workstream sample builders', () => {
    expect(NIVARA_WORKSTREAM_KEYS).toHaveLength(12);
  });

  it.each(NIVARA_WORKSTREAM_KEYS)('schema validation passes for %s', (key) => {
    const sample = getNivaraWorkstreamSample(key);
    const result = SCHEMA_BY_KEY[key].safeParse(sample);
    if (!result.success) {
      throw new Error(
        `${key}: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
      );
    }
    expect(result.success).toBe(true);
  });

  it('produces deterministic IDs on repeated generation', () => {
    const first = createNivaraCapitalOwnershipPayload();
    const second = createNivaraCapitalOwnershipPayload();
    expect(first.shareholdersAndBeneficialOwnership.shareholders[0]?.id).toBe(NIVARA_IDS.shareholder001);
    expect(second.shareholdersAndBeneficialOwnership.shareholders[0]?.id).toBe(NIVARA_IDS.shareholder001);
    expect(first.promotersAndControl.promoters[0]?.id).toBe(NIVARA_IDS.promoter001);
    expect(second.promotersAndControl.promoters[0]?.id).toBe(NIVARA_IDS.promoter001);
  });

  it('keeps important shared Nivara values coherent across workstreams', () => {
    const company = createNivaraCompanyIncorporationPayload();
    const ipo = createNivaraIpoSetupPayload();
    const capital = createNivaraCapitalOwnershipPayload();
    const objects = createNivaraObjectsOfIssuePayload();
    const bac = createNivaraBorrowingsAssetsContractsPayload();

    expect(company.identity.legalName).toBe(NIVARA_ISSUER.legalName);
    expect(company.identity.cin).toBe(NIVARA_ISSUER.cin);
    expect(ipo.offerStructure.proposedFreshIssueShares).toBe(Number(NIVARA_CAPITAL.freshIssueShares));
    expect(capital.currentCapitalStructure.equityClasses[0]?.id).toBe(NIVARA_CAPITAL.equityClassId);
    expect(capital.promotersAndControl.promoters.map((p) => p.name)).toEqual(
      expect.arrayContaining([NIVARA_PEOPLE.promoter1.name, NIVARA_PEOPLE.promoter2.name]),
    );
    expect(objects.proceedsAndFundingSummary.freshIssueGrossProceeds).toBeTruthy();
    expect(bac.financialIndebtednessAndFacilityMaster.facilities[0]?.id).toBe(NIVARA_IDS.facility001);
    expect(bac.financialIndebtednessAndFacilityMaster.facilities[0]?.lender.lenderName).toBe(
      NIVARA_BORROWINGS.termLoanLender,
    );

    const fyEnds = ipo.trackRecordAndFinancialEligibility.financialYears.map((row) => row.financialYearEnding);
    expect(fyEnds).toEqual(
      expect.arrayContaining([
        NIVARA_FINANCIAL_PERIODS.fy2022End.slice(0, 4),
        NIVARA_FINANCIAL_PERIODS.fy2023End.slice(0, 4),
        NIVARA_FINANCIAL_PERIODS.fy2024End.slice(0, 4),
      ]),
    );
  });

  it('keeps internal BAC references connected', () => {
    const bac = createNivaraBorrowingsAssetsContractsPayload();
    const facilityId = bac.financialIndebtednessAndFacilityMaster.facilities[0]?.id;
    const charge = bac.securityChargesGuaranteesAndBorrowingPowers.charges[0];
    expect(charge?.linkedFacilityId).toBe(facilityId);
    expect(bac.immovablePropertiesAndOccupancyRights.properties[0]?.id).toBe(NIVARA_IDS.property001);
  });

  it('avoids embedding orphan cross-workstream foreign IDs in objects debt repayment', () => {
    const objects = createNivaraObjectsOfIssuePayload();
    const debtItems = objects.workingCapitalAndBorrowingRepayment.borrowingRepaymentItems;
    const facilityRef = debtItems.find((item) =>
      item.repaymentRationale?.includes(NIVARA_BORROWINGS.facilityLabel),
    );
    expect(facilityRef?.repaymentRationale).toContain(NIVARA_BORROWINGS.facilityLabel);
    expect(facilityRef?.lenderName).toContain('HDFC');
  });
});

describe('isNivaraSampleDataEnabled', () => {
  const original = process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA;
    else process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA = original;
  });

  it('respects explicit false', () => {
    process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA = 'false';
    expect(isNivaraSampleDataEnabled()).toBe(false);
  });

  it('respects explicit true', () => {
    process.env.NEXT_PUBLIC_ENABLE_NIVARA_SAMPLE_DATA = 'true';
    expect(isNivaraSampleDataEnabled()).toBe(true);
  });
});
