/**
 * Shared Intermediaries & Filing types.
 *
 * Persisted shapes live in `@/lib/schemas/intermediaries-filing` and are re-exported here.
 * Types declared in this file describe DERIVED state (progress, cross-workstream references,
 * dependency tracking) and are never persisted.
 */

import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
  FilingStage,
} from '@/lib/schemas/intermediaries-filing';

export type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
  IntermediaryRecord,
  FilingRecord,
  OfferDocumentVersionRecord,
  CertificateRecord,
  ConsentRecord,
  IfFinalConfirmations,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
  FilingStage,
  FilingStatus,
  IntermediaryRole,
  ReconciliationStatus,
} from '@/lib/schemas/intermediaries-filing';

export type { IntermediariesFilingTabId } from '@/lib/intermediaries-filing/options';

export type SectionStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'not_yet_due'
  | 'not_applicable';

export type IfProgress = {
  sections: Record<IntermediariesFilingSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
  currentFilingStage: FilingStage | '';
};

export type CompanyReference = {
  available: boolean;
  legalName: string | null;
  cin: string | null;
  registeredOffice: string | null;
  publicPrivateStatus: string | null;
};

export type IpoSetupReference = {
  available: boolean;
  targetSmePlatform: string | null;
  issueMethod: string | null;
  freshIssue: string | null;
  ofs: string | null;
  totalOffer: string | null;
  faceValue: string | null;
  proposedFinalIssuePrice: string | null;
  targetFilingDate: string | null;
  issueStage: string | null;
};

export type CapitalOwnershipReference = {
  available: boolean;
  preIssueShares: string | null;
  postIssueShares: string | null;
  freshIssueShares: string | null;
  ofsShares: string | null;
  promoterContribution: string | null;
  sellingShareholders: string | null;
};

export type ObjectsOfIssueReference = {
  available: boolean;
  totalObjectsAmount: string | null;
  capexAmount: string | null;
  workingCapitalAmount: string | null;
  debtRepaymentAmount: string | null;
};

export type FinancialsKpisReference = {
  available: boolean;
  latestFinancialPeriod: string | null;
  restatedFinancialsReady: boolean | null;
  kpiReadiness: string | null;
  auditorCertificateContext: string | null;
};

export type ManagementGovernanceReference = {
  available: boolean;
  directorCount: number | null;
  kmpCount: number | null;
  cfoName: string | null;
  companySecretaryName: string | null;
};

export type BusinessOperationsReference = {
  available: boolean;
  facilityCount: number | null;
  operationalDdContextAvailable: boolean | null;
};

export type IndustryMarketReference = {
  available: boolean;
  industryReportReady: boolean | null;
  researchProvider: string | null;
};

export type GroupEntitiesReference = {
  available: boolean;
  entityCount: number | null;
  materialSubsidiaryCount: number | null;
};

export type BorrowingsAssetsContractsReference = {
  available: boolean;
  materialContractCount: number | null;
  inspectionCandidateCount: number | null;
  financingConsentCount: number | null;
};

export type LitigationApprovalsComplianceReference = {
  available: boolean;
  openMatterCount: number | null;
  materialDevelopmentCount: number | null;
  approvalGapCount: number | null;
  filingCutOffUpdated: boolean | null;
};

export type LinkedWorkstreamReferences = {
  company: CompanyReference;
  ipoSetup: IpoSetupReference;
  capitalOwnership: CapitalOwnershipReference;
  objectsOfIssue: ObjectsOfIssueReference;
  financialsKpis: FinancialsKpisReference;
  managementGovernance: ManagementGovernanceReference;
  businessOperations: BusinessOperationsReference;
  industryMarket: IndustryMarketReference;
  groupEntities: GroupEntitiesReference;
  borrowingsAssetsContracts: BorrowingsAssetsContractsReference;
  litigationApprovalsCompliance: LitigationApprovalsComplianceReference;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: {
      available: false,
      legalName: null,
      cin: null,
      registeredOffice: null,
      publicPrivateStatus: null,
    },
    ipoSetup: {
      available: false,
      targetSmePlatform: null,
      issueMethod: null,
      freshIssue: null,
      ofs: null,
      totalOffer: null,
      faceValue: null,
      proposedFinalIssuePrice: null,
      targetFilingDate: null,
      issueStage: null,
    },
    capitalOwnership: {
      available: false,
      preIssueShares: null,
      postIssueShares: null,
      freshIssueShares: null,
      ofsShares: null,
      promoterContribution: null,
      sellingShareholders: null,
    },
    objectsOfIssue: {
      available: false,
      totalObjectsAmount: null,
      capexAmount: null,
      workingCapitalAmount: null,
      debtRepaymentAmount: null,
    },
    financialsKpis: {
      available: false,
      latestFinancialPeriod: null,
      restatedFinancialsReady: null,
      kpiReadiness: null,
      auditorCertificateContext: null,
    },
    managementGovernance: {
      available: false,
      directorCount: null,
      kmpCount: null,
      cfoName: null,
      companySecretaryName: null,
    },
    businessOperations: {
      available: false,
      facilityCount: null,
      operationalDdContextAvailable: null,
    },
    industryMarket: {
      available: false,
      industryReportReady: null,
      researchProvider: null,
    },
    groupEntities: {
      available: false,
      entityCount: null,
      materialSubsidiaryCount: null,
    },
    borrowingsAssetsContracts: {
      available: false,
      materialContractCount: null,
      inspectionCandidateCount: null,
      financingConsentCount: null,
    },
    litigationApprovalsCompliance: {
      available: false,
      openMatterCount: null,
      materialDevelopmentCount: null,
      approvalGapCount: null,
      filingCutOffUpdated: null,
    },
  };
}

export type IntermediariesFilingPayloadDraft = IntermediariesFilingPayload;

export type IfDependencyCategory =
  | 'inter-se-responsibility'
  | 'filing-record'
  | 'exchange-query'
  | 'resubmission'
  | 'certificate'
  | 'consent'
  | 'chapter-signoff'
  | 'issue-bank-role'
  | 'underwriting-commitment'
  | 'nominated-investor'
  | 'subscription-row'
  | 'allotment-summary'
  | 'placeholder'
  | 'inspection-item'
  | 'issue-agreement'
  | 'public-communication'
  | 'post-issue-action';

export type IfDependency = {
  category: IfDependencyCategory;
  recordId: string;
  sectionId: IntermediariesFilingSectionId;
  label: string;
};

export type MasterRecordType = 'intermediary' | 'filing' | 'document-version';

export type MasterRecordReference = {
  masterType: MasterRecordType;
  masterId: string;
  label: string;
};
