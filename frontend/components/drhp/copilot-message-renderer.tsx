import { cn } from '@/lib/utils';
import type { CopilotContentBlock, CopilotTextSpan } from '@/lib/drhp/copilot-types';

function renderSpan(span: CopilotTextSpan, index: number) {
  if (span.style === 'bold') {
    return (
      <strong key={`span-${index}`} className="font-semibold text-foreground">
        {span.text}
      </strong>
    );
  }
  if (span.style === 'muted') {
    return (
      <span key={`span-${index}`} className="text-muted-foreground">
        {span.text}
      </span>
    );
  }
  return <span key={`span-${index}`}>{span.text}</span>;
}

export function CopilotMessageRenderer({ blocks }: { blocks: CopilotContentBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No response content.</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          if (!block.text.trim()) return null;
          const level = block.level ?? 2;
          const className = cn(
            'font-semibold text-foreground',
            level <= 2 ? 'text-sm' : 'text-xs uppercase tracking-wide',
          );
          return (
            <h4 key={`block-${index}`} className={className}>
              {block.text}
            </h4>
          );
        }
        if (block.type === 'paragraph') {
          if (block.spans.length === 0) return null;
          return (
            <p key={`block-${index}`}>
              {block.spans.map((span, spanIndex) => renderSpan(span, spanIndex))}
            </p>
          );
        }
        if (block.type === 'bullets') {
          if (block.items.length === 0) return null;
          return (
            <ul key={`block-${index}`} className="list-disc space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'callout') {
          return (
            <div
              key={`block-${index}`}
              className={cn(
                'rounded-md border px-3 py-2 text-xs leading-relaxed',
                block.variant === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
            >
              {block.text}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
