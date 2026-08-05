'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { DraftBlock } from '@/components/drhp/draft-block';
import { chapterStatusLabel } from '@/lib/drhp/chapters';
import type { DrhpBlock, DrhpChapter } from '@/lib/drhp/types';

type DocumentPaneProps = {
  chapter: DrhpChapter;
  blocks: DrhpBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
};

export function DocumentPane({
  chapter,
  blocks,
  selectedBlockId,
  onSelectBlock,
}: DocumentPaneProps) {
  const workstreamHref = chapter.workstreamSlug
    ? `/projects/demo/workstreams/${chapter.workstreamSlug}`
    : null;

  return (
    <section
      aria-label="DRHP document preview"
      className="flex h-full min-h-0 min-w-0 flex-col bg-[#f7f4ef] dark:bg-background"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{chapter.title}</p>
          <p className="text-xs text-muted-foreground">{chapterStatusLabel(chapter.status)}</p>
        </div>
        <button
          type="button"
          disabled
          title="PDF download will be available when a generated draft exists"
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground opacity-60"
        >
          Download PDF
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <article className="mx-auto min-h-[70vh] w-full max-w-5xl rounded-sm border border-border/70 bg-white p-8 shadow-sm dark:bg-card sm:p-12">
          <header className="mb-8 border-b border-border pb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Draft offer document
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {chapter.title}
            </h1>
          </header>

          {blocks.length > 0 ? (
            <div className="space-y-3">
              {blocks.map((block) => (
                <DraftBlock
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  onSelect={(id) => onSelectBlock(id === selectedBlockId ? null : id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 py-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Chapter not generated</h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  This chapter has no draft content yet. Generation will populate a page-like
                  preview here. Nothing fabricated is shown until a real draft exists.
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
    </section>
  );
}
