import { apiRequest } from '@/lib/api/client';
import type {
  InitializeObjectsIssueWorkspaceResponse,
  ObjectsAssessmentResponse,
  ObjectsIssueOverviewSummary,
  ObjectsIssueSectionSaveResponse,
  ObjectsIssueWorkspaceResponse,
} from '@/lib/objects-of-issue/api-types';
import type {
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';

const BASE = '/workstreams/objects-issue';

export async function initializeObjectsIssueWorkspace(): Promise<InitializeObjectsIssueWorkspaceResponse> {
  return apiRequest<InitializeObjectsIssueWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchObjectsIssueWorkspace(): Promise<ObjectsIssueWorkspaceResponse> {
  return apiRequest<ObjectsIssueWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveObjectsIssueSection(
  sectionId: ObjectsOfIssueSectionId,
  version: number,
  data: ObjectsOfIssuePayload[keyof Omit<ObjectsOfIssuePayload, 'schemaVersion'>],
): Promise<ObjectsIssueSectionSaveResponse> {
  return apiRequest<ObjectsIssueSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchObjectsIssueOverviewSummary(): Promise<ObjectsIssueOverviewSummary> {
  return apiRequest<ObjectsIssueOverviewSummary>(`${BASE}/overview-summary`, { method: 'GET' });
}

export async function fetchObjectsIssueAssessment(): Promise<ObjectsAssessmentResponse> {
  return apiRequest<ObjectsAssessmentResponse>(`${BASE}/objects-assessment`, {
    method: 'GET',
  });
}
