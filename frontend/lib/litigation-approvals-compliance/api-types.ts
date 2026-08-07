import type { LacAssessmentResponse } from '@/lib/litigation-approvals-compliance/assessment';
import type { LitigationApprovalsComplianceOverviewSummary } from '@/lib/litigation-approvals-compliance/overview';
import type {
  LacProgress,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/litigation-approvals-compliance/types';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export type { LitigationApprovalsComplianceSectionId };

export type WorkspaceProgress = LacProgress;

export type MatterCategoryCountResponse = {
  category: string;
  count: number;
};

export type ExposureByCurrencyResponse = {
  currency: string;
  amountUnit: string;
  matterCount: number;
  totalExposure: string;
  taxExposure: string;
  criminalCount: number;
  pendingCount: number;
};

export type TaxAggregateResponse = {
  directTaxDemand: string;
  indirectTaxDemand: string;
  totalDemand: string;
  totalBalanceDisputed: string;
  proceedingCount: number;
};

export type ApprovalExpiryWindowEntryResponse = {
  approvalId: string;
  label: string;
  expiryDate: string;
  daysUntilExpiry: number | null;
  window: string;
};

export type ApprovalExpiryWindowsResponse = {
  within30Days: ApprovalExpiryWindowEntryResponse[];
  within90Days: ApprovalExpiryWindowEntryResponse[];
  within180Days: ApprovalExpiryWindowEntryResponse[];
  within365Days: ApprovalExpiryWindowEntryResponse[];
};

export type ComplianceCountsResponse = {
  domainReviewCount: number;
  domainsWithKnownExceptions: number;
  complianceIssueCount: number;
  continuingIssues: number;
  statutoryDueCount: number;
  delayedStatutoryDues: number;
  approvalConditionsOutstanding: number;
};

export type CreditorTotalsResponse = {
  materialCreditorCount: number;
  msmeCreditorCount: number;
  materialOutstanding: string;
  msmeOutstanding: string;
  aggregateOutstanding: string;
  reconciliationDifference: string;
  reconciliationStatus: string;
};

export type ReconciliationPreviewItemResponse = {
  status: string;
  detail: string;
};

export type LacReconciliationPreviewResponse = {
  financials: ReconciliationPreviewItemResponse;
  groupEntities: ReconciliationPreviewItemResponse;
  managementGovernance: ReconciliationPreviewItemResponse;
  bac: ReconciliationPreviewItemResponse;
  businessOperations: ReconciliationPreviewItemResponse;
  objectsOfIssue: ReconciliationPreviewItemResponse;
  ipoSetup: ReconciliationPreviewItemResponse;
};

export type ComputationsResponse = {
  matterCount: number;
  mattersByCategory: MatterCategoryCountResponse[];
  criminalMatterCount: number;
  taxMatterCount: number;
  pendingOutcomeCount: number;
  exposureByCurrency: ExposureByCurrencyResponse[];
  taxAggregates: TaxAggregateResponse;
  approvalCount: number;
  expiredApprovalCount: number;
  renewalPendingCount: number;
  approvalExpiryWindows: ApprovalExpiryWindowsResponse;
  complianceCounts: ComplianceCountsResponse;
  creditorTotals: CreditorTotalsResponse;
  remediationOpenCount: number;
  legalDdAsOfDate: string;
  reconciliation: LacReconciliationPreviewResponse;
};

export type LitigationApprovalsComplianceWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: LitigationApprovalsCompliancePayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeLitigationApprovalsComplianceWorkspaceResponse =
  LitigationApprovalsComplianceWorkspaceResponse & {
    created: boolean;
  };

export type LitigationApprovalsComplianceSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: LitigationApprovalsComplianceSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: LitigationApprovalsCompliancePayload;
  computations: ComputationsResponse;
  acknowledgement: { message: string; savedAt: string };
  notification: {
    id: string;
    notificationType: string;
    title: string;
    message: string;
    workstreamSlug: string;
    sectionId: string | null;
    targetRoute: string;
    readAt: string | null;
    createdAt: string;
  };
};

export type LitigationApprovalsComplianceOverviewSummaryResponse =
  LitigationApprovalsComplianceOverviewSummary & {
    lastUpdatedAt: string | null;
  };

export type DashboardLitigationApprovalsComplianceProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};

export type { LacAssessmentResponse };
