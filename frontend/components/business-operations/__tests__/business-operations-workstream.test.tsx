/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessOperationsWorkstream } from '@/components/business-operations/business-operations-workstream';
import { createEmptyBusinessOperationsPayload } from '@/lib/business-operations/defaults';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/business-operations/types';
import type { Workstream } from '@/lib/types';
import { initializeBusinessOperationsWorkspace } from '@/lib/api/business-operations';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyBusinessOperationsPayload();
const linked = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'business-profile-operating-model': 'not_started',
    'products-services-revenue-mix': 'not_started',
    'customers-sales-distribution-geography': 'not_started',
    'suppliers-procurement-inventory-logistics': 'not_started',
    'facilities-capacity-operational-process': 'not_started',
    'technology-quality-rd-ip': 'not_started',
    'workforce-collaborations-insurance-continuity': 'not_started',
    'competitive-strengths-strategy-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  productsCount: 0,
  facilitiesCount: 0,
  employeesTotal: '',
  largestSegmentLabel: '',
  largestSegmentPercentage: '',
  productConcentration: '',
  revenuePercentagesReconcile: false,
  customerConcentrationLargest: '',
  supplierConcentrationLargest: '',
  capacityUtilisationLatest: '',
  dependenciesCount: 0,
  certificationsCount: 0,
  ipRecordsCount: 0,
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  missingInformationChecksCount: 4,
};

const companyReference = {
  legalName: null,
  companyClass: null,
  cin: null,
  available: false,
};

const workspaceFixture = {
  id: 'bo-ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: progressFixture,
  computations: computationsFixture,
  companyReference,
  linkedReferences: linked,
};

const overviewFixture = {
  sectionsComplete: 0,
  sectionsInProgress: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
  sectionStatuses: progressFixture.sections,
  businessModelSummary: '',
  operatingSegmentsSummary: '',
  productsCount: 0,
  facilitiesCount: 0,
  employeesTotal: '',
  domesticOperations: '',
  exportOperations: '',
  largestSegmentLabel: '',
  largestSegmentPercentage: '',
  productConcentration: '',
  customerConcentration: '',
  supplierConcentration: '',
  capacityUtilisation: '',
  dependenciesCount: 0,
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  missingInformationChecksCount: 4,
  reconciliationConcerns: [],
  assessmentResult: 'insufficient_information',
  assessmentResultLabel: 'Insufficient information',
  assessmentSummary: 'Too much of the business and operations record is still blank.',
  missingRequiredResponses: [],
  missingRequiredCount: 0,
  recommendedNextActions: [
    {
      label: 'Continue Business Profile & Operating Model',
      sectionId: 'business-profile-operating-model',
      href: '/projects/demo/workstreams/business-operations?tab=information&section=business-profile-operating-model',
    },
  ],
  companyReference,
  lastUpdatedAt: null,
};

const assessmentFixture = {
  result: 'insufficient_information',
  resultLabel: 'Insufficient information',
  summary: 'Too much of the business and operations record is still blank.',
  criteria: [],
  groups: [],
  counts: {
    substantiated: 0,
    potential_inconsistency: 0,
    missing_information: 4,
    pending_linked_workstream: 0,
    pending_supporting_source: 0,
    pending_professional_confirmation: 0,
    not_applicable: 0,
  },
  metrics: {
    products: 0,
    facilities: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 14,
    unreconciledChecks: 0,
    largestSegmentLabel: '',
    latestHeadcount: '',
  },
};

