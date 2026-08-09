'use client';

import { DRHP_PUBLICATION_CLASSES } from '@/lib/drhp/publication/theme';
import type { DrhpBlock, DrhpBlockContent } from '@/lib/drhp/types';

type AstRendererProps = {
  blocks: DrhpBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  isCoverChapter?: boolean;
  isRiskChapter?: boolean;
};

function renderContent(content: DrhpBlockContent, options: { isCoverChapter: boolean; isRiskChapter: boolean }) {
  const { isCoverChapter, isRiskChapter } = options;
  const c = DRHP_PUBLICATION_CLASSES;

  switch (content.kind) {
    case 'paragraph':
      return (
        <p className={isCoverChapter ? `${c.body} text-center` : c.body}>{content.text}</p>
      );
    case 'heading': {
      const level = content.level ?? 3;
      const className = level <= 2 ? c.sectionHeading : c.subsectionHeading;
      const riskClass = isRiskChapter ? `${className} mt-1` : className;
      return <h3 className={riskClass}>{content.text}</h3>;
    }
    case 'table': {
      const alignments = content.columnAlignments ?? [];
      return (
        <figure className="my-2">
          {content.caption ? <figcaption className={c.tableCaption}>{content.caption}</figcaption> : null}
          {content.unit && !content.caption?.toLowerCase().includes(content.unit.toLowerCase()) ? (
            <p className={c.tableNote}>(₹ in {content.unit}, unless otherwise stated)</p>
          ) : null}
          <table className={c.table}>
            <thead>
              <tr>
                {content.headers.map((header, headerIndex) => (
                  <th key={`header-${headerIndex}`} className={c.tableHeaderCell}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => {
                    const alignment = alignments[cellIndex] ?? 'left';
                    const cellClass = alignment === 'right' ? c.tableCellNumeric : c.tableCell;
                    return (
                      <td key={`cell-${rowIndex}-${cellIndex}`} className={cellClass}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {content.notes?.length ? (
            <div className="mt-1">
              <p className={`${c.tableNote} font-semibold`}>Notes:</p>
              {content.notes.map((note, index) => (
                <p key={`note-${index}`} className={c.tableNote}>
                  {index + 1}. {note}
                </p>
              ))}
            </div>
          ) : null}
        </figure>
      );
    }
    case 'list':
      if (content.ordered) {
        return (
          <ol className={`${c.list} list-decimal`}>
            {content.items.map((item, index) => (
              <li key={`list-item-${index}`}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className={`${c.list} list-disc`}>
          {content.items.map((item, index) => (
            <li key={`list-item-${index}`}>{item}</li>
          ))}
        </ul>
      );
    case 'legal_notice':
      return <p className={c.legalNotice}>{content.text}</p>;
    case 'notice':
      return <p className={c.legalNotice}>{content.text}</p>;
    case 'missing_information':
      return <p className={c.placeholder}>[●]</p>;
    default:
      return null;
  }
}

/** Renderer-neutral AST block list with prospectus-style publication treatment. */
export function AstRenderer({
  blocks,
  selectedBlockId,
  onSelectBlock,
  isCoverChapter = false,
  isRiskChapter = false,
}: AstRendererProps) {
  return (
    <div className={DRHP_PUBLICATION_CLASSES.blockGap}>
      {blocks.map((block) => {
        if (block.kind === 'page_break') {
          return (
            <div
              key={block.id}
              aria-hidden
              className="my-6 border-t border-dashed border-neutral-300 print:break-before-page"
            />
          );
        }

        return (
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
            className={`rounded-sm px-0.5 py-0.5 outline-none transition ${
              selectedBlockId === block.id
                ? 'bg-primary/5 ring-1 ring-primary/30'
                : 'hover:bg-neutral-100/60'
            }`}
          >
            {renderContent(block.content, { isCoverChapter, isRiskChapter })}
          </div>
        );
      })}
    </div>
  );
}
