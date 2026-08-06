import type {
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';
import type {
  CompanyLegalReference,
  IpoSetupReference,
  ObjectsOfIssueProgress,
  SectionStatus,
} from '@/lib/objects-of-issue/types';

export type { ObjectsOfIssueSectionId };

export type WorkspaceProgress = ObjectsOfIssueProgress;

export type ComputationsResponse = {
  isPureOfs: boolean;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
  totalAllocatedFromNetProceeds: string;
  totalAllocatedFromAllSources: string;
  unallocatedNetProceeds: string;
  allocationReconciles: boolean;
  totalMeansOfFinance: string;
  totalDeploymentScheduled: string;
  meansOfFinanceReconciles: boolean;
  totalIssueExpenses: string;
  gcpPercentageOfFreshIssue: string;
  gcpApplicableCap: string;
  gcpWithinLimit: boolean;
  objectsCount: number;
  capexItemsCount: number;
  borrowingRepaymentItemsCount: number;
  investmentItemsCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  pendingChecksCount: number;
};

export type LinkedPlaceholder = { available: false };

export type LinkedReferencesResponse = {
  company: CompanyLegalReference;
  businessOperations: LinkedPlaceholder;
  capitalOwnership: LinkedPlaceholder;
  borrowings: LinkedPlaceholder;
};

export type ObjectsIssueWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: ObjectsOfIssuePayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  ipoSetupReference: IpoSetupReference;
  companyReference: CompanyLegalReference;
  linkedReferences: LinkedReferencesResponse;
};

export type InitializeObjectsIssueWorkspaceResponse = ObjectsIssueWorkspaceResponse & {
  created: boolean;
};

export type ObjectsIssueSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: ObjectsOfIssueSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: ObjectsOfIssuePayload;
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
  sectionId: ObjectsOfIssueSectionId;
  label: string;
};

export type ObjectsIssueOverviewSummary = {
  isPureOfs: boolean;
  sectionStatuses: Record<ObjectsOfIssueSectionId, SectionStatus>;
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  objectsCount: number;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
  totalAllocatedFromNetProceeds: string;
  gcpPercentageOfFreshIssue: string;
  gcpApplicableCap: string;
  hasCapexRelevantObjects: boolean;
  hasAcquisitionRelevantObjects: boolean;
  companyReference: CompanyLegalReference;
  assessmentResult: string;
  assessmentResultLabel: string;
  assessmentSummary: string;
  blockingConcernCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  recommendedNextActions: OverviewNextAction[];
  lastUpdatedAt: string | null;
};

export type AssessmentCriterionCounts = {
  reconciled: number;
  potentialConcern: number;
  missingInformation: number;
  pendingLinkedWorkstream: number;
  pendingSupportingSource: number;
  blocked: number;
  pendingProfessionalConfirmation: number;
  notApplicable: number;
};

export type ObjectsAssessmentCriterion = {
  id: string;
  label: string;
  state: string;
  reason: string;
};

export type ObjectsAssessmentGroup = {
  group: string;
  label: string;
  criteria: ObjectsAssessmentCriterion[];
  counts: AssessmentCriterionCounts;
  headlineState: string;
};

export type ObjectsAssessmentResponse = {
  result: string;
  resultLabel: string;
  summary: string;
  criteria: ObjectsAssessmentCriterion[];
  groups: ObjectsAssessmentGroup[];
  counts: AssessmentCriterionCounts;
  metrics: {
    objects: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    unreconciledChecks: number;
    blockingConcerns: number;
    netFreshIssueProceeds: string;
    totalEstimatedObjectsCost: string;
  };
};

export type DashboardObjectsIssueProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};