const saveBusinessOperationsSection = vi.fn(
  async (_sectionId: string, version: number, data: unknown) => ({
    version: version + 1,
    lastSavedAt: new Date().toISOString(),
    savedSectionId: 'business-profile-operating-model',
    savedSection: { businessProfileAndOperatingModel: data },
    progress: {
      ...progressFixture,
      sections: {
        ...progressFixture.sections,
        'business-profile-operating-model': 'in_progress',
      },
      overallStatus: 'in_progress',
    },
    payload: { ...emptyPayload, businessProfileAndOperatingModel: data },
    computations: computationsFixture,
    acknowledgement: {
      message: 'Your Business & Operations information was saved successfully.',
      savedAt: new Date().toISOString(),
    },
    notification: {
      id: 'n1',
      notificationType: 'workstream_save',
      title: 'Business Profile & Operating Model saved',
      message: 'Your Business & Operations information was saved successfully.',
      workstreamSlug: 'business-operations',
      sectionId: 'business-profile-operating-model',
      targetRoute:
        '/projects/demo/workstreams/business-operations?tab=information&section=business-profile-operating-model',
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/business-operations',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

vi.mock('@/lib/api/business-operations', () => ({
  initializeBusinessOperationsWorkspace: vi.fn(async () => workspaceFixture),
  fetchBusinessOperationsWorkspace: vi.fn(async () => workspaceFixture),
  saveBusinessOperationsSection: (...args: unknown[]) =>
    saveBusinessOperationsSection(...(args as [string, number, unknown])),
  fetchBusinessOperationsOverviewSummary: vi.fn(async () => overviewFixture),
  fetchBusinessOperationsAssessment: vi.fn(async () => assessmentFixture),
}));

const workstream: Workstream = {
  sequence: 4,
  slug: 'business-operations',
  title: 'Business & Operations',
  description: 'Business profile, products, customers, facilities and operational disclosure.',
  phaseId: 'establish-issuer',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Business & Operations information sections/i,
  });
}

describe('Business & Operations workstream UI (B2 persistence)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    saveBusinessOperationsSection.mockClear();
    vi.mocked(initializeBusinessOperationsWorkspace).mockResolvedValue(workspaceFixture);
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('loads workspace and renders three tabs and eight information sections', async () => {
    const user = userEvent.setup();
    render(<BusinessOperationsWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(sectionNav()).toBeTruthy();
    });

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Business Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(within(nav).getByRole('button', { name: /Business Profile/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Products, Services/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Customers, Sales/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Suppliers, Procurement/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Facilities, Capacity/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Technology, Quality/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Workforce, Collaborations/i })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Competitive Strengths/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();
    expect(screen.getByText(/Insufficient information/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Business Assessment' }));
    expect(screen.getByText(/not a strong\/weak or investment-quality score/i)).toBeTruthy();
  });

  it('prefills persisted Business Profile values after reload', async () => {
    const persistedProfile = {
      ...emptyPayload.businessProfileAndOperatingModel,
      primaryBusinessActivity: 'Precision tooling',
      briefBusinessOverview: 'Makes tooling for automotive OEMs',
      businessClassifications: ['manufacturing' as const],
    };
    vi.mocked(initializeBusinessOperationsWorkspace).mockResolvedValueOnce({
      ...workspaceFixture,
      created: false,
      version: 2,
      payload: {
        ...emptyPayload,
        businessProfileAndOperatingModel: persistedProfile,
      },
      progress: {
        ...progressFixture,
        sections: {
          ...progressFixture.sections,
          'business-profile-operating-model': 'in_progress',
        },
        overallStatus: 'in_progress',
      },
    });

    render(<BusinessOperationsWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Primary business activity/i)).toBeTruthy();
    });

    expect(
      (screen.getByLabelText(/Primary business activity/i) as HTMLInputElement).value,
    ).toBe('Precision tooling');
    expect(
      within(sectionNav()).getByRole('button', { name: /Business Profile/i }).textContent,
    ).toContain('In progress');
  });

  it('saves the active section and discards drafts to the persisted baseline', async () => {
    const user = userEvent.setup();
    render(<BusinessOperationsWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Primary business activity/i)).toBeTruthy();
    });

    const activity = screen.getByLabelText(/Primary business activity/i);
    await user.clear(activity);
    await user.type(activity, 'Precision tooling');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveBusinessOperationsSection).toHaveBeenCalled();
    });
    expect(saveBusinessOperationsSection.mock.calls[0]?.[0]).toBe(
      'business-profile-operating-model',
    );
    expect(saveBusinessOperationsSection.mock.calls[0]?.[1]).toBe(1);

    await waitFor(() => {
      expect(
        screen.getByText(/Your Business & Operations information was saved successfully/i),
      ).toBeTruthy();
    });

    await user.clear(activity);
    await user.type(activity, 'draft only');
    expect((activity as HTMLInputElement).value).toContain('draft only');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((screen.getByLabelText(/Primary business activity/i) as HTMLInputElement).value).toBe(
      'Precision tooling',
    );
  });

  it('preserves unsaved values when a save request fails', async () => {
    const user = userEvent.setup();
    saveBusinessOperationsSection.mockRejectedValueOnce(new Error('network'));
    render(<BusinessOperationsWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Primary business activity/i)).toBeTruthy();
    });

    const activity = screen.getByLabelText(/Primary business activity/i);
    await user.type(activity, 'Keep me');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(screen.getByText(/Unable to save changes/i)).toBeTruthy();
    });
    expect((screen.getByLabelText(/Primary business activity/i) as HTMLInputElement).value).toContain(
      'Keep me',
    );
  });

  it('only prompts leave confirmation when the section actually differs from baseline', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<BusinessOperationsWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Primary business activity/i)).toBeTruthy();
    });

    await user.click(within(sectionNav()).getByRole('button', { name: /Products, Services/i }));
    expect(confirmSpy).not.toHaveBeenCalled();

    await user.click(within(sectionNav()).getByRole('button', { name: /Business Profile/i }));
    await user.type(screen.getByLabelText(/Primary business activity/i), 'Changed');
    await user.click(within(sectionNav()).getByRole('button', { name: /Products, Services/i }));
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
