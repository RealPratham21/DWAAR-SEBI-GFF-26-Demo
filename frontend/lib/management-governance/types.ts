/**
 * Shared Management & Governance types.
 *
 * Persisted shapes live in `@/lib/schemas/management-governance` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references, applicability profile) and are never persisted.
 */

import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

export type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
  BoardStructureAndIpoGovernanceReadiness,
  BoardSnapshot,
  BoardLeadership,
  GovernanceReadiness,
  IpoCommittee,
  IndependentDirectorPriceBandProcess,
  DirectorsProfilesAppointmentsAndEligibility,
  DirectorRecord,
  PreviousEmploymentRecord,
  OtherDirectorshipRecord,
  DirectorEligibility,
  IndependentDirectorDetails,
  KmpSeniorManagementAndOrganisationStructure,
  OrgStructureNode,
  KmpSmpRecord,
  KmpRoleReadiness,
  VacancyRecord,
  FamilyRelationshipRecord,
  BoardCommitteesAndGovernanceBodies,
  CommitteeRecord,
  CommitteeMember,
  CommitteeMeetingRecord,
  RemunerationServiceContractsEsopsAndBenefits,
  DirectorRemunerationRecord,
  ExecutiveAppointmentTerm,
  KmpSmpRemunerationRecord,
  IncentiveArrangementRecord,
  ServiceContractBenefitRecord,
  EsopGovernance,
  InterestsConflictsAndManagementRelationships,
  InterestInIssuerRecord,
  DirectorOfferDocumentInterest,
  OutsideInterestRecord,
  AppointmentArrangementRecord,
  FinancialArrangementRecord,
  ChangesContinuityAndSuccession,
  BoardChangeRecord,
  KmpSmpChangeRecord,
  SuccessionReadiness,
  KeyPersonDependencyRecord,
  GovernancePoliciesRptOversightAndConfirmations,
  GovernancePolicyRecord,
  RptGovernance,
  BoardProcessReadiness,
  ManagementGovernanceConfirmations,
  DirectorDesignation,
  CommitteeType,
  AppointmentStatus,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/management-governance';

export type { ManagementGovernanceTabId } from '@/lib/management-governance/options';

import {
  createEmptyIpoSetupReference,
  type IpoSetupReference,
} from '@/lib/capital-ownership/types';

export { createEmptyIpoSetupReference };
export type { IpoSetupReference };

/** IPO Setup mirror extended for governance applicability (M2 wiring). */
export type ManagementGovernanceIpoSetupReference = IpoSetupReference & {
  targetListingSegment: string | null;
  listingPlatform: string | null;
};

export function createEmptyManagementGovernanceIpoSetupReference(): ManagementGovernanceIpoSetupReference {
  return {
    ...createEmptyIpoSetupReference(),
    targetListingSegment: null,
    listingPlatform: null,
  };
}

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type ManagementGovernanceProgress = {
  sections: Record<ManagementGovernanceSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyLegalReference = {
  available: boolean;
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
  companyStatus: string | null;
  incorporationDate: string | null;
};

export type LinkedWorkstreamPlaceholder = {
  available: false;
};

export type CapitalOwnershipReference = LinkedWorkstreamPlaceholder & {
  paidUpEquityCapital: string | null;
  promoterIdentityAvailable: boolean;
};

export type FinancialsKpisReference = LinkedWorkstreamPlaceholder & {
  netWorth: string | null;
  rptSummaryAvailable: boolean;
};

export type BusinessOperationsReference = LinkedWorkstreamPlaceholder & {
  businessUnitContextAvailable: boolean;
};

export type GroupEntitiesReference = LinkedWorkstreamPlaceholder;

export type LitigationReference = LinkedWorkstreamPlaceholder;

/**
 * Read-only mirrors of other workstreams.
 *
 * Management & Governance never writes back. Placeholders remain empty until M2 wiring.
 */
export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  ipoSetup: ManagementGovernanceIpoSetupReference;
  capitalOwnership: CapitalOwnershipReference;
  financialsKpis: FinancialsKpisReference;
  businessOperations: BusinessOperationsReference;
  groupEntities: GroupEntitiesReference;
  litigation: LitigationReference;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: {
      available: false,
      legalName: null,
      companyClass: null,
      cin: null,
      companyStatus: null,
      incorporationDate: null,
    },
    ipoSetup: createEmptyManagementGovernanceIpoSetupReference(),
    capitalOwnership: {
      available: false,
      paidUpEquityCapital: null,
      promoterIdentityAvailable: false,
    },
    financialsKpis: {
      available: false,
      netWorth: null,
      rptSummaryAvailable: false,
    },
    businessOperations: {
      available: false,
      businessUnitContextAvailable: false,
    },
    groupEntities: { available: false },
    litigation: { available: false },
  };
}

/** Convenience alias used by hooks and page components. */
export type ManagementGovernancePayloadDraft = ManagementGovernancePayload;
