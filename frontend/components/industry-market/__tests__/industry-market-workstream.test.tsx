/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IndustryMarketWorkstream } from '@/components/industry-market/industry-market-workstream';
import { createEmptyIndustryMarketPayload } from '@/lib/industry-market/defaults';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/industry-market/types';
import type { Workstream } from '@/lib/types';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyIndustryMarketPayload();
const linkedReferences = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'industry-scope-and-company-market-mapping': 'not_started',
    'research-sources-and-industry-report-governance': 'not_started',
    'macroeconomic-and-industry-context': 'not_started',
    'market-size-segmentation-and-growth': 'not_started',
    'demand-drivers-end-markets-trends-and-policy': 'not_started',
    'value-chain-supply-structure-and-entry-barriers': 'not_started',
    'competition-market-share-and-issuer-positioning': 'not_started',
    'outlook-industry-risks-and-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  primaryIndustry: '',
  relevantMarket: '',
  geography: '',
  latestMarketSize: '',
  latestMarketSizePeriod: '',
  latestMarketSizeUnit: '',
  forecastMarketSize: '',
  forecastPeriod: '',
  forecastCagr: '',
  marketSeriesCount: 0,
  marketSegmentCount: 0,
  issuerLinkedSegmentCount: 0,
  competitorCount: 0,
  calculatedIssuerMarketShare: '',
  marketShareBasis: '',
  marketSharePeriod: '',
  sourceCount: 0,
  currentSourceCount: 0,
  potentiallyStaleSourceCount: 0,
  pendingVerificationSourceCount: 0,
  commissionedReportCount: 0,
  claimsProposed: 0,
  claimsSubstantiated: 0,
  claimsNeedingEvidence: 0,
  conflictingSourceCount: 0,
};

const workspaceFixture = {
  id: 'im-ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: progressFixture,
  computations: computationsFixture,
  companyReference: linkedReferences.company,
  linkedReferences,
};

const overviewFixture = {
  sectionStatuses: progressFixture.sections,
  sectionsComplete: 0,
  sectionsInProgress: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
  primaryIndustry: '',
  relevantMarket: '',
  geography: '',
  latestMarketSize: '',
  latestMarketSizePeriod: '',
  latestMarketSizeUnit: '',
  forecastMarketSize: '',
  forecastPeriod: '',
  forecastCagr: '',
  relevantMarketSegmentCount: 0,
  issuerLinkedSegmentCount: 0,
  competitorsIdentified: 0,
  calculatedIssuerMarketShare: '',
  marketShareBasis: '',
  marketSharePeriod: '',
  externalSourceCount: 0,
  currentSourceCount: 0,
  potentiallyStaleSourceCount: 0,
  pendingVerificationSourceCount: 0,
  commissionedReportCount: 0,
  claimsProposed: 0,
  claimsSubstantiated: 0,
  claimsNeedingEvidence: 0,
  conflictingSourceCount: 0,
  assessmentConcerns: 0,
  assessmentResult: 'insufficient_information' as const,
  assessmentResultLabel: 'Disclosure readiness in progress',
  assessmentSummary: 'Summary',
  recommendedNextActions: [],
  lastUpdatedAt: null,
};

const assessmentFixture = {
  result: 'insufficient_information' as const,
  resultLabel: 'Disclosure readiness in progress',
  summary: 'Summary',
  criteria: [],
  groups: [],
  counts: {
    substantiated: 0,
    potentialInconsistency: 0,
    missingInformation: 0,
    missingSource: 0,
    staleSource: 0,
    methodologyConcern: 0,
    conflictingSources: 0,
    pendingIndustryReport: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    sourceCount: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    unsupportedClaims: 0,
    conflictingSourceCount: 0,
    staleSourceCount: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'industry-scope-and-company-market-mapping',
  savedSection: emptyPayload.industryScopeAndCompanyMarketMapping,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Industry & Market information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Industry Scope saved',
    message: 'Saved',
    workstreamSlug: 'industry-market',
    sectionId: 'industry-scope-and-company-market-mapping',
    targetRoute:
      '/projects/demo/workstreams/industry-market?tab=information&section=industry-scope-and-company-market-mapping',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/industry-market',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/api/industry-market', () => ({
  initializeIndustryMarketWorkspace: vi.fn(async () => workspaceFixture),
  fetchIndustryMarketOverviewSummary: vi.fn(async () => overviewFixture),
  fetchIndustryMarketAssessment: vi.fn(async () => assessmentFixture),
  saveIndustryMarketSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 8,
  slug: 'industry-market',
  title: 'Industry & Market',
  description: 'Industry overview, market dynamics, and competitive landscape.',
  phaseId: 'due-diligence',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Industry & Market information sections/i,
  });
}

async function renderLoaded() {
  render(<IndustryMarketWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Industry & Market/i)).toBeNull();
  });
}

describe('Industry & Market workstream UI (IM2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Industry Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(
      within(nav).getByRole('button', { name: /Industry Scope & Company-to-Market Mapping/i }),
    ).toBeTruthy();
    expect(within(nav).getAllByRole('button').length).toBe(8);
  });

  it('renders Overview and Industry Assessment after load', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Industry Assessment' }));
    expect(
      screen.getByText(/attractive\/unattractive industry/i),
    ).toBeTruthy();
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveIndustryMarketSection } = await import('@/lib/api/industry-market');
    await renderLoaded();

    const primaryIndustry = screen.getByLabelText(/Primary industry/i);
    await user.type(primaryIndustry, 'Manufacturing');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveIndustryMarketSection).toHaveBeenCalled();
    });
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const primaryIndustry = screen.getByLabelText(/Primary industry/i);
    await user.type(primaryIndustry, 'Draft only');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((primaryIndustry as HTMLInputElement).value).toBe('');
  });

  it('prompts before leaving a dirty section', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderLoaded();

    await user.type(screen.getByLabelText(/Primary industry/i), 'Changed');
    await user.click(
      within(sectionNav()).getByRole('button', {
        name: /Research Sources & Industry Report Governance/i,
      }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
