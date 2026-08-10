import { describe, expect, it } from 'vitest';
import { astChapterToBlocks, hasRenderableChapterAst } from '@/lib/drhp/ast-mapper';

const coverAst = {
  chapterKey: 'cover-page-front-matter',
  title: 'Cover Page & Front Matter',
  sections: [
    {
      sectionKey: 'cover',
      heading: 'Cover Page',
      blocks: [
        { blockId: 'b1', kind: 'legal_notice', content: { text: 'Legal notice text.' } },
        { blockId: 'b2', kind: 'paragraph', content: { text: 'Issuer summary paragraph.' } },
      ],
    },
  ],
};

describe('hasRenderableChapterAst', () => {
  it('returns false for empty or missing sections', () => {
    expect(hasRenderableChapterAst(null)).toBe(false);
    expect(hasRenderableChapterAst({ sections: [] })).toBe(false);
    expect(hasRenderableChapterAst({ sections: [{ blocks: [] }] })).toBe(false);
  });

  it('returns true when a section has blocks', () => {
    expect(hasRenderableChapterAst(coverAst)).toBe(true);
  });
});

describe('astChapterToBlocks', () => {
  it('maps cover page AST from backend', () => {
    const blocks = astChapterToBlocks(coverAst);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('maps snake_case AST keys from legacy payloads', () => {
    const legacy = JSON.parse(
      JSON.stringify(coverAst)
        .replaceAll('sectionKey', 'section_key')
        .replaceAll('blockId', 'block_id'),
    ) as Record<string, unknown>;
    const blocks = astChapterToBlocks(legacy);
    expect(blocks.length).toBeGreaterThan(0);
  });
});
