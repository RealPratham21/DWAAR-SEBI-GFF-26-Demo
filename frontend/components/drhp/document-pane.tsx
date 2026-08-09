'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { AstRenderer } from '@/components/drhp/ast-renderer';
import { ExportMenu } from '@/components/drhp/export-menu';
import { chapterStatusLabel } from '@/lib/drhp/chapters';
import type { DrhpBlock, DrhpChapter } from '@/lib/drhp/types';

type DocumentPaneProps = {
  chapter: DrhpChapter;
  blocks: DrhpBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  loading?: boolean;
  documentVersionId?: string | null;
  documentStatus?: string | null;
  completedChapters?: number;
};

import { DRHP_PUBLICATION_CLASSES } from '@/lib/drhp/publication/theme';

export function DocumentPane({
  chapter,
  blocks,
  selectedBlockId,
  onSelectBlock,
  loading = false,
  documentVersionId = null,
  documentStatus = null,
  completedChapters = 0,
}: DocumentPaneProps) {
  const emptyMessage =
    chapter.status === 'generation_incomplete'
      ? {
          title: 'Generation incomplete',
          body: 'This chapter was marked generated but has no renderable content. Try regenerating the DRHP version.',
        }
      : chapter.status === 'draft_ready' || chapter.status === 'needs_review'
        ? {
            title: 'Chapter content unavailable',
            body: 'Generated chapter content could not be loaded or mapped for preview.',
          }
        : {
            title: 'Chapter not generated',
            body: 'This chapter has no draft content yet. Generation will populate a page-like preview here.',
          };

  const workstreamHref = chapter.workstreamSlug
    ? `/projects/demo/workstreams/${chapter.workstreamSlug}`
    : null;

  return (
    <section
      aria-label="DRHP document preview"
      className="flex h-full min-h-0 min-w-0 flex-col bg-[#ebe8e2] dark:bg-background"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{chapter.title}</p>
          <p className="text-xs text-muted-foreground">{chapterStatusLabel(chapter.status)}</p>
        </div>
        <ExportMenu
          documentVersionId={documentVersionId}
          documentStatus={documentStatus}
          completedChapters={completedChapters}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6">
        <div className="space-y-6">
          <article className={DRHP_PUBLICATION_CLASSES.page}>
            <header className="mb-4 border-b border-neutral-400 pb-3">
              <p className={DRHP_PUBLICATION_CLASSES.runningHeader}>Draft Red Herring Prospectus</p>
              <h1 className={`${DRHP_PUBLICATION_CLASSES.chapterTitle} mt-2`}>{chapter.title}</h1>
            </header>

            {loading ? (
              <div className="py-10 font-serif text-sm text-neutral-600">Loading generated chapter…</div>
            ) : blocks.length > 0 ? (
              <AstRenderer
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
                isCoverChapter={chapter.key === 'cover-page-front-matter'}
                isRiskChapter={chapter.key === 'risk-factors'}
              />
            ) : (
              <div className="flex flex-col items-start gap-4 py-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-base font-semibold text-neutral-900">{emptyMessage.title}</h2>
                  <p className="max-w-md font-serif text-sm leading-relaxed text-neutral-600">
                    {emptyMessage.body}
                  </p>
                </div>
                {workstreamHref && chapter.workstreamTitle ? (
                  <Link
                    href={workstreamHref}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Complete {chapter.workstreamTitle}
                  </Link>
                ) : null}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
