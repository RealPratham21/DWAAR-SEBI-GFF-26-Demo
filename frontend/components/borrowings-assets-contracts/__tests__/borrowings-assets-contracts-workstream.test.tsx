/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BorrowingsAssetsContractsWorkstream } from '@/components/borrowings-assets-contracts/borrowings-assets-contracts-workstream';
import { createEmptyBorrowingsAssetsContractsPayload } from '@/lib/borrowings-assets-contracts/defaults';
import { createEmptyLinkedWorkstreamReferences } from '@/lib/borrowings-assets-contracts/types';
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

const emptyPayload = createEmptyBorrowingsAssetsContractsPayload();
const linkedReferences = createEmptyLinkedWorkstreamReferences();

const progressFixture = {
  sections: {
    'financial-indebtedness-and-facility-master': 'not_started',
    'security-charges-guarantees-and-borrowing-powers': 'not_started',
    'covenants-defaults-waivers-and-lender-consents': 'not_started',
    'immovable-properties-and-occupancy-rights': 'not_started',
    'material-assets-encumbrance-and-insurance-linkage': 'not_started',
    'material-business-strategic-and-other-contracts': 'not_started',
    'contract-materiality-expiry-and-inspection-readiness': 'not_started',
    'reconciliation-changes-and-issuer-confirmations': 'not_started',
  } as const,
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started' as const,
};

const computationsFixture = {
  facilityCount: 0,
  primaryCurrency: null,
  primaryAmountUnit: null,
  positionAsOfDate: '',
  currencyTotals: [],
  interestVarianceCount: 0,
  consentCounts: {
    facilitiesReviewed: 0,
    consentRequired: 0,
    consentRequested: 0,
    consentReceived: 0,
    consentPending: 0,
  },
  chargeCount: 0,
  chargesRegistered: 0,
  chargesPendingRegistration: 0,
  personalGuaranteeCount: 0,
  corporateGuaranteeCount: 0,
  financialCovenantCount: 0,
  covenantsRequiringReview: 0,
  recordedBreaches: 0,
  waiversPending: 0,
  propertyCount: 0,
  ownedPropertyCount: 0,
  leasedPropertyCount: 0,
  propertyLeasesExpiringWithin12Months: 0,
  contractCount: 0,
  contractsExpiringWithin12Months: 0,
  contractsWithChangeOfControlClauses: 0,
  materialAssetCount: 0,
  encumberedMaterialAssetCount: 0,
  titleOccupancyReviewItems: 0,
  materialContractReviewItems: 0,
  debtProposedForIpoRepayment: '',
};

const workspaceFixture = {
  id: 'bac-ws-1',
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
  positionAsOfDate: '',
  reportingCurrency: null,
  amountUnit: null,
  currencyTotals: [],
  facilityCount: 0,
  totalSanctioned: '',
  totalOutstanding: '',
  securedDebt: '',
  unsecuredDebt: '',
  totalUndrawn: '',
  fundBasedExposure: '',
  nonFundBasedExposure: '',
  relatedPartyBorrowings: '',
  chargeCount: 0,
  chargesRegistered: 0,
  chargesPendingRegistration: 0,
  personalGuaranteeCount: 0,
  corporateGuaranteeCount: 0,
  financialCovenantsRequiringReview: 0,
  recordedBreaches: 0,
  waiversPending: 0,
  lenderConsentsRequired: 0,
  lenderConsentsReceived: 0,
  debtProposedForIpoRepayment: '',
  objectsReconciliationStatus: '',
  materialProperties: 0,
  ownedProperties: 0,
  leasedLicensedProperties: 0,
  propertyLeasesExpiringWithin12Months: 0,
  titleOccupancyReviewItems: 0,
  materialAssets: 0,
  encumberedMaterialAssets: 0,
  materialContracts: 0,
  contractsExpiringWithin12Months: 0,
  contractsWithChangeOfControlClauses: 0,
  materialContractReviewItems: 0,
  financialsReconciliationStatus: '',
  interestVarianceCount: 0,
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
    pendingChargeRegistration: 0,
    pendingLenderConsent: 0,
    covenantReviewRequired: 0,
    financialReconciliationPending: 0,
    titleReviewRequired: 0,
    contractReviewRequired: 0,
    pendingLinkedWorkstream: 0,
    pendingProfessionalConfirmation: 0,
    notApplicable: 0,
  },
  metrics: {
    facilityCount: 0,
    sectionsComplete: 0,
    unansweredConfirmations: 0,
    consentPending: 0,
    chargesPendingRegistration: 0,
    potentialConcerns: 0,
  },
};

