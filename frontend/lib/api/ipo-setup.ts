import { apiRequest } from '@/lib/api/client';
import type {
  EligibilityAssessmentResponse,
  InitializeIpoSetupWorkspaceResponse,
  IpoSetupOverviewSummary,
  IpoSetupSectionId,
  IpoSetupWorkspaceResponse,
  IpoSetupSectionSaveResponse,
} from '@/lib/ipo-setup/api-types';
import type { IpoSetupPayload } from '@/lib/schemas/ipo-setup';

const BASE = '/workstreams/ipo-setup-eligibility';

export async function initializeIpoSetupWorkspace(): Promise<InitializeIpoSetupWorkspaceResponse> {
  return apiRequest<InitializeIpoSetupWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchIpoSetupWorkspace(): Promise<IpoSetupWorkspaceResponse> {
  return apiRequest<IpoSetupWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveIpoSetupSection(
  sectionId: IpoSetupSectionId,
  version: number,
  data: IpoSetupPayload[keyof Omit<IpoSetupPayload, 'schemaVersion'>],
): Promise<IpoSetupSectionSaveResponse> {
  return apiRequest<IpoSetupSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchIpoSetupOverviewSummary(): Promise<IpoSetupOverviewSummary> {
  return apiRequest<IpoSetupOverviewSummary>(`${BASE}/overview-summary`, { method: 'GET' });
}

export async function fetchIpoSetupEligibilityAssessment(): Promise<EligibilityAssessmentResponse> {
  return apiRequest<EligibilityAssessmentResponse>(`${BASE}/eligibility-assessment`, {
    method: 'GET',
  });
}
