import { apiRequest } from '@/lib/api/client';
import type {
  BusinessAssessmentResponse,
  BusinessOperationsOverviewSummary,
  BusinessOperationsSectionId,
  BusinessOperationsSectionSaveResponse,
  BusinessOperationsWorkspaceResponse,
  InitializeBusinessOperationsWorkspaceResponse,
} from '@/lib/business-operations/api-types';
import type { BusinessOperationsPayload } from '@/lib/schemas/business-operations';

const BASE = '/workstreams/business-operations';

export async function initializeBusinessOperationsWorkspace(): Promise<InitializeBusinessOperationsWorkspaceResponse> {
  return apiRequest<InitializeBusinessOperationsWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchBusinessOperationsWorkspace(): Promise<BusinessOperationsWorkspaceResponse> {
  return apiRequest<BusinessOperationsWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveBusinessOperationsSection(
  sectionId: BusinessOperationsSectionId,
  version: number,
  data: BusinessOperationsPayload[keyof Omit<BusinessOperationsPayload, 'schemaVersion'>],
): Promise<BusinessOperationsSectionSaveResponse> {
  return apiRequest<BusinessOperationsSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchBusinessOperationsOverviewSummary(): Promise<BusinessOperationsOverviewSummary> {
  return apiRequest<BusinessOperationsOverviewSummary>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchBusinessOperationsAssessment(): Promise<BusinessAssessmentResponse> {
  return apiRequest<BusinessAssessmentResponse>(`${BASE}/business-assessment`, { method: 'GET' });
}
