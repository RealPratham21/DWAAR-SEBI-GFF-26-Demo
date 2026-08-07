/**
 * Shared Litigation, Approvals & Compliance types.
 *
 * Persisted shapes live in `@/lib/schemas/litigation-approvals-compliance` and are re-exported here.
 * Types declared in this file describe DERIVED state (progress, cross-workstream references,
 * dependency tracking) and are never persisted.
 */

import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
  MatterRecord,
  ApprovalRecord,
  ApprovalConditionRecord,
  RegulatoryActionRecord,
  TaxProceedingDetail,
  ComplianceIssueRecord,
  StatutoryDueRecord,
  MaterialCreditorRecord,
  HistoricalPenaltyRecord,
  MaterialDevelopmentRecord,
  RemediationActionRecord,
  LacConfirmations,
  LegalPartyReviewRecord,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
  MatterCategory,
  ApprovalCategory,
  ApprovalStatus,
  ReconciliationStatus,
  MatterOutcomeStatus,
  MatterMaterialityState,
  ConditionComplianceStatus,
} from '@/lib/schemas/litigation-approvals-compliance';

export type { LitigationApprovalsComplianceTabId } from '@/lib/litigation-approvals-compliance/options';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type LacProgress = {
  sections: Record<LitigationApprovalsComplianceSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyLegalReference = {
  available: boolean;
  legalName: string | null;
  cin: string | null;
};

export type IpoSetupReference = {
  available: boolean;
  targetDrhpFilingDate: string | null;
  proposedOfferType: string | null;
};

export type CapitalOwnershipReference = {
  available: boolean;
  promoterCount: number | null;
  pledgedSharesReported: boolean | null;
};

export type ManagementGovernanceReference = {
  available: boolean;
  directorCount: number | null;
  kmpCount: number | null;
};

export type FinancialsKpisReference = {
  available: boolean;
  latestFinancialPeriod: string | null;
  contingentLiabilitiesTotal: string | null;
  provisionsTotal: string | null;
  taxDisputesTotal: string | null;
  tradePayablesTotal: string | null;
};

export type BusinessOperationsReference = {
  available: boolean;
  facilityCount: number | null;
  operationalApprovalContextAvailable: boolean | null;
};

export type ObjectsOfIssueReference = {
  available: boolean;
  capexProjectCount: number | null;
  approvalPlanLinked: boolean | null;
};

export type GroupEntitiesReference = {
  available: boolean;
  entityCount: number | null;
  materialSubsidiaryCount: number | null;
};

export type BorrowingsAssetsContractsReference = {
  available: boolean;
  facilityCount: number | null;
  defaultEventCount: number | null;
  contractDisputeCount: number | null;
};

export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  ipoSetup: IpoSetupReference;
  capitalOwnership: CapitalOwnershipReference;
  managementGovernance: ManagementGovernanceReference;
  financialsKpis: FinancialsKpisReference;
  businessOperations: BusinessOperationsReference;
  objectsOfIssue: ObjectsOfIssueReference;
  groupEntities: GroupEntitiesReference;
  borrowingsAssetsContracts: BorrowingsAssetsContractsReference;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: { available: false, legalName: null, cin: null },
    ipoSetup: { available: false, targetDrhpFilingDate: null, proposedOfferType: null },
    capitalOwnership: { available: false, promoterCount: null, pledgedSharesReported: null },
    managementGovernance: { available: false, directorCount: null, kmpCount: null },
    financialsKpis: {
      available: false,
      latestFinancialPeriod: null,
      contingentLiabilitiesTotal: null,
      provisionsTotal: null,
      taxDisputesTotal: null,
      tradePayablesTotal: null,
    },
    businessOperations: {
      available: false,
      facilityCount: null,
      operationalApprovalContextAvailable: null,
    },
    objectsOfIssue: { available: false, capexProjectCount: null, approvalPlanLinked: null },
    groupEntities: { available: false, entityCount: null, materialSubsidiaryCount: null },
    borrowingsAssetsContracts: {
      available: false,
      facilityCount: null,
      defaultEventCount: null,
      contractDisputeCount: null,
    },
  };
}

export type LitigationApprovalsCompliancePayloadDraft = LitigationApprovalsCompliancePayload;

export type LacDependencyCategory =
  | 'criminal-screening'
  | 'regulatory-action'
  | 'sebi-exchange-screening'
  | 'tax-proceeding'
  | 'matter-subject-link'
  | 'approval-condition'
  | 'facility-approval-review'
  | 'project-approval-requirement'
  | 'compliance-issue'
  | 'statutory-due'
  | 'material-creditor'
  | 'historical-penalty'
  | 'material-development'
  | 'remediation-action';

export type LacDependency = {
  category: LacDependencyCategory;
  recordId: string;
  sectionId: LitigationApprovalsComplianceSectionId;
  label: string;
};

export type MasterRecordType = 'matter' | 'approval';

export type MasterRecordReference = {
  masterType: MasterRecordType;
  masterId: string;
  label: string;
};