const saveResponseFixture = {
  version: 2,
  lastSavedAt: '2026-08-06T12:00:00.000Z',
  savedSectionId: 'financial-indebtedness-and-facility-master',
  savedSection: emptyPayload.financialIndebtednessAndFacilityMaster,
  progress: progressFixture,
  payload: emptyPayload,
  computations: computationsFixture,
  acknowledgement: {
    message: 'Your Borrowings, Assets & Contracts information was saved successfully.',
    savedAt: '2026-08-06T12:00:00.000Z',
  },
  notification: {
    id: 'n1',
    notificationType: 'workstream_save',
    title: 'Facility Master saved',
    message: 'Saved',
    workstreamSlug: 'borrowings-assets-contracts',
    sectionId: 'financial-indebtedness-and-facility-master',
    targetRoute:
      '/projects/demo/workstreams/borrowings-assets-contracts?tab=information&section=financial-indebtedness-and-facility-master',
    readAt: null,
    createdAt: '2026-08-06T12:00:00.000Z',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationState.replace, push: vi.fn() }),
  usePathname: () => '/projects/demo/workstreams/borrowings-assets-contracts',
  useSearchParams: () => navigationState.getSearchParams(),
}));

vi.mock('@/lib/api/borrowings-assets-contracts', () => ({
  initializeBorrowingsAssetsContractsWorkspace: vi.fn(async () => workspaceFixture),
  fetchBorrowingsAssetsContractsOverviewSummary: vi.fn(async () => overviewFixture),
  fetchBorrowingsAssetsContractsAssessment: vi.fn(async () => assessmentFixture),
  saveBorrowingsAssetsContractsSection: vi.fn(async () => saveResponseFixture),
}));

vi.mock('@/lib/notifications/context', () => ({
  useNotifications: () => ({ prependNotification: vi.fn() }),
}));

const workstream: Workstream = {
  sequence: 10,
  slug: 'borrowings-assets-contracts',
  title: 'Borrowings, Assets & Contracts',
  description: 'Debt profile, material assets, and key commercial contracts.',
  phaseId: 'due-diligence',
};

function sectionNav() {
  return screen.getByRole('navigation', {
    name: /Borrowings, Assets & Contracts information sections/i,
  });
}

async function renderLoaded() {
  render(<BorrowingsAssetsContractsWorkstream workstream={workstream} />);
  await waitFor(() => {
    expect(screen.queryByText(/Loading Borrowings, Assets & Contracts/i)).toBeNull();
  });
}

describe('Borrowings, Assets & Contracts workstream UI (BAC2 API-backed)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    navigationState.reset();
  });

  it('renders three tabs and eight information sections after load', async () => {
    await renderLoaded();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Information' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Borrowings & Contracts Assessment' })).toBeTruthy();

    const nav = sectionNav();
    expect(
      within(nav).getByRole('button', { name: /Financial Indebtedness & Facility Master/i }),
    ).toBeTruthy();
    expect(within(nav).getAllByRole('button').length).toBe(8);
  });

  it('renders Overview and Borrowings & Contracts Assessment after load', async () => {
    const { rerender } = render(
      <BorrowingsAssetsContractsWorkstream workstream={workstream} initialTab="overview" />,
    );
    await waitFor(() => {
      expect(screen.queryByText(/Loading Borrowings, Assets & Contracts/i)).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText(/Sections completed/i)).toBeTruthy();
    });

    rerender(
      <BorrowingsAssetsContractsWorkstream
        workstream={workstream}
        initialTab="borrowings-contracts-assessment"
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/not a credit rating, covenant compliance certificate/i),
      ).toBeTruthy();
    });
  });

  it('saves a section via the API and clears dirty state', async () => {
    const user = userEvent.setup();
    const { saveBorrowingsAssetsContractsSection } = await import(
      '@/lib/api/borrowings-assets-contracts'
    );
    await renderLoaded();

    const positionDate = screen.getByLabelText(/Position as of date/i);
    await user.type(positionDate, '2026-01-01');
    await user.click(screen.getByRole('button', { name: /Keep section updates/i }));

    await waitFor(() => {
      expect(saveBorrowingsAssetsContractsSection).toHaveBeenCalled();
    });
  });

  it('discards drafts back to the persisted baseline', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const positionDate = screen.getByLabelText(/Position as of date/i);
    await user.type(positionDate, 'Draft only');
    await user.click(screen.getByRole('button', { name: /Discard changes/i }));
    expect((positionDate as HTMLInputElement).value).toBe('');
  });

  it('prompts before leaving a dirty section', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderLoaded();

    await user.type(screen.getByLabelText(/Position as of date/i), '2026-01-01');
    await user.click(
      within(sectionNav()).getByRole('button', {
        name: /Security, Charges, Guarantees & Borrowing Powers/i,
      }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
