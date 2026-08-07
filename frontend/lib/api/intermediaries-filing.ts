import { apiRequest } from '@/lib/api/client';
import type {
  IfAssessmentResponse,
  InitializeIntermediariesFilingWorkspaceResponse,
  IntermediariesFilingOverviewSummaryResponse,
  IntermediariesFilingSectionSaveResponse,
  IntermediariesFilingWorkspaceResponse,
} from '@/lib/intermediaries-filing/api-types';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

const BASE = '/workstreams/intermediaries-filing';

export async function initializeIntermediariesFilingWorkspace(): Promise<InitializeIntermediariesFilingWorkspaceResponse> {
  return apiRequest<InitializeIntermediariesFilingWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchIntermediariesFilingWorkspace(): Promise<IntermediariesFilingWorkspaceResponse> {
  return apiRequest<IntermediariesFilingWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'GET',
  });
}

export async function saveIntermediariesFilingSection(
  sectionId: IntermediariesFilingSectionId,
  version: number,
  data: IntermediariesFilingPayload[keyof Omit<IntermediariesFilingPayload, 'schemaVersion'>],
): Promise<IntermediariesFilingSectionSaveResponse> {
  return apiRequest<IntermediariesFilingSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchIntermediariesFilingOverviewSummary(): Promise<IntermediariesFilingOverviewSummaryResponse> {
  return apiRequest<IntermediariesFilingOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchIntermediariesFilingReadiness(): Promise<IfAssessmentResponse> {
  return apiRequest<IfAssessmentResponse>(`${BASE}/filing-readiness`, {
    method: 'GET',
  });
}
