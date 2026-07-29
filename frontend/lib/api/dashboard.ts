import { apiRequest } from '@/lib/api/client';
import type { DashboardBootstrapResponse } from '@/lib/workspace/types';

export async function fetchDashboardBootstrap(): Promise<DashboardBootstrapResponse> {
  return apiRequest<DashboardBootstrapResponse>('/dashboard/bootstrap', { method: 'GET' });
}
