'use client';

import { chapterStatusLabel } from '@/lib/drhp/chapters';
import type { DrhpChapter } from '@/lib/drhp/types';
import { cn } from '@/lib/utils';

type ChapterNavigatorProps = {
  chapters: DrhpChapter[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function ChapterNavigator({ chapters, selectedKey, onSelect }: ChapterNavigatorProps) {
  return (
    <nav
      aria-label="DRHP chapters"
      className="flex h-full min-h-0 min-w-0 flex-col border-r border-border bg-muted/20"
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Chapters
        </h2>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {chapters.map((chapter) => {
          const selected = chapter.key === selectedKey;
          return (
            <li key={chapter.key}>
              <button
                type="button"
                onClick={() => onSelect(chapter.key)}
                className={cn(
                  'w-full rounded-md px-3 py-2.5 text-left transition-colors',
                  selected
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                <span className="block text-sm font-medium leading-snug">{chapter.title}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {chapterStatusLabel(chapter.status)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
