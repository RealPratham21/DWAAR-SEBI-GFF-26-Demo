import { apiRequest } from '@/lib/api/client';
import type {
  GroupAssessmentResponse,
  GroupEntitiesOverviewSummaryResponse,
  GroupEntitiesSectionSaveResponse,
  GroupEntitiesWorkspaceResponse,
  InitializeGroupEntitiesWorkspaceResponse,
} from '@/lib/group-entities-related-parties/api-types';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

const BASE = '/workstreams/group-entities-related-parties';

export async function initializeGroupEntitiesWorkspace(): Promise<InitializeGroupEntitiesWorkspaceResponse> {
  return apiRequest<InitializeGroupEntitiesWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchGroupEntitiesWorkspace(): Promise<GroupEntitiesWorkspaceResponse> {
  return apiRequest<GroupEntitiesWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveGroupEntitiesSection(
  sectionId: GroupEntitiesSectionId,
  version: number,
  data: GroupEntitiesRelatedPartiesPayload[keyof Omit<
    GroupEntitiesRelatedPartiesPayload,
    'schemaVersion'
  >],
): Promise<GroupEntitiesSectionSaveResponse> {
  return apiRequest<GroupEntitiesSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchGroupEntitiesOverviewSummary(): Promise<GroupEntitiesOverviewSummaryResponse> {
  return apiRequest<GroupEntitiesOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchGroupEntitiesAssessment(): Promise<GroupAssessmentResponse> {
  return apiRequest<GroupAssessmentResponse>(`${BASE}/group-rpt-assessment`, {
    method: 'GET',
  });
}
