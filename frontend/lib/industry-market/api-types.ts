import type { IndustryAssessmentResponse } from '@/lib/industry-market/assessment';
import type { IndustryMarketOverviewSummary } from '@/lib/industry-market/overview';
import type {
  IndustryMarketProgress,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/industry-market/types';
import type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

export type { IndustryMarketSectionId };

export type WorkspaceProgress = IndustryMarketProgress;

export type ComputationsResponse = {
  primaryIndustry: string;
  relevantMarket: string;
  geography: string;
  latestMarketSize: string;
  latestMarketSizePeriod: string;
  latestMarketSizeUnit: string;
  forecastMarketSize: string;
  forecastPeriod: string;
  forecastCagr: string;
  marketSeriesCount: number;
  marketSegmentCount: number;
  issuerLinkedSegmentCount: number;
  competitorCount: number;
  calculatedIssuerMarketShare: string;
  marketShareBasis: string;
  marketSharePeriod: string;
  sourceCount: number;
  currentSourceCount: number;
  potentiallyStaleSourceCount: number;
  pendingVerificationSourceCount: number;
  commissionedReportCount: number;
  claimsProposed: number;
  claimsSubstantiated: number;
  claimsNeedingEvidence: number;
  conflictingSourceCount: number;
};

export type IndustryMarketWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: IndustryMarketPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  companyReference: LinkedWorkstreamReferences['company'];
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeIndustryMarketWorkspaceResponse = IndustryMarketWorkspaceResponse & {
  created: boolean;
};

export type IndustryMarketSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: IndustryMarketSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: IndustryMarketPayload;
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

export type OverviewNextAction = {
  sectionId: IndustryMarketSectionId;
  label: string;
};

export type IndustryMarketOverviewSummaryResponse = IndustryMarketOverviewSummary & {
  lastUpdatedAt: string | null;
};

export type { IndustryAssessmentResponse };

export type DashboardIndustryMarketProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};
