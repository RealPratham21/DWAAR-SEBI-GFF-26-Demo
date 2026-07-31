import type { CompanyIncorporationSessionData } from '@/lib/company-incorporation/defaults';
import type { SaveAcknowledgement, UserNotification } from '@/lib/notifications/types';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';
export type OverallStatus = 'not_started' | 'in_progress' | 'complete';

export interface WorkspaceProgress {
  sections: Record<string, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: OverallStatus;
}

export interface CompanyIncorporationWorkspaceResponse {
  id: string;
  version: number;
  schemaVersion: number;
  initializedFromOnboarding: boolean;
  initializedAt: string | null;
  lastSavedAt: string | null;
  payload: CompanyIncorporationSessionData;
  progress: WorkspaceProgress;
}

export interface InitializeWorkspaceResponse extends CompanyIncorporationWorkspaceResponse {
  created: boolean;
}

export interface SectionSaveResponse {
  version: number;
  lastSavedAt: string;
  savedSection: Record<string, unknown>;
  progress: WorkspaceProgress;
  payload: CompanyIncorporationSessionData;
  acknowledgement: SaveAcknowledgement;
  notification: UserNotification;
}

export interface DashboardCompanyIncorporationProgress {
  overallStatus: OverallStatus;
  sectionsComplete: number;
  totalSections: number;
}

export type InformationSectionId =
  | 'legal-identity'
  | 'corporate-history'
  | 'offices-contact'
  | 'constitutional-documents'
  | 'core-registrations'
  | 'issuer-confirmations';
