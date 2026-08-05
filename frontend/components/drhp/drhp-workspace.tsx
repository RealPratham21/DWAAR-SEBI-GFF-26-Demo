'use client';

import { useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { ChapterNavigator } from '@/components/drhp/chapter-navigator';
import { DocumentPane } from '@/components/drhp/document-pane';
import { InspectorPane } from '@/components/drhp/inspector-pane';
import { buildEmptyDrhpChapters } from '@/lib/drhp/chapters';
import { useDrhpChapterReadiness } from '@/lib/drhp/hooks/use-drhp-chapter-readiness';
import { useDrhpUrlState } from '@/lib/drhp/hooks/use-drhp-url-state';
import { useSidebarCollapse } from '@/lib/layout/sidebar-collapse-context';
import type { DrhpBlock } from '@/lib/drhp/types';
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
  const { collapsed, setCollapsed } = useSidebarCollapse();
  const [mobilePane, setMobilePane] = useState<'chapters' | 'document' | 'inspector'>('document');

  const chapterList = chapters.length > 0 ? chapters : fallbackChapters;
  const selectedChapter =
    chapterList.find((chapter) => chapter.key === chapterKey) ?? chapterList[0];
  const blocks = fixtureBlocksByChapter?.[selectedChapter.key] ?? [];

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
            {listLoading ? (
              <p className="text-xs text-muted-foreground">Loading chapter readiness…</p>
            ) : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        />
        <InspectorPane
          chapter={selectedChapter}
          selectedBlockId={blockId}
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
          readiness={readiness}
          readinessLoading={detailLoading}
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
          />
        ) : null}
        {mobilePane === 'inspector' ? (
          <InspectorPane
            chapter={selectedChapter}
            selectedBlockId={blockId}
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            readiness={readiness}
            readinessLoading={detailLoading}
          />
        ) : null}
      </div>
    </div>
  );
}
