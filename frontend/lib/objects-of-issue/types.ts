/**
 * Shared Objects of the Issue types.
 *
 * Persisted shapes live in `@/lib/schemas/objects-of-issue` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references) and are never persisted.
 */

import type {
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';

export type {
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
  ProceedsAndFundingSummary,
  ObjectsRegisterAndAllocation,
  IssueObject,
  CapitalExpenditureFacilitiesAndExpansion,
  CapexItem,
  WorkingCapitalAndBorrowingRepayment,
  BorrowingRepaymentItem,
  AcquisitionsSubsidiariesJvsAndInvestments,
  InvestmentItem,
  MeansOfFinanceAndDeploymentSchedule,
  MeansOfFinanceRow,
  DeploymentScheduleRow,
  ExpensesGcpMonitoringAndConfirmations,
  IssueExpenseItem,
  ObjectsOfIssueConfirmations,
  DeclaredOfferType,
  ObjectCategory,
  AppraisalStatus,
  CapexItemType,
  QuotationSource,
  ApprovalStatus,
  WorkingCapitalMethodology,
  LoanType,
  TransactionType,
  DefinitiveAgreementStatus,
  MeansOfFinanceSource,
  FundingTieUpStatus,
  ExpenseCategory,
  MonitoringAgencyStatus,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/objects-of-issue';

export type { ObjectsOfIssueTabId } from '@/lib/objects-of-issue/options';

/**
 * Read-only mirror of the IPO Setup & Eligibility workstream.
 *
 * Shared shape with Capital & Ownership so both workstreams read the same reference contract.
 * Objects of the Issue never writes back to IPO Setup. For Increment O1 this is always the
 * empty (`available: false`) stub — wiring to the live workstream lands in O2.
 */
export { createEmptyIpoSetupReference } from '@/lib/capital-ownership/types';
export type { IpoSetupReference } from '@/lib/capital-ownership/types';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type ObjectsOfIssueProgress = {
  sections: Record<ObjectsOfIssueSectionId, SectionStatus>;
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
 * Company identity may be populated from Company & Incorporation in a later increment. IPO
 * Setup, Financials, Industry, Business & Operations, Assets and Compliance remain unavailable
 * placeholders until those workstreams publish a stable reference contract. Objects of the
 * Issue never writes back.
 */
export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  businessOperations: LinkedWorkstreamPlaceholder;
  financials: LinkedWorkstreamPlaceholder;
  industry: LinkedWorkstreamPlaceholder;
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
    businessOperations: { available: false },
    financials: { available: false },
    industry: { available: false },
    assets: { available: false },
    compliance: { available: false },
  };
}

/** Convenience alias used by hooks and page components. */
export type ObjectsOfIssuePayloadDraft = ObjectsOfIssuePayload;
