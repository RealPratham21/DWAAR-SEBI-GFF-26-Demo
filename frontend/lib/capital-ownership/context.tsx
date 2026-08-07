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
import { ApiClientError } from '@/lib/api/errors';
import {
  fetchCapitalOwnershipAssessment,
  fetchCapitalOwnershipOverviewSummary,
  initializeCapitalOwnershipWorkspace,
  saveCapitalOwnershipSection,
} from '@/lib/api/capital-ownership';
import type {
  CapitalAssessmentResponse,
  CapitalOwnershipOverviewSummary,
  CompanyReference,
  ComputationsResponse,
  WorkspaceProgress,
} from '@/lib/capital-ownership/api-types';
import {
  computeCapitalOwnershipModel,
  type CapitalOwnershipModel,
} from '@/lib/capital-ownership/compute';
import { createEmptyCapitalOwnershipPayload } from '@/lib/capital-ownership/defaults';
import { calculateCapitalOwnershipProgress } from '@/lib/capital-ownership/progress';
import {
  createEmptyIpoSetupReference,
  type IpoSetupReference,
} from '@/lib/capital-ownership/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  CapitalOwnershipPayload,
  CapitalOwnershipSectionId,
} from '@/lib/schemas/capital-ownership';
import { formatCompanyClass } from '@/lib/workspace/format';

/** Payload keys that a section writes to. `schemaVersion` is never edited from the UI. */
export type CapitalOwnershipSectionKey = Exclude<keyof CapitalOwnershipPayload, 'schemaVersion'>;

export const CAPITAL_OWNERSHIP_SECTION_PAYLOAD_KEYS: Record<
  CapitalOwnershipSectionId,
  CapitalOwnershipSectionKey
> = {
  'current-capital-structure': 'currentCapitalStructure',
  'share-capital-history': 'shareCapitalHistory',
  'shareholders-beneficial-ownership': 'shareholdersAndBeneficialOwnership',
  'promoters-and-control': 'promotersAndControl',
  'pre-post-issue-ownership': 'preAndPostIssueOwnership',
  'promoter-contribution-lock-in': 'promoterContributionLockInAndEncumbrances',
  'outstanding-securities-confirmations': 'outstandingSecuritiesTransactionsAndConfirmations',
};

export type CapitalOwnershipCompanyReference = CompanyReference;

