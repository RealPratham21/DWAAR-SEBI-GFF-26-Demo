/**
 * Cross-record reference integrity for Borrowings, Assets & Contracts.
 */

import { formatFacilityLabel, getFacilityById } from '@/lib/borrowings-assets-contracts/facilities';
import {
  formatAssetLabel,
  formatContractLabel,
  formatPropertyLabel,
  getAssetById,
  getContractById,
  getPropertyById,
} from '@/lib/borrowings-assets-contracts/masters';
import { BAC_SECTION_LABELS } from '@/lib/borrowings-assets-contracts/options';
import type { BacDependency, BacDependencyCategory } from '@/lib/borrowings-assets-contracts/types';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

function push(
  deps: BacDependency[],
  category: BacDependencyCategory,
  recordId: string,
  sectionId: BorrowingsAssetsContractsSectionId,
  label: string,
) {
  deps.push({ category, recordId, sectionId, label });
}

export function countFacilityReferences(
  payload: BorrowingsAssetsContractsPayload,
  facilityId: string,
): BacDependency[] {
  if (!facilityId) return [];
  const deps: BacDependency[] = [];

  const securitySection = payload.securityChargesGuaranteesAndBorrowingPowers;
  for (const security of securitySection.securities) {
    if (security.linkedFacilityId === facilityId) {
      push(
        deps,
        'security',
        security.id,
        'security-charges-guarantees-and-borrowing-powers',
        'Security → Facility',
      );
    }
  }

  for (const charge of securitySection.charges) {
    if (charge.linkedFacilityId === facilityId) {
      push(
        deps,
        'charge',
        charge.id,
        'security-charges-guarantees-and-borrowing-powers',
        'Charge → Facility',
      );
    }
  }

  for (const guarantee of securitySection.guarantees) {
    if (guarantee.linkedFacilityId === facilityId) {
      push(
        deps,
        'guarantee',
        guarantee.id,
        'security-charges-guarantees-and-borrowing-powers',
        'Guarantee → Facility',
      );
    }
  }

  const covenantSection = payload.covenantsDefaultsWaiversAndLenderConsents;
  for (const covenant of covenantSection.covenants) {
    if (covenant.linkedFacilityId === facilityId) {
      push(
        deps,
        'covenant',
        covenant.id,
        'covenants-defaults-waivers-and-lender-consents',
        'Covenant → Facility',
      );
    }
  }

  for (const consent of covenantSection.lenderConsents) {
    if (consent.linkedFacilityId === facilityId) {
      push(
        deps,
        'consent',
        consent.id,
        'covenants-defaults-waivers-and-lender-consents',
        'Lender consent → Facility',
      );
    }
  }

  for (const event of covenantSection.defaultEvents) {
    if (event.linkedFacilityId === facilityId) {
      push(
        deps,
        'default',
        event.id,
        'covenants-defaults-waivers-and-lender-consents',
        'Default event → Facility',
      );
    }
  }

  for (const event of covenantSection.restructuringEvents) {
    if (event.linkedFacilityId === facilityId) {
      push(
        deps,
        'restructuring',
        event.id,
        'covenants-defaults-waivers-and-lender-consents',
        'Restructuring event → Facility',
      );
    }
  }

  for (const crossDefault of covenantSection.crossDefaults) {
    if (
      crossDefault.linkedFacilityId === facilityId ||
      crossDefault.linkedFacilityIds.includes(facilityId)
    ) {
      push(
        deps,
        'cross-default',
        crossDefault.id,
        'covenants-defaults-waivers-and-lender-consents',
        'Cross-default → Facility',
      );
    }
  }

  for (const asset of payload.materialAssetsEncumbranceAndInsuranceLinkage.assets) {
    if (asset.linkedFacilityId === facilityId) {
      push(
        deps,
        'security',
        asset.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'Asset → Facility',
      );
    }
  }

  for (const repayment of payload.reconciliationChangesAndIssuerConfirmations
    .objectsOfIssueRepayments) {
    if (repayment.linkedFacilityId === facilityId) {
      push(
        deps,
        'objects-repayment',
        repayment.id,
        'reconciliation-changes-and-issuer-confirmations',
        'Objects repayment → Facility',
      );
    }
  }

  for (const change of payload.reconciliationChangesAndIssuerConfirmations.changes) {
    if (change.relatedRecordType === 'facility' && change.relatedRecordId === facilityId) {
      push(
        deps,
        'change',
        change.id,
        'reconciliation-changes-and-issuer-confirmations',
        'Change register → Facility',
      );
    }
  }

  return deps;
}

export function countPropertyReferences(
  payload: BorrowingsAssetsContractsPayload,
  propertyId: string,
): BacDependency[] {
  if (!propertyId) return [];
  const deps: BacDependency[] = [];

  for (const security of payload.securityChargesGuaranteesAndBorrowingPowers.securities) {
    if (security.linkedPropertyId === propertyId) {
      push(
        deps,
        'security',
        security.id,
        'security-charges-guarantees-and-borrowing-powers',
        'Security → Property',
      );
    }
  }

  for (const issue of payload.immovablePropertiesAndOccupancyRights.propertyIssues) {
    if (issue.linkedPropertyId === propertyId) {
      push(
        deps,
        'property-issue',
        issue.id,
        'immovable-properties-and-occupancy-rights',
        'Property issue → Property',
      );
    }
  }

  for (const asset of payload.materialAssetsEncumbranceAndInsuranceLinkage.assets) {
    if (asset.linkedPropertyId === propertyId) {
      push(
        deps,
        'security',
        asset.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'Asset → Property',
      );
    }
  }

  for (const insurance of payload.materialAssetsEncumbranceAndInsuranceLinkage.insuranceLinkages) {
    if (insurance.linkedPropertyId === propertyId) {
      push(
        deps,
        'insurance-linkage',
        insurance.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'Insurance linkage → Property',
      );
    }
  }

  for (const change of payload.reconciliationChangesAndIssuerConfirmations.changes) {
    if (change.relatedRecordType === 'property' && change.relatedRecordId === propertyId) {
      push(
        deps,
        'change',
        change.id,
        'reconciliation-changes-and-issuer-confirmations',
        'Change register → Property',
      );
    }
  }

  return deps;
}

