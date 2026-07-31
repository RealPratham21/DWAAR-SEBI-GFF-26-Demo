'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  initializeCompanyIncorporationWorkspace,
  saveConstitutionalDocumentsSection,
  saveCoreRegistrationsSection,
  saveCorporateHistorySection,
  saveIssuerConfirmationsSection,
  saveLegalIdentitySection,
  saveOfficesContactSection,
} from '@/lib/api/company-incorporation';
import { ApiClientError } from '@/lib/api/errors';
import {
  emptyCompanyIncorporationFormData,
  type CompanyIncorporationSessionData,
} from '@/lib/company-incorporation/defaults';
import type { SectionSaveResponse, WorkspaceProgress } from '@/lib/company-incorporation/types';
import { useNotifications } from '@/lib/notifications/context';
import type {
  CompanyRegistration,
  ConstitutionalAmendment,
  CorporateEvent,
  IssuerConfirmation,
  OfficeAddress,
} from '@/lib/schemas/company-incorporation';

interface CompanyIncorporationContextValue {
  data: CompanyIncorporationSessionData;
  version: number;
  progress: WorkspaceProgress | null;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  saveIdentity: (identity: CompanyIncorporationSessionData['identity']) => Promise<boolean>;
  saveCorporateEvents: (events: CorporateEvent[]) => Promise<boolean>;
  saveOffices: (offices: OfficeAddress[]) => Promise<boolean>;
  saveConstitutionalRecord: (
    record: CompanyIncorporationSessionData['constitutionalRecord'],
  ) => Promise<boolean>;
  saveConstitutionalAmendments: (amendments: ConstitutionalAmendment[]) => Promise<boolean>;
  saveRegistrations: (registrations: CompanyRegistration[]) => Promise<boolean>;
  saveConfirmations: (confirmations: IssuerConfirmation) => Promise<boolean>;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
}

const CompanyIncorporationContext = createContext<CompanyIncorporationContextValue | null>(null);

function applySaveResponse(
  response: SectionSaveResponse,
  setData: (data: CompanyIncorporationSessionData) => void,
  setVersion: (version: number) => void,
  setProgress: (progress: WorkspaceProgress) => void,
) {
  setData(response.payload);
  setVersion(response.version);
  setProgress(response.progress);
}

export function CompanyIncorporationProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [data, setData] = useState<CompanyIncorporationSessionData>(
    emptyCompanyIncorporationFormData,
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<WorkspaceProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeCompanyIncorporationWorkspace();
        if (cancelled) return;
        setData(response.payload);
        setVersion(response.version);
        setProgress(response.progress);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Company & Incorporation workspace.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearSaveNotice = useCallback(() => {
    setSaveNotice(null);
  }, []);

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  const handleSaveError = useCallback((error: unknown) => {
    if (error instanceof ApiClientError) {
      if (error.code === 'COMPANY_INCORPORATION_VERSION_CONFLICT') {
        const details = error.details as {
          currentVersion?: number;
          payload?: CompanyIncorporationSessionData;
          progress?: WorkspaceProgress;
        } | undefined;
        if (details?.payload && details.currentVersion && details.progress) {
          setData(details.payload);
          setVersion(details.currentVersion);
          setProgress(details.progress);
        }
        setSaveError('This section was updated elsewhere. Your view has been refreshed — try again.');
        return false;
      }
      const fieldErrors = (
        error.details as { fieldErrors?: Record<string, string> } | undefined
      )?.fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setSaveError(Object.values(fieldErrors).join(' '));
        return false;
      }
      setSaveError(error.message);
      return false;
    }
    setSaveError('Unable to save changes. Please try again.');
    return false;
  }, []);

  const runSave = useCallback(
    async (saveFn: () => Promise<SectionSaveResponse>) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveFn();
        applySaveResponse(response, setData, setVersion, setProgress);
        prependNotification(response.notification);
        setSaveNotice(response.notification.title);
        return true;
      } catch (error) {
        handleSaveError(error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handleSaveError, prependNotification],
  );

  const saveIdentity = useCallback(
    async (identity: CompanyIncorporationSessionData['identity']) =>
      runSave(() => saveLegalIdentitySection(version, identity)),
    [runSave, version],
  );

  const saveCorporateEvents = useCallback(
    async (events: CorporateEvent[]) =>
      runSave(() => saveCorporateHistorySection(version, events)),
    [runSave, version],
  );

  const saveOffices = useCallback(
    async (offices: OfficeAddress[]) => runSave(() => saveOfficesContactSection(version, offices)),
    [runSave, version],
  );

  const saveConstitutionalRecord = useCallback(
    async (record: CompanyIncorporationSessionData['constitutionalRecord']) =>
      runSave(() =>
        saveConstitutionalDocumentsSection(version, {
          constitutionalRecord: record,
          constitutionalAmendments: data.constitutionalAmendments,
        }),
      ),
    [data.constitutionalAmendments, runSave, version],
  );

  const saveConstitutionalAmendments = useCallback(
    async (amendments: ConstitutionalAmendment[]) =>
      runSave(() =>
        saveConstitutionalDocumentsSection(version, {
          constitutionalRecord: data.constitutionalRecord,
          constitutionalAmendments: amendments,
        }),
      ),
    [data.constitutionalRecord, runSave, version],
  );

  const saveRegistrations = useCallback(
    async (registrations: CompanyRegistration[]) =>
      runSave(() => saveCoreRegistrationsSection(version, registrations)),
    [runSave, version],
  );

  const saveConfirmations = useCallback(
    async (confirmations: IssuerConfirmation) =>
      runSave(() => saveIssuerConfirmationsSection(version, confirmations)),
    [runSave, version],
  );

  const value = useMemo<CompanyIncorporationContextValue>(
    () => ({
      data,
      version,
      progress,
      isLoading,
      isSaving,
      loadError,
      saveNotice,
      saveError,
      saveIdentity,
      saveCorporateEvents,
      saveOffices,
      saveConstitutionalRecord,
      saveConstitutionalAmendments,
      saveRegistrations,
      saveConfirmations,
      clearSaveNotice,
      clearSaveError,
    }),
    [
      data,
      version,
      progress,
      isLoading,
      isSaving,
      loadError,
      saveNotice,
      saveError,
      saveIdentity,
      saveCorporateEvents,
      saveOffices,
      saveConstitutionalRecord,
      saveConstitutionalAmendments,
      saveRegistrations,
      saveConfirmations,
      clearSaveNotice,
      clearSaveError,
    ],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading Company & Incorporation workspace…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

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
