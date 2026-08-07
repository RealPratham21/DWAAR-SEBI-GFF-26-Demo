import type { BacAssessmentResponse } from '@/lib/borrowings-assets-contracts/assessment';
import type { BorrowingsAssetsContractsOverviewSummary } from '@/lib/borrowings-assets-contracts/overview';
import type {
  BorrowingsAssetsContractsProgress,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/borrowings-assets-contracts/types';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export type { BorrowingsAssetsContractsSectionId };

export type WorkspaceProgress = BorrowingsAssetsContractsProgress;

export type FacilityCurrencyTotalsResponse = {
  currency: string;
  amountUnit: string;
  facilityCount: number;
  totalSanctioned: string;
  totalDisbursed: string;
  totalPrincipalOutstanding: string;
  totalAccruedInterest: string;
  totalOutstanding: string;
  totalUndrawn: string;
  securedDebt: string;
  unsecuredDebt: string;
  fundBasedExposure: string;
  nonFundBasedExposure: string;
  relatedPartyBorrowings: string;
};

export type ConsentCountsResponse = {
  facilitiesReviewed: number;
  consentRequired: number;
  consentRequested: number;
  consentReceived: number;
  consentPending: number;
};

export type ComputationsResponse = {
  facilityCount: number;
  primaryCurrency: string | null;
  primaryAmountUnit: string | null;
  positionAsOfDate: string;
  currencyTotals: FacilityCurrencyTotalsResponse[];
  interestVarianceCount: number;
  consentCounts: ConsentCountsResponse;
  chargeCount: number;
  chargesRegistered: number;
  chargesPendingRegistration: number;
  personalGuaranteeCount: number;
  corporateGuaranteeCount: number;
  financialCovenantCount: number;
  covenantsRequiringReview: number;
  recordedBreaches: number;
  waiversPending: number;
  propertyCount: number;
  ownedPropertyCount: number;
  leasedPropertyCount: number;
  propertyLeasesExpiringWithin12Months: number;
  contractCount: number;
  contractsExpiringWithin12Months: number;
  contractsWithChangeOfControlClauses: number;
  materialAssetCount: number;
  encumberedMaterialAssetCount: number;
  titleOccupancyReviewItems: number;
  materialContractReviewItems: number;
  debtProposedForIpoRepayment: string;
};

export type BorrowingsAssetsContractsWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: BorrowingsAssetsContractsPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeBorrowingsAssetsContractsWorkspaceResponse =
  BorrowingsAssetsContractsWorkspaceResponse & {
    created: boolean;
  };

export type BorrowingsAssetsContractsSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: BorrowingsAssetsContractsSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: BorrowingsAssetsContractsPayload;
  computations: ComputationsResponse;
  acknowledgement: { message: string; savedAt: string };
  notification: {
    id: string;
    notificationType: string;
    title: string;
    message: string;
    workstreamSlug: string;
    sectionId: string | null;
    targetRoute: string;
    readAt: string | null;
    createdAt: string;
  };
};

export type BorrowingsAssetsContractsOverviewSummaryResponse =
  BorrowingsAssetsContractsOverviewSummary & {
    lastUpdatedAt: string | null;
  };

export type DashboardBorrowingsAssetsContractsProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};

export type { BacAssessmentResponse };
