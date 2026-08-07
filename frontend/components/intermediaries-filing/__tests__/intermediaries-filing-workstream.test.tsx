/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntermediariesFilingWorkstream } from '@/components/intermediaries-filing/intermediaries-filing-workstream';
import { createEmptyIntermediariesFilingPayload } from '@/lib/intermediaries-filing/defaults';
import { IF_INFORMATION_SECTIONS } from '@/lib/intermediaries-filing/options';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/intermediaries-filing/types';
import type { Workstream } from '@/lib/types';

const navigationState = vi.hoisted(() => {
  let searchParams = new URLSearchParams();
  const replace = vi.fn((href: string) => {
    const query = href.includes('?') ? href.split('?')[1] : '';
    searchParams = new URLSearchParams(query);
  });
  return {
    replace,
    getSearchParams: () => searchParams,
    reset: () => {
      searchParams = new URLSearchParams();
      replace.mockClear();
    },
  };
});

const emptyPayload = createEmptyIntermediariesFilingPayload();
const linkedReferences = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'issue-team-and-intermediary-master': 'not_started',
    'issue-configuration-and-filing-snapshot': 'not_started',
    'filing-and-regulatory-milestone-tracker': 'not_started',
    'due-diligence-certificates-consents-and-signoffs': 'not_started',
    'depositories-banking-asba-upi-and-issue-infrastructure': 'not_started',
    'underwriting-market-making-and-distribution-arrangements': 'not_started',
    'issue-programme-allotment-listing-and-post-issue-execution': 'not_started',
    'final-offer-document-advertisements-material-documents-and-filing-readiness': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
  currentFilingStage: '',
};

const computationsFixture = {
  intermediaryAggregates: {},
  filingAggregates: {},
  certificateConsentAggregates: {},
  dueDiligenceAggregates: {},
  infrastructureAggregates: {},
  underwritingAggregates: {},
  marketMakingAggregates: {},
  programmeAggregates: {},
  finalDocumentAggregates: {},
  reconciliation: {
    ipoSetup: { status: 'pending_linked_workstream', detail: '', mismatchCount: 0, mismatches: [] },
    capitalOwnership: {
      status: 'pending_linked_workstream',
      detail: '',
      mismatchCount: 0,
      mismatches: [],
    },
    objectsOfIssue: {
      status: 'pending_linked_workstream',
      detail: '',
      mismatchCount: 0,
      mismatches: [],
    },
    totalMismatchCount: 0,
    items: [],
  },
  currentFilingStage: '',
};

const workspaceFixture = {
  id: 'if-ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: progressFixture,
  computations: computationsFixture,
  linkedReferences,
};

const overviewFixture = {
  sectionStatuses: progressFixture.sections,
  sectionsComplete: 0,
  sectionsInProgress: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
  currentFilingStage: '',
  targetSmePlatform: '',
  issueMethod: '',
  freshIssueAmount: '',
  ofsAmount: '',
  totalOfferAmount: '',
  currentPriceBandStatus: '',
  authoritativeDocumentVersion: '',
  intermediaryCount: 0,
  leadManagerCount: 0,
  activeIntermediaryCount: 0,
  agreementsPendingCount: 0,
  registrationsPendingReview: 0,
  ddAreasSignedOff: 0,
  ddAreasTotal: 0,
  openDdAreas: 0,
  certificatesReady: 0,
  certificatesPending: 0,
  consentsRequired: 0,
  consentsReceived: 0,
  chapterSignoffsComplete: 0,
  chapterSignoffsTotal: 0,
  filingCount: 0,
  openExchangeQueries: 0,
  overdueExchangeQueries: 0,
  inPrincipleStatus: '',
  sebiSmeFilingStatus: '',
  rocFilingStatus: '',
  isinStatus: '',
  sponsorBankReady: false,
  upiReady: false,
  asbaReady: false,
  bankRolesReady: 0,
  bankRolesTotal: 0,
  underwritingCoverage: '',
  uncoveredShares: '',
  merchantBankerOwnAccountPercentage: '',
  marketMakerAppointed: false,
  marketMakingAgreementExecuted: false,
  marketMakingReservationStatus: '',
  issueOpeningDate: '',
  issueClosingDate: '',
  preliminaryTPlus3ListingDate: '',
  basisStatus: '',
  dematStatus: '',
  listingStatus: '',
  unresolvedPlaceholders: 0,
  inspectionItemsPending: 0,
  issueAgreementsPending: 0,
  advertisementsPending: 0,
  repositoryReadiness: '',
  reconciliationMismatchCount: 0,
  assessmentConcerns: 0,
  pendingProfessionalConfirmations: 0,
  assessmentResult: 'insufficient_information' as const,
  assessmentResultLabel: 'Filing readiness in progress',
  assessmentSummary: 'Summary',
  recommendedNextActions: [],
  lastUpdatedAt: null,
};

