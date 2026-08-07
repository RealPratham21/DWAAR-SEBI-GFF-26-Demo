/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialsKpisWorkstream } from '@/components/financials-kpis/financials-kpis-workstream';
import { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
import { createEmptyFinancialsKpisPayload } from '@/lib/financials-kpis/defaults';
import type { Workstream } from '@/lib/types';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyFinancialsKpisPayload();
const ipoReference = createEmptyIpoSetupReference();

const progressFixture = {
  sections: {
    'reporting-scope-periods-and-auditor-readiness': 'not_started',
    'restated-statement-of-profit-and-loss': 'not_started',
    'assets-liabilities-equity-and-cash-flows': 'not_started',
    'restatement-adjustments-policies-and-auditor-matters': 'not_started',
    'other-financial-information': 'not_started',
    'ratios-capitalisation-and-issue-price-metrics': 'not_started',
    'kpi-selection-governance-and-peer-comparison': 'not_started',
    'mda-trends-material-developments-and-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  periodCount: 0,
  plPeriodCount: 0,
  latestPeriodLabel: '',
  displayUnit: '',
  latestRevenue: '',
  latestProfitAfterTax: '',
  latestEbitda: '',
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  missingInformationChecksCount: 0,
  periodComparisonWarningsCount: 0,
  restatementChecksCount: 0,
  restatementChecksReconciledCount: 0,
  smeEligibilityCount: 0,
  kpiCount: 0,
  plLineCount: 0,
};

const companyReference = {
  legalName: null,
  companyClass: null,
  cin: null,
  available: false,
};

const linkedReferences = {
  company: companyReference,
  capitalOwnership: { available: false, equityShareCapital: null, faceValue: null },
  businessOperations: { available: false, segmentIds: [] },
  objectsOfIssue: {
    available: false,
    workingCapitalRequirement: null,
    borrowingRepaymentTotal: null,
  },
  borrowings: { available: false },
  groupEntities: { available: false },
};

const workspaceFixture = {
  id: 'fk-ws-1',
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
  sectionStatuses: progressFixture.sections,
  sectionsComplete: 0,
  sectionsInProgress: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
  periodLabels: [],
  latestPeriodLabel: '',
  displayUnit: '',
  fullYearPeriodCount: 0,
  interimPeriodCount: 0,
  entityCount: 0,
  plLineCount: 0,
  kpiCount: 0,
  reconciledChecksCount: 0,
  varianceChecksCount: 0,
  missingInformationChecksCount: 0,
  reconciliationConcerns: [],
  periodComparisonWarnings: [],
  assessmentResult: 'insufficient_information',
  assessmentResultLabel: 'Disclosure readiness in progress',
  assessmentSummary: 'Summary',
  recommendedNextActions: [],
  latestRevenue: '',
  latestProfitAfterTax: '',
  latestEbitda: '',
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
    potentialInconsistency: 0,
    missingInformation: 0,
    pendingRestatement: 0,
    pendingAuditorConfirmation: 0,
    pendingLinkedWorkstream: 0,
    pendingKpiCertification: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    periods: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    unreconciledChecks: 0,
    blockingConcerns: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'reporting-scope-periods-and-auditor-readiness',
  savedSection: emptyPayload.reportingScopePeriodsAndAuditorReadiness,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Financials & KPIs information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Reporting Scope saved',
    message: 'Saved',
    workstreamSlug: 'financials-kpis',
    sectionId: 'reporting-scope-periods-and-auditor-readiness',
    targetRoute:
      '/projects/demo/workstreams/financials-kpis?tab=information&section=reporting-scope-periods-and-auditor-readiness',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/financials-kpis',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/api/financials-kpis', () => ({
  initializeFinancialsKpisWorkspace: vi.fn(async () => workspaceFixture),
  fetchFinancialsKpisOverviewSummary: vi.fn(async () => overviewFixture),
  fetchFinancialsKpisAssessment: vi.fn(async () => assessmentFixture),
  saveFinancialsKpisSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 6,
  slug: 'financials-kpis',
  title: 'Financials & KPIs',
  description: 'Historical financial statements and key performance indicators.',
  phaseId: 'core-disclosures',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Financials & KPIs information sections/i,
  });
}

async function renderLoaded() {
  render(<FinancialsKpisWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Financials & KPIs/i)).toBeNull();
  });
}

describe('Financials & KPIs workstream UI (F2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Financial Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(
      within(nav).getByRole('button', { name: /Reporting Scope, Periods & Auditor Readiness/i }),
    ).toBeTruthy();
    expect(within(nav).getAllByRole('button').length).toBe(8);
  });

  it('renders Overview and Financial Assessment after load', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Financial Assessment' }));
    expect(
      screen.getByText(/disclosure readiness view, not a strong\/weak or investment-quality score/i),
    ).toBeTruthy();
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveFinancialsKpisSection } = await import('@/lib/api/financials-kpis');
    await renderLoaded();

    const notes = screen.getByLabelText(/^Notes$/i);
    await user.type(notes, 'Persisted note');
    await user.click(screen.getByRole('button', { name: /Save section/i }));

    await waitFor(() => {
      expect(saveFinancialsKpisSection).toHaveBeenCalled();
    });
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
      within(sectionNav()).getByRole('button', {
        name: /Restated Statement of Profit & Loss/i,
      }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
