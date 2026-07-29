import { apiRequest } from '@/lib/api/client';
import type {
  CompanyIncorporationWorkspaceResponse,
  InitializeWorkspaceResponse,
  SectionSaveResponse,
} from '@/lib/company-incorporation/types';
import type { CompanyIncorporationSessionData } from '@/lib/company-incorporation/defaults';
import type {
  CompanyRegistration,
  ConstitutionalAmendment,
  CorporateEvent,
  IssuerConfirmation,
  OfficeAddress,
} from '@/lib/schemas/company-incorporation';

const BASE = '/workstreams/company-incorporation';

export async function initializeCompanyIncorporationWorkspace(): Promise<InitializeWorkspaceResponse> {
  return apiRequest<InitializeWorkspaceResponse>(`${BASE}/workspace`, { method: 'POST' });
}

export async function fetchCompanyIncorporationWorkspace(): Promise<CompanyIncorporationWorkspaceResponse> {
  return apiRequest<CompanyIncorporationWorkspaceResponse>(`${BASE}/workspace`, { method: 'GET' });
}

export async function saveLegalIdentitySection(
  version: number,
  identity: CompanyIncorporationSessionData['identity'],
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/legal-identity`, {
    method: 'PATCH',
    body: { version, data: identity },
  });
}

export async function saveCorporateHistorySection(
  version: number,
  corporateEvents: CorporateEvent[],
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/corporate-history`, {
    method: 'PATCH',
    body: { version, data: { corporateEvents } },
  });
}

export async function saveOfficesContactSection(
  version: number,
  offices: OfficeAddress[],
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/offices-contact`, {
    method: 'PATCH',
    body: { version, data: { offices } },
  });
}

export async function saveConstitutionalDocumentsSection(
  version: number,
  data: {
    constitutionalRecord: CompanyIncorporationSessionData['constitutionalRecord'];
    constitutionalAmendments: ConstitutionalAmendment[];
  },
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/constitutional-documents`, {
    method: 'PATCH',
    body: { version, data },
  });
}

export async function saveCoreRegistrationsSection(
  version: number,
  registrations: CompanyRegistration[],
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/core-registrations`, {
    method: 'PATCH',
    body: { version, data: { registrations } },
  });
}

export async function saveIssuerConfirmationsSection(
  version: number,
  confirmations: IssuerConfirmation,
): Promise<SectionSaveResponse> {
  return apiRequest<SectionSaveResponse>(`${BASE}/sections/issuer-confirmations`, {
    method: 'PATCH',
    body: { version, data: confirmations },
  });
}
