/**
 * Overview summary derived from the in-memory Borrowings, Assets & Contracts draft (BAC1).
 */

import {
  assessBorrowingsAssetsContracts,
  type BacAssessmentResponse,
} from '@/lib/borrowings-assets-contracts/assessment';
import {
  computeBorrowingsAssetsContractsModel,
  type BorrowingsAssetsContractsModel,
  type FacilityCurrencyTotals,
} from '@/lib/borrowings-assets-contracts/compute';
import { BAC_SECTION_LABELS } from '@/lib/borrowings-assets-contracts/options';
import { calculateBorrowingsAssetsContractsProgress } from '@/lib/borrowings-assets-contracts/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type BorrowingsAssetsContractsProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/borrowings-assets-contracts/types';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export type BorrowingsAssetsContractsOverviewSummary = {
  sectionStatuses: BorrowingsAssetsContractsProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: BorrowingsAssetsContractsProgress['overallStatus'];
  positionAsOfDate: string;
  reportingCurrency: string | null;
  amountUnit: string | null;
  currencyTotals: FacilityCurrencyTotals[];
  facilityCount: number;
  totalSanctioned: string;
  totalOutstanding: string;
  securedDebt: string;
  unsecuredDebt: string;
  totalUndrawn: string;
  fundBasedExposure: string;
  nonFundBasedExposure: string;
  relatedPartyBorrowings: string;
  chargeCount: number;
  chargesRegistered: number;
  chargesPendingRegistration: number;
  personalGuaranteeCount: number;
  corporateGuaranteeCount: number;
  financialCovenantsRequiringReview: number;
  recordedBreaches: number;
  waiversPending: number;
  lenderConsentsRequired: number;
  lenderConsentsReceived: number;
  debtProposedForIpoRepayment: string;
  objectsReconciliationStatus: string;
  materialProperties: number;
  ownedProperties: number;
  leasedLicensedProperties: number;
  propertyLeasesExpiringWithin12Months: number;
  titleOccupancyReviewItems: number;
  materialAssets: number;
  encumberedMaterialAssets: number;
  materialContracts: number;
  contractsExpiringWithin12Months: number;
  contractsWithChangeOfControlClauses: number;
  materialContractReviewItems: number;
  financialsReconciliationStatus: string;
  interestVarianceCount: number;
  assessmentConcerns: number;
  pendingProfessionalReviewItems: number;
  assessmentResult: BacAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: BorrowingsAssetsContractsSectionId; label: string }>;
};

function primaryTotals(model: BorrowingsAssetsContractsModel): FacilityCurrencyTotals | undefined {
  return model.currencyTotals[0];
}

export function buildOverviewSummary(
  payload: BorrowingsAssetsContractsPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): BorrowingsAssetsContractsOverviewSummary {
  const progress = calculateBorrowingsAssetsContractsProgress(payload);
  const model = computeBorrowingsAssetsContractsModel(payload, linkedReferences);
  const assessment = assessBorrowingsAssetsContracts(payload, linkedReferences);
  const primary = primaryTotals(model);
  const snapshot = payload.financialIndebtednessAndFacilityMaster.borrowingSnapshot;

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [
        BorrowingsAssetsContractsSectionId,
        BorrowingsAssetsContractsProgress['sections'][BorrowingsAssetsContractsSectionId],
      ]
    >
  ).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${BAC_SECTION_LABELS[sectionId]}`,
  }));

  const assessmentConcerns =
    assessment.counts.potentialConcern +
    assessment.counts.pendingChargeRegistration +
    assessment.counts.covenantReviewRequired +
    assessment.counts.financialReconciliationPending +
    assessment.counts.titleReviewRequired +
    assessment.counts.contractReviewRequired;

  const pendingProfessionalReviewItems =
    assessment.counts.pendingProfessionalConfirmation + assessment.counts.pendingLenderConsent;

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    positionAsOfDate: model.positionAsOfDate,
    reportingCurrency: (model.primaryCurrency ?? snapshot.reportingCurrency.trim()) || null,
    amountUnit: (model.primaryAmountUnit ?? snapshot.displayUnit.trim()) || null,
    currencyTotals: model.currencyTotals,
    facilityCount: model.facilityCount,
    totalSanctioned: primary?.totalSanctioned ?? '',
    totalOutstanding: primary?.totalOutstanding ?? '',
    securedDebt: primary?.securedDebt ?? '',
    unsecuredDebt: primary?.unsecuredDebt ?? '',
    totalUndrawn: primary?.totalUndrawn ?? '',
    fundBasedExposure: primary?.fundBasedExposure ?? '',
    nonFundBasedExposure: primary?.nonFundBasedExposure ?? '',
    relatedPartyBorrowings: primary?.relatedPartyBorrowings ?? '',
    chargeCount: model.chargeCount,
    chargesRegistered: model.chargesRegistered,
    chargesPendingRegistration: model.chargesPendingRegistration,
    personalGuaranteeCount: model.personalGuaranteeCount,
    corporateGuaranteeCount: model.corporateGuaranteeCount,
    financialCovenantsRequiringReview: model.covenantsRequiringReview,
    recordedBreaches: model.recordedBreaches,
    waiversPending: model.waiversPending,
    lenderConsentsRequired: model.consentCounts.consentRequired,
    lenderConsentsReceived: model.consentCounts.consentReceived,
    debtProposedForIpoRepayment: model.debtProposedForIpoRepayment,
    objectsReconciliationStatus: model.reconciliation.objects.status,
    materialProperties: model.propertyCount,
    ownedProperties: model.ownedPropertyCount,
    leasedLicensedProperties: model.leasedPropertyCount,
    propertyLeasesExpiringWithin12Months: model.propertyLeasesExpiringWithin12Months.length,
    titleOccupancyReviewItems: model.titleOccupancyReviewItems,
    materialAssets: model.materialAssetCount,
    encumberedMaterialAssets: model.encumberedMaterialAssetCount,
    materialContracts: model.contractCount,
    contractsExpiringWithin12Months: model.contractsExpiringWithin12Months.length,
    contractsWithChangeOfControlClauses: model.contractsWithChangeOfControlClauses,
    materialContractReviewItems: model.materialContractReviewItems,
    financialsReconciliationStatus: model.reconciliation.financials.status,
    interestVarianceCount: model.interestVarianceCount,
    assessmentConcerns,
    pendingProfessionalReviewItems,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
  };
}

export type { BorrowingsAssetsContractsModel };
