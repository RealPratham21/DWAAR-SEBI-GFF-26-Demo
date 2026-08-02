import { apiRequest } from '@/lib/api/client';
import type { DocumentPipelineSummaryResponse } from '@/lib/company-incorporation/extraction/types';

const BASE = '/workstreams/company-incorporation/documents';

export async function fetchDocumentPipelineSummary(): Promise<DocumentPipelineSummaryResponse> {
  return apiRequest<DocumentPipelineSummaryResponse>(`${BASE}/pipeline-summary`, {
    method: 'GET',
  });
}

export async function retryDocumentProcessing(
  versionId: string,
): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>(
    `/workstreams/company-incorporation/documents/versions/${versionId}/processing/retry`,
    { method: 'POST' },
  );
}
