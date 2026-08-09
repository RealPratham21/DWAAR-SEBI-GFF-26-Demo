'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchDocumentGenerationStatus,
  fetchGeneratedChapter,
  fetchLatestDrhpDocument,
  startDrhpGeneration,
  type DocumentGenerationStatus,
  type GeneratedChapterResponse,
} from '@/lib/api/drhp';
import { astChapterToBlocks } from '@/lib/drhp/ast-mapper';
import { DRHP_CHAPTER_DEFINITIONS } from '@/lib/drhp/chapters';
import type { DrhpBlock, DrhpChapter, DrhpChapterStatus } from '@/lib/drhp/types';

const TERMINAL_STATUSES = new Set([
  'generated',
  'generated_with_warnings',
  'partially_generated',
  'failed',
]);

function mapGenerationChapterStatus(
  status: string,
  hasAstContent: boolean,
): DrhpChapterStatus {
  if (
    (status === 'generated' || status === 'generated_with_warnings') &&
    !hasAstContent
  ) {
    return 'generation_incomplete';
  }
  switch (status) {
    case 'queued':
    case 'waiting_for_dependency':
      return 'generating';
    case 'generating':
      return 'generating';
    case 'generated':
      return 'draft_ready';
    case 'generated_with_warnings':
      return 'needs_review';
    case 'blocked':
      return 'blocked';
    case 'failed':
      return 'blocked';
    default:
      return 'not_generated';
  }
}

export function useDrhpGeneration() {
  const [documentVersionId, setDocumentVersionId] = useState<string | null>(null);
  const [status, setStatus] = useState<DocumentGenerationStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterCache, setChapterCache] = useState<Record<string, GeneratedChapterResponse>>({});
  const chapterCacheRef = useRef(chapterCache);
  chapterCacheRef.current = chapterCache;

  const statusProgress = useMemo(() => {
    if (!status) return 'none';
    return `${status.status}:${status.completedChapters}`;
  }, [status]);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await fetchLatestDrhpDocument();
      if (latest?.latestVersionId) {
        setDocumentVersionId(latest.latestVersionId);
        const nextStatus = await fetchDocumentGenerationStatus(latest.latestVersionId);
        setStatus(nextStatus);
      } else {
        setDocumentVersionId(null);
        setStatus(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load DRHP document.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    if (!documentVersionId || !status) return undefined;
    if (TERMINAL_STATUSES.has(status.status)) return undefined;

    const interval = window.setInterval(() => {
      void fetchDocumentGenerationStatus(documentVersionId)
        .then(setStatus)
        .catch(() => undefined);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [documentVersionId, statusProgress, status?.status]);

  const startGeneration = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const response = await startDrhpGeneration({ createSnapshot: true });
      setDocumentVersionId(response.documentVersionId);
      const nextStatus = await fetchDocumentGenerationStatus(response.documentVersionId);
      setStatus(nextStatus);
      setChapterCache({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start DRHP generation.');
    } finally {
      setStarting(false);
    }
  }, []);

  const generationChapters: DrhpChapter[] = useMemo(() => {
    if (!status) return [];
    const byKey = new Map(status.chapters.map((chapter) => [chapter.chapterKey, chapter]));
    return DRHP_CHAPTER_DEFINITIONS.map((definition) => {
      const row = byKey.get(definition.key);
      return {
        id: `chapter:${definition.key}`,
        key: definition.key,
        title: definition.title,
        order: definition.order,
        status: row
          ? mapGenerationChapterStatus(row.status, Boolean(row.hasAstContent))
          : 'not_generated',
        sections: [],
        workstreamSlug: definition.workstreamSlug,
        workstreamTitle: definition.workstreamTitle,
      };
    });
  }, [status]);

  const loadGeneratedChapter = useCallback(
    async (chapterKey: string) => {
      if (!documentVersionId) return null;
      const cached = chapterCacheRef.current[chapterKey];
      if (cached) return cached;
      const response = await fetchGeneratedChapter(documentVersionId, chapterKey);
      setChapterCache((prev) => ({ ...prev, [chapterKey]: response }));
      return response;
    },
    [documentVersionId],
  );

  const blocksForChapter = useCallback((chapterKey: string): DrhpBlock[] => {
    const row = chapterCacheRef.current[chapterKey];
    if (!row?.ast) return [];
    return astChapterToBlocks(row.ast, row.sourceRefsSummary);
  }, []);

  return {
    documentVersionId,
    status,
    starting,
    loading,
    error,
    startGeneration,
    reload: loadLatest,
    generationChapters,
    loadGeneratedChapter,
    blocksForChapter,
    isGenerating: Boolean(status && !TERMINAL_STATUSES.has(status.status)),
  };
}
