'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  fetchDocumentPipelineSummary,
  retryDocumentProcessing,
} from '@/lib/api/company-incorporation-pipeline-api';
import { retryStructuredExtraction } from '@/lib/api/company-incorporation-facts-api';
import type { DocumentPipelineSummaryResponse } from '@/lib/company-incorporation/extraction/types';

const POLL_INTERVAL_MS = 4000;

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to load document pipeline status.';
}

export type CompanyIncorporationPipelineState = ReturnType<typeof useCompanyIncorporationPipeline>;

export function useCompanyIncorporationPipeline(options: {
  enabled: boolean;
  onPipelineBecameIdle?: () => void;
} ) {
  const { enabled, onPipelineBecameIdle } = options;
  const [data, setData] = useState<DocumentPipelineSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState<string | null>(null);
  const wasActiveRef = useRef(false);
  const onIdleRef = useRef(onPipelineBecameIdle);
  onIdleRef.current = onPipelineBecameIdle;

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!enabled) return null;
    if (opts?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetchDocumentPipelineSummary();
      setData(response);
      setError(null);
      const active = response.aggregation.hasAnyActivePipeline;
      if (wasActiveRef.current && !active) {
        onIdleRef.current?.();
      }
      wasActiveRef.current = active;
      return response;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const active = data?.aggregation.hasAnyActivePipeline === true;
    if (!active) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        void refresh({ silent: true });
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true });
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [data?.aggregation.hasAnyActivePipeline, enabled, refresh]);

  const retryProcessing = useCallback(
    async (versionId: string) => {
      setMutationPending(`processing:${versionId}`);
      try {
        await retryDocumentProcessing(versionId);
        await refresh({ silent: true });
      } finally {
        setMutationPending(null);
      }
    },
    [refresh],
  );

  const retryFacts = useCallback(
    async (versionId: string) => {
      setMutationPending(`structured:${versionId}`);
      try {
        await retryStructuredExtraction(versionId);
        await refresh({ silent: true });
      } finally {
        setMutationPending(null);
      }
    },
    [refresh],
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    retryProcessing,
    retryFacts,
    mutationPending,
  };
}
