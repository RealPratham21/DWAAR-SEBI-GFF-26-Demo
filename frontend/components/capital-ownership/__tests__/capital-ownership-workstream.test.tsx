/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapitalOwnershipWorkstream } from '@/components/capital-ownership/capital-ownership-workstream';
import { createEmptyCapitalOwnershipPayload } from '@/lib/capital-ownership/defaults';
import { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
import type { Workstream } from '@/lib/types';
import { initializeCapitalOwnershipWorkspace } from '@/lib/api/capital-ownership';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyCapitalOwnershipPayload();

const emptyIpoReference = createEmptyIpoSetupReference();

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

const companyReference = {
  legalName: 'Nivara Techfab Private Limited',
  companyClass: 'private',
  cin: 'U12345MH2020PTC123456',
  available: true,
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
  companyReference,
  ipoSetupReference: emptyIpoReference,
};

const overviewFixture = {
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
  missingInformationChecksCount: 4,
  reconciliationConcerns: [],
  ipoSetupLinked: false,
  ipoSetupOfferType: '',
  assessmentResult: 'insufficient_information',
  assessmentResultLabel: 'Insufficient information',
  assessmentSummary: 'Too much of the capital and ownership record is still blank.',
  missingRequiredResponses: ['Current Capital Structure incomplete'],
  missingRequiredCount: 1,
  recommendedNextActions: [
    {
      label: 'Continue with Current Capital Structure',
      sectionId: 'current-capital-structure',
      href: '/projects/demo/workstreams/capital-ownership?tab=information&section=current-capital-structure',
    },
  ],
  companyReference,
  ipoSetupReference: emptyIpoReference,
};

const assessmentFixture = {
  result: 'insufficient_information',
  resultLabel: 'Insufficient information',
  summary: 'Too much of the capital and ownership record is still blank.',
  criteria: [],
  groups: [],
  counts: {
    reconciled: 0,
    potential_inconsistency: 0,
    missing_information: 4,
    pending_linked_workstream: 0,
    pending_professional_confirmation: 0,
    not_applicable: 0,
  },
  metrics: {
    currentEquityShares: '',
    paidUpEquityCapital: '',
    postIssueEquityShares: '',
    promoterPreIssuePercentage: '',
    promoterPostIssuePercentage: '',
    promoterDilutionPercentagePoints: '',
    totalSharesOfferedForSale: '',
    minimumContributionRequiredShares: '',
    eligibleContributionShares: '',
    contributionShortfallShares: '',
    potentialDilutionFromConvertibles: '',
    unreconciledChecks: 0,
    unansweredConfirmations: 11,
    sectionsComplete: 0,
  },
};

const saveCapitalOwnershipSection = vi.fn(
  async (_sectionId: string, version: number, data: unknown) => ({
    version: version + 1,
    lastSavedAt: new Date().toISOString(),
    savedSectionId: 'current-capital-structure',
    savedSection: { currentCapitalStructure: data },
    progress: {
      ...progressFixture,
      sections: {
        ...progressFixture.sections,
        'current-capital-structure': 'in_progress',
      },
      overallStatus: 'in_progress',
    },
    payload: { ...emptyPayload, currentCapitalStructure: data },
    computations: computationsFixture,
    acknowledgement: {
      message: 'Your Capital & Ownership information was saved successfully.',
      savedAt: new Date().toISOString(),
    },
    notification: {
      id: 'n1',
      notificationType: 'workstream_save',
      title: 'Current Capital Structure saved',
      message: 'Your Capital & Ownership information was saved successfully.',
      workstreamSlug: 'capital-ownership',
      sectionId: 'current-capital-structure',
      targetRoute:
        '/projects/demo/workstreams/capital-ownership?tab=information&section=current-capital-structure',
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/capital-ownership',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

vi.mock('@/lib/api/capital-ownership', () => ({
  initializeCapitalOwnershipWorkspace: vi.fn(async () => workspaceFixture),
  fetchCapitalOwnershipWorkspace: vi.fn(async () => workspaceFixture),
  saveCapitalOwnershipSection: (...args: unknown[]) =>
    saveCapitalOwnershipSection(...(args as [string, number, unknown])),
  fetchCapitalOwnershipOverviewSummary: vi.fn(async () => overviewFixture),
  fetchCapitalOwnershipAssessment: vi.fn(async () => assessmentFixture),
}));

const workstream: Workstream = {
  sequence: 3,
  slug: 'capital-ownership',
  title: 'Capital & Ownership',
  description: 'Share capital structure, shareholding pattern, and ownership details.',
  phaseId: 'establish-issuer',
};

function sectionNav() {
  return screen.getByRole('navigation', { name: /information sections/i });
}

describe('Capital & Ownership workstream UI (C2 persistence)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    saveCapitalOwnershipSection.mockClear();
    vi.mocked(initializeCapitalOwnershipWorkspace).mockResolvedValue(workspaceFixture);
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('loads workspace and renders three tabs and seven information sections', async () => {
    const user = userEvent.setup();
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /information sections/i })).toBeTruthy();
    });

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Capital Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(within(nav).getByRole('button', { name: /Current Capital Structure/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Share Capital History/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Shareholders/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Promoters/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Pre & Post-Issue/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Promoter Contribution/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Outstanding Securities/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();
    expect(screen.getByText(/Insufficient information/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Capital Assessment' }));
    expect(screen.getByText(/not a pass or fail decision/i)).toBeTruthy();
  });

  it('prefills persisted Share Capital History values after reload', async () => {
    const user = userEvent.setup();
    const persistedHistory = {
      ...emptyPayload.shareCapitalHistory,
      historyCoversPeriodSinceIncorporation: 'no' as const,
      historyStartDate: '2026-08-02',
      allHistoricalAllotmentsDocumented: 'no' as const,
      historyReconciledWithMcaFilings: 'no' as const,
      historyReconciledWithRegisterOfMembers: 'yes' as const,
      bonusIssueInLastTwelveMonths: 'yes' as const,
      bonusIssueOutOfRevaluationReserves: 'no' as const,
      sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths: 'yes' as const,
      anyPendingAllotments: 'no' as const,
      gapsInHistoryExplanation: 'idk man',
    };
    vi.mocked(initializeCapitalOwnershipWorkspace).mockResolvedValueOnce({
      ...workspaceFixture,
      created: false,
      version: 2,
      payload: {
        ...emptyPayload,
        shareCapitalHistory: persistedHistory,
      },
      progress: {
        ...progressFixture,
        sections: {
          ...progressFixture.sections,
          'share-capital-history': 'in_progress',
        },
        overallStatus: 'in_progress',
      },
    });

    searchParamsState.set('section', 'share-capital-history');
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/History covers the period since incorporation/i),
      ).toBeTruthy();
    });

    expect(
      (screen.getByLabelText(/History covers the period since incorporation/i) as HTMLSelectElement)
        .value,
    ).toBe('no');
    expect((screen.getByLabelText(/History start date/i) as HTMLInputElement).value).toBe(
      '2026-08-02',
    );
    expect(
      (screen.getByLabelText(/Gaps in history/i) as HTMLTextAreaElement).value,
    ).toBe('idk man');
    expect(
      within(sectionNav()).getByRole('button', { name: /Share Capital History/i }).textContent,
    ).toContain('In progress');

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections started/i)).toBeTruthy();
  });

  it('saves the active section and discards drafts', async () => {
    const user = userEvent.setup();
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Capital structure as on date/i)).toBeTruthy();
    });

    const dateField = screen.getByLabelText(/Capital structure as on date/i);
    await user.clear(dateField);
    await user.type(dateField, '2025-03-31');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveCapitalOwnershipSection).toHaveBeenCalled();
    });
    expect(saveCapitalOwnershipSection.mock.calls[0]?.[0]).toBe('current-capital-structure');
    expect(saveCapitalOwnershipSection.mock.calls[0]?.[1]).toBe(1);

    await waitFor(() => {
      expect(
        screen.getByText(/Your Capital & Ownership information was saved successfully/i),
      ).toBeTruthy();
    });

    const notesField = document.getElementById('cap-structure-notes') as HTMLTextAreaElement;
    expect(notesField).toBeTruthy();
    await user.type(notesField, 'draft note');
    expect(notesField.value).toContain('draft note');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect(
      (document.getElementById('cap-structure-notes') as HTMLTextAreaElement).value,
    ).toBe('');
  });

  it('only flags a section once its value actually differs from the persisted copy', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Capital structure as on date/i)).toBeTruthy();
    });

    const nav = sectionNav();
    const currentCapitalNavItem = within(nav).getByRole('button', {
      name: /Current Capital Structure/i,
    });
    const notesField = document.getElementById('cap-structure-notes') as HTMLTextAreaElement;

    // A field event that re-sends the value already on file is not an edit.
    await user.click(notesField);
    await user.tab();
    expect(currentCapitalNavItem.textContent).not.toContain('not kept yet');

    // Typing and then undoing it leaves the section identical to the persisted copy.
    await user.type(notesField, 'x');
    expect(currentCapitalNavItem.textContent).toContain('not kept yet');
    await user.clear(notesField);
    expect(currentCapitalNavItem.textContent).not.toContain('not kept yet');

    // A real edit clears once the save succeeds.
    await user.type(notesField, 'real edit');
    expect(currentCapitalNavItem.textContent).toContain('not kept yet');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(currentCapitalNavItem.textContent).not.toContain('not kept yet');
    });
    expect(screen.getByRole('button', { name: /Keep section updates/i }).hasAttribute('disabled')).toBe(
      true,
    );

    // Nothing is outstanding, so moving around must not prompt.
    await user.click(within(nav).getByRole('button', { name: /Share Capital History/i }));
    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(confirmSpy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('shows preference classes only when preference shares are Yes or Not sure', async () => {
    const user = userEvent.setup();
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Does the company have preference shares/i)).toBeTruthy();
    });

    expect(screen.queryByText(/Add preference class/i)).toBeNull();
    await user.selectOptions(
      screen.getByLabelText(/Does the company have preference shares/i),
      'yes',
    );
    expect(screen.getByRole('button', { name: /Add preference class/i })).toBeTruthy();
  });

  it('protects unsaved section changes when navigating away', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Capital structure as on date/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/Capital structure as on date/i), '2025-03-31');
    await user.click(within(sectionNav()).getByRole('button', { name: /Share Capital History/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByLabelText(/Capital structure as on date/i)).toBeTruthy();
    confirmSpy.mockRestore();
  });

  it('shows pending linked workstream for IPO when reference unavailable', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CapitalOwnershipWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /information sections/i })).toBeTruthy();
    });

    await user.click(within(sectionNav()).getByRole('button', { name: /Pre & Post-Issue/i }));
    expect(
      screen.getByText(/Pending linked workstream — offer sizing is governed by IPO Setup/i),
    ).toBeTruthy();
  });
});
