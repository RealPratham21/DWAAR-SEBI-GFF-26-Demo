'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  emptyCompanyIncorporationFormData,
  SESSION_SAVE_MESSAGE,
  type CompanyIncorporationSessionData,
} from '@/lib/company-incorporation/defaults';
import type {
  CompanyRegistration,
  ConstitutionalAmendment,
  CorporateEvent,
  IssuerConfirmation,
  OfficeAddress,
} from '@/lib/schemas/company-incorporation';
import type { CompanyIdentityInput } from '@/lib/schemas/company-incorporation';

interface CompanyIncorporationContextValue {
  data: CompanyIncorporationSessionData;
  saveNotice: string | null;
  setIdentity: (identity: CompanyIncorporationSessionData['identity']) => void;
  setCorporateEvents: (events: CorporateEvent[]) => void;
  setOffices: (offices: OfficeAddress[]) => void;
  setConstitutionalRecord: (record: CompanyIncorporationSessionData['constitutionalRecord']) => void;
  setConstitutionalAmendments: (amendments: ConstitutionalAmendment[]) => void;
  setRegistrations: (registrations: CompanyRegistration[]) => void;
  setConfirmations: (confirmations: IssuerConfirmation) => void;
  notifySaved: () => void;
  clearSaveNotice: () => void;
}

const CompanyIncorporationContext = createContext<CompanyIncorporationContextValue | null>(
  null,
);

export function CompanyIncorporationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CompanyIncorporationSessionData>(
    emptyCompanyIncorporationFormData,
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const notifySaved = useCallback(() => {
    setSaveNotice(SESSION_SAVE_MESSAGE);
  }, []);

  const clearSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  const value = useMemo<CompanyIncorporationContextValue>(
    () => ({
      data,
      saveNotice,
      setIdentity: (identity) => setData((current) => ({ ...current, identity })),
      setCorporateEvents: (corporateEvents) =>
        setData((current) => ({ ...current, corporateEvents })),
      setOffices: (offices) => setData((current) => ({ ...current, offices })),
      setConstitutionalRecord: (constitutionalRecord) =>
        setData((current) => ({ ...current, constitutionalRecord })),
      setConstitutionalAmendments: (constitutionalAmendments) =>
        setData((current) => ({ ...current, constitutionalAmendments })),
      setRegistrations: (registrations) =>
        setData((current) => ({ ...current, registrations })),
      setConfirmations: (confirmations) =>
        setData((current) => ({ ...current, confirmations })),
      notifySaved,
      clearSaveNotice,
    }),
    [data, notifySaved, clearSaveNotice, saveNotice],
  );

  return (
    <CompanyIncorporationContext.Provider value={value}>
      {children}
    </CompanyIncorporationContext.Provider>
  );
}

export function useCompanyIncorporation() {
  const context = useContext(CompanyIncorporationContext);
  if (!context) {
    throw new Error('useCompanyIncorporation must be used within CompanyIncorporationProvider');
  }
  return context;
}
