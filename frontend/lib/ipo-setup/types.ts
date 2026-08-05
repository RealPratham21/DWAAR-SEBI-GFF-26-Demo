import type { IpoSetupPayload, IpoSetupSectionId } from '@/lib/schemas/ipo-setup';

export type AmountUnit = 'lakh' | 'crore';

export type {
  IpoSetupPayload,
  IpoSetupSectionId,
  IpoDirection,
  OfferStructure,
  TrackRecordAndFinancialEligibility,
  EligibilityDeclarations,
  ProcessReadiness,
  IssuerConfirmations,
  DeclarationDetail,
  FinancialYearRow,
  YesNoNotSure,
} from '@/lib/schemas/ipo-setup';

export type { IpoSetupTabId } from '@/lib/ipo-setup/options';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type IpoSetupProgress = {
  sections: Record<IpoSetupSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyIncorporationReference = {
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
  available: boolean;
};
