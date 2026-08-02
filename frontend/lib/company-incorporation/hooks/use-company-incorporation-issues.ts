'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  fetchCompanyIncorporationIssues,
  fetchFactIssueDetail,
  resolveFactIssue,
  type IssuesQuery,
} from '@/lib/api/company-incorporation-issues-api';
import type {
  FactIssueDetail,
  FactIssuesListResponse,
  ResolveIssueRequest,
} from '@/lib/company-incorporation/extraction/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to load issues.';
}

export function useCompanyIncorporationIssues(options: {
  enabled: boolean;
  query?: IssuesQuery;
}) {
  const { enabled, query } = options;
  const [data, setData] = useState<FactIssuesListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueDetail, setIssueDetail] = useState<FactIssueDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!enabled) return null;
      if (opts?.silent) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await fetchCompanyIncorporationIssues(query ?? {});
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

  const loadIssue = useCallback(async (issueId: string) => {
    setDetailLoading(true);
    setMutationError(null);
    try {
      const detail = await fetchFactIssueDetail(issueId);
      setIssueDetail(detail);
      return detail;
    } catch (err) {
      setMutationError(errorMessage(err));
      setIssueDetail(null);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearIssue = useCallback(() => {
    setIssueDetail(null);
    setMutationError(null);
  }, []);

  const submitResolution = useCallback(
    async (issueId: string, body: ResolveIssueRequest) => {
      setMutationPending(true);
      setMutationError(null);
      setAcknowledgement(null);
      try {
        const response = await resolveFactIssue(issueId, body);
        if (response.informationUpdateRequired) {
          setAcknowledgement(
            'The document value was approved, but the Information section has not been changed. Update the relevant Information field separately.',
          );
        } else {
          setAcknowledgement('Issue resolution saved.');
        }
        await Promise.all([loadIssue(issueId), refresh({ silent: true })]);
        return response;
      } catch (err) {
        setMutationError(errorMessage(err));
        throw err;
      } finally {
        setMutationPending(false);
      }
    },
    [loadIssue, refresh],
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    issueDetail,
    detailLoading,
    loadIssue,
    clearIssue,
    submitResolution,
    mutationPending,
    mutationError,
    acknowledgement,
    clearAcknowledgement: () => setAcknowledgement(null),
  };
}
