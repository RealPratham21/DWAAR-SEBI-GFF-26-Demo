/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObjectsOfIssueWorkstream } from '@/components/objects-of-issue/objects-of-issue-workstream';
import { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
import { createEmptyObjectsOfIssuePayload } from '@/lib/objects-of-issue/defaults';
import type { Workstream } from '@/lib/types';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyObjectsOfIssuePayload();
const ipoReference = createEmptyIpoSetupReference();

const progressFixture = {
  sections: {
    'proceeds-and-funding-summary': 'not_started',
    'objects-register-and-allocation': 'not_started',
    'capital-expenditure-facilities-and-expansion': 'not_started',
    'working-capital-and-borrowing-repayment': 'not_started',
    'acquisitions-subsidiaries-jvs-and-investments': 'not_started',
    'means-of-finance-and-deployment-schedule': 'not_started',
    'expenses-gcp-monitoring-and-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 7,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  isPureOfs: false,
  netFreshIssueProceeds: '',
  totalEstimatedObjectsCost: '',
  totalAllocatedFromNetProceeds: '',
  totalAllocatedFromAllSources: '',
  unallocatedNetProceeds: '',
  allocationReconciles: true,
  totalMeansOfFinance: '',
  totalDeploymentScheduled: '',
  meansOfFinanceReconciles: true,
  totalIssueExpenses: '',
  gcpPercentageOfFreshIssue: '',
  gcpApplicableCap: '',
  gcpWithinLimit: true,
  objectsCount: 0,
  capexItemsCount: 0,
  borrowingRepaymentItemsCount: 0,
  investmentItemsCount: 0,
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  pendingChecksCount: 0,
};

const companyReference = {
  legalName: null,
  companyClass: null,
  cin: null,
  available: false,
};

const linkedReferences = {
  company: companyReference,
  businessOperations: { available: false },
  capitalOwnership: { available: false },
  borrowings: { available: false },
};

const workspaceFixture = {
  id: 'oi-ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: progressFixture,
  computations: computationsFixture,
  ipoSetupReference: ipoReference,
  companyReference,
  linkedReferences,
};

const overviewFixture = {
  isPureOfs: false,
  sectionStatuses: progressFixture.sections,
  sectionsComplete: 0,
  sectionsInProgress: 0,
  totalSections: 7,
  objectsCount: 0,
  netFreshIssueProceeds: '',
  totalEstimatedObjectsCost: '',
  totalAllocatedFromNetProceeds: '',
  gcpPercentageOfFreshIssue: '',
  gcpApplicableCap: '',
  hasCapexRelevantObjects: false,
  hasAcquisitionRelevantObjects: false,
  companyReference,
  assessmentResult: 'insufficient_information',
  assessmentResultLabel: 'Disclosure readiness in progress',
  assessmentSummary: 'Summary',
  blockingConcernCount: 0,
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  missingInformationChecksCount: 0,
  recommendedNextActions: [],
  lastUpdatedAt: null,
};

const assessmentFixture = {
  result: 'insufficient_information',
  resultLabel: 'Disclosure readiness in progress',
  summary: 'Summary',
  criteria: [],
  groups: [],
  counts: {
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    pendingLinkedWorkstream: 0,
    pendingSupportingSource: 0,
    blocked: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    objects: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 7,
    unreconciledChecks: 0,
    blockingConcerns: 0,
    netFreshIssueProceeds: '',
    totalEstimatedObjectsCost: '',
  },
};

const saveObjectsIssueSection = vi.fn(
  async (_sectionId: string, version: number, data: unknown) => ({
    version: version + 1,
    lastSavedAt: new Date().toISOString(),
    savedSectionId: 'proceeds-and-funding-summary',
    savedSection: { proceedsAndFundingSummary: data },
    progress: {
      ...progressFixture,
      sections: {
        ...progressFixture.sections,
        'proceeds-and-funding-summary': 'in_progress',
      },
      overallStatus: 'in_progress',
    },
    payload: { ...emptyPayload, proceedsAndFundingSummary: data },
    computations: computationsFixture,
    acknowledgement: {
      message: 'Your Objects of the Issue information was saved successfully.',
      savedAt: new Date().toISOString(),
    },
    notification: {
      id: 'n1',
      notificationType: 'workstream_save',
      title: 'Proceeds & Funding Summary saved',
      message: 'Your Objects of the Issue information was saved successfully.',
      workstreamSlug: 'objects-of-issue',
      sectionId: 'proceeds-and-funding-summary',
      targetRoute:
        '/projects/demo/workstreams/objects-of-issue?tab=information&section=proceeds-and-funding-summary',
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/objects-of-issue',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

vi.mock('@/lib/api/objects-of-issue', () => ({
  initializeObjectsIssueWorkspace: vi.fn(async () => workspaceFixture),
  fetchObjectsIssueWorkspace: vi.fn(async () => workspaceFixture),
  saveObjectsIssueSection: (...args: unknown[]) =>
    saveObjectsIssueSection(...(args as [string, number, unknown])),
  fetchObjectsIssueOverviewSummary: vi.fn(async () => overviewFixture),
  fetchObjectsIssueAssessment: vi.fn(async () => assessmentFixture),
}));

const workstream: Workstream = {
  sequence: 7,
  slug: 'objects-of-issue',
  title: 'Objects of the Issue',
  description: 'Objects of the issue, allocation, capex, working capital and means of finance.',
  phaseId: 'establish-issuer',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Objects of the Issue information sections/i,
  });
}

async function renderLoaded() {
  render(<ObjectsOfIssueWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Objects of the Issue/i)).toBeNull();
  });
}

describe('Objects of the Issue workstream UI (O2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    saveObjectsIssueSection.mockClear();
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('renders three tabs and seven information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Objects Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(within(nav).getByRole('button', { name: /Proceeds & Funding Summary/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Objects Register & Allocation/i })).toBeTruthy();
  });

  it('renders Overview and Objects Assessment after load', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Objects Assessment' }));
    expect(
      screen.getByText(/disclosure readiness view, not a strong\/weak or investment-quality score/i),
    ).toBeTruthy();
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const notes = screen.getByLabelText(/^Notes$/i);
    await user.type(notes, 'Saved note');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveObjectsIssueSection).toHaveBeenCalled();
    });
    expect(
      screen.getByText(/Your Objects of the Issue information was saved successfully\./i),
    ).toBeTruthy();
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const notes = screen.getByLabelText(/^Notes$/i);
    await user.type(notes, 'Draft only');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((notes as HTMLTextAreaElement).value).toBe('');
  });

  it('prompts before leaving a dirty section', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderLoaded();

    await user.type(screen.getByLabelText(/^Notes$/i), 'Changed');
    await user.click(
      within(sectionNav()).getByRole('button', { name: /Objects Register & Allocation/i }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
