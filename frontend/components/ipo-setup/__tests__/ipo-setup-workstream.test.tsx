/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IpoSetupEligibilityWorkstream } from '@/components/ipo-setup/ipo-setup-workstream';
import { createEmptyIpoSetupPayload } from '@/lib/ipo-setup/defaults';
import type { Workstream } from '@/lib/types';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyIpoSetupPayload();
const workspaceFixture = {
  id: 'ws-1',
  version: 1,
  schemaVersion: 1,
  lastSavedAt: null,
  created: true,
  payload: emptyPayload,
  progress: {
    sections: {
      'ipo-direction': 'not_started',
      'offer-structure': 'not_started',
      'track-record-financial': 'not_started',
      'eligibility-declarations': 'not_started',
      'process-readiness': 'not_started',
      'issuer-confirmations': 'not_started',
    },
    sectionsComplete: 0,
    totalSections: 6,
    overallStatus: 'not_started',
  },
  offerComputations: {
    includesFreshIssue: false,
    includesOfs: false,
    amountDisplayUnit: 'crore',
    totalSharesOffered: null,
    totalOfferAmount: null,
    freshIssuePercentageOfOffer: null,
    ofsPercentageOfOffer: null,
    proposedPostIssueShares: null,
    proposedPostIssuePaidUpCapital: null,
    offerAsPercentageOfPostIssueCapital: null,
    paidUpCapitalIncreaseFromOffer: null,
  },
  companyReference: {
    legalName: 'Nivara Techfab Private Limited',
    companyClass: 'private',
    cin: 'U12345MH2020PTC123456',
    available: true,
  },
};

const overviewFixture = {
  preparationStage: '',
  preparationStageLabel: 'Not provided',
  targetPlatform: '',
  targetPlatformLabel: 'Not provided',
  offerType: '',
  offerTypeLabel: 'Not provided',
  pricingMethod: '',
  pricingMethodLabel: 'Not provided',
  sectionsComplete: 0,
  totalSections: 6,
  overallStatus: 'not_started',
  sectionStatuses: workspaceFixture.progress.sections,
  preliminaryAssessmentResult: 'insufficient_information',
  preliminaryAssessmentLabel: 'Insufficient information',
  potentialConcerns: [],
  missingRequiredResponses: ['IPO Direction incomplete'],
  missingRequiredCount: 1,
  processReadinessStatus: 'not_started',
  recommendedNextActions: [
    {
      label: 'Complete IPO Direction',
      sectionId: 'ipo-direction',
      href: '/projects/demo/workstreams/ipo-setup-eligibility?tab=information&section=ipo-direction',
    },
  ],
  offerComputations: workspaceFixture.offerComputations,
  companyReference: workspaceFixture.companyReference,
};

