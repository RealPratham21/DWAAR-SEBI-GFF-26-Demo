/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupEntitiesRelatedPartiesWorkstream } from '@/components/group-entities-related-parties/group-entities-workstream';
import { createEmptyGroupEntitiesRelatedPartiesPayload } from '@/lib/group-entities-related-parties/defaults';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/group-entities-related-parties/types';
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

const emptyPayload = createEmptyGroupEntitiesRelatedPartiesPayload();
const linkedReferences = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'group-structure-and-entity-master': 'not_started',
    'ownership-control-and-relationship-mapping': 'not_started',
    'group-company-and-materiality-classification': 'not_started',
    'related-party-universe-and-classification': 'not_started',
    'related-party-transactions-balances-and-commitments': 'not_started',
    'common-pursuits-dependencies-and-conflicts': 'not_started',
    'group-entity-financial-regulatory-and-litigation-readiness': 'not_started',
    'changes-rpt-readiness-and-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  entityCount: 0,
  subsidiaryCount: 0,
  stepDownSubsidiaryCount: 0,
  associateCount: 0,
  jvCount: 0,
  promoterGroupEntityCount: 0,
  icdrGroupCompanyCount: 0,
  icdrPendingBoardCount: 0,
  relatedPartyCount: 0,
  historicalRelatedPartyCount: 0,
  ownershipRelationshipCount: 0,
  rptTransactionCount: 0,
  commonPursuitEntityCount: 0,
  dependencyCount: 0,
  negativeNetWorthCount: 0,
  lossMakingCount: 0,
  auditorQualifiedCount: 0,
  incompleteInformationCount: 0,
  ibcConcernCount: 0,
  pendingEntityInformationCount: 0,
  rptSummary: {
    totalByParty: {},
    totalByType: {},
    totalByFinancialYear: {},
    rptSales: '',
    rptPurchases: '',
    rptLoansGiven: '',
    rptLoansReceived: '',
    guarantees: '',
    closingReceivables: '',
    closingPayables: '',
    closingLoans: '',
    latestFinancialYearTotal: '',
    rptRevenuePercent: null,
    rptPurchasesPercent: null,
    rptReceivablesPercent: null,
    rptPayablesPercent: null,
    financialsRevenueDifference: null,
    financialsPurchasesDifference: null,
  },
  ownershipChainSummary: [],
};

const workspaceFixture = {
  id: 'gr-ws-1',
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
  entityCount: 0,
  subsidiaryCount: 0,
  stepDownSubsidiaryCount: 0,
  associateCount: 0,
  jvCount: 0,
  promoterGroupEntityCount: 0,
  icdrGroupCompanyCount: 0,
  icdrPendingBoardCount: 0,
  relatedPartyCount: 0,
  historicalRelatedPartyCount: 0,
  latestFinancialYearRptTotal: '',
  rptRevenuePercent: null,
  rptPurchasesPercent: null,
  relatedPartyReceivables: '',
  relatedPartyPayables: '',
  relatedPartyLoans: '',
  guaranteesCommitments: '',
  commonPursuitEntityCount: 0,
  materialDependencyCount: 0,
  potentialConflictItems: 0,
  groupCompaniesWithCompleteFinancialInfo: 0,
  negativeNetWorthCount: 0,
  auditorQualifiedCount: 0,
  ibcConcernCount: 0,
  pendingEntityInformationCount: 0,
  rptFinancialsReconciliationStatus: '',
  materialityPolicyStatus: '',
  assessmentConcerns: 0,
  professionalReviewItems: 0,
  assessmentResult: 'insufficient_information' as const,
  assessmentResultLabel: 'Disclosure readiness in progress',
  assessmentSummary: 'Summary',
  recommendedNextActions: [],
  latestFinancialPeriod: null,
  currency: 'INR',
  amountUnit: 'lakhs',
  lastUpdatedAt: null,
};

const assessmentFixture = {
  result: 'insufficient_information' as const,
  resultLabel: 'Disclosure readiness in progress',
  summary: 'Summary',
  criteria: [],
  groups: [],
  counts: {
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    unresolvedRelationship: 0,
    classificationReviewRequired: 0,
    financialReconciliationPending: 0,
    pendingEntityInformation: 0,
    pendingLinkedWorkstream: 0,
    pendingBoardDetermination: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    entityCount: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    rptTransactionCount: 0,
    pendingBoardDeterminations: 0,
    potentialConcerns: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'group-structure-and-entity-master',
  savedSection: emptyPayload.groupStructureAndEntityMaster,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Group Entities & Related Parties information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Group Structure saved',
    message: 'Saved',
    workstreamSlug: 'group-entities-related-parties',
    sectionId: 'group-structure-and-entity-master',
    targetRoute:
      '/projects/demo/workstreams/group-entities-related-parties?tab=information&section=group-structure-and-entity-master',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationState.replace, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/group-entities-related-parties',
  useSearchParams: () => navigationState.getSearchParams(),
}));

vi.mock('@/lib/api/group-entities-related-parties', () => ({
  initializeGroupEntitiesWorkspace: vi.fn(async () => workspaceFixture),
  fetchGroupEntitiesOverviewSummary: vi.fn(async () => overviewFixture),
  fetchGroupEntitiesAssessment: vi.fn(async () => assessmentFixture),
  saveGroupEntitiesSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 9,
  slug: 'group-entities-related-parties',
  title: 'Group Entities & Related Parties',
  description: 'Group structure, subsidiaries, associates, and related party relationships.',
  phaseId: 'due-diligence',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Group Entities & Related Parties information sections/i,
  });
}

async function renderLoaded() {
  render(<GroupEntitiesRelatedPartiesWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Group Entities & Related Parties/i)).toBeNull();
  });
}

describe('Group Entities & Related Parties workstream UI (GR2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    navigationState.reset();
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Group & RPT Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(
      within(nav).getByRole('button', { name: /Group Structure & Entity Master/i }),
    ).toBeTruthy();
    expect(within(nav).getAllByRole('button').length).toBe(8);
  });

  it('renders Overview and Group & RPT Assessment after load', async () => {
    const { rerender } = render(
      <GroupEntitiesRelatedPartiesWorkstream workstream={workstream} initialTab="overview" />,
    );
    await waitFor(() => {
      expect(screen.queryByText(/Loading Group Entities & Related Parties/i)).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText(/Sections completed/i)).toBeTruthy();
    });

    rerender(
      <GroupEntitiesRelatedPartiesWorkstream
        workstream={workstream}
        initialTab="group-rpt-assessment"
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/healthy\/unhealthy group, compliant\/non-compliant/i),
      ).toBeTruthy();
    });
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveGroupEntitiesSection } = await import('@/lib/api/group-entities-related-parties');
    await renderLoaded();

    const asOfDate = screen.getByLabelText(/Structure as of date/i);
    await user.type(asOfDate, '2026-01-01');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveGroupEntitiesSection).toHaveBeenCalled();
    });
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const asOfDate = screen.getByLabelText(/Structure as of date/i);
    await user.type(asOfDate, 'Draft only');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((asOfDate as HTMLInputElement).value).toBe('');
  });

  it('prompts before leaving a dirty section', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderLoaded();

    await user.type(screen.getByLabelText(/Structure as of date/i), '2026-01-01');
    await user.click(
      within(sectionNav()).getByRole('button', {
        name: /Ownership, Control & Relationship Mapping/i,
      }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
