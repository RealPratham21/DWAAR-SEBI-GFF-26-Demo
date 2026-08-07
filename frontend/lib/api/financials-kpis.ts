import { apiRequest } from '@/lib/api/client';
import type {
  FinancialAssessmentResponse,
  FinancialsKpisOverviewSummary,
  FinancialsKpisSectionSaveResponse,
  FinancialsKpisWorkspaceResponse,
  InitializeFinancialsKpisWorkspaceResponse,
} from '@/lib/financials-kpis/api-types';
import type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';

const BASE = '/workstreams/financials-kpis';

export async function initializeFinancialsKpisWorkspace(): Promise<InitializeFinancialsKpisWorkspaceResponse> {
  return apiRequest<InitializeFinancialsKpisWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchFinancialsKpisWorkspace(): Promise<FinancialsKpisWorkspaceResponse> {
  return apiRequest<FinancialsKpisWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveFinancialsKpisSection(
  sectionId: FinancialsKpisSectionId,
  version: number,
  data: FinancialsKpisPayload[keyof Omit<FinancialsKpisPayload, 'schemaVersion'>],
): Promise<FinancialsKpisSectionSaveResponse> {
  return apiRequest<FinancialsKpisSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchFinancialsKpisOverviewSummary(): Promise<FinancialsKpisOverviewSummary> {
  return apiRequest<FinancialsKpisOverviewSummary>(`${BASE}/overview-summary`, { method: 'GET' });
}

export async function fetchFinancialsKpisAssessment(): Promise<FinancialAssessmentResponse> {
  return apiRequest<FinancialAssessmentResponse>(`${BASE}/financial-assessment`, {
    method: 'GET',
  });
}
