import { apiRequest } from '@/lib/api/client';
import type {
  FactAssertionDetail,
  FactEvidenceResponse,
  FactsListResponse,
  ReviewAssertionRequest,
  ReviewAssertionResponse,
  RetryStructuredExtractionResponse,
} from '@/lib/company-incorporation/extraction/types';

const BASE = '/workstreams/company-incorporation/structured-extraction';

export interface FactsQuery {
  factKey?: string;
  requirementKey?: string;
  comparisonStatus?: string;
  reviewStatus?: string;
  qualityCategory?: string;
  documentVersionId?: string;
}

function toQuery(params: FactsQuery): string {
  const search = new URLSearchParams();
  if (params.factKey) search.set('factKey', params.factKey);
  if (params.requirementKey) search.set('requirementKey', params.requirementKey);
  if (params.comparisonStatus) search.set('comparisonStatus', params.comparisonStatus);
  if (params.reviewStatus) search.set('reviewStatus', params.reviewStatus);
  if (params.qualityCategory) search.set('qualityCategory', params.qualityCategory);
  if (params.documentVersionId) search.set('documentVersionId', params.documentVersionId);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export async function fetchCompanyIncorporationFacts(
  query: FactsQuery = {},
): Promise<FactsListResponse> {
  return apiRequest<FactsListResponse>(`${BASE}/facts${toQuery(query)}`, { method: 'GET' });
}

export async function fetchFactAssertionDetail(
  assertionId: string,
): Promise<FactAssertionDetail> {
  return apiRequest<FactAssertionDetail>(`${BASE}/assertions/${assertionId}`, {
    method: 'GET',
  });
}

export async function fetchFactAssertionEvidence(
  assertionId: string,
): Promise<FactEvidenceResponse> {
  return apiRequest<FactEvidenceResponse>(`${BASE}/assertions/${assertionId}/evidence`, {
    method: 'GET',
  });
}

export async function reviewFactAssertion(
  assertionId: string,
  body: ReviewAssertionRequest,
): Promise<ReviewAssertionResponse> {
  return apiRequest<ReviewAssertionResponse>(`${BASE}/assertions/${assertionId}/review`, {
    method: 'POST',
    body,
  });
}

export async function retryStructuredExtraction(
  versionId: string,
): Promise<RetryStructuredExtractionResponse> {
  return apiRequest<RetryStructuredExtractionResponse>(
    `${BASE}/versions/${versionId}/retry`,
    { method: 'POST' },
  );
}
