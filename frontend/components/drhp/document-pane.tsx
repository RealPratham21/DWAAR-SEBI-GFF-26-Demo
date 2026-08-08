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

/** A4 width at 96dpi ≈ 794px; print-like margins and dense serif body. */
const PAGE_CLASS =
  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-[#fffef9] px-[20mm] py-[18mm] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-card';

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
          <article className={PAGE_CLASS}>
            <header className="mb-6 border-b border-neutral-300 pb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Draft Red Herring Prospectus
              </p>
              <h1 className="mt-2 font-serif text-xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
                {chapter.title}
              </h1>
            </header>

            {loading ? (
              <div className="py-10 font-serif text-sm text-neutral-600">Loading generated chapter…</div>
            ) : blocks.length > 0 ? (
              <AstRenderer
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            ) : (
              <div className="flex flex-col items-start gap-4 py-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-base font-semibold text-neutral-900">Chapter not generated</h2>
                  <p className="max-w-md font-serif text-sm leading-relaxed text-neutral-600">
                    This chapter has no draft content yet. Generation will populate a page-like preview here.
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
