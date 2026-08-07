import { apiRequest } from '@/lib/api/client';
import type {
  IndustryAssessmentResponse,
  InitializeIndustryMarketWorkspaceResponse,
  IndustryMarketOverviewSummaryResponse,
  IndustryMarketSectionSaveResponse,
  IndustryMarketWorkspaceResponse,
} from '@/lib/industry-market/api-types';
import type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

const BASE = '/workstreams/industry-market';

export async function initializeIndustryMarketWorkspace(): Promise<InitializeIndustryMarketWorkspaceResponse> {
  return apiRequest<InitializeIndustryMarketWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchIndustryMarketWorkspace(): Promise<IndustryMarketWorkspaceResponse> {
  return apiRequest<IndustryMarketWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveIndustryMarketSection(
  sectionId: IndustryMarketSectionId,
  version: number,
  data: IndustryMarketPayload[keyof Omit<IndustryMarketPayload, 'schemaVersion'>],
): Promise<IndustryMarketSectionSaveResponse> {
  return apiRequest<IndustryMarketSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchIndustryMarketOverviewSummary(): Promise<IndustryMarketOverviewSummaryResponse> {
  return apiRequest<IndustryMarketOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchIndustryMarketAssessment(): Promise<IndustryAssessmentResponse> {
  return apiRequest<IndustryAssessmentResponse>(`${BASE}/industry-assessment`, {
    method: 'GET',
  });
}
