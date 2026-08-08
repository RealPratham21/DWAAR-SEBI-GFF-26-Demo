'use client';

import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { DrhpBlock } from '@/lib/drhp/types';

type DraftBlockProps = {
  block: DrhpBlock;
  selected: boolean;
  onSelect: (blockId: string) => void;
};

/**
 * Selectable draft block shell for future generated content.
 * Renders real block content when provided; used today mainly via test fixtures.
 */
export function DraftBlock({ block, selected, onSelect }: DraftBlockProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(block.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      data-block-id={block.id}
      onClick={() => onSelect(block.id)}
      onKeyDown={onKeyDown}
      className={cn(
        'rounded-md border px-4 py-3 text-sm transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-accent/40'
          : 'border-border bg-card hover:border-muted-foreground/40',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {block.kind.replaceAll('_', ' ')}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {block.status.replaceAll('_', ' ')}
        </span>
      </div>
      <DraftBlockBody block={block} />
    </div>
  );
}

function DraftBlockBody({ block }: { block: DrhpBlock }) {
  const { content } = block;
  switch (content.kind) {
    case 'paragraph':
      return <p className="leading-relaxed text-foreground">{content.text}</p>;
    case 'notice':
      return <p className="leading-relaxed text-foreground">{content.text}</p>;
    case 'list':
      return content.ordered ? (
        <ol className="list-decimal space-y-1 pl-5 text-foreground">
          {content.items.map((item, index) => (
            <li key={`list-item-${index}`}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-foreground">
          {content.items.map((item, index) => (
            <li key={`list-item-${index}`}>{item}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                {content.headers.map((header) => (
                  <th key={header} className="border border-border px-2 py-1 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-border px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'missing_information':
      return (
        <p className="italic text-muted-foreground">{content.marker.message}</p>
      );
    default:
      return null;
  }
}
