import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AstRenderer } from '@/components/drhp/ast-renderer';
import type { DrhpBlock } from '@/lib/drhp/types';

const FIXTURE_BLOCKS: DrhpBlock[] = [
  {
    id: 'block-heading',
    kind: 'heading',
    status: 'draft',
    order: 1,
    content: { kind: 'heading', text: 'Section heading fixture', level: 2 },
    evidenceRefs: [],
    gapRefs: [],
    supportState: 'structured_input_backed',
    sourceRefs: [
      {
        refId: 'src-1',
        workstreamKey: 'business-operations',
        sectionKey: 'customers',
        fieldPath: 'customerConcentration.topCustomerSharePct',
        fieldLabel: 'Top customer concentration',
        sourceType: 'structured_user_input',
        valuePreview: '42%',
      },
    ],
  },
  {
    id: 'block-table',
    kind: 'table',
    status: 'draft',
    order: 2,
    content: {
      kind: 'table',
      caption: 'Share capital',
      headers: ['Particulars', 'Amount'],
      rows: [['Authorised capital', '₹ 50,00,000']],
    },
    evidenceRefs: [],
    gapRefs: [],
    supportState: 'calculation_backed',
  },
  {
    id: 'block-placeholder',
    kind: 'placeholder',
    status: 'draft',
    order: 3,
    content: {
      kind: 'missing_information',
      marker: { id: 'ph-1', message: 'Final issue price' },
    },
    evidenceRefs: [],
    gapRefs: [],
    supportState: 'placeholder',
  },
];

describe('AstRenderer', () => {
  it('renders fixture blocks with document-like typography', () => {
    render(
      <AstRenderer blocks={FIXTURE_BLOCKS} selectedBlockId={null} onSelectBlock={() => undefined} />,
    );
    expect(screen.getByText('Section heading fixture')).toBeInTheDocument();
    expect(screen.getByText('Share capital')).toBeInTheDocument();
    expect(screen.getByText('[●]')).toBeInTheDocument();
  });

  it('supports selectable block ids for evidence linking', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AstRenderer blocks={FIXTURE_BLOCKS} selectedBlockId={null} onSelectBlock={onSelect} />,
    );
    await user.click(screen.getByText('Section heading fixture'));
    expect(onSelect).toHaveBeenCalledWith('block-heading');
  });

  it('renders duplicate list items without key collisions', () => {
    const duplicateNotice =
      'Please read Section 32 of the Companies Act, 2013. This Draft Red Herring Prospectus will be updated upon filing with SEBI.';
    render(
      <AstRenderer
        blocks={[
          {
            id: 'block-list',
            kind: 'list',
            status: 'draft',
            order: 1,
            content: {
              kind: 'list',
              ordered: false,
              items: [duplicateNotice, duplicateNotice],
            },
            evidenceRefs: [],
            gapRefs: [],
            supportState: 'structured_input_backed',
          },
        ]}
        selectedBlockId={null}
        onSelectBlock={() => undefined}
      />,
    );
    expect(screen.getAllByText(duplicateNotice)).toHaveLength(2);
  });
});
