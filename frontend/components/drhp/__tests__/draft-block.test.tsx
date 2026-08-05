/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftBlock } from '@/components/drhp/draft-block';
import type { DrhpBlock } from '@/lib/drhp/types';

const fixtureBlock: DrhpBlock = {
  id: 'fixture-block-1',
  kind: 'paragraph',
  status: 'draft',
  order: 1,
  content: { kind: 'paragraph', text: 'Test-only fixture paragraph.' },
  evidenceRefs: [],
  gapRefs: [],
};

describe('DraftBlock selection', () => {
  it('supports click and keyboard selection for URL block plumbing', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DraftBlock block={fixtureBlock} selected={false} onSelect={onSelect} />);

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('fixture-block-1');

    onSelect.mockClear();
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('fixture-block-1');
  });
});
