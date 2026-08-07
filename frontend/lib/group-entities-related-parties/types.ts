/**
 * Shared Group Entities & Related Parties types.
 */

import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
  EntityRecord,
  OwnershipRelationshipRecord,
  RelatedPartyRelationshipRecord,
  RptTransactionRecord,
  RptBalanceRecord,
  EntityClassificationRecord,
  IcdrGroupCompanyDetermination,
  MaterialityCriterionRecord,
  EntityFinancialReadinessRecord,
  GroupEntitiesConfirmations,
} from '@/lib/schemas/group-entities-related-parties';

export type { GroupEntitiesTabId } from '@/lib/group-entities-related-parties/options';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type GroupEntitiesProgress = {
  sections: Record<GroupEntitiesSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type LinkedPersonReference = {
  id: string;
  name: string;
  role: string;
  source: 'capital-ownership' | 'management-governance';
};

export type CapitalOwnershipReference = {
  available: boolean;
  promoterCount: number;
  promoters: LinkedPersonReference[];
};

export type ManagementGovernanceReference = {
  available: boolean;
  directorCount: number;
  kmpCount: number;
  directors: LinkedPersonReference[];
  kmp: LinkedPersonReference[];
  rptOversightAvailable: boolean;
};

export type FinancialsKpisReference = {
  available: boolean;
  latestFinancialPeriod: string | null;
  revenueFromOperations: string | null;
  totalPurchases: string | null;
  totalReceivables: string | null;
  totalPayables: string | null;
  rptRevenueTotal: string | null;
  rptPurchasesTotal: string | null;
  rptReceivablesTotal: string | null;
  rptPayablesTotal: string | null;
};

export type BusinessOperationsReference = {
  available: boolean;
  productServiceContextAvailable: boolean;
  supplierCustomerContextAvailable: boolean;
};

export type ObjectsOfIssueReference = {
  available: boolean;
  subsidiaryInvestmentProposed: boolean;
  relatedPartyDebtRepaymentProposed: boolean;
};

export type CompanyLegalReference = {
  available: boolean;
  legalName: string | null;
  cin: string | null;
};

export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  capitalOwnership: CapitalOwnershipReference;
  managementGovernance: ManagementGovernanceReference;
  financialsKpis: FinancialsKpisReference;
  businessOperations: BusinessOperationsReference;
  objectsOfIssue: ObjectsOfIssueReference;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: { available: false, legalName: null, cin: null },
    capitalOwnership: { available: false, promoterCount: 0, promoters: [] },
    managementGovernance: {
      available: false,
      directorCount: 0,
      kmpCount: 0,
      directors: [],
      kmp: [],
      rptOversightAvailable: false,
    },
    financialsKpis: {
      available: false,
      latestFinancialPeriod: null,
      revenueFromOperations: null,
      totalPurchases: null,
      totalReceivables: null,
      totalPayables: null,
      rptRevenueTotal: null,
      rptPurchasesTotal: null,
      rptReceivablesTotal: null,
      rptPayablesTotal: null,
    },
    businessOperations: {
      available: false,
      productServiceContextAvailable: false,
      supplierCustomerContextAvailable: false,
    },
    objectsOfIssue: {
      available: false,
      subsidiaryInvestmentProposed: false,
      relatedPartyDebtRepaymentProposed: false,
    },
  };
}

export type GroupEntitiesPayloadDraft = GroupEntitiesRelatedPartiesPayload;

export type EntityDependencyCategory =
  | 'ownership-relationship'
  | 'contractual-arrangement'
  | 'entity-classification'
  | 'icdr-determination'
  | 'material-subsidiary-purpose'
  | 'related-party-relationship'
  | 'rpt-transaction'
  | 'rpt-balance'
  | 'common-pursuit'
  | 'dependency'
  | 'other-business-interest'
  | 'financial-readiness'
  | 'relationship-change';

export type EntityDependency = {
  category: EntityDependencyCategory;
  recordId: string;
  sectionId: GroupEntitiesSectionId;
  label: string;
};
