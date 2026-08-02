import { apiRequest } from '@/lib/api/client';
import type { OverviewSummaryResponse } from '@/lib/company-incorporation/extraction/types';

export async function fetchCompanyIncorporationOverviewSummary(): Promise<OverviewSummaryResponse> {
  return apiRequest<OverviewSummaryResponse>(
    '/workstreams/company-incorporation/overview-summary',
    { method: 'GET' },
  );
}
