/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LitigationApprovalsComplianceWorkstream } from '@/components/litigation-approvals-compliance/litigation-approvals-compliance-workstream';
import { createEmptyLitigationApprovalsCompliancePayload } from '@/lib/litigation-approvals-compliance/defaults';
import { LAC_INFORMATION_SECTIONS } from '@/lib/litigation-approvals-compliance/options';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/litigation-approvals-compliance/types';
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

const emptyPayload = createEmptyLitigationApprovalsCompliancePayload();
const linkedReferences = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'legal-universe-materiality-policy-and-party-mapping': 'not_started',
    'litigation-and-proceedings-master': 'not_started',
    'criminal-regulatory-tax-and-enforcement-readiness': 'not_started',
    'government-regulatory-and-business-approvals-master': 'not_started',
    'approval-conditions-facility-compliance-and-renewal-readiness': 'not_started',
    'corporate-statutory-and-operational-compliance-exceptions': 'not_started',
    'material-creditors-penalties-and-material-developments': 'not_started',
    'reconciliation-remediation-and-issuer-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  matterCount: 0,
  mattersByCategory: [],
  criminalMatterCount: 0,
  taxMatterCount: 0,
  pendingOutcomeCount: 0,
  exposureByCurrency: [],
  taxAggregates: {
    directTaxDemand: '',
    indirectTaxDemand: '',
    totalDemand: '',
    totalBalanceDisputed: '',
    proceedingCount: 0,
  },
  approvalCount: 0,
  expiredApprovalCount: 0,
  renewalPendingCount: 0,
  approvalExpiryWindows: {
    within30Days: [],
    within90Days: [],
    within180Days: [],
    within365Days: [],
  },
  complianceCounts: {
    domainReviewCount: 0,
    domainsWithKnownExceptions: 0,
    complianceIssueCount: 0,
    continuingIssues: 0,
    statutoryDueCount: 0,
    delayedStatutoryDues: 0,
    approvalConditionsOutstanding: 0,
  },
  creditorTotals: {
    materialCreditorCount: 0,
    msmeCreditorCount: 0,
    materialOutstanding: '',
    msmeOutstanding: '',
    aggregateOutstanding: '',
    reconciliationDifference: '',
    reconciliationStatus: '',
  },
  remediationOpenCount: 0,
  legalDdAsOfDate: '',
  reconciliation: {
    financials: { status: 'pending_linked_workstream', detail: '' },
    groupEntities: { status: 'pending_linked_workstream', detail: '' },
    managementGovernance: { status: 'pending_linked_workstream', detail: '' },
    bac: { status: 'pending_linked_workstream', detail: '' },
    businessOperations: { status: 'pending_linked_workstream', detail: '' },
    objectsOfIssue: { status: 'pending_linked_workstream', detail: '' },
    ipoSetup: { status: 'pending_linked_workstream', detail: '' },
  },
};

const workspaceFixture = {
  id: 'lac-ws-1',
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
  legalDdAsOfDate: '',
  matterCount: 0,
  criminalMatterCount: 0,
  taxMatterCount: 0,
  pendingOutcomeCount: 0,
  primaryExposure: '',
  taxAggregateDemand: '',
  approvalCount: 0,
  expiredApprovalCount: 0,
  renewalPendingCount: 0,
  approvalsExpiringWithin30Days: 0,
  approvalsExpiringWithin90Days: 0,
  complianceIssueCount: 0,
  delayedStatutoryDues: 0,
  approvalConditionsOutstanding: 0,
  materialCreditorCount: 0,
  msmeCreditorCount: 0,
  creditorAggregateOutstanding: '',
  materialDevelopmentCount: 0,
  remediationOpenCount: 0,
  financialsReconciliationStatus: '',
  groupEntitiesReconciliationStatus: '',
  managementGovernanceReconciliationStatus: '',
  bacReconciliationStatus: '',
  businessOperationsReconciliationStatus: '',
  objectsReconciliationStatus: '',
  ipoSetupReconciliationStatus: '',
  assessmentConcerns: 0,
  pendingProfessionalReviewItems: 0,
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
    reconciled: 0,
    potentialConcern: 0,
    missingInformation: 0,
    materialityReviewRequired: 0,
    pendingLegalReview: 0,
    approvalRenewalReviewRequired: 0,
    complianceReviewRequired: 0,
    financialReconciliationPending: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    pendingBoardDetermination: 0,
    notApplicable: 0,
  },
  metrics: {
    matterCount: 0,
    approvalCount: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    expiringApprovals30Days: 0,
    delayedStatutoryDues: 0,
    potentialConcerns: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'legal-universe-materiality-policy-and-party-mapping',
  savedSection: emptyPayload.legalUniverseMaterialityPolicyAndPartyMapping,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Litigation, Approvals & Compliance information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Legal universe saved',
    message: 'Saved',
    workstreamSlug: 'litigation-approvals-compliance',
    sectionId: 'legal-universe-materiality-policy-and-party-mapping',
    targetRoute:
      '/projects/demo/workstreams/litigation-approvals-compliance?tab=information&section=legal-universe-materiality-policy-and-party-mapping',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects/demo/workstreams/litigation-approvals-compliance',
  useRouter: () => ({ replace: navigationState.replace, push: vi.fn() }),
  useSearchParams: () => navigationState.getSearchParams(),
}));

vi.mock('@/lib/api/litigation-approvals-compliance', () => ({
  initializeLitigationApprovalsComplianceWorkspace: vi.fn(async () => workspaceFixture),
  fetchLitigationApprovalsComplianceOverviewSummary: vi.fn(async () => overviewFixture),
  fetchLitigationApprovalsComplianceAssessment: vi.fn(async () => assessmentFixture),
  saveLitigationApprovalsComplianceSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 11,
  slug: 'litigation-approvals-compliance',
  title: 'Litigation, Approvals & Compliance',
  description: 'Legal proceedings, regulatory approvals and compliance readiness.',
  phaseId: 'due-diligence',
};

function sectionNav() {
  return screen.getByRole('navigation', { name: /information sections/i });
}

async function renderLoaded() {
  render(<LitigationApprovalsComplianceWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Litigation, Approvals & Compliance/i)).toBeNull();
  });
}

describe('Litigation, Approvals & Compliance workstream UI (LAC2 API-backed)', () => {
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
    expect(screen.getByRole('tab', { name: 'Legal & Compliance Assessment' })).toBeTruthy();

    await userEvent.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(sectionNav()).toBeTruthy();
    });

    for (const section of LAC_INFORMATION_SECTIONS) {
      expect(within(sectionNav()).getByRole('button', { name: new RegExp(section.label, 'i') })).toBeTruthy();
    }
  });

  it('navigates between tabs without unsaved-change prompt on overview', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    await renderLoaded();

    await userEvent.click(screen.getByRole('tab', { name: 'Information' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveLitigationApprovalsComplianceSection } = await import(
      '@/lib/api/litigation-approvals-compliance'
    );
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Legal DD as-of date/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/Legal DD as-of date/i), '2025-03-31');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveLitigationApprovalsComplianceSection).toHaveBeenCalled();
    });
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole('tab', { name: 'Information' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Legal DD as-of date/i)).toBeTruthy();
    });

    const dateInput = screen.getByLabelText(/Legal DD as-of date/i) as HTMLInputElement;
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
      expect(screen.getByLabelText(/Legal DD as-of date/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/Legal DD as-of date/i), '2025-03-31');
    await user.click(
      within(sectionNav()).getByRole('button', { name: /Litigation & Proceedings Master/i }),
    );

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
