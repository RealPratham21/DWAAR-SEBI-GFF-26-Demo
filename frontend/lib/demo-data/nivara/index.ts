import type { CompanyIncorporationSessionData } from '@/lib/company-incorporation/defaults';
import type { BorrowingsAssetsContractsPayload } from '@/lib/schemas/borrowings-assets-contracts';
import type { BusinessOperationsPayload } from '@/lib/schemas/business-operations';
import type { CapitalOwnershipPayload } from '@/lib/schemas/capital-ownership';
import type { FinancialsKpisPayload } from '@/lib/schemas/financials-kpis';
import type { GroupEntitiesRelatedPartiesPayload } from '@/lib/schemas/group-entities-related-parties';
import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';
import type { IntermediariesFilingPayload } from '@/lib/schemas/intermediaries-filing';
import type { IpoSetupPayload } from '@/lib/schemas/ipo-setup';
import type { LitigationApprovalsCompliancePayload } from '@/lib/schemas/litigation-approvals-compliance';
import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';
import type { ObjectsOfIssuePayload } from '@/lib/schemas/objects-of-issue';

import { createNivaraBorrowingsAssetsContractsPayload } from '@/lib/demo-data/nivara/borrowings-assets-contracts';
import { createNivaraBusinessOperationsPayload } from '@/lib/demo-data/nivara/business-operations';
import { createNivaraCapitalOwnershipPayload } from '@/lib/demo-data/nivara/capital-ownership';
import { createNivaraCompanyIncorporationPayload } from '@/lib/demo-data/nivara/company-incorporation';
import { createNivaraFinancialsKpisPayload } from '@/lib/demo-data/nivara/financials-kpis';
import { createNivaraGroupEntitiesPayload } from '@/lib/demo-data/nivara/group-entities-related-parties';
import { createNivaraIndustryMarketPayload } from '@/lib/demo-data/nivara/industry-market';
import { createNivaraIntermediariesFilingPayload } from '@/lib/demo-data/nivara/intermediaries-filing';
import { createNivaraIpoSetupPayload } from '@/lib/demo-data/nivara/ipo-setup';
import { createNivaraLitigationApprovalsCompliancePayload } from '@/lib/demo-data/nivara/litigation-approvals-compliance';
import { createNivaraManagementGovernancePayload } from '@/lib/demo-data/nivara/management-governance';
import { createNivaraObjectsOfIssuePayload } from '@/lib/demo-data/nivara/objects-of-issue';
import type { NivaraWorkstreamKey } from '@/lib/demo-data/nivara/types';

export type NivaraWorkstreamSample =
  | CompanyIncorporationSessionData
  | IpoSetupPayload
  | CapitalOwnershipPayload
  | BusinessOperationsPayload
  | ObjectsOfIssuePayload
  | FinancialsKpisPayload
  | ManagementGovernancePayload
  | IndustryMarketPayload
  | GroupEntitiesRelatedPartiesPayload
  | BorrowingsAssetsContractsPayload
  | LitigationApprovalsCompliancePayload
  | IntermediariesFilingPayload;

const SAMPLE_BUILDERS: Record<NivaraWorkstreamKey, () => NivaraWorkstreamSample> = {
  'company-incorporation': createNivaraCompanyIncorporationPayload,
  'ipo-setup-eligibility': createNivaraIpoSetupPayload,
  'capital-ownership': createNivaraCapitalOwnershipPayload,
  'business-operations': createNivaraBusinessOperationsPayload,
  'objects-of-issue': createNivaraObjectsOfIssuePayload,
  'financials-kpis': createNivaraFinancialsKpisPayload,
  'management-governance': createNivaraManagementGovernancePayload,
  'industry-market': createNivaraIndustryMarketPayload,
  'group-entities-related-parties': createNivaraGroupEntitiesPayload,
  'borrowings-assets-contracts': createNivaraBorrowingsAssetsContractsPayload,
  'litigation-approvals-compliance': createNivaraLitigationApprovalsCompliancePayload,
  'intermediaries-filing': createNivaraIntermediariesFilingPayload,
};

/** Returns a fresh deep-cloned Nivara sample payload for the given workstream. */
export function getNivaraWorkstreamSample(workstreamKey: NivaraWorkstreamKey): NivaraWorkstreamSample {
  return structuredClone(SAMPLE_BUILDERS[workstreamKey]());
}

export { NIVARA_WORKSTREAM_KEYS } from '@/lib/demo-data/nivara/types';
export type { NivaraWorkstreamKey } from '@/lib/demo-data/nivara/types';
