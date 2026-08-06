import { apiRequest } from '@/lib/api/client';
import type {
  CapitalAssessmentResponse,
  CapitalOwnershipOverviewSummary,
  CapitalOwnershipSectionId,
  CapitalOwnershipSectionSaveResponse,
  CapitalOwnershipWorkspaceResponse,
  InitializeCapitalOwnershipWorkspaceResponse,
} from '@/lib/capital-ownership/api-types';
import type { CapitalOwnershipPayload } from '@/lib/schemas/capital-ownership';

const BASE = '/workstreams/capital-ownership';

export async function initializeCapitalOwnershipWorkspace(): Promise<InitializeCapitalOwnershipWorkspaceResponse> {
  return apiRequest<InitializeCapitalOwnershipWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchCapitalOwnershipWorkspace(): Promise<CapitalOwnershipWorkspaceResponse> {
  return apiRequest<CapitalOwnershipWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveCapitalOwnershipSection(
  sectionId: CapitalOwnershipSectionId,
  version: number,
  data: CapitalOwnershipPayload[keyof Omit<CapitalOwnershipPayload, 'schemaVersion'>],
): Promise<CapitalOwnershipSectionSaveResponse> {
  return apiRequest<CapitalOwnershipSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchCapitalOwnershipOverviewSummary(): Promise<CapitalOwnershipOverviewSummary> {
  return apiRequest<CapitalOwnershipOverviewSummary>(`${BASE}/overview-summary`, { method: 'GET' });
}

export async function fetchCapitalOwnershipAssessment(): Promise<CapitalAssessmentResponse> {
  return apiRequest<CapitalAssessmentResponse>(`${BASE}/capital-assessment`, { method: 'GET' });
}
