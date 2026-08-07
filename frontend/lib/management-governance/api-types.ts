import type { GovernanceAssessmentResponse } from '@/lib/management-governance/assessment';
import type { ManagementGovernanceOverviewSummary } from '@/lib/management-governance/overview';
import type {
  LinkedWorkstreamReferences,
  ManagementGovernanceIpoSetupReference,
  ManagementGovernanceProgress,
  SectionStatus,
} from '@/lib/management-governance/types';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

export type { ManagementGovernanceSectionId };

export type WorkspaceProgress = ManagementGovernanceProgress;

export type ComputationsResponse = {
  boardSize: number;
  proposedBoardSize: number;
  vacantSeats: number;
  pendingAppointments: number;
  kmpCount: number;
  smpCount: number;
  committeesReadyCount: number;
  committeesRequiredCount: number;
  policiesAdoptedCount: number;
  policiesRequiredCount: number;
  potentialDirectorshipLimitFlags: number;
  listingSegment: string;
  directorCount: number;
  currentDirectorCount: number;
  independentDirectorCount: number;
  criticalRoleVacancies: number;
};

export type ManagementGovernanceWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: ManagementGovernancePayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  ipoSetupReference: ManagementGovernanceIpoSetupReference;
  companyReference: LinkedWorkstreamReferences['company'];
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeManagementGovernanceWorkspaceResponse =
  ManagementGovernanceWorkspaceResponse & {
    created: boolean;
  };

export type ManagementGovernanceSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: ManagementGovernanceSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: ManagementGovernancePayload;
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
  sectionId: ManagementGovernanceSectionId;
  label: string;
};

export type ManagementGovernanceOverviewSummaryResponse = ManagementGovernanceOverviewSummary & {
  lastUpdatedAt: string | null;
};

export type { GovernanceAssessmentResponse };

export type DashboardManagementGovernanceProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};
