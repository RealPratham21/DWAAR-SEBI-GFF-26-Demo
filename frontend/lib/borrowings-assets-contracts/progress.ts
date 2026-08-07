/**
 * Section completion for Borrowings, Assets & Contracts.
 */

import { isFilledDecimal } from '@/lib/borrowings-assets-contracts/decimal';
import { BAC_CONFIRMATION_FIELDS } from '@/lib/borrowings-assets-contracts/options';
import type {
  BorrowingsAssetsContractsProgress,
  BorrowingsAssetsContractsSectionId,
  SectionStatus,
} from '@/lib/borrowings-assets-contracts/types';
import type { BorrowingsAssetsContractsPayload } from '@/lib/schemas/borrowings-assets-contracts';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateFacilityMasterStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const section = payload.financialIndebtednessAndFacilityMaster;
  const snapshot = section.borrowingSnapshot;
  const core = [
    filled(snapshot.positionAsOfDate),
    filled(snapshot.reportingCurrency),
    filled(snapshot.currentBorrowingsExist),
    section.facilities.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const facilitiesComplete = section.facilities.every(
    (facility) =>
      filled(facility.lender.lenderName) &&
      filled(facility.facilityType) &&
      (filled(facility.sanctionAndUtilisation.currentSanctionedLimit) ||
        isFilledDecimal(facility.sanctionAndUtilisation.principalOutstanding)),
  );
  return statusFrom(answered, core.length, facilitiesComplete);
}

export function evaluateSecurityChargesStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const section = payload.securityChargesGuaranteesAndBorrowingPowers;
  const hasData =
    section.securities.length > 0 ||
    section.charges.length > 0 ||
    section.guarantees.length > 0 ||
    filled(section.borrowingPowers.boardBorrowingResolutionExists);
  if (!hasData) return 'not_started';

  const securitiesComplete = section.securities.every(
    (security) => filled(security.linkedFacilityId) && filled(security.securityType),
  );
  const chargesComplete = section.charges.every(
    (charge) => filled(charge.linkedFacilityId) && filled(charge.status),
  );
  return securitiesComplete && chargesComplete ? 'complete' : 'in_progress';
}

export function evaluateCovenantsConsentsStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const section = payload.covenantsDefaultsWaiversAndLenderConsents;
  const hasData =
    section.covenants.length > 0 ||
    section.lenderConsents.length > 0 ||
    section.defaultEvents.length > 0;
  if (!hasData) return 'not_started';

  const covenantsComplete = section.covenants.every(
    (covenant) => filled(covenant.linkedFacilityId) && filled(covenant.covenantType),
  );
  const consentsComplete = section.lenderConsents.every(
    (consent) => filled(consent.linkedFacilityId) && filled(consent.ipoConsentRequirement),
  );
  return covenantsComplete && consentsComplete ? 'complete' : 'in_progress';
}

export function evaluatePropertiesStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const section = payload.immovablePropertiesAndOccupancyRights;
  if (section.properties.length === 0) return 'not_started';
  const complete = section.properties.every(
    (property) =>
      filled(property.identity.propertyName) || filled(property.identity.address),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateAssetsStatus(payload: BorrowingsAssetsContractsPayload): SectionStatus {
  const section = payload.materialAssetsEncumbranceAndInsuranceLinkage;
  const hasData =
    section.assets.length > 0 ||
    section.insuranceLinkages.length > 0 ||
    section.ipContractualDependencies.length > 0;
  if (!hasData) return 'not_started';
  const complete = section.assets.every(
    (asset) => filled(asset.description) || filled(asset.assetClass),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateContractsStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const contracts = payload.materialBusinessStrategicAndOtherContracts.contracts;
  if (contracts.length === 0) return 'not_started';
  const complete = contracts.every(
    (contract) =>
      filled(contract.basicTerms.agreementTitle) || filled(contract.parties.counterparty),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateMaterialityInspectionStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const section = payload.contractMaterialityExpiryAndInspectionReadiness;
  const hasData =
    section.materialityRecords.length > 0 ||
    section.nonOrdinaryCourseReviews.length > 0 ||
    section.breachDisputeReadiness.length > 0 ||
    section.inspectionCandidates.length > 0;
  if (!hasData) return 'not_started';
  const complete = section.materialityRecords.every(
    (record) => filled(record.linkedContractId) && filled(record.materialityStatus),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateReconciliationConfirmationsStatus(
  payload: BorrowingsAssetsContractsPayload,
): SectionStatus {
  const confirmations = payload.reconciliationChangesAndIssuerConfirmations.confirmations;
  const answered = BAC_CONFIRMATION_FIELDS.filter((field) => confirmations[field.key] !== '').length;
  if (answered === 0) return 'not_started';
  if (answered < BAC_CONFIRMATION_FIELDS.length) return 'in_progress';
  return 'complete';
}

const SECTION_EVALUATORS: Record<
  BorrowingsAssetsContractsSectionId,
  (payload: BorrowingsAssetsContractsPayload) => SectionStatus
> = {
  'financial-indebtedness-and-facility-master': evaluateFacilityMasterStatus,
  'security-charges-guarantees-and-borrowing-powers': evaluateSecurityChargesStatus,
  'covenants-defaults-waivers-and-lender-consents': evaluateCovenantsConsentsStatus,
  'immovable-properties-and-occupancy-rights': evaluatePropertiesStatus,
  'material-assets-encumbrance-and-insurance-linkage': evaluateAssetsStatus,
  'material-business-strategic-and-other-contracts': evaluateContractsStatus,
  'contract-materiality-expiry-and-inspection-readiness': evaluateMaterialityInspectionStatus,
  'reconciliation-changes-and-issuer-confirmations': evaluateReconciliationConfirmationsStatus,
};

export function calculateBorrowingsAssetsContractsProgress(
  payload: BorrowingsAssetsContractsPayload,
): BorrowingsAssetsContractsProgress {
  const sections = Object.fromEntries(
    (Object.keys(SECTION_EVALUATORS) as BorrowingsAssetsContractsSectionId[]).map((sectionId) => [
      sectionId,
      SECTION_EVALUATORS[sectionId](payload),
    ]),
  ) as BorrowingsAssetsContractsProgress['sections'];

  const sectionsComplete = Object.values(sections).filter((status) => status === 'complete').length;
  const overallStatus: SectionStatus =
    sectionsComplete === 0
      ? 'not_started'
      : sectionsComplete === Object.keys(sections).length
        ? 'complete'
        : 'in_progress';

  return {
    sections,
    sectionsComplete,
    totalSections: Object.keys(sections).length,
    overallStatus,
  };
}
