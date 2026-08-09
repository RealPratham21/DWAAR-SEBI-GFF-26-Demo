import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardWorkspace } from '@/components/dashboard/dashboard-workspace';
import * as api from '@/lib/api/dashboard-summary';

vi.mock('@/lib/api/dashboard-summary');
vi.mock('@/lib/api/drhp', () => ({
  downloadDrhpExport: vi.fn(),
}));

const mockSummary = {
  issuerContext: {
    issuerName: 'Nivara Techfab Private Limited',
    companyClass: 'private_limited',
    targetExchange: 'nse_emerge',
    issueType: 'fresh_issue',
    targetTimeline: 'six_to_twelve_months',
    preparationStage: 'internal_preparation',
  },
  workstreams: {
    total: 12,
    complete: 11,
    inProgress: 1,
    notStarted: 0,
    totalSections: 94,
    completedSections: 92,
    items: [
      {
        key: 'company-incorporation',
        label: 'Company & Incorporation',
        order: 1,
        completedSections: 6,
        totalSections: 6,
        progressState: 'complete',
        progressStateLabel: 'Complete',
        openIssues: 1,
        documentProvided: 4,
        documentExpected: 5,
        primaryReviewState: 'Complete',
        href: '/projects/demo/workstreams/company-incorporation?tab=information',
      },
    ],
  },
  issues: {
    open: 17,
    blocking: 0,
    high: 2,
    medium: 8,
    low: 7,
    professionalReview: 6,
    topIssues: [
      {
        issueId: 'issue-1',
        title: 'Fresh Issue share count differs across sources',
        severity: 'high',
        severityLabel: 'High',
        workstreamKey: 'capital-ownership',
        workstreamLabel: 'Capital & Ownership',
        reason: 'Mismatch between IPO setup and ownership records.',
        href: '/projects/demo/issues-gaps?issue=issue-1',
      },
    ],
  },
  factsEvidence: {
    canonicalFacts: 286,
    documentBackedFacts: 34,
    structuredInputFacts: 180,
    calculatedFacts: 42,
    professionalConfirmationFacts: 30,
    factsUsedInLatestDrhp: 198,
    evidenceDocuments: 12,
    evidenceItems: 45,
  },
  dataRoom: {
    uploadedDocuments: 8,
    expectedApplicable: 45,
    providedRequirements: 12,
    missingRequirements: 33,
    reviewApplicability: 2,
    processedDocuments: 6,
    storedOnlyDocuments: 2,
  },
  drhp: {
    exists: true,
    versionId: 'ver-1',
    versionNumber: 2,
    status: 'generated_with_warnings',
    statusLabel: 'Generated with warnings',
    generatedAt: '2026-08-09T10:00:00Z',
    chapterTotal: 18,
    generated: 16,
    generatedWithWarnings: 2,
    blocked: 0,
    failed: 0,
    stale: true,
    affectedChapterCount: 3,
    exportAvailable: true,
    openUrl: '/projects/demo/drhp',
  },
  nextActions: [
    {
      id: 'issue-1',
      priority: 2,
      title: 'Resolve Registrar information',
      description: 'Affects Cover Page and Terms of Issue',
      sourceType: 'issue',
      workstreamKey: 'intermediaries-filing',
      issueId: 'issue-1',
      actionLabel: 'Review',
      href: '/projects/demo/issues-gaps?issue=issue-1',
    },
  ],
  generatedAt: '2026-08-09T12:00:00Z',
  warnings: [],
};

describe('DashboardWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.fetchDashboardSummary).mockResolvedValue(mockSummary);
  });

  it('renders KPI row from backend summary', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Preparation Progress')).toBeInTheDocument();
    });
    expect(screen.getByText('11 / 12 workstreams')).toBeInTheDocument();
    expect(screen.getByText('17 open')).toBeInTheDocument();
    expect(screen.getByText('286 canonical facts')).toBeInTheDocument();
    expect(screen.getAllByText(/Draft v2/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows issuer context strip', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Nivara Techfab Private Limited')).toBeInTheDocument();
    });
  });

  it('shows workstream overview and attention panel', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('IPO Preparation Overview')).toBeInTheDocument();
    });
    expect(screen.getByText('Company & Incorporation')).toBeInTheDocument();
    expect(screen.getByText('Needs Your Attention')).toBeInTheDocument();
    expect(
      screen.getByText('Fresh Issue share count differs across sources'),
    ).toBeInTheDocument();
  });

  it('shows DRHP widget with stale warning', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Draft DRHP')).toBeInTheDocument();
    });
    expect(screen.getByText(/Source information changed/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Draft' })).toHaveAttribute(
      'href',
      '/projects/demo/drhp',
    );
  });

  it('shows next best actions', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Next Best Actions')).toBeInTheDocument();
    });
    expect(screen.getByText('Resolve Registrar information')).toBeInTheDocument();
  });

  it('does not show stale misleading copy', async () => {
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Preparation Progress')).toBeInTheDocument();
    });
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument();
    expect(screen.queryByText('Document storage not connected')).not.toBeInTheDocument();
    expect(screen.queryByText('No facts verified yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Start building verified facts')).not.toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    vi.mocked(api.fetchDashboardSummary).mockRejectedValue(new Error('Network failed'));
    render(<DashboardWorkspace />);
    await waitFor(() => {
      expect(screen.getByText('Network failed')).toBeInTheDocument();
    });
    vi.mocked(api.fetchDashboardSummary).mockResolvedValue(mockSummary);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    await waitFor(() => {
      expect(screen.getByText('Preparation Progress')).toBeInTheDocument();
    });
  });
});
