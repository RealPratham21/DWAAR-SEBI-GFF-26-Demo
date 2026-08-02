'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  fetchCompanyIncorporationFacts,
  fetchFactAssertionDetail,
  fetchFactAssertionEvidence,
  reviewFactAssertion,
  type FactsQuery,
} from '@/lib/api/company-incorporation-facts-api';
import type {
  FactAssertionDetail,
  FactEvidenceResponse,
  FactsListResponse,
  ReviewAction,
} from '@/lib/company-incorporation/extraction/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to load facts.';
}

export function useCompanyIncorporationFacts(options: { enabled: boolean; query?: FactsQuery }) {
  const { enabled, query } = options;
  const [data, setData] = useState<FactsListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assertionDetail, setAssertionDetail] = useState<FactAssertionDetail | null>(null);
  const [evidence, setEvidence] = useState<FactEvidenceResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) return null;
      if (opts?.silent) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await fetchCompanyIncorporationFacts(query ?? {});
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
    [enabled, query],
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const loadAssertion = useCallback(async (assertionId: string) => {
    setDetailLoading(true);
    setMutationError(null);
    try {
      const detail = await fetchFactAssertionDetail(assertionId);
      setAssertionDetail(detail);
      return detail;
    } catch (err) {
      setMutationError(errorMessage(err));
      setAssertionDetail(null);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadEvidence = useCallback(async (assertionId: string) => {
    setEvidenceLoading(true);
    try {
      const response = await fetchFactAssertionEvidence(assertionId);
      setEvidence(response);
      return response;
    } catch (err) {
      setMutationError(errorMessage(err));
      setEvidence(null);
      return null;
    } finally {
      setEvidenceLoading(false);
    }
  }, []);

  const clearAssertion = useCallback(() => {
    setAssertionDetail(null);
    setEvidence(null);
    setMutationError(null);
  }, []);

  const submitReview = useCallback(
    async (assertionId: string, action: ReviewAction, rationale?: string | null) => {
      setMutationPending(true);
      setMutationError(null);
      setAcknowledgement(null);
      try {
        const response = await reviewFactAssertion(assertionId, { action, rationale });
        setAcknowledgement(`Review saved: ${action.replaceAll('_', ' ')}.`);
        await Promise.all([loadAssertion(assertionId), refresh({ silent: true })]);
        return response;
      } catch (err) {
        setMutationError(errorMessage(err));
        throw err;
      } finally {
        setMutationPending(false);
      }
    },
    [loadAssertion, refresh],
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    assertionDetail,
    evidence,
    detailLoading,
    evidenceLoading,
    loadAssertion,
    loadEvidence,
    clearAssertion,
    submitReview,
    mutationPending,
    mutationError,
    acknowledgement,
    clearAcknowledgement: () => setAcknowledgement(null),
  };
}
