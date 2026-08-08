/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapitalOwnershipWorkstream } from '@/components/capital-ownership/capital-ownership-workstream';
import { createEmptyCapitalOwnershipPayload } from '@/lib/capital-ownership/defaults';
import { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
import { createNivaraCapitalOwnershipPayload } from '@/lib/demo-data/nivara/capital-ownership';
import { NIVARA_CAPITAL } from '@/lib/demo-data/nivara/constants';
import type { Workstream } from '@/lib/types';

vi.mock('@/lib/demo-data/config', () => ({
  isNivaraSampleDataEnabled: vi.fn(() => true),
  NIVARA_SAMPLE_CONFIRM_MESSAGE: 'Replace your current unsaved changes with Nivara sample data?',
}));

const navigationState = vi.hoisted(() => {
  let searchParams = new URLSearchParams('tab=information');
  const replace = vi.fn((href: string) => {
    const query = href.includes('?') ? href.split('?')[1] : '';
    searchParams = new URLSearchParams(query);
  });
  return {
    replace,
    getSearchParams: () => searchParams,
    reset: () => {
      searchParams = new URLSearchParams('tab=information');
      replace.mockClear();
    },
  };
});

const emptyPayload = createEmptyCapitalOwnershipPayload();
const nivaraPayload = createNivaraCapitalOwnershipPayload();

const progressFixture = {
  sections: {
    'current-capital-structure': 'not_started',
    'share-capital-history': 'not_started',
    'shareholders-beneficial-ownership': 'not_started',
    'promoters-and-control': 'not_started',
    'pre-post-issue-ownership': 'not_started',
    'promoter-contribution-lock-in': 'not_started',
    'outstanding-securities-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 7,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  currentEquityShares: '',
  paidUpEquityCapitalFromClasses: '',
  promoterAndGroupPercentage: '',
  publicPercentage: '',
  postIssueShares: '',
  promoterPreIssuePercentage: '',
  promoterPostIssuePercentage: '',
  promoterDilutionPercentagePoints: '',
  offerAsPercentageOfPostIssueCapital: '',
  totalSharesOfferedForSale: '',
  potentialDilutionFromConvertibles: '',
  requiredContributionShares: '',
  eligibleContributionShares: '',
  contributionShortfallShares: '',
  totalEncumberedShares: '',
};

const workspaceFixture = {
  id: 'co-ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: progressFixture,
  computations: computationsFixture,
  companyReference: { available: false, legalName: null, cin: null, companyClass: null },
  ipoSetupReference: createEmptyIpoSetupReference(),
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-08T12:00:00.000Z',
  savedSectionId: 'current-capital-structure' as const,
  savedSection: nivaraPayload.currentCapitalStructure,
  progress: progressFixture,
  payload: nivaraPayload,
  computations: computationsFixture,
  acknowledgement: { message: 'Saved', savedAt: '2026-08-08T12:00:00.000Z' },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Saved',
    message: 'Saved',
    workstreamSlug: 'capital-ownership',
    sectionId: 'current-capital-structure',
    targetRoute: '/projects/demo/workstreams/capital-ownership',
    readAt: null,
    createdAt: '2026-08-08T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects/demo/workstreams/capital-ownership',
  useRouter: () => ({ replace: navigationState.replace, push: vi.fn() }),
  useSearchParams: () => navigationState.getSearchParams(),
}));

vi.mock('@/lib/api/capital-ownership', () => ({
  initializeCapitalOwnershipWorkspace: vi.fn(async () => workspaceFixture),
  fetchCapitalOwnershipOverviewSummary: vi.fn(async () => ({
    sectionsComplete: 0,
    sectionsInProgress: 0,
    totalSections: 7,
    overallStatus: 'not_started' as const,
    sectionStatuses: progressFixture.sections,
    currentEquityShares: '',
    paidUpEquityCapital: '',
    promoterAndGroupPercentage: '',
    postIssueShares: '',
    promoterPostIssuePercentage: '',
    offerAsPercentageOfPostIssueCapital: '',
    potentialDilutionFromConvertibles: '',
    totalSharesOfferedForSale: '',
    sellingShareholdersCount: 0,
    outstandingInstrumentsCount: 0,
    totalEncumberedShares: '',
    reconciledChecksCount: 0,
    varianceChecksCount: 0,
    missingInformationChecksCount: 0,
    reconciliationConcerns: [],
    ipoSetupLinked: false,
    ipoSetupOfferType: '',
    assessmentResult: 'insufficient_information',
    assessmentResultLabel: 'Insufficient information',
    assessmentSummary: 'Summary',
    missingRequiredResponses: [],
    missingRequiredCount: 0,
    recommendedNextActions: [],
    lastUpdatedAt: null,
    companyReference: { available: false, legalName: null, cin: null, companyClass: null },
    ipoSetupReference: createEmptyIpoSetupReference(),
  })),
  fetchCapitalOwnershipAssessment: vi.fn(async () => null),
  saveCapitalOwnershipSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 3,
  slug: 'capital-ownership',
  title: 'Capital & Ownership',
  description: 'Share capital structure and ownership.',
  phaseId: 'due-diligence',
};

async function openInformationTab() {
  render(<CapitalOwnershipWorkstream workstream={workstream} initialTab="information" />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Capital & Ownership/i)).toBeNull();
  });
}

describe('Nivara sample data action (Capital & Ownership)', () => {
  beforeEach(() => navigationState.reset());
  afterEach(() => cleanup());

  it('shows the action when demo mode is enabled', async () => {
    await openInformationTab();
    expect(screen.getByRole('button', { name: /Use Nivara sample data/i })).toBeTruthy();
  });

  it('populates draft without calling save API', async () => {
    const user = userEvent.setup();
    const { saveCapitalOwnershipSection } = await import('@/lib/api/capital-ownership');
    await openInformationTab();

    await user.click(screen.getByRole('button', { name: /Use Nivara sample data/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Equity Shares of ₹10 each')).toBeTruthy();
    });
    expect(saveCapitalOwnershipSection).not.toHaveBeenCalled();
  });

  it('prompts before replacing unsaved edits and preserves draft on cancel', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await openInformationTab();

    await waitFor(() => {
      expect(screen.getByLabelText(/Capital structure as on date/i)).toBeTruthy();
    });

    const dateField = screen.getByLabelText(/Capital structure as on date/i) as HTMLInputElement;
    await user.clear(dateField);
    await user.type(dateField, '2025-01-01');
    await user.click(screen.getByRole('button', { name: /Use Nivara sample data/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(dateField.value).toBe('2025-01-01');
    confirmSpy.mockRestore();
  });

  it('allows normal save after applying sample data', async () => {
    const user = userEvent.setup();
    const { saveCapitalOwnershipSection } = await import('@/lib/api/capital-ownership');
    await openInformationTab();

    await user.click(screen.getByRole('button', { name: /Use Nivara sample data/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue('Equity Shares of ₹10 each')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));
    await waitFor(() => {
      expect(saveCapitalOwnershipSection).toHaveBeenCalled();
    });
  });
});

describe('Nivara sample data visibility flag', () => {
  afterEach(() => cleanup());

  it('hides the action when demo mode is disabled', async () => {
    const { isNivaraSampleDataEnabled } = await import('@/lib/demo-data/config');
    vi.mocked(isNivaraSampleDataEnabled).mockReturnValue(false);
    await openInformationTab();
    expect(screen.queryByRole('button', { name: /Use Nivara sample data/i })).toBeNull();
    vi.mocked(isNivaraSampleDataEnabled).mockReturnValue(true);
  });
});
