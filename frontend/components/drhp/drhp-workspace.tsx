'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { ExportMenu } from '@/components/drhp/export-menu';
import { ChapterNavigator } from '@/components/drhp/chapter-navigator';
import { DocumentPane } from '@/components/drhp/document-pane';
import { InspectorPane } from '@/components/drhp/inspector-pane';
import { buildEmptyDrhpChapters } from '@/lib/drhp/chapters';
import { astChapterToBlocks } from '@/lib/drhp/ast-mapper';
import { useDrhpChapterReadiness } from '@/lib/drhp/hooks/use-drhp-chapter-readiness';
import { useDrhpGeneration } from '@/lib/drhp/hooks/use-drhp-generation';
import { useDrhpUrlState } from '@/lib/drhp/hooks/use-drhp-url-state';
import { useSidebarCollapse } from '@/lib/layout/sidebar-collapse-context';
import type { DrhpBlock, DrhpChapter } from '@/lib/drhp/types';
import { cn } from '@/lib/utils';

type DrhpWorkspaceProps = {
  /** Optional test-only blocks keyed by chapter key. Production passes none. */
  fixtureBlocksByChapter?: Record<string, DrhpBlock[]>;
};

export function DrhpWorkspace({ fixtureBlocksByChapter }: DrhpWorkspaceProps) {
  const fallbackChapters = useMemo(() => buildEmptyDrhpChapters('not_generated'), []);
  const { chapterKey, blockId, inspectorTab, setChapterKey, setBlockId, setInspectorTab } =
    useDrhpUrlState();
  const { chapters, readiness, listLoading, detailLoading, error } =
    useDrhpChapterReadiness(chapterKey);
  const generation = useDrhpGeneration();
  const {
    documentVersionId,
    status: generationStatus,
    starting,
    loading: generationLoading,
    error: generationError,
    startGeneration,
    generationChapters,
    loadGeneratedChapter,
    isGenerating,
  } = generation;
  const generationProgress = generationStatus
    ? `${generationStatus.status}:${generationStatus.completedChapters}`
    : 'none';
  const { collapsed, setCollapsed } = useSidebarCollapse();
  const [mobilePane, setMobilePane] = useState<'chapters' | 'document' | 'inspector'>('document');
  const [chapterBlocks, setChapterBlocks] = useState<DrhpBlock[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);

  const chapterList: DrhpChapter[] = useMemo(() => {
    if (generationStatus) {
      const readinessByKey = new Map(chapters.map((item) => [item.key, item]));
      return generationChapters.map((item) => {
        const readinessItem = readinessByKey.get(item.key);
        return readinessItem
          ? { ...readinessItem, status: item.status !== 'not_generated' ? item.status : readinessItem.status }
          : item;
      });
    }
    return chapters.length > 0 ? chapters : fallbackChapters;
  }, [chapters, fallbackChapters, generationChapters, generationStatus]);

  const selectedChapter =
    chapterList.find((chapter) => chapter.key === chapterKey) ?? chapterList[0];

  useEffect(() => {
    let cancelled = false;
    setChapterLoading(true);
    void (async () => {
      if (fixtureBlocksByChapter?.[selectedChapter.key]?.length) {
        if (!cancelled) {
          setChapterBlocks(fixtureBlocksByChapter[selectedChapter.key] ?? []);
          setChapterLoading(false);
        }
        return;
      }
      if (!documentVersionId) {
        if (!cancelled) {
          setChapterBlocks([]);
          setChapterLoading(false);
        }
        return;
      }
      try {
        const response = await loadGeneratedChapter(selectedChapter.key);
        if (cancelled) return;
        if (response?.ast) {
          setChapterBlocks(astChapterToBlocks(response.ast, response.sourceRefsSummary));
        } else {
          setChapterBlocks([]);
        }
      } catch {
        if (!cancelled) setChapterBlocks([]);
      } finally {
        if (!cancelled) setChapterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    fixtureBlocksByChapter,
    documentVersionId,
    selectedChapter.key,
    generationProgress,
    loadGeneratedChapter,
  ]);

  const blocks = fixtureBlocksByChapter?.[selectedChapter.key] ?? chapterBlocks;
  const selectedBlock = blocks.find((block) => block.id === blockId) ?? null;

  const generatedChapterMeta = useMemo(() => {
    if (blocks.length === 0) return null;
    const supportStates: Record<string, number> = {};
    let placeholders = 0;
    let sourceRefCount = 0;
    for (const block of blocks) {
      const state = block.supportState ?? 'unknown';
      supportStates[state] = (supportStates[state] ?? 0) + 1;
      if (block.kind === 'placeholder') placeholders += 1;
      sourceRefCount += block.sourceRefs?.length ?? 0;
    }
    const chapterRow = generationStatus?.chapters.find((c) => c.chapterKey === selectedChapter.key);
    return {
      blockCount: blocks.length,
      sourceRefCount,
      placeholderCount: placeholders,
      supportStates,
      warnings: chapterRow?.warnings ?? [],
    };
  }, [blocks, generationStatus, selectedChapter.key]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              DRHP Draft Workspace
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Generate, review and trace your promoter-prepared draft offer document.
            </p>
            <p className="max-w-3xl text-xs text-muted-foreground">
              Professional due diligence, certification and filing remain outside this workspace.
            </p>
            {isGenerating && generationStatus ? (
              <p className="text-xs text-muted-foreground">
                Generating Draft DRHP — {generationStatus.completedChapters} of{' '}
                {generationStatus.totalChapters} chapters complete
              </p>
            ) : null}
            {generationStatus?.isStale ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Source data changed after this draft was generated.
              </p>
            ) : null}
            {listLoading || generationLoading ? (
              <p className="text-xs text-muted-foreground">Loading chapter readiness…</p>
            ) : null}
            {error || generationError ? (
              <p className="text-xs text-destructive">{error ?? generationError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              documentVersionId={documentVersionId}
              documentStatus={generationStatus?.status}
              completedChapters={generationStatus?.completedChapters ?? 0}
            />
            <button
              type="button"
              disabled={starting || isGenerating}
              onClick={() => void startGeneration()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {starting || isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Generate Draft DRHP
            </button>
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted md:inline-flex"
                title="Collapse the application sidebar"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
                Focus view
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted md:inline-flex"
                title="Expand the application sidebar"
              >
                <PanelLeft className="h-3.5 w-3.5" />
                Expand nav
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-1 rounded-md border border-border p-1 lg:hidden">
          {(
            [
              ['chapters', 'Chapters'],
              ['document', 'Draft'],
              ['inspector', 'Context'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobilePane(id)}
              className={cn(
                'flex-1 rounded px-2 py-1.5 text-xs font-medium',
                mobilePane === id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="hidden min-h-0 min-w-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)_minmax(18rem,22rem)]">
        <ChapterNavigator
          chapters={chapterList}
          selectedKey={selectedChapter.key}
          onSelect={setChapterKey}
        />
        <DocumentPane
          chapter={selectedChapter}
          blocks={blocks}
          selectedBlockId={blockId}
          onSelectBlock={setBlockId}
          loading={chapterLoading}
          documentVersionId={documentVersionId}
          documentStatus={generationStatus?.status}
          completedChapters={generationStatus?.completedChapters ?? 0}
        />
        <InspectorPane
          chapter={selectedChapter}
          selectedBlockId={blockId}
          selectedBlock={selectedBlock}
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
          readiness={readiness}
          readinessLoading={detailLoading}
          generationStatus={generationStatus}
          documentVersionId={documentVersionId}
          generatedChapterMeta={generatedChapterMeta}
          hasGeneratedBlocks={blocks.length > 0}
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden lg:hidden">
        {mobilePane === 'chapters' ? (
          <ChapterNavigator
            chapters={chapterList}
            selectedKey={selectedChapter.key}
            onSelect={(key) => {
              setChapterKey(key);
              setMobilePane('document');
            }}
          />
        ) : null}
        {mobilePane === 'document' ? (
          <DocumentPane
            chapter={selectedChapter}
            blocks={blocks}
            selectedBlockId={blockId}
            onSelectBlock={setBlockId}
            loading={chapterLoading}
            documentVersionId={documentVersionId}
            documentStatus={generationStatus?.status}
            completedChapters={generationStatus?.completedChapters ?? 0}
          />
        ) : null}
        {mobilePane === 'inspector' ? (
          <InspectorPane
            chapter={selectedChapter}
            selectedBlockId={blockId}
            selectedBlock={selectedBlock}
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            readiness={readiness}
            readinessLoading={detailLoading}
            generationStatus={generationStatus}
            documentVersionId={documentVersionId}
            generatedChapterMeta={generatedChapterMeta}
            hasGeneratedBlocks={blocks.length > 0}
          />
        ) : null}
      </div>
    </div>
  );
}
