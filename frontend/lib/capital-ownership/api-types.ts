import type {
  CapitalOwnershipPayload,
  CapitalOwnershipSectionId,
} from '@/lib/schemas/capital-ownership';
import type { CapitalOwnershipProgress, IpoSetupReference, SectionStatus } from '@/lib/capital-ownership/types';

export type { CapitalOwnershipSectionId };

export type WorkspaceProgress = CapitalOwnershipProgress;

export type CompanyReference = {
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
  available: boolean;
};

export type ComputationsResponse = {
  currentEquityShares: string;
  paidUpEquityCapitalFromClasses: string;
  promoterAndGroupPercentage: string;
  publicPercentage: string;
  postIssueShares: string;
  promoterPreIssuePercentage: string;
  promoterPostIssuePercentage: string;
  promoterDilutionPercentagePoints: string;
  offerAsPercentageOfPostIssueCapital: string;
  totalSharesOfferedForSale: string;
  potentialDilutionFromConvertibles: string;
  requiredContributionShares: string;
  eligibleContributionShares: string;
  contributionShortfallShares: string;
  totalEncumberedShares: string;
};

export type CapitalOwnershipWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: CapitalOwnershipPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  companyReference: CompanyReference;
  ipoSetupReference: IpoSetupReference;
};

export type InitializeCapitalOwnershipWorkspaceResponse = CapitalOwnershipWorkspaceResponse & {
  created: boolean;
};

export type CapitalOwnershipSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: CapitalOwnershipSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: CapitalOwnershipPayload;
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

export type OverviewNextAction = {
  label: string;
  sectionId: string;
  href: string;
};

export type OverviewConcern = {
  key: string;
  label: string;
  explanation: string;
};

export type CapitalOwnershipOverviewSummary = {
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: SectionStatus;
  sectionStatuses: Record<string, SectionStatus>;
  currentEquityShares: string;
  paidUpEquityCapital: string;
  promoterAndGroupPercentage: string;
  postIssueShares: string;
  promoterPostIssuePercentage: string;
  offerAsPercentageOfPostIssueCapital: string;
  potentialDilutionFromConvertibles: string;
  totalSharesOfferedForSale: string;
  sellingShareholdersCount: number;
  outstandingInstrumentsCount: number;
  totalEncumberedShares: string;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  reconciliationConcerns: OverviewConcern[];
  ipoSetupLinked: boolean;
  ipoSetupOfferType: string;
  assessmentResult: string;
  assessmentResultLabel: string;
  assessmentSummary: string;
  missingRequiredResponses: string[];
  missingRequiredCount: number;
  recommendedNextActions: OverviewNextAction[];
  companyReference: CompanyReference;
  ipoSetupReference: IpoSetupReference;
};

export type AssessmentCriterionResponse = {
  id: string;
  group: string;
  label: string;
  state: string;
  reason: string;
  expected?: string | null;
  actual?: string | null;
  difference?: string | null;
};

export type AssessmentGroupCounts = {
  reconciled: number;
  potential_inconsistency: number;
  missing_information: number;
  pending_linked_workstream: number;
  pending_professional_confirmation: number;
  not_applicable: number;
};

export type AssessmentGroupResponse = {
  group: string;
  label: string;
  criteria: AssessmentCriterionResponse[];
  counts: AssessmentGroupCounts;
  headlineState: string;
};

export type AssessmentMetricsResponse = {
  currentEquityShares: string;
  paidUpEquityCapital: string;
  postIssueEquityShares: string;
  promoterPreIssuePercentage: string;
  promoterPostIssuePercentage: string;
  promoterDilutionPercentagePoints: string;
  totalSharesOfferedForSale: string;
  minimumContributionRequiredShares: string;
  eligibleContributionShares: string;
  contributionShortfallShares: string;
  potentialDilutionFromConvertibles: string;
  unreconciledChecks: number;
  unansweredConfirmations: number;
  sectionsComplete: number;
};

export type CapitalAssessmentResponse = {
  result: string;
  resultLabel: string;
  summary: string;
  criteria: AssessmentCriterionResponse[];
  groups: AssessmentGroupResponse[];
  counts: AssessmentGroupCounts;
  metrics: AssessmentMetricsResponse;
};
