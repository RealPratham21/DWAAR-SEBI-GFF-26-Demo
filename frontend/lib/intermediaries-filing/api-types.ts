import type { IfAssessmentResponse } from '@/lib/intermediaries-filing/assessment';
import type { IfReconciliationPreview } from '@/lib/intermediaries-filing/reconciliation';
import type { IntermediariesFilingOverviewSummary } from '@/lib/intermediaries-filing/overview';
import type {
  IfProgress,
  LinkedWorkstreamReferences,
} from '@/lib/intermediaries-filing/types';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

export type { IntermediariesFilingSectionId };

export type WorkspaceProgress = IfProgress;

export type ReconciliationMismatchResponse = {
  workstream: string;
  field: string;
  ifValue: string;
  linkedValue: string;
  status: string;
  message: string;
};

export type ReconciliationWorkstreamPreviewResponse = {
  status: string;
  detail: string;
  mismatchCount: number;
  mismatches: ReconciliationMismatchResponse[];
};

export type ComputationsResponse = {
  intermediaryAggregates: Record<string, unknown>;
  filingAggregates: Record<string, unknown>;
  certificateConsentAggregates: Record<string, unknown>;
  dueDiligenceAggregates: Record<string, unknown>;
  infrastructureAggregates: Record<string, unknown>;
  underwritingAggregates: Record<string, unknown>;
  marketMakingAggregates: Record<string, unknown>;
  programmeAggregates: Record<string, unknown>;
  finalDocumentAggregates: Record<string, unknown>;
  reconciliation: IfReconciliationPreview & {
    items?: ReconciliationMismatchResponse[];
    totalMismatchCount?: number;
  };
  currentFilingStage: string;
};

export type IntermediariesFilingWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: IntermediariesFilingPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeIntermediariesFilingWorkspaceResponse =
  IntermediariesFilingWorkspaceResponse & {
    created: boolean;
  };

export type IntermediariesFilingSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: IntermediariesFilingSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: IntermediariesFilingPayload;
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

export type IntermediariesFilingOverviewSummaryResponse = IntermediariesFilingOverviewSummary & {
  lastUpdatedAt: string | null;
};

export type DashboardIntermediariesFilingProgress = {
  overallStatus: 'not_started' | 'in_progress' | 'complete';
  sectionsComplete: number;
  totalSections: number;
};

export type { IfAssessmentResponse };