type CapitalOwnershipContextValue = {
  payload: CapitalOwnershipPayload;
  version: number;
  progress: WorkspaceProgress;
  model: CapitalOwnershipModel;
  assessment: CapitalAssessmentResponse | null;
  overview: CapitalOwnershipOverviewSummary | null;
  computations: ComputationsResponse | null;
  companyReference: CapitalOwnershipCompanyReference;
  ipoReference: IpoSetupReference;
  dirtySections: Set<CapitalOwnershipSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends CapitalOwnershipSectionKey>(
    sectionKey: K,
    value: CapitalOwnershipPayload[K],
    sectionId: CapitalOwnershipSectionId,
  ) => void;
  saveActiveSection: (sectionId: CapitalOwnershipSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: CapitalOwnershipSectionId) => void;
  /** Prompts only when there is a real difference. Scoped to one section when an id is given. */
  confirmLeave: (sectionId?: CapitalOwnershipSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const SECTION_ENTRIES = Object.entries(CAPITAL_OWNERSHIP_SECTION_PAYLOAD_KEYS) as Array<
  [CapitalOwnershipSectionId, CapitalOwnershipSectionKey]
>;

function clonePayload(payload: CapitalOwnershipPayload): CapitalOwnershipPayload {
  return structuredClone(payload);
}

/**
 * Server state wins for the section just saved and for sections the user has not touched,
 * while sections still holding edits keep their draft.
 */
function mergePersistedPayload(
  current: CapitalOwnershipPayload,
  baseline: CapitalOwnershipPayload,
  persisted: CapitalOwnershipPayload,
  savedSectionId: CapitalOwnershipSectionId,
): CapitalOwnershipPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

const CapitalOwnershipContext = createContext<CapitalOwnershipContextValue | null>(null);

const EMPTY_COMPANY_REFERENCE: CapitalOwnershipCompanyReference = {
  available: false,
  legalName: null,
  companyClass: null,
  cin: null,
};

const EMPTY_PROGRESS: WorkspaceProgress = {
  sections: {
    'current-capital-structure': 'not_started',
    'share-capital-history': 'not_started',
    'shareholders-beneficial-ownership': 'not_started',
    'promoters-and-control': 'not_started',
    'pre-post-issue-ownership': 'not_started',
    'promoter-contribution-lock-in': 'not_started',
    'outstanding-securities-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 7,
  overallStatus: 'not_started',
};

export function CapitalOwnershipProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<CapitalOwnershipPayload>(() =>
    createEmptyCapitalOwnershipPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<WorkspaceProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<CapitalAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<CapitalOwnershipOverviewSummary | null>(null);
  const [companyReference, setCompanyReference] =
    useState<CapitalOwnershipCompanyReference>(EMPTY_COMPANY_REFERENCE);
  const [ipoReference, setIpoReference] = useState<IpoSetupReference>(() =>
    createEmptyIpoSetupReference(),
  );
  /** Last state known to be persisted. Every dirty flag is derived from a diff against this. */
  const [baseline, setBaseline] = useState<CapitalOwnershipPayload>(() =>
    createEmptyCapitalOwnershipPayload(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshDerived = useCallback(async () => {
    const [overviewResponse, assessmentResponse] = await Promise.all([
      fetchCapitalOwnershipOverviewSummary(),
      fetchCapitalOwnershipAssessment(),
    ]);
    setOverview(overviewResponse);
    setAssessment(assessmentResponse);
    if (overviewResponse.ipoSetupReference) {
      setIpoReference(overviewResponse.ipoSetupReference);
    }
    if (overviewResponse.companyReference) {
      setCompanyReference(overviewResponse.companyReference);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeCapitalOwnershipWorkspace();
        if (cancelled) return;
        const loaded = clonePayload(response.payload);
        setBaseline(loaded);
        setPayload(clonePayload(loaded));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        setCompanyReference(response.companyReference);
        setIpoReference(response.ipoSetupReference);
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Capital & Ownership workspace.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [refreshDerived]);

  const dirtySections = useMemo(() => {
    if (isLoading) return new Set<CapitalOwnershipSectionId>();
    const next = new Set<CapitalOwnershipSectionId>();
    for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
      if (!isDeepEqual(payload[sectionKey], baseline[sectionKey])) next.add(sectionId);
    }
    return next;
  }, [baseline, isLoading, payload]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtySections.size === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtySections]);

  const liveProgress = useMemo(() => calculateCapitalOwnershipProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const model = useMemo(
    () => computeCapitalOwnershipModel(payload, ipoReference),
    [ipoReference, payload],
  );

  const updateSection = useCallback(
    <K extends CapitalOwnershipSectionKey>(
      sectionKey: K,
      value: CapitalOwnershipPayload[K],
      _sectionId: CapitalOwnershipSectionId,
    ) => {
      setPayload((current) => {
        if (isDeepEqual(current[sectionKey], value)) return current;
        return { ...current, [sectionKey]: value };
      });
      setSaveNotice(null);
      setSaveError(null);
    },
    [],
  );

  const discardSectionDraft = useCallback(
    (sectionId: CapitalOwnershipSectionId) => {
      const sectionKey = CAPITAL_OWNERSHIP_SECTION_PAYLOAD_KEYS[sectionId];
      setPayload((current) => ({ ...current, [sectionKey]: baseline[sectionKey] }));
      setSaveError(null);
    },
    [baseline],
  );

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const saveActiveSection = useCallback(
    async (sectionId: CapitalOwnershipSectionId) => {
      const key = CAPITAL_OWNERSHIP_SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveCapitalOwnershipSection(
          sectionId,
          version,
          payload[key] as never,
        );
        const persisted = clonePayload(response.payload);
        setBaseline(persisted);
        setPayload((current) =>
          mergePersistedPayload(current, baseline, persisted, sectionId),
        );
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        prependNotification(response.notification);
        setSaveNotice(response.acknowledgement.message);
        await refreshDerived();
        return true;
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.code === 'CAPITAL_OWNERSHIP_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: CapitalOwnershipPayload;
                  progress?: WorkspaceProgress;
                  computations?: ComputationsResponse;
                }
              | undefined;
            if (details?.payload && details.currentVersion && details.progress) {
              const loaded = clonePayload(details.payload);
              setBaseline(loaded);
              setPayload(clonePayload(loaded));
              setVersion(details.currentVersion);
              setProgress(details.progress);
              if (details.computations) setComputations(details.computations);
              void refreshDerived();
            }
            setSaveError(
              'This section was updated elsewhere. Your view has been refreshed — review and try again.',
            );
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
      } finally {
        setIsSaving(false);
      }
    },
    [baseline, payload, prependNotification, refreshDerived, version],
  );

  const confirmLeave = useCallback(
    (sectionId?: CapitalOwnershipSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const value = useMemo<CapitalOwnershipContextValue>(
    () => ({
      payload,
      version,
      progress: displayProgress,
      model,
      assessment,
      overview,
      computations,
      companyReference,
      ipoReference,
      dirtySections,
      isDirty: dirtySections.size > 0,
      isLoading,
      isSaving,
      loadError,
      saveNotice,
      saveError,
      clearSaveNotice,
      clearSaveError,
      updateSection,
      saveActiveSection,
      discardSectionDraft,
      confirmLeave,
      refreshDerived,
    }),
    [
      assessment,
      clearSaveError,
      clearSaveNotice,
      companyReference,
      computations,
      confirmLeave,
      dirtySections,
      discardSectionDraft,
      displayProgress,
      ipoReference,
      isLoading,
      isSaving,
      loadError,
      model,
      overview,
      payload,
      refreshDerived,
      saveActiveSection,
      saveError,
      saveNotice,
      updateSection,
      version,
    ],
  );

  return (
    <CapitalOwnershipContext.Provider value={value}>{children}</CapitalOwnershipContext.Provider>
  );
}

export function useCapitalOwnership(): CapitalOwnershipContextValue {
  const context = useContext(CapitalOwnershipContext);
  if (!context) {
    throw new Error('useCapitalOwnership must be used within CapitalOwnershipProvider');
  }
  return context;
}

export function formatReferencedCompanyClass(value: string | null | undefined): string {
  if (!value) return 'Not available from Company & Incorporation';
  return formatCompanyClass(value);
}