const assessmentFixture = {
  result: 'insufficient_information' as const,
  resultLabel: 'Filing readiness in progress',
  summary: 'Summary',
  criteria: [],
  groups: [],
  counts: {
    ready: 0,
    potentialConcern: 0,
    missingInformation: 0,
    appointmentPending: 0,
    agreementPending: 0,
    certificatePending: 0,
    consentPending: 0,
    exchangeQueryPending: 0,
    filingPending: 0,
    approvalPending: 0,
    underwritingPending: 0,
    marketMakingPending: 0,
    issueInfrastructurePending: 0,
    listingActionPending: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
    notYetDue: 0,
  },
  metrics: {
    intermediaryCount: 0,
    filingCount: 0,
    openQueryCount: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    reconciliationMismatchCount: 0,
    potentialConcerns: 0,
  },
  rulesVersion: 'if-sme-v1',
  rulesAsOf: '2026-08-06',
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'issue-team-and-intermediary-master' as const,
  savedSection: emptyPayload.issueTeamAndIntermediaryMaster,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Intermediaries & Filing information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Issue Team & Intermediary Master saved',
    message: 'Saved',
    workstreamSlug: 'intermediaries-filing',
    sectionId: 'issue-team-and-intermediary-master',
    targetRoute:
      '/projects/demo/workstreams/intermediaries-filing?tab=information&section=issue-team-and-intermediary-master',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects/demo/workstreams/intermediaries-filing',
  useRouter: () => ({ replace: navigationState.replace, push: vi.fn() }),
  useSearchParams: () => navigationState.getSearchParams(),
}));

vi.mock('@/lib/api/intermediaries-filing', () => ({
  initializeIntermediariesFilingWorkspace: vi.fn(async () => workspaceFixture),
  fetchIntermediariesFilingOverviewSummary: vi.fn(async () => overviewFixture),
  fetchIntermediariesFilingReadiness: vi.fn(async () => assessmentFixture),
  saveIntermediariesFilingSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 12,
  slug: 'intermediaries-filing',
  title: 'Intermediaries & Filing',
  description: 'Merchant bankers, advisors, and DRHP filing requirements.',
  phaseId: 'finalise-filing',
};

function sectionNav() {
  return screen.getByRole('navigation', { name: /Intermediaries & Filing information sections/i });
}

async function renderLoaded() {
  render(<IntermediariesFilingWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Intermediaries & Filing/i)).toBeNull();
  });
}

describe('Intermediaries & Filing workstream UI (IF2 API-backed)', () => {
  beforeEach(() => {
    navigationState.reset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Filing Readiness' })).toBeTruthy();

    await userEvent.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(sectionNav()).toBeTruthy();
    });

    for (const section of IF_INFORMATION_SECTIONS) {
      expect(
        within(sectionNav()).getByRole('button', { name: new RegExp(section.label, 'i') }),
      ).toBeTruthy();
    }
  });

  it('renders Overview and Filing Readiness after load', async () => {
    const { rerender } = render(
      <IntermediariesFilingWorkstream workstream={workstream} initialTab="overview" />,
    );
    await waitFor(() => {
      expect(screen.queryByText(/Loading Intermediaries & Filing/i)).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText(/Sections completed/i)).toBeTruthy();
    });

    rerender(
      <IntermediariesFilingWorkstream workstream={workstream} initialTab="filing-readiness" />,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/not an IPO approval or regulator clearance determination/i),
      ).toBeTruthy();
    });
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveIntermediariesFilingSection } = await import('@/lib/api/intermediaries-filing');
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Team as-of date/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/Team as-of date/i), '2025-03-31');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveIntermediariesFilingSection).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Your Intermediaries & Filing information was saved successfully/i),
      ).toBeTruthy();
    });
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Team as-of date/i)).toBeTruthy();
    });

    const dateInput = screen.getByLabelText(/Team as-of date/i) as HTMLInputElement;
    await user.type(dateInput, '2025-03-31');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));

    await waitFor(() => {
      expect(dateInput.value).toBe('');
    });
  });

  it('prompts before leaving a dirty information section', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Team as-of date/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/Team as-of date/i), '2025-03-31');
    await user.click(
      within(sectionNav()).getByRole('button', {
        name: /Issue Configuration & Filing Snapshot/i,
      }),
    );

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
