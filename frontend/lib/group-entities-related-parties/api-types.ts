import type { GroupAssessmentResponse } from '@/lib/group-entities-related-parties/assessment';
import type { GroupEntitiesOverviewSummary } from '@/lib/group-entities-related-parties/overview';
import type {
  GroupEntitiesProgress,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/group-entities-related-parties/types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export type { GroupEntitiesSectionId };

export type WorkspaceProgress = GroupEntitiesProgress;

export type RptSummaryResponse = {
  totalByParty: Record<string, string>;
  totalByType: Record<string, string>;
  totalByFinancialYear: Record<string, string>;
  rptSales: string;
  rptPurchases: string;
  rptLoansGiven: string;
  rptLoansReceived: string;
  guarantees: string;
  closingReceivables: string;
  closingPayables: string;
  closingLoans: string;
  latestFinancialYearTotal: string;
  rptRevenuePercent: string | null;
  rptPurchasesPercent: string | null;
  rptReceivablesPercent: string | null;
  rptPayablesPercent: string | null;
  financialsRevenueDifference: string | null;
  financialsPurchasesDifference: string | null;
};

export type ComputationsResponse = {
  entityCount: number;
  subsidiaryCount: number;
  stepDownSubsidiaryCount: number;
  associateCount: number;
  jvCount: number;
  promoterGroupEntityCount: number;
  icdrGroupCompanyCount: number;
  icdrPendingBoardCount: number;
  relatedPartyCount: number;
  historicalRelatedPartyCount: number;
  ownershipRelationshipCount: number;
  rptTransactionCount: number;
  commonPursuitEntityCount: number;
  dependencyCount: number;
  negativeNetWorthCount: number;
  lossMakingCount: number;
  auditorQualifiedCount: number;
  incompleteInformationCount: number;
  ibcConcernCount: number;
  pendingEntityInformationCount: number;
  rptSummary: RptSummaryResponse;
  ownershipChainSummary: string[];
};

export type GroupEntitiesWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: GroupEntitiesRelatedPartiesPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  companyReference: LinkedWorkstreamReferences['company'];
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeGroupEntitiesWorkspaceResponse = GroupEntitiesWorkspaceResponse & {
  created: boolean;
};

export type GroupEntitiesSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: GroupEntitiesSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: GroupEntitiesRelatedPartiesPayload;
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

export type GroupEntitiesOverviewSummaryResponse = GroupEntitiesOverviewSummary & {
  lastUpdatedAt: string | null;
};

export type DashboardGroupEntitiesProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};

export type { GroupAssessmentResponse };
