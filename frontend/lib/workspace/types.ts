import type { NextAction } from '@/lib/auth/types';

export interface BootstrapUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface BootstrapAlternateContact {
  fullName: string;
  designation: string;
  email: string;
  mobile: string;
}

export interface BootstrapRepresentative {
  designation: string;
  relationship: string;
  relationshipOther: string;
  authorisedSignatory: string;
  basisOfAuthority: string;
  basisOfAuthorityOther: string;
  primaryOnboardingContact: string;
  addAlternateContact: boolean;
  alternateContact: BootstrapAlternateContact | null;
}

export interface RegisteredOffice {
  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface BootstrapCompany {
  legalName: string;
  cin: string;
  incorporationDate: string;
  companyClass: string;
  registeredState: string;
  registrarOfCompanies: string;
  companyEmail: string;
  companyWebsite: string;
  registeredOffice: RegisteredOffice;
}

export interface BootstrapBusiness {
  primaryIndustry: string;
  primaryIndustryOther: string;
  businessSector: string;
  operationsDescription: string;
  employeeCountRange: string;
}

export interface GstRegistration {
  id: string;
  gstin: string;
  state: string;
  principalPlaceOfBusiness: string;
}

export interface BootstrapRegistrations {
  pan: string;
  gstRegistrationRequired: string;
  gstRegistrations: GstRegistration[];
  udyamRegistration: string;
  importExportCode: string;
}

export interface BootstrapOwnership {
  promoterCount: number;
  directorCount: number;
  promoterHoldingPercent: number;
  nonPromoterHoldingPercent: number;
  institutionalShareholdersPresent: string;
  foreignShareholdersPresent: string;
  promoterGroupEntitiesPresent: string;
}

export interface BootstrapIpoIntent {
  proposedIssueType: string;
  issueSizeCrore: string;
  issueSizeNotDecided: boolean;
  targetTimeline: string;
  intendedExchange: string;
  primaryPurposes: string[];
  primaryPurposeOther: string;
  merchantBankerAppointed: string;
  merchantBankerName: string;
  preparationStage: string;
}

export interface BootstrapOnboarding {
  id: string;
  status: string;
  submittedAt: string;
  schemaVersion: number;
}

export interface BootstrapWorkspace {
  route: string;
  displayName: string;
}

import type { DashboardCompanyIncorporationProgress } from '@/lib/company-incorporation/types';
import type { DashboardBusinessOperationsProgress } from '@/lib/business-operations/api-types';
import type { DashboardObjectsIssueProgress } from '@/lib/objects-of-issue/api-types';
import type { DashboardFinancialsKpisProgress } from '@/lib/financials-kpis/api-types';
import type { DashboardIndustryMarketProgress } from '@/lib/industry-market/api-types';
import type { DashboardGroupEntitiesProgress } from '@/lib/group-entities-related-parties/api-types';
import type { DashboardManagementGovernanceProgress } from '@/lib/management-governance/api-types';

export interface DashboardBootstrapResponse {
  user: BootstrapUser;
  representative: BootstrapRepresentative;
  company: BootstrapCompany;
  business: BootstrapBusiness;
  registrations: BootstrapRegistrations;
  ownership: BootstrapOwnership;
  ipoIntent: BootstrapIpoIntent;
  onboarding: BootstrapOnboarding;
  workspace: BootstrapWorkspace;
  companyIncorporation: DashboardCompanyIncorporationProgress;
  businessOperations: DashboardBusinessOperationsProgress;
  objectsOfIssue: DashboardObjectsIssueProgress;
  financialsKpis: DashboardFinancialsKpisProgress;
  managementGovernance: DashboardManagementGovernanceProgress;
  industryMarket: DashboardIndustryMarketProgress;
  groupEntitiesRelatedParties: DashboardGroupEntitiesProgress;
}

export interface DashboardBootstrapErrorDetails {
  nextAction?: NextAction;
  redirectTo?: string;
}
