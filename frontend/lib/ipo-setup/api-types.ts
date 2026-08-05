import type { IpoSetupPayload, IpoSetupSectionId } from '@/lib/schemas/ipo-setup';
import type { SectionStatus } from '@/lib/ipo-setup/types';

export type { IpoSetupSectionId };

export type WorkspaceProgress = {
  sections: Record<IpoSetupSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyReference = {
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
  available: boolean;
};

export type OfferComputationsResponse = {
  includesFreshIssue: boolean;
  includesOfs: boolean;
  amountDisplayUnit: string;
  totalSharesOffered: string | null;
  totalOfferAmount: string | null;
  freshIssuePercentageOfOffer: string | null;
  ofsPercentageOfOffer: string | null;
  proposedPostIssueShares: string | null;
  proposedPostIssuePaidUpCapital: string | null;
  offerAsPercentageOfPostIssueCapital: string | null;
  paidUpCapitalIncreaseFromOffer: string | null;
};

export type IpoSetupWorkspaceResponse = {
  id: string;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  payload: IpoSetupPayload;
  progress: WorkspaceProgress;
  offerComputations: OfferComputationsResponse;
  companyReference: CompanyReference;
};

export type InitializeIpoSetupWorkspaceResponse = IpoSetupWorkspaceResponse & {
  created: boolean;
};

export type IpoSetupSectionSaveResponse = {
  version: number;
  lastSavedAt: string;
  savedSectionId: IpoSetupSectionId;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: IpoSetupPayload;
  offerComputations: OfferComputationsResponse;
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

export type AssessmentCriterionResponse = {
  key: string;
  label: string;
  group: string;
  result: string;
  explanation: string;
  valuesUsed: Record<string, unknown>;
  missingFields: string[];
  relatedSection: string | null;
  deepLink: string;
};

export type EligibilityAssessmentResponse = {
  result: string;
  resultLabel: string;
  summary: string;
  criteria: AssessmentCriterionResponse[];
  groupedCriteria: Record<string, AssessmentCriterionResponse[]>;
  metrics: {
    proposedPostIssuePaidUpCapital: string | null;
    ofsPercentageOfOffer: string | null;
    yearsMeetingOperatingProfitThreshold: number;
    positiveNetWorthAvailable: boolean | null;
    yearsWithPositiveFcfe: number;
    threeYearTrackRecordEstablished: boolean | null;
    publicCompanyConversionStatus: string;
    unresolvedAdverseDeclarations: number;
  };
  offerComputations: OfferComputationsResponse;
};

export type IpoSetupOverviewSummary = {
  preparationStage: string;
  preparationStageLabel: string;
  targetPlatform: string;
  targetPlatformLabel: string;
  offerType: string;
  offerTypeLabel: string;
  pricingMethod: string;
  pricingMethodLabel: string;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
  sectionStatuses: Record<IpoSetupSectionId, SectionStatus>;
  preliminaryAssessmentResult: string;
  preliminaryAssessmentLabel: string;
  potentialConcerns: Array<{ key: string; label: string; explanation: string }>;
  missingRequiredResponses: string[];
  missingRequiredCount: number;
  processReadinessStatus: SectionStatus;
  recommendedNextActions: Array<{ label: string; sectionId: string; href: string }>;
  offerComputations: OfferComputationsResponse;
  companyReference: CompanyReference;
};
