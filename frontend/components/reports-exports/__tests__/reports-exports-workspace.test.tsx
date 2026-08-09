import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReportsExportsWorkspace } from '@/components/reports-exports/reports-exports-workspace';
import * as api from '@/lib/api/reports-exports';

vi.mock('@/lib/api/reports-exports');

const mockSummary = {
  issuer: 'Nivara Techfab Private Limited',
  generatedAt: '2026-08-09T12:00:00Z',
  workstreams: { complete: 10, inProgress: 2, notStarted: 0, total: 12 },
  drhpDocx: {
    available: true,
    versionNumber: 2,
    versionId: 'ver-2',
    statusLabel: 'Generated with warnings',
    generatedAt: '2026-08-09T10:00:00Z',
    stale: true,
    affectedChapterCount: 3,
    openDrhpUrl: '/projects/demo/drhp',
  },
  drhpPdf: {
    available: true,
    versionNumber: 2,
    versionId: 'ver-2',
    statusLabel: 'Generated with warnings',
    generatedAt: '2026-08-09T10:00:00Z',
    stale: true,
    affectedChapterCount: 3,
    openDrhpUrl: '/projects/demo/drhp',
  },
  cards: [
    {
      cardId: 'drhp-docx',
      title: 'DRHP Working Draft',
      description: 'Editable Word export',
      formatLabel: 'Word (.docx)',
      statusLabel: 'Generated with warnings',
      detailLabel: 'Draft v2',
      available: true,
      disabledReason: '',
      downloadKind: 'drhp-docx',
      progressRatio: null,
      progressCaption: '',
    },
    {
      cardId: 'readiness',
      title: 'Readiness Report',
      description: 'Executive summary',
      formatLabel: 'PDF',
      statusLabel: '10 of 12 workstreams complete',
      detailLabel: '4 open issues',
      available: true,
      disabledReason: '',
      downloadKind: 'readiness-pdf',
      progressRatio: 0.83,
      progressCaption: '10 of 12 workstreams complete',
    },
  ],
  nextActions: [],
};

describe('ReportsExportsWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.fetchReportsExportSummary).mockResolvedValue(mockSummary);
  });

  it('renders live summary without fake readiness percentages', async () => {
    render(<ReportsExportsWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Reports & Export' })).toBeInTheDocument();
    expect(screen.getAllByText('10 of 12 workstreams complete').length).toBeGreaterThan(0);
    expect(screen.queryByText(/100% Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/42% Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/8\.5 MB/i)).not.toBeInTheDocument();
  });

  it('shows DRHP stale warning', async () => {
    render(<ReportsExportsWorkspace />);
    await screen.findByText('DRHP Working Draft');
    expect(screen.getAllByText(/Source information has changed/).length).toBeGreaterThan(0);
  });
});
