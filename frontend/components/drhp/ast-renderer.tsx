'use client';

import type { DrhpBlock, DrhpBlockContent } from '@/lib/drhp/types';

type AstRendererProps = {
  blocks: DrhpBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
};

function renderContent(content: DrhpBlockContent) {
  switch (content.kind) {
    case 'paragraph':
      return (
        <p className="font-serif text-[11.5px] leading-[1.55] text-neutral-900">{content.text}</p>
      );
    case 'table':
      return (
        <figure className="my-4">
          {content.caption ? (
            <figcaption className="mb-2 text-center text-xs font-medium text-muted-foreground">
              {content.caption}
            </figcaption>
          ) : null}
          <table className="w-full border-collapse border border-neutral-400 text-[10.5px] text-neutral-900">
            <thead>
              <tr>
                {content.headers.map((header, headerIndex) => (
                  <th
                    key={`header-${headerIndex}`}
                    className="border border-neutral-400 bg-neutral-100 px-2 py-1 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="border border-neutral-400 px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case 'list':
      if (content.ordered) {
        return (
          <ol className="list-decimal space-y-1 pl-5 font-serif text-[13px] leading-[1.65]">
            {content.items.map((item, index) => (
              <li key={`list-item-${index}`}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc space-y-1 pl-5 font-serif text-[13px] leading-[1.65]">
          {content.items.map((item, index) => (
            <li key={`list-item-${index}`}>{item}</li>
          ))}
        </ul>
      );
    case 'notice':
    case 'legal_notice':
      return (
        <p className="rounded border border-border bg-muted/30 px-3 py-2 font-serif text-[12px] italic text-muted-foreground">
          {content.text}
        </p>
      );
    case 'heading':
      return (
        <h2 className="font-serif text-[15px] font-semibold tracking-tight text-foreground">
          {(content as { text?: string }).text ?? ''}
        </h2>
      );
    case 'missing_information':
      return (
        <p className="font-serif text-[13px] text-muted-foreground">
          [●] {content.marker.message}
        </p>
      );
    default:
      return null;
  }
}

/** Renderer-neutral AST block list — used with fixture data only until generation exists. */
export function AstRenderer({ blocks, selectedBlockId, onSelectBlock }: AstRendererProps) {
  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <div
          key={block.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelectBlock(block.id === selectedBlockId ? null : block.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectBlock(block.id === selectedBlockId ? null : block.id);
            }
          }}
          className={`rounded-sm px-1 py-1 outline-none transition ${
            selectedBlockId === block.id
              ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-white'
              : 'hover:bg-muted/20'
          }`}
        >
          {renderContent(block.content)}
        </div>
      ))}
    </div>
  );
}
