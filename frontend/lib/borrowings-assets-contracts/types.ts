/**
 * Shared Borrowings, Assets & Contracts types.
 *
 * Persisted shapes live in `@/lib/schemas/borrowings-assets-contracts` and are re-exported here.
 * Types declared in this file describe DERIVED state (progress, cross-workstream references,
 * dependency tracking) and are never persisted.
 */

import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
  FacilityRecord,
  SecurityRecord,
  ChargeRecord,
  GuaranteeRecord,
  CovenantRecord,
  LenderConsentRecord,
  DefaultEventRecord,
  PropertyRecord,
  PropertyIssueRecord,
  MaterialAssetRecord,
  ContractRecord,
  ContractMaterialityRecord,
  BacChangeRecord,
  BacConfirmations,
  BorrowingSnapshot,
  BorrowingPowers,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/borrowings-assets-contracts';

export type { BorrowingsAssetsContractsTabId } from '@/lib/borrowings-assets-contracts/options';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type BorrowingsAssetsContractsProgress = {
  sections: Record<BorrowingsAssetsContractsSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type LinkedWorkstreamPlaceholder = {
  available: boolean;
};

export type FinancialsKpisReference = {
  available: boolean;
  latestFinancialPeriod: string | null;
  currentBorrowings: string | null;
  nonCurrentBorrowings: string | null;
  leaseLiabilities: string | null;
  totalDebt: string | null;
  relatedPartyDebt: string | null;
  financeCosts: string | null;
  ppe: string | null;
  cwip: string | null;
  rouAssets: string | null;
};

export type ObjectsOfIssueReference = {
  available: boolean;
  debtRepaymentObjectsCount: number;
  totalProposedRepayment: string | null;
};

export type GroupEntitiesReference = {
  available: boolean;
  relatedPartyBorrowingsCount: number;
  interCompanyLoansCount: number;
  corporateGuaranteesCount: number;
};

export type CapitalOwnershipReference = {
  available: boolean;
  promoterCount: number;
  pledgedSharesReported: boolean;
  guaranteeProvidersCount: number;
};

export type BusinessOperationsReference = {
  available: boolean;
  facilityCount: number;
  insurancePolicyCount: number;
  ipRecordCount: number;
  majorCustomerSupplierContextAvailable: boolean;
};

export type ManagementGovernanceReference = {
  available: boolean;
  directorCount: number;
  kmpCount: number;
  approvalContextAvailable: boolean;
};

export type LinkedWorkstreamReferences = {
  financialsKpis: FinancialsKpisReference;
  objectsOfIssue: ObjectsOfIssueReference;
  groupEntities: GroupEntitiesReference;
  capitalOwnership: CapitalOwnershipReference;
  businessOperations: BusinessOperationsReference;
  managementGovernance: ManagementGovernanceReference;
  litigationApprovalsCompliance: LinkedWorkstreamPlaceholder;
  intermediariesFiling: LinkedWorkstreamPlaceholder;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    financialsKpis: {
      available: false,
      latestFinancialPeriod: null,
      currentBorrowings: null,
      nonCurrentBorrowings: null,
      leaseLiabilities: null,
      totalDebt: null,
      relatedPartyDebt: null,
      financeCosts: null,
      ppe: null,
      cwip: null,
      rouAssets: null,
    },
    objectsOfIssue: {
      available: false,
      debtRepaymentObjectsCount: 0,
      totalProposedRepayment: null,
    },
    groupEntities: {
      available: false,
      relatedPartyBorrowingsCount: 0,
      interCompanyLoansCount: 0,
      corporateGuaranteesCount: 0,
    },
    capitalOwnership: {
      available: false,
      promoterCount: 0,
      pledgedSharesReported: false,
      guaranteeProvidersCount: 0,
    },
    businessOperations: {
      available: false,
      facilityCount: 0,
      insurancePolicyCount: 0,
      ipRecordCount: 0,
      majorCustomerSupplierContextAvailable: false,
    },
    managementGovernance: {
      available: false,
      directorCount: 0,
      kmpCount: 0,
      approvalContextAvailable: false,
    },
    litigationApprovalsCompliance: { available: false },
    intermediariesFiling: { available: false },
  };
}

export type BorrowingsAssetsContractsPayloadDraft = BorrowingsAssetsContractsPayload;

export type BacDependencyCategory =
  | 'security'
  | 'charge'
  | 'guarantee'
  | 'covenant'
  | 'consent'
  | 'default'
  | 'restructuring'
  | 'cross-default'
  | 'property-issue'
  | 'asset-reconciliation'
  | 'insurance-linkage'
  | 'ip-dependency'
  | 'materiality'
  | 'non-ordinary-course-review'
  | 'breach-dispute'
  | 'inspection-candidate'
  | 'objects-repayment'
  | 'change';

export type BacDependency = {
  category: BacDependencyCategory;
  recordId: string;
  sectionId: BorrowingsAssetsContractsSectionId;
  label: string;
};

export type MasterRecordType = 'facility' | 'property' | 'asset' | 'contract';

export type MasterRecordReference = {
  masterType: MasterRecordType;
  masterId: string;
  label: string;
};
