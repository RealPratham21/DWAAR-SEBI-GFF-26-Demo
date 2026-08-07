/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagementGovernanceWorkstream } from '@/components/management-governance/management-governance-workstream';
import { createEmptyManagementGovernancePayload } from '@/lib/management-governance/defaults';
import { createEmptyManagementGovernanceIpoSetupReference } from '@/lib/management-governance/types';
import type { Workstream } from '@/lib/types';

const replaceMock = vi.fn();
const searchParamsState = new URLSearchParams();

const emptyPayload = createEmptyManagementGovernancePayload();
const ipoReference = createEmptyManagementGovernanceIpoSetupReference();

const progressFixture = {
  sections: {
    'board-structure-and-ipo-governance-readiness': 'not_started',
    'directors-profiles-appointments-and-eligibility': 'not_started',
    'kmp-senior-management-and-organisation-structure': 'not_started',
    'board-committees-and-governance-bodies': 'not_started',
    'remuneration-service-contracts-esops-and-benefits': 'not_started',
    'interests-conflicts-and-management-relationships': 'not_started',
    'changes-continuity-and-succession': 'not_started',
    'governance-policies-rpt-oversight-and-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  boardSize: 0,
  proposedBoardSize: 0,
  vacantSeats: 0,
  pendingAppointments: 0,
  kmpCount: 0,
  smpCount: 0,
  committeesReadyCount: 0,
  committeesRequiredCount: 0,
  policiesAdoptedCount: 0,
  policiesRequiredCount: 0,
  potentialDirectorshipLimitFlags: 0,
  listingSegment: 'unknown',
  directorCount: 0,
  currentDirectorCount: 0,
  independentDirectorCount: 0,
  criticalRoleVacancies: 0,
};

const companyReference = {
  available: false,
  legalName: null,
  companyClass: null,
  cin: null,
  companyStatus: null,
  incorporationDate: null,
};

const linkedReferences = {
  company: companyReference,
  ipoSetup: ipoReference,
  capitalOwnership: {
    available: false,
    paidUpEquityCapital: null,
    promoterIdentityAvailable: false,
  },
  financialsKpis: {
    available: false,
    netWorth: null,
    rptSummaryAvailable: false,
  },
  businessOperations: {
    available: false,
    businessUnitContextAvailable: false,
  },
  groupEntities: { available: false },
  litigation: { available: false },
};

const workspaceFixture = {
  id: 'mg-ws-1',
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
  boardSize: 0,
  proposedBoardSize: 0,
  executiveDirectors: 0,
  nonExecutiveDirectors: 0,
  independentDirectors: 0,
  womenDirectors: 0,
  residentDirectors: 0,
  chairmanName: '',
  managingDirectorName: '',
  kmpCount: 0,
  seniorManagementCount: 0,
  criticalVacancies: 0,
  committeesReady: 0,
  committeesRequired: 0,
  policiesAdopted: 0,
  policiesRequired: 0,
  boardChangesLastThreeYears: 0,
  kmpChangesLastThreeYears: 0,
  pendingAppointments: 0,
  potentialConcerns: 0,
  professionalReviewItems: 0,
  listingSegment: 'unknown',
  assessmentResult: 'insufficient_information',
  assessmentResultLabel: 'Disclosure readiness in progress',
  assessmentSummary: 'Summary',
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
    appearsReady: 0,
    potentialConcern: 0,
    missingInformation: 0,
    pendingAppointment: 0,
    pendingBoardApproval: 0,
    pendingShareholderApproval: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    boardSize: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    pendingAppointments: 0,
    potentialConcerns: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'board-structure-and-ipo-governance-readiness',
  savedSection: emptyPayload.boardStructureAndIpoGovernanceReadiness,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Management & Governance information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Board Structure saved',
    message: 'Saved',
    workstreamSlug: 'management-governance',
    sectionId: 'board-structure-and-ipo-governance-readiness',
    targetRoute:
      '/projects/demo/workstreams/management-governance?tab=information&section=board-structure-and-ipo-governance-readiness',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/management-governance',
  useSearchParams: () => searchParamsState,
}));

vi.mock('@/lib/api/management-governance', () => ({
  initializeManagementGovernanceWorkspace: vi.fn(async () => workspaceFixture),
  fetchManagementGovernanceOverviewSummary: vi.fn(async () => overviewFixture),
  fetchManagementGovernanceAssessment: vi.fn(async () => assessmentFixture),
  saveManagementGovernanceSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 7,
  slug: 'management-governance',
  title: 'Management & Governance',
  description: 'Board composition, management team, and corporate governance practices.',
  phaseId: 'core-disclosures',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Management & Governance information sections/i,
  });
}

async function renderLoaded() {
  render(<ManagementGovernanceWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Management & Governance/i)).toBeNull();
  });
}

describe('Management & Governance workstream UI (M2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    replaceMock.mockClear();
    Array.from(searchParamsState.keys()).forEach((key) => searchParamsState.delete(key));
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Governance Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(
      within(nav).getByRole('button', { name: /Board Structure & IPO Governance Readiness/i }),
    ).toBeTruthy();
    expect(within(nav).getAllByRole('button').length).toBe(8);
  });

  it('renders Overview and Governance Assessment after load', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Sections completed/i)).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Governance Assessment' }));
    expect(
      screen.getByText(/disclosure readiness view, not a strong\/weak or investment-quality score/i),
    ).toBeTruthy();
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveManagementGovernanceSection } = await import('@/lib/api/management-governance');
    await renderLoaded();

    const notes = screen.getByLabelText(/^Notes$/i);
    await user.type(notes, 'Persisted note');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveManagementGovernanceSection).toHaveBeenCalled();
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
        name: /Directors — Profiles, Appointments & Eligibility/i,
      }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