export function countAssetReferences(
  payload: BorrowingsAssetsContractsPayload,
  assetId: string,
): BacDependency[] {
  if (!assetId) return [];
  const deps: BacDependency[] = [];

  for (const security of payload.securityChargesGuaranteesAndBorrowingPowers.securities) {
    if (security.linkedAssetId === assetId) {
      push(
        deps,
        'security',
        security.id,
        'security-charges-guarantees-and-borrowing-powers',
        'Security → Asset',
      );
    }
  }

  for (const reconciliation of payload.materialAssetsEncumbranceAndInsuranceLinkage
    .assetFinancialsReconciliations) {
    if (reconciliation.linkedAssetId === assetId) {
      push(
        deps,
        'asset-reconciliation',
        reconciliation.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'Financials reconciliation → Asset',
      );
    }
  }

  for (const insurance of payload.materialAssetsEncumbranceAndInsuranceLinkage.insuranceLinkages) {
    if (insurance.linkedAssetId === assetId) {
      push(
        deps,
        'insurance-linkage',
        insurance.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'Insurance linkage → Asset',
      );
    }
  }

  for (const change of payload.reconciliationChangesAndIssuerConfirmations.changes) {
    if (change.relatedRecordType === 'asset' && change.relatedRecordId === assetId) {
      push(
        deps,
        'change',
        change.id,
        'reconciliation-changes-and-issuer-confirmations',
        'Change register → Asset',
      );
    }
  }

  return deps;
}

export function countContractReferences(
  payload: BorrowingsAssetsContractsPayload,
  contractId: string,
): BacDependency[] {
  if (!contractId) return [];
  const deps: BacDependency[] = [];

  const section7 = payload.contractMaterialityExpiryAndInspectionReadiness;

  for (const record of section7.materialityRecords) {
    if (record.linkedContractId === contractId) {
      push(
        deps,
        'materiality',
        record.id,
        'contract-materiality-expiry-and-inspection-readiness',
        'Materiality review → Contract',
      );
    }
  }

  for (const record of section7.nonOrdinaryCourseReviews) {
    if (record.linkedContractId === contractId) {
      push(
        deps,
        'non-ordinary-course-review',
        record.id,
        'contract-materiality-expiry-and-inspection-readiness',
        'Non-ordinary-course review → Contract',
      );
    }
  }

  for (const record of section7.breachDisputeReadiness) {
    if (record.linkedContractId === contractId) {
      push(
        deps,
        'breach-dispute',
        record.id,
        'contract-materiality-expiry-and-inspection-readiness',
        'Breach/dispute readiness → Contract',
      );
    }
  }

  for (const record of section7.inspectionCandidates) {
    if (record.linkedContractId === contractId) {
      push(
        deps,
        'inspection-candidate',
        record.id,
        'contract-materiality-expiry-and-inspection-readiness',
        'Inspection candidate → Contract',
      );
    }
  }

  for (const dependency of payload.materialAssetsEncumbranceAndInsuranceLinkage
    .ipContractualDependencies) {
    if (dependency.linkedContractId === contractId) {
      push(
        deps,
        'ip-dependency',
        dependency.id,
        'material-assets-encumbrance-and-insurance-linkage',
        'IP dependency → Contract',
      );
    }
  }

  for (const change of payload.reconciliationChangesAndIssuerConfirmations.changes) {
    if (change.relatedRecordType === 'contract' && change.relatedRecordId === contractId) {
      push(
        deps,
        'change',
        change.id,
        'reconciliation-changes-and-issuer-confirmations',
        'Change register → Contract',
      );
    }
  }

  return deps;
}

export function formatFacilityDependencyMessage(
  payload: BorrowingsAssetsContractsPayload,
  facilityId: string,
  deps: BacDependency[],
): string {
  if (deps.length === 0) return '';
  const facility = getFacilityById(payload, facilityId);
  const label = formatFacilityLabel(facility, facilityId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => BAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatPropertyDependencyMessage(
  payload: BorrowingsAssetsContractsPayload,
  propertyId: string,
  deps: BacDependency[],
): string {
  if (deps.length === 0) return '';
  const property = getPropertyById(payload, propertyId);
  const label = formatPropertyLabel(property, propertyId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => BAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatAssetDependencyMessage(
  payload: BorrowingsAssetsContractsPayload,
  assetId: string,
  deps: BacDependency[],
): string {
  if (deps.length === 0) return '';
  const asset = getAssetById(payload, assetId);
  const label = formatAssetLabel(asset, assetId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => BAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatContractDependencyMessage(
  payload: BorrowingsAssetsContractsPayload,
  contractId: string,
  deps: BacDependency[],
): string {
  if (deps.length === 0) return '';
  const contract = getContractById(payload, contractId);
  const label = formatContractLabel(contract, contractId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => BAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}
