export type StatusType = 'not-started' | 'in-progress' | 'pending-review' | 'approved' | 'blocked';

export type SeverityType = 'critical' | 'high' | 'medium' | 'low';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'pending-update';

export type UserRole = 'sme' | 'merchant-banker';

export type DRHPPhaseId =
  | 'establish-issuer'
  | 'core-disclosures'
  | 'due-diligence'
  | 'finalise-filing';

export interface Company {
  id: string;
  name: string;
  cin: string;
  registeredOffice: string;
  website?: string;
  sector: string;
}

export interface Workstream {
  sequence: number;
  slug: string;
  title: string;
  description: string;
  phaseId: DRHPPhaseId;
}

export interface DRHPSection {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  evidenceCoverage: number;
  openGaps: string[];
}

export interface Document {
  id: string;
  name: string;
  category: string;
  status: StatusType;
  uploadedDate: string;
  fileSize: string;
  url?: string;
}

export interface Fact {
  id: string;
  fact: string;
  value: string;
  source: string;
  verificationStatus: VerificationStatus;
  drwhUses: string[];
}

export interface IssueCard {
  id: string;
  severity: SeverityType;
  workstream: string;
  description: string;
  status: StatusType;
  relatedFacts?: string[];
  evidence?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  workstream: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ReviewComment {
  id: string;
  drhpSection: string;
  author: string;
  comment: string;
  timestamp: string;
  status: 'open' | 'resolved';
}
