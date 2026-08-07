import { apiRequest } from '@/lib/api/client';
import type {
  BacAssessmentResponse,
  BorrowingsAssetsContractsOverviewSummaryResponse,
  BorrowingsAssetsContractsSectionSaveResponse,
  BorrowingsAssetsContractsWorkspaceResponse,
  InitializeBorrowingsAssetsContractsWorkspaceResponse,
} from '@/lib/borrowings-assets-contracts/api-types';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

const BASE = '/workstreams/borrowings-assets-contracts';

export async function initializeBorrowingsAssetsContractsWorkspace(): Promise<InitializeBorrowingsAssetsContractsWorkspaceResponse> {
  return apiRequest<InitializeBorrowingsAssetsContractsWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'POST',
  });
}

export async function fetchBorrowingsAssetsContractsWorkspace(): Promise<BorrowingsAssetsContractsWorkspaceResponse> {
  return apiRequest<BorrowingsAssetsContractsWorkspaceResponse>(`${BASE}/workspace`, {
    method: 'GET',
  });
}

export async function saveBorrowingsAssetsContractsSection(
  sectionId: BorrowingsAssetsContractsSectionId,
  version: number,
  data: BorrowingsAssetsContractsPayload[keyof Omit<
    BorrowingsAssetsContractsPayload,
    'schemaVersion'
  >],
): Promise<BorrowingsAssetsContractsSectionSaveResponse> {
  return apiRequest<BorrowingsAssetsContractsSectionSaveResponse>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function fetchBorrowingsAssetsContractsOverviewSummary(): Promise<BorrowingsAssetsContractsOverviewSummaryResponse> {
  return apiRequest<BorrowingsAssetsContractsOverviewSummaryResponse>(`${BASE}/overview-summary`, {
    method: 'GET',
  });
}

export async function fetchBorrowingsAssetsContractsAssessment(): Promise<BacAssessmentResponse> {
  return apiRequest<BacAssessmentResponse>(`${BASE}/borrowings-contracts-assessment`, {
    method: 'GET',
  });
}
