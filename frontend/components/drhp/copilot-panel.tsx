'use client';

import { MessageSquare } from 'lucide-react';
import type { DrhpChapter } from '@/lib/drhp/types';

type CopilotPanelProps = {
  chapter: DrhpChapter;
  selectedBlockId: string | null;
};

export function CopilotPanel({ chapter, selectedBlockId }: CopilotPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Dwaar Copilot</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Copilot is not connected yet. This panel is ready to receive chapter and block context
            once the assistant backend is available.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Chapter context:</span> {chapter.title}
        </p>
        <p className="mt-1">
          <span className="font-medium text-foreground">Block context:</span>{' '}
          {selectedBlockId ? (
            <span className="font-mono">{selectedBlockId}</span>
          ) : (
            'None selected'
          )}
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <textarea
          disabled
          rows={3}
          placeholder="Ask about this chapter once Copilot is connected…"
          className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground opacity-60"
        >
          Send (unavailable)
        </button>
      </div>
    </div>
  );
}
