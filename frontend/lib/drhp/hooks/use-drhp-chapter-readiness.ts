'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchDrhpChapterReadiness,
  fetchDrhpChapters,
  mapDrhpDisplayStatus,
  type DrhpChapterListItem,
  type DrhpChapterReadinessResponse,
} from '@/lib/api/drhp';
import { DRHP_CHAPTER_DEFINITIONS } from '@/lib/drhp/chapters';
import type { DrhpChapter, DrhpChapterStatus } from '@/lib/drhp/types';

function toChapter(item: DrhpChapterListItem): DrhpChapter {
  const definition = DRHP_CHAPTER_DEFINITIONS.find((entry) => entry.key === item.key);
  const status = mapDrhpDisplayStatus(item) as DrhpChapterStatus;
  return {
    id: `chapter:${item.key}`,
    key: item.key,
    title: item.title,
    order: item.order,
    status,
    sections: [],
    workstreamSlug: definition?.workstreamSlug,
    workstreamTitle: definition?.workstreamTitle,
    connectionStatus: item.connectionStatus,
    generationStatus: item.generationStatus,
    canGenerate: item.canGenerate,
    readinessSummary: {
      satisfiedCount: item.satisfiedCount,
      missingCount: item.missingCount,
      unknownApplicabilityCount: item.unknownApplicabilityCount,
      blockingCount: item.blockingCount,
      gapCount: item.gapCount,
      requirementTotal: item.requirementTotal,
    },
  };
}

export function useDrhpChapterReadiness(chapterKey: string) {
  const [chapters, setChapters] = useState<DrhpChapter[]>([]);
  const [readiness, setReadiness] = useState<DrhpChapterReadinessResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const response = await fetchDrhpChapters();
      setChapters(response.chapters.map(toChapter));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load DRHP chapter readiness.');
      setChapters(
        DRHP_CHAPTER_DEFINITIONS.map((definition) => ({
          id: `chapter:${definition.key}`,
          key: definition.key,
          title: definition.title,
          order: definition.order,
          status: 'not_connected' as DrhpChapterStatus,
          sections: [],
          workstreamSlug: definition.workstreamSlug,
          workstreamTitle: definition.workstreamTitle,
          connectionStatus: 'not_connected',
          generationStatus: 'blocked',
          canGenerate: false,
        })),
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setReadiness(null);
    void fetchDrhpChapterReadiness(chapterKey)
      .then((response) => {
        if (!cancelled) {
          setReadiness(response);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load chapter readiness.');
          setReadiness(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chapterKey]);

  return {
    chapters,
    readiness,
    listLoading,
    detailLoading,
    error,
    reload: loadList,
  };
}
