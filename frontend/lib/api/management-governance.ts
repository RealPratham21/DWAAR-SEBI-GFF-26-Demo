import { apiRequest } from '@/lib/api/client';
import type {
  GovernanceAssessmentResponse,
  InitializeManagementGovernanceWorkspaceResponse,
  ManagementGovernanceOverviewSummaryResponse,
  ManagementGovernanceSectionSaveResponse,
  ManagementGovernanceWorkspaceResponse,
} from '@/lib/management-governance/api-types';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

const BASE = '/workstreams/management-governance';

export async function initializeManagementGovernanceWorkspace(): Promise<InitializeManagementGovernanceWorkspaceResponse> {
  return apiRequest<InitializeManagementGovernanceWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchManagementGovernanceWorkspace(): Promise<ManagementGovernanceWorkspaceResponse> {
  return apiRequest<ManagementGovernanceWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveManagementGovernanceSection(
  sectionId: ManagementGovernanceSectionId,
  version: number,
  data: ManagementGovernancePayload[keyof Omit<ManagementGovernancePayload, 'schemaVersion'>],
): Promise<ManagementGovernanceSectionSaveResponse> {
  return apiRequest<ManagementGovernanceSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchManagementGovernanceOverviewSummary(): Promise<ManagementGovernanceOverviewSummaryResponse> {
  return apiRequest<ManagementGovernanceOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchManagementGovernanceAssessment(): Promise<GovernanceAssessmentResponse> {
  return apiRequest<GovernanceAssessmentResponse>(`${BASE}/governance-assessment`, {
    method: 'GET',
  });
}
