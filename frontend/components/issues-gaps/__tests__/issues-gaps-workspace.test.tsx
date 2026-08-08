import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssuesGapsWorkspace } from '@/components/issues-gaps/issues-gaps-workspace';
import * as api from '@/lib/api/issues-gaps';

vi.mock('@/lib/api/issues-gaps');

const mockIssue = {
  id: 'abc123',
  fingerprint: 'abc123',
  title: 'Fresh Issue share count differs across workstreams',
  description: 'Capital & Ownership (authoritative) shows 100; IPO Setup shows 120.',
  category: 'inconsistent_information',
  severity: 'blocking' as const,
  lifecycleState: 'open' as const,
  sourceKind: 'cross_workstream_conflict',
  sourceKinds: ['cross_workstream_conflict'],
  workstreamKey: 'capital-ownership',
  workstreamLabel: 'Capital & Ownership',
  sectionKey: 'freshIssueShares',
  sectionLabel: 'Fresh Issue shares',
  recordId: 'ipo-setup-eligibility',
  recordLabel: 'IPO Setup & Eligibility',
  sourceRefs: [],
  evidenceRefs: [],
  whyItMatters: 'May affect cover page disclosures.',
  suggestedAction: 'Review share counts across workstreams.',
  affectedDrhpChapters: ['cover-page-front-matter'],
  affectedDrhpChapterLabels: ['Cover Page & Front Matter'],
  openSourceUrl: '/projects/demo/workstreams/capital-ownership?tab=information',
  openDrhpUrl: '/projects/demo/drhp?chapter=cover-page-front-matter',
  professionalReviewRequired: false,
  acknowledged: false,
  metadata: {},
};

describe('IssuesGapsWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.fetchIssuesGaps).mockResolvedValue({ total: 1, issues: [mockIssue] });
    vi.mocked(api.fetchIssuesGapsSummary).mockResolvedValue({
      totalOpen: 1,
      blocking: 1,
      high: 0,
      medium: 0,
      low: 0,
      professionalReview: 0,
      evidenceGaps: 0,
      inconsistencies: 1,
      drhpRelated: 0,
      acknowledged: 0,
      byWorkstream: { 'capital-ownership': 1 },
      byCategory: { inconsistent_information: 1 },
    });
    vi.mocked(api.patchIssueAcknowledgement).mockResolvedValue({
      issueId: 'abc123',
      fingerprint: 'abc123',
      acknowledged: true,
      note: 'Noted',
    });
  });

  it('renders summary cards and issue list', async () => {
    render(<IssuesGapsWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Issues & Gaps' })).toBeInTheDocument();
    expect(screen.getAllByText('Blocking').length).toBeGreaterThan(0);
    expect(await screen.findByText('Fresh Issue share count differs across workstreams')).toBeInTheDocument();
    expect(screen.getAllByText('Capital & Ownership').length).toBeGreaterThan(0);
  });

  it('filters by severity', async () => {
    render(<IssuesGapsWorkspace />);
    await screen.findByText('Fresh Issue share count differs across workstreams');
    fireEvent.change(screen.getByLabelText('Severity filter'), { target: { value: 'blocking' } });
    await waitFor(() => {
      expect(api.fetchIssuesGaps).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'blocking' }),
      );
    });
  });

  it('opens detail drawer and acknowledges', async () => {
    render(<IssuesGapsWorkspace />);
    fireEvent.click(await screen.findByText('Fresh Issue share count differs across workstreams'));
    expect(await screen.findByText('Why it matters')).toBeInTheDocument();
    expect(screen.getAllByText('Cover Page & Front Matter').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    await waitFor(() => {
      expect(api.patchIssueAcknowledgement).toHaveBeenCalledWith('abc123', {
        acknowledged: true,
        note: null,
      });
    });
  });

  it('shows empty state when no issues', async () => {
    vi.mocked(api.fetchIssuesGaps).mockResolvedValue({ total: 0, issues: [] });
    vi.mocked(api.fetchIssuesGapsSummary).mockResolvedValue({
      totalOpen: 0,
      blocking: 0,
      high: 0,
      medium: 0,
      low: 0,
      professionalReview: 0,
      evidenceGaps: 0,
      inconsistencies: 0,
      drhpRelated: 0,
      acknowledged: 0,
      byWorkstream: {},
      byCategory: {},
    });
    render(<IssuesGapsWorkspace />);
    expect(
      await screen.findByText('No open issues detected from the information currently available.'),
    ).toBeInTheDocument();
  });
});
