'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import { fetchCompanyIncorporationOverviewSummary } from '@/lib/api/company-incorporation-overview-api';
import type { OverviewSummaryResponse } from '@/lib/company-incorporation/extraction/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to load overview readiness.';
}

export function useCompanyIncorporationOverview(options: { enabled: boolean }) {
  const { enabled } = options;
  const [data, setData] = useState<OverviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) return null;
      if (opts?.silent) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await fetchCompanyIncorporationOverviewSummary();
        setData(response);
        setError(null);
        return response;
      } catch (err) {
        setError(errorMessage(err));
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { data, loading, refreshing, error, refresh };
}
