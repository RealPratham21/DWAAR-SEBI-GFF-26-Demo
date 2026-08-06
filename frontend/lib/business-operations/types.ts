/**
 * Shared Business & Operations types.
 *
 * Persisted shapes live in `@/lib/schemas/business-operations` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references) and are never persisted.
 */

import type {
  BusinessOperationsPayload,
  BusinessOperationsSectionId,
} from '@/lib/schemas/business-operations';

export type {
  BusinessOperationsPayload,
  BusinessOperationsSectionId,
  BusinessProfileAndOperatingModel,
  BusinessUnit,
  ProductsServicesAndRevenueMix,
  ProductService,
  RevenueMixRow,
  OfferingChange,
  CustomersSalesDistributionAndGeography,
  CustomerConcentrationPeriod,
  MaterialCustomer,
  SalesChannel,
  GeographicRevenue,
  SuppliersProcurementInventoryAndLogistics,
  KeyInput,
  SupplierConcentrationPeriod,
  MaterialSupplier,
  FacilitiesCapacityAndOperationalProcess,
  Facility,
  CapacityRecord,
  PlannedCapacity,
  OperatingProcessStep,
  TechnologyQualityResearchAndIntellectualProperty,
  MachineryEquipment,
  QualityCertification,
  RdSpendRow,
  IntellectualPropertyRecord,
  WorkforceCollaborationsInsuranceAndContinuity,
  WorkforcePeriod,
  Collaboration,
  OperatingDependency,
  InsurancePolicy,
  CompetitiveStrengthsStrategyDependenciesAndConfirmations,
  CompetitiveStrength,
  StrategyItem,
  KeyDependency,
  BusinessOperationsConfirmations,
  BusinessClassification,
  CustomerModel,
  RevenueModel,
  OrderModel,
  ProductType,
  FacilityType,
  IpType,
  FigureSource,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/business-operations';

export type { BusinessOperationsTabId } from '@/lib/business-operations/options';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type BusinessOperationsProgress = {
  sections: Record<BusinessOperationsSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyLegalReference = {
  available: boolean;
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
};

export type LinkedWorkstreamPlaceholder = {
  available: false;
};

/**
 * Read-only mirrors of other workstreams.
 *
 * Company identity may be populated from Company & Incorporation. Financials, Industry,
 * Objects of the Issue, Assets and Compliance remain unavailable placeholders until those
 * workstreams publish a stable reference contract. Business & Operations never writes back.
 */
export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  financials: LinkedWorkstreamPlaceholder;
  industry: LinkedWorkstreamPlaceholder;
  objectsOfTheIssue: LinkedWorkstreamPlaceholder;
  assets: LinkedWorkstreamPlaceholder;
  compliance: LinkedWorkstreamPlaceholder;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: {
      available: false,
      legalName: null,
      companyClass: null,
      cin: null,
    },
    financials: { available: false },
    industry: { available: false },
    objectsOfTheIssue: { available: false },
    assets: { available: false },
    compliance: { available: false },
  };
}

/** Convenience alias used by hooks and page components. */
export type BusinessOperationsPayloadDraft = BusinessOperationsPayload;
