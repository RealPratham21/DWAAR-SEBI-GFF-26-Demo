import { describe, expect, it } from 'vitest';
import { calculateBorrowingsAssetsContractsProgress } from '@/lib/borrowings-assets-contracts/progress';
import { calculateBusinessOperationsProgress } from '@/lib/business-operations/progress';
import { calculateCapitalOwnershipProgress } from '@/lib/capital-ownership/progress';
import { calculateFinancialsKpisProgress } from '@/lib/financials-kpis/progress';
import { calculateGroupEntitiesProgress } from '@/lib/group-entities-related-parties/progress';
import { calculateIndustryMarketProgress } from '@/lib/industry-market/progress';
import { calculateIntermediariesFilingProgress } from '@/lib/intermediaries-filing/progress';
import { calculateIpoSetupProgress } from '@/lib/ipo-setup/progress';
import { calculateLitigationApprovalsComplianceProgress } from '@/lib/litigation-approvals-compliance/progress';
import { calculateManagementGovernanceProgress } from '@/lib/management-governance/progress';
import { calculateObjectsOfIssueProgress } from '@/lib/objects-of-issue/progress';
import { getNivaraWorkstreamSample, NIVARA_WORKSTREAM_KEYS } from '@/lib/demo-data/nivara';
import type { NivaraWorkstreamKey } from '@/lib/demo-data/nivara/types';
import { createNivaraCompanyIncorporationPayload } from '@/lib/demo-data/nivara/company-incorporation';

type SectionStatus = 'not_started' | 'in_progress' | 'complete' | 'not_yet_due' | 'not_applicable';

const FRONTEND_PROGRESS: Record<
  Exclude<NivaraWorkstreamKey, 'company-incorporation'>,
  (payload: never) => { sections: Record<string, SectionStatus> }
> = {
  'ipo-setup-eligibility': calculateIpoSetupProgress as never,
  'capital-ownership': calculateCapitalOwnershipProgress as never,
  'business-operations': calculateBusinessOperationsProgress as never,
  'objects-of-issue': calculateObjectsOfIssueProgress as never,
  'financials-kpis': calculateFinancialsKpisProgress as never,
  'management-governance': calculateManagementGovernanceProgress as never,
  'industry-market': calculateIndustryMarketProgress as never,
  'group-entities-related-parties': calculateGroupEntitiesProgress as never,
  'borrowings-assets-contracts': calculateBorrowingsAssetsContractsProgress as never,
  'litigation-approvals-compliance': calculateLitigationApprovalsComplianceProgress as never,
  'intermediaries-filing': calculateIntermediariesFilingProgress as never,
};

function incompleteSections(
  workstream: Exclude<NivaraWorkstreamKey, 'company-incorporation'>,
  payload: unknown,
): string[] {
  const progress = FRONTEND_PROGRESS[workstream](payload as never);
  return Object.entries(progress.sections)
    .filter(([, status]) => status !== 'complete' && status !== 'not_applicable')
    .map(([id, status]) => `${id}: ${status}`);
}

describe('Nivara fixtures — all sections completable', () => {
  for (const key of NIVARA_WORKSTREAM_KEYS) {
    if (key === 'company-incorporation') continue;

    it(`${key} — every section is complete`, () => {
      const sample = getNivaraWorkstreamSample(key);
      const incomplete = incompleteSections(key, sample);
      expect(incomplete, `Incomplete sections in ${key}`).toEqual([]);
    });
  }

  it('company-incorporation — core sections have required data', () => {
    const data = createNivaraCompanyIncorporationPayload();
    expect(data.identity.legalName).toBeTruthy();
    expect(data.identity.cin).toBeTruthy();
    expect(data.offices.length).toBeGreaterThan(0);
    expect(data.registrations.length).toBeGreaterThan(0);
    expect(data.confirmations.authorisedRepresentativeDeclaration).toBe(true);
  });
});
