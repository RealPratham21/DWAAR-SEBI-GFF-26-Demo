'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { CopilotMessageRenderer } from '@/components/drhp/copilot-message-renderer';
import { sendCopilotChat } from '@/lib/api/drhp-copilot';
import {
  copilotAnswerToPlainText,
  type CopilotAnswer,
  type CopilotChatMessage,
} from '@/lib/drhp/copilot-types';
import type { DrhpBlock, DrhpChapter } from '@/lib/drhp/types';
import { cn } from '@/lib/utils';

type CopilotPanelProps = {
  chapter: DrhpChapter;
  selectedBlockId: string | null;
  selectedBlock?: DrhpBlock | null;
  documentVersionId?: string | null;
};

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  answer?: CopilotAnswer;
  error?: string;
};

function blockPreview(block: DrhpBlock | null | undefined): string {
  if (!block) return '';
  if (block.content.kind === 'paragraph') return block.content.text.slice(0, 160);
  if (block.content.kind === 'heading') return block.content.text.slice(0, 160);
  if (block.content.kind === 'legal_notice') return block.content.text.slice(0, 160);
  return block.kind;
}

export function CopilotPanel({
  chapter,
  selectedBlockId,
  selectedBlock = null,
  documentVersionId = null,
}: CopilotPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectionLabel = useMemo(() => {
    if (!selectedBlockId) return 'No block selected — answers will use chapter-level context.';
    const preview = blockPreview(selectedBlock);
    return preview ? `${preview}${preview.length >= 160 ? '…' : ''}` : selectedBlockId;
  }, [selectedBlock, selectedBlockId]);

  const historyForApi = useCallback((): CopilotChatMessage[] => {
    return messages
      .filter((message) => !message.error)
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content:
          message.role === 'assistant' && message.answer
            ? copilotAnswerToPlainText(message.answer)
            : (message.text ?? ''),
      }))
      .filter((message) => message.content.trim().length > 0);
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendCopilotChat({
        message: trimmed,
        history: historyForApi(),
        documentVersionId,
        chapterKey: chapter.key,
        blockId: selectedBlockId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          answer: response.answer,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Copilot request failed.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          error: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    chapter.key,
    documentVersionId,
    historyForApi,
    input,
    loading,
    selectedBlockId,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Dwaar Copilot</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ask about this chapter, selected disclosure text, or traceability to workstream sources.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-b border-border px-4 py-3 text-xs">
        <p>
          <span className="font-medium text-foreground">Chapter:</span>{' '}
          <span className="text-muted-foreground">{chapter.title}</span>
        </p>
        <p className="leading-relaxed text-muted-foreground">{selectionLabel}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Try: “What source supports this risk factor?” or “What should we verify before filing?”
          </p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'rounded-md border px-3 py-2',
              message.role === 'user'
                ? 'border-primary/20 bg-primary/5'
                : 'border-border bg-card',
            )}
          >
            {message.role === 'user' ? (
              <p className="text-sm text-foreground">{message.text}</p>
            ) : message.error ? (
              <p className="text-sm text-destructive">{message.error}</p>
            ) : message.answer ? (
              <CopilotMessageRenderer blocks={message.answer.blocks} />
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border p-4">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <textarea
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask about this chapter or selected block…"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
        />
        <button
          type="button"
          disabled={loading || !input.trim()}
          onClick={() => void handleSend()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send
        </button>
      </div>
    </div>
  );
}
