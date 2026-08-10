import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopilotMessageRenderer } from '@/components/drhp/copilot-message-renderer';
import { copilotAnswerToPlainText, parseCopilotBlocks } from '@/lib/drhp/copilot-types';

describe('copilot types', () => {
  it('parses paragraph blocks that only include text', () => {
    const blocks = parseCopilotBlocks([
      { type: 'paragraph', text: 'Readable fallback paragraph.' },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('paragraph');
    if (blocks[0].type === 'paragraph') {
      expect(blocks[0].spans[0]?.text).toContain('Readable fallback');
    }
  });

  it('parses structured blocks from API payload', () => {
    const blocks = parseCopilotBlocks([
      { type: 'heading', text: 'About this block' },
      {
        type: 'paragraph',
        spans: [
          { text: 'Status: ', style: 'plain' },
          { text: 'structured input backed', style: 'bold' },
        ],
      },
    ]);
    expect(blocks).toHaveLength(2);
    expect(copilotAnswerToPlainText({ blocks })).toContain('structured input backed');
  });
});

describe('CopilotMessageRenderer', () => {
  it('renders heading, paragraph, bullets, and callout', () => {
    render(
      <CopilotMessageRenderer
        blocks={[
          { type: 'heading', text: 'Summary' },
          {
            type: 'paragraph',
            spans: [{ text: 'Important ', style: 'plain' }, { text: 'detail', style: 'bold' }],
          },
          { type: 'bullets', items: ['First point'] },
          { type: 'callout', variant: 'note', text: 'Preparation guidance only.' },
        ]}
      />,
    );
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('detail')).toBeInTheDocument();
    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.getByText('Preparation guidance only.')).toBeInTheDocument();
  });
});
