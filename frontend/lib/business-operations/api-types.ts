import type {
  BusinessOperationsPayload,
  BusinessOperationsSectionId,
} from '@/lib/schemas/business-operations';
import type {
  BusinessOperationsProgress,
  CompanyLegalReference,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/business-operations/types';

export type { BusinessOperationsSectionId };

export type WorkspaceProgress = BusinessOperationsProgress;

export type CompanyReference = CompanyLegalReference;

export type ComputationsResponse = {
  productsCount: number;
  facilitiesCount: number;
  employeesTotal: string;
  largestSegmentLabel: string;
  largestSegmentPercentage: string;
  productConcentration: string;
  revenuePercentagesReconcile: boolean;
  customerConcentrationLargest: string;
  supplierConcentrationLargest: string;
  capacityUtilisationLatest: string;
  dependenciesCount: number;
  certificationsCount: number;
  ipRecordsCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
};

export type LinkedPlaceholder = { available: false };

export type LinkedReferencesResponse = LinkedWorkstreamReferences;

export type BusinessOperationsWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: BusinessOperationsPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  companyReference: CompanyReference;
  linkedReferences: LinkedReferencesResponse;
};

export type InitializeBusinessOperationsWorkspaceResponse =
  BusinessOperationsWorkspaceResponse & {
    created: boolean;
  };

export type BusinessOperationsSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: BusinessOperationsSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: BusinessOperationsPayload;
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

export type BusinessOperationsOverviewSummary = {
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: SectionStatus;
  sectionStatuses: Record<string, SectionStatus>;
  businessModelSummary: string;
  operatingSegmentsSummary: string;
  productsCount: number;
  facilitiesCount: number;
  employeesTotal: string;
  domesticOperations: string;
  exportOperations: string;
  largestSegmentLabel: string;
  largestSegmentPercentage: string;
  productConcentration: string;
  customerConcentration: string;
  supplierConcentration: string;
  capacityUtilisation: string;
  dependenciesCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  reconciliationConcerns: OverviewConcern[];
  assessmentResult: string;
  assessmentResultLabel: string;
  assessmentSummary: string;
  missingRequiredResponses: string[];
  missingRequiredCount: number;
  recommendedNextActions: OverviewNextAction[];
  companyReference: CompanyReference;
  lastUpdatedAt: string | null;
};

export type AssessmentCriterionResponse = {
  id: string;
  group: string;
  label: string;
  state: string;
  reason: string;
  explanation?: string | null;
  valuesUsed?: Record<string, unknown> | null;
  missingFields?: string[] | null;
  relatedSection?: string | null;
  deepLink?: string | null;
};

export type AssessmentGroupCounts = {
  substantiated: number;
  potential_inconsistency: number;
  missing_information: number;
  pending_linked_workstream: number;
  pending_supporting_source: number;
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
  products: number;
  facilities: number;
  sectionsComplete: number;
  unansweredConfirmations: number;
  unreconciledChecks: number;
  largestSegmentLabel: string;
  latestHeadcount: string;
};

export type BusinessAssessmentResponse = {
  result: string;
  resultLabel: string;
  summary: string;
  criteria: AssessmentCriterionResponse[];
  groups: AssessmentGroupResponse[];
  counts: AssessmentGroupCounts;
  metrics: AssessmentMetricsResponse;
};

export type DashboardBusinessOperationsProgress = {
  overallStatus: SectionStatus;
  sectionsComplete: number;
  totalSections: number;
};
