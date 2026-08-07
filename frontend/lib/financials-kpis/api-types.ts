import type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';
import type {
  CompanyLegalReference,
  FinancialsKpisProgress,
  IpoSetupReference,
  LinkedWorkstreamReferences,
  SectionStatus,
} from '@/lib/financials-kpis/types';

export type { FinancialsKpisSectionId };

export type WorkspaceProgress = FinancialsKpisProgress;

export type ComputationsResponse = {
  periodCount: number;
  plPeriodCount: number;
  latestPeriodLabel: string;
  displayUnit: string;
  latestRevenue: string;
  latestProfitAfterTax: string;
  latestEbitda: string;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  periodComparisonWarningsCount: number;
  restatementChecksCount: number;
  restatementChecksReconciledCount: number;
  smeEligibilityCount: number;
  kpiCount: number;
  plLineCount: number;
};

export type FinancialsKpisWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: FinancialsKpisPayload;
  progress: WorkspaceProgress;
  computations: ComputationsResponse;
  ipoSetupReference: IpoSetupReference;
  companyReference: CompanyLegalReference;
  linkedReferences: LinkedWorkstreamReferences;
};

export type InitializeFinancialsKpisWorkspaceResponse = FinancialsKpisWorkspaceResponse & {
  created: boolean;
};

export type FinancialsKpisSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: FinancialsKpisSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: FinancialsKpisPayload;
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
  sectionId: FinancialsKpisSectionId;
  label: string;
};

export type ReconciliationConcern = {
  id: string;
  label: string;
  message: string;
  periodLabel: string;
};

export type PeriodComparisonWarning = {
  id: string;
  previousPeriodId: string;
  currentPeriodId: string;
  previousLabel: string;
  currentLabel: string;
  warning: string;
};

export type FinancialsKpisOverviewSummary = {
  sectionStatuses: Record<FinancialsKpisSectionId, SectionStatus>;
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: SectionStatus;
  periodLabels: string[];
  latestPeriodLabel: string;
  displayUnit: string;
  fullYearPeriodCount: number;
  interimPeriodCount: number;
  entityCount: number;
  plLineCount: number;
  kpiCount: number;
  reconciledChecksCount: number;
  varianceChecksCount: number;
  missingInformationChecksCount: number;
  reconciliationConcerns: ReconciliationConcern[];
  periodComparisonWarnings: PeriodComparisonWarning[];
  assessmentResult: string;
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: OverviewNextAction[];
  latestRevenue: string;
  latestProfitAfterTax: string;
  latestEbitda: string;
  lastUpdatedAt: string | null;
};

export type AssessmentCriterionCounts = {
  reconciled: number;
  potentialInconsistency: number;
  missingInformation: number;
  pendingRestatement: number;
  pendingAuditorConfirmation: number;
  pendingLinkedWorkstream: number;
  pendingKpiCertification: number;
  pendingProfessionalConfirmation: number;
  notApplicable: number;
};

export type FinancialAssessmentCriterion = {
  id: string;
  group: string;
  label: string;
  state: string;
  reason: string;
};

export type FinancialAssessmentGroup = {
  group: string;
  label: string;
  criteria: FinancialAssessmentCriterion[];
  counts: AssessmentCriterionCounts;
  headlineState: string;
};

export type FinancialAssessmentResponse = {
  result: string;
  resultLabel: string;
  summary: string;
  criteria: FinancialAssessmentCriterion[];
  groups: FinancialAssessmentGroup[];
  counts: AssessmentCriterionCounts;
  metrics: {
    periods: number;
    sectionsComplete: number;
    unansweredConfirmations: number;
    unreconciledChecks: number;
    blockingConcerns: number;
  };
};

export type DashboardFinancialsKpisProgress = {
  overallStatus: 'not_started' | 'in_progress' | 'complete';
  sectionsComplete: number;
  totalSections: number;
};
