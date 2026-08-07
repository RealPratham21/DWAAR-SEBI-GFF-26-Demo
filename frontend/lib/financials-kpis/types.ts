/**
 * Shared Financials & KPIs types.
 *
 * Persisted shapes live in `@/lib/schemas/financials-kpis` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references) and are never persisted.
 */

import type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';

export type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
  ReportingScopePeriodsAndAuditorReadiness,
  ReportingBasis,
  ReportingEntity,
  FinancialPeriod,
  AuditorReadiness,
  AuditorChangeRecord,
  RestatedStatementOfProfitAndLoss,
  PlLineValue,
  ExceptionalItem,
  PerShareByPeriod,
  AssetsLiabilitiesEquityAndCashFlows,
  BalanceSheetLineValue,
  CashFlowLineValue,
  ChangesInEquityLineValue,
  RestatementAdjustmentsPoliciesAndAuditorMatters,
  RestatementAdjustment,
  AccountingPolicy,
  AuditReportMatter,
  OtherFinancialInformation,
  SegmentRecord,
  RelatedPartyTransaction,
  ContingentLiability,
  WorkingCapitalSummary,
  IndebtednessSummary,
  TaxByPeriod,
  DividendRecord,
  DividendPolicy,
  RatiosCapitalisationAndIssuePriceMetrics,
  FormulaRecord,
  SmeEligibilityByPeriod,
  KpiSelectionGovernanceAndPeerComparison,
  SelectedDataCandidate,
  KpiRegisterEntry,
  PeerComparison,
  ManagementCertification,
  AuditCommitteeGovernance,
  ProfessionalCertification,
  OngoingDisclosureReadiness,
  MdaTrendsMaterialDevelopmentsAndConfirmations,
  PerformanceFactor,
  VarianceAnalysis,
  LiquidityCapitalResources,
  TrendUncertainty,
  SubsequentEvent,
  FinancialsKpisConfirmations,
  PlLineKey,
  BsLineKey,
  CfLineKey,
  EquityLineKey,
  SourceStatus,
  DisplayUnit,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/financials-kpis';

export type { FinancialsKpisTabId } from '@/lib/financials-kpis/options';

import {
  createEmptyIpoSetupReference,
  type IpoSetupReference,
} from '@/lib/capital-ownership/types';

export { createEmptyIpoSetupReference };
export type { IpoSetupReference };

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type FinancialsKpisProgress = {
  sections: Record<FinancialsKpisSectionId, SectionStatus>;
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

export type CapitalOwnershipReference = LinkedWorkstreamPlaceholder & {
  equityShareCapital: string | null;
  faceValue: string | null;
};

export type BusinessOperationsReference = LinkedWorkstreamPlaceholder & {
  segmentIds: string[];
};

export type ObjectsOfIssueReference = LinkedWorkstreamPlaceholder & {
  workingCapitalRequirement: string | null;
  borrowingRepaymentTotal: string | null;
};

/**
 * Read-only mirrors of other workstreams.
 *
 * Financials & KPIs never writes back. Placeholders remain empty until F2 wiring.
 */
export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  capitalOwnership: CapitalOwnershipReference;
  ipoSetup: IpoSetupReference;
  businessOperations: BusinessOperationsReference;
  objectsOfIssue: ObjectsOfIssueReference;
  borrowings: LinkedWorkstreamPlaceholder;
  groupEntities: LinkedWorkstreamPlaceholder;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: {
      available: false,
      legalName: null,
      companyClass: null,
      cin: null,
    },
    capitalOwnership: {
      available: false,
      equityShareCapital: null,
      faceValue: null,
    },
    ipoSetup: createEmptyIpoSetupReference(),
    businessOperations: { available: false, segmentIds: [] },
    objectsOfIssue: {
      available: false,
      workingCapitalRequirement: null,
      borrowingRepaymentTotal: null,
    },
    borrowings: { available: false },
    groupEntities: { available: false },
  };
}

/** Convenience alias used by hooks and page components. */
export type FinancialsKpisPayloadDraft = FinancialsKpisPayload;