const assessmentFixture = {
  result: 'insufficient_information',
  resultLabel: 'Insufficient information',
  summary: 'Too many required inputs remain unanswered for a meaningful preliminary view.',
  criteria: [],
  groupedCriteria: {
    issuer_eligibility: [],
    financial_eligibility: [],
    offer_eligibility: [],
    legal_disqualification: [],
    process_readiness: [],
  },
  metrics: {
    proposedPostIssuePaidUpCapital: null,
    ofsPercentageOfOffer: null,
    yearsMeetingOperatingProfitThreshold: 0,
    positiveNetWorthAvailable: null,
    yearsWithPositiveFcfe: 0,
    threeYearTrackRecordEstablished: null,
    publicCompanyConversionStatus: 'not provided',
    unresolvedAdverseDeclarations: 0,
  },
  offerComputations: workspaceFixture.offerComputations,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/ipo-setup-eligibility',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

vi.mock('@/lib/api/ipo-setup', () => ({
  initializeIpoSetupWorkspace: vi.fn(async () => workspaceFixture),
  fetchIpoSetupWorkspace: vi.fn(async () => workspaceFixture),
  saveIpoSetupSection: vi.fn(async (_sectionId: string, version: number, data: unknown) => ({
    version: version + 1,
    lastSavedAt: new Date().toISOString(),
    savedSectionId: 'ipo-direction',
    savedSection: { ipoDirection: data },
    progress: {
      ...workspaceFixture.progress,
      sections: { ...workspaceFixture.progress.sections, 'ipo-direction': 'in_progress' },
      sectionsComplete: 0,
      overallStatus: 'in_progress',
    },
    payload: { ...emptyPayload, ipoDirection: data },
    offerComputations: workspaceFixture.offerComputations,
    acknowledgement: { message: 'Saved successfully.', savedAt: new Date().toISOString() },
    notification: {
      id: 'n1',
      notificationType: 'workstream_save',
      title: 'IPO Direction saved',
      message: 'Saved successfully.',
      workstreamSlug: 'ipo-setup-eligibility',
      sectionId: 'ipo-direction',
      targetRoute: '/projects/demo/workstreams/ipo-setup-eligibility',
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  })),
  fetchIpoSetupOverviewSummary: vi.fn(async () => overviewFixture),
  fetchIpoSetupEligibilityAssessment: vi.fn(async () => assessmentFixture),
}));

const workstream: Workstream = {
  sequence: 2,
  slug: 'ipo-setup-eligibility',
  title: 'IPO Setup & Eligibility',
  description: 'Capture IPO direction, offer structure and eligibility inputs.',
  phaseId: 'establish-issuer',
};

function sectionNav() {
  return screen.getByRole('navigation', { name: /information sections/i });
}

async function openSection(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
) {
  await user.click(within(sectionNav()).getByRole('button', { name: label }));
}

describe('IPO Setup workstream UI (I2 persistence)', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    replaceMock.mockClear();
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('loads workspace and renders tabs/sections from backend', async () => {
    const user = userEvent.setup();
    render(<IpoSetupEligibilityWorkstream workstream={workstream} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    });

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Eligibility Assessment' })).toBeTruthy();
    expect(within(sectionNav()).getByRole('button', { name: /IPO Direction/i })).toBeTruthy();
    expect(screen.getByText(/Private Limited Company/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Preliminary assessment')).toBeTruthy();
    expect(screen.getByText('Insufficient information')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Eligibility Assessment' }));
    expect(screen.getByText('Preliminary result')).toBeTruthy();
    expect(screen.getByText(/calculated on the server/i)).toBeTruthy();
  });

  it('saves the active section through the API', async () => {
    const user = userEvent.setup();
    const { saveIpoSetupSection } = await import('@/lib/api/ipo-setup');
    render(<IpoSetupEligibilityWorkstream workstream={workstream} />);
    await waitFor(() => screen.getByLabelText(/Current preparation stage/i));

    await user.selectOptions(screen.getByLabelText(/Current preparation stage/i), 'exploring-ipo');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveIpoSetupSection).toHaveBeenCalled();
    });
    expect(screen.getByText(/Saved successfully/i)).toBeTruthy();
  });

  it('discards unsaved local edits back to persisted values', async () => {
    const user = userEvent.setup();
    render(<IpoSetupEligibilityWorkstream workstream={workstream} />);
    await waitFor(() => screen.getByLabelText(/Current preparation stage/i));

    await user.selectOptions(screen.getByLabelText(/Current preparation stage/i), 'exploring-ipo');
    expect((screen.getByLabelText(/Current preparation stage/i) as HTMLSelectElement).value).toBe(
      'exploring-ipo',
    );
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((screen.getByLabelText(/Current preparation stage/i) as HTMLSelectElement).value).toBe(
      '',
    );
  });

  it('toggles fresh/OFS fields and declaration details', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<IpoSetupEligibilityWorkstream workstream={workstream} />);
    await waitFor(() => screen.getByLabelText(/Proposed offer type/i));

    await user.selectOptions(screen.getByLabelText(/Proposed offer type/i), 'fresh-issue');
    await openSection(user, /Proposed Offer Structure/i);
    expect(screen.getByLabelText(/Proposed fresh-issue shares/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Proposed OFS shares/i)).toBeNull();

    await openSection(user, /Eligibility Declarations/i);
    const first = screen.getByLabelText(/Admitted IBC proceeding against the issuer/i);
    expect((first as HTMLSelectElement).value).toBe('');
    await user.selectOptions(first, 'yes');
    expect(screen.getByLabelText(/Person \/ entity involved/i)).toBeTruthy();
  });
});
