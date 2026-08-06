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
  fetchObjectsIssueAssessment,
  fetchObjectsIssueOverviewSummary,
  initializeObjectsIssueWorkspace,
  saveObjectsIssueSection,
} from '@/lib/api/objects-of-issue';
import type {
  ComputationsResponse,
  ObjectsAssessmentResponse,
  ObjectsIssueOverviewSummary,
} from '@/lib/objects-of-issue/api-types';
import { computeObjectsOfIssueModel } from '@/lib/objects-of-issue/compute';
import { createEmptyObjectsOfIssuePayload } from '@/lib/objects-of-issue/defaults';
import { calculateObjectsOfIssueProgress } from '@/lib/objects-of-issue/progress';
import {
  createEmptyIpoSetupReference,
  createEmptyLinkedWorkstreamReferences,
  type IpoSetupReference,
  type LinkedWorkstreamReferences,
  type ObjectsOfIssueProgress,
} from '@/lib/objects-of-issue/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import { formatCompanyClass } from '@/lib/workspace/format';
import type {
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';

export type ObjectsOfIssueSectionKey = Exclude<keyof ObjectsOfIssuePayload, 'schemaVersion'>;

export const SECTION_PAYLOAD_KEYS: Record<ObjectsOfIssueSectionId, ObjectsOfIssueSectionKey> = {
  'proceeds-and-funding-summary': 'proceedsAndFundingSummary',
  'objects-register-and-allocation': 'objectsRegisterAndAllocation',
  'capital-expenditure-facilities-and-expansion': 'capitalExpenditureFacilitiesAndExpansion',
  'working-capital-and-borrowing-repayment': 'workingCapitalAndBorrowingRepayment',
  'acquisitions-subsidiaries-jvs-and-investments': 'acquisitionsSubsidiariesJvsAndInvestments',
  'means-of-finance-and-deployment-schedule': 'meansOfFinanceAndDeploymentSchedule',
  'expenses-gcp-monitoring-and-confirmations': 'expensesGcpMonitoringAndConfirmations',
};

export const OBJECTS_OF_ISSUE_SECTION_PAYLOAD_KEYS = SECTION_PAYLOAD_KEYS;

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [ObjectsOfIssueSectionId, ObjectsOfIssueSectionKey]
>;

const EMPTY_PROGRESS: ObjectsOfIssueProgress = {
  sections: {
    'proceeds-and-funding-summary': 'not_started',
    'objects-register-and-allocation': 'not_started',
    'capital-expenditure-facilities-and-expansion': 'not_started',
    'working-capital-and-borrowing-repayment': 'not_started',
    'acquisitions-subsidiaries-jvs-and-investments': 'not_started',
    'means-of-finance-and-deployment-schedule': 'not_started',
    'expenses-gcp-monitoring-and-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 7,
  overallStatus: 'not_started',
};

function clonePayload(payload: ObjectsOfIssuePayload): ObjectsOfIssuePayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: ObjectsOfIssuePayload,
  baseline: ObjectsOfIssuePayload,
  persisted: ObjectsOfIssuePayload,
  savedSectionId: ObjectsOfIssueSectionId,
): ObjectsOfIssuePayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type ObjectsOfIssueContextValue = {
  payload: ObjectsOfIssuePayload;
  version: number;
  progress: ObjectsOfIssueProgress;
  model: ReturnType<typeof computeObjectsOfIssueModel>;
  assessment: ObjectsAssessmentResponse | null;
  overview: ObjectsIssueOverviewSummary | null;
  computations: ComputationsResponse | null;
  ipoReference: IpoSetupReference;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<ObjectsOfIssueSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends ObjectsOfIssueSectionKey>(
    sectionKey: K,
    value: ObjectsOfIssuePayload[K],
    sectionId: ObjectsOfIssueSectionId,
  ) => void;
  saveActiveSection: (sectionId: ObjectsOfIssueSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: ObjectsOfIssueSectionId) => void;
  confirmLeave: (sectionId?: ObjectsOfIssueSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const ObjectsOfIssueContext = createContext<ObjectsOfIssueContextValue | null>(null);

export function ObjectsOfIssueProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<ObjectsOfIssuePayload>(() =>
    createEmptyObjectsOfIssuePayload(),
  );
  const [baseline, setBaseline] = useState<ObjectsOfIssuePayload>(() =>
    createEmptyObjectsOfIssuePayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<ObjectsOfIssueProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<ObjectsAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<ObjectsIssueOverviewSummary | null>(null);
  const [ipoReference, setIpoReference] = useState<IpoSetupReference>(() =>
    createEmptyIpoSetupReference(),
  );
  const [linkedReferences, setLinkedReferences] = useState<LinkedWorkstreamReferences>(() =>
    createEmptyLinkedWorkstreamReferences(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [derivedError, setDerivedError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshDerived = useCallback(async () => {
    try {
      const [overviewResponse, assessmentResponse] = await Promise.all([
        fetchObjectsIssueOverviewSummary(),
        fetchObjectsIssueAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      if (overviewResponse.companyReference) {
        setLinkedReferences((current) => ({
          ...current,
          company: overviewResponse.companyReference,
        }));
      }
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Objects Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeObjectsIssueWorkspace();
        if (cancelled) return;
        const loaded = clonePayload(response.payload);
        setBaseline(loaded);
        setPayload(clonePayload(loaded));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        setIpoReference(response.ipoSetupReference);
        setLinkedReferences({
          company: response.companyReference,
          businessOperations: response.linkedReferences.businessOperations,
          financials: { available: false },
          industry: { available: false },
          assets: { available: false },
          compliance: { available: false },
        });
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Objects of the Issue workspace.');
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
    const next = new Set<ObjectsOfIssueSectionId>();
    for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
      if (!isDeepEqual(payload[sectionKey], baseline[sectionKey])) next.add(sectionId);
    }
    return next;
  }, [baseline, payload]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtySections.size === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtySections]);

  const liveProgress = useMemo(() => calculateObjectsOfIssueProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const model = useMemo(
    () => computeObjectsOfIssueModel(payload, ipoReference),
    [ipoReference, payload],
  );

  const updateSection = useCallback(
    <K extends ObjectsOfIssueSectionKey>(
      sectionKey: K,
      value: ObjectsOfIssuePayload[K],
      _sectionId: ObjectsOfIssueSectionId,
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
    (sectionId: ObjectsOfIssueSectionId) => {
      const sectionKey = SECTION_PAYLOAD_KEYS[sectionId];
      setPayload((current) => ({
        ...current,
        [sectionKey]: structuredClone(baseline[sectionKey]),
      }));
      setSaveError(null);
    },
    [baseline],
  );

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const saveActiveSection = useCallback(
    async (sectionId: ObjectsOfIssueSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveObjectsIssueSection(sectionId, version, payload[key] as never);
        const persisted = clonePayload(response.payload);
        setBaseline(persisted);
        setPayload((current) => mergePersistedPayload(current, baseline, persisted, sectionId));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        prependNotification(response.notification);
        setSaveNotice(response.acknowledgement.message);
        await refreshDerived();
        return true;
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.code === 'OBJECTS_ISSUE_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: ObjectsOfIssuePayload;
                  progress?: ObjectsOfIssueProgress;
                  computations?: ComputationsResponse;
                }
              | undefined;
            if (details?.payload && details.currentVersion && details.progress) {
              const loaded = clonePayload(details.payload);
              setBaseline(loaded);
              setPayload((current) =>
                mergePersistedPayload(current, baseline, loaded, sectionId),
              );
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
    (sectionId?: ObjectsOfIssueSectionId) => {
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections],
  );

  const value = useMemo<ObjectsOfIssueContextValue>(
    () => ({
      payload,
      version,
      progress: displayProgress,
      model,
      assessment,
      overview,
      computations,
      ipoReference,
      linkedReferences,
      dirtySections,
      isDirty: dirtySections.size > 0,
      isLoading,
      isSaving,
      loadError,
      derivedError,
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
      computations,
      confirmLeave,
      derivedError,
      dirtySections,
      discardSectionDraft,
      displayProgress,
      ipoReference,
      isLoading,
      isSaving,
      linkedReferences,
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
    <ObjectsOfIssueContext.Provider value={value}>{children}</ObjectsOfIssueContext.Provider>
  );
}

export function useObjectsOfIssue(): ObjectsOfIssueContextValue {
  const context = useContext(ObjectsOfIssueContext);
  if (!context) {
    throw new Error('useObjectsOfIssue must be used within ObjectsOfIssueProvider');
  }
  return context;
}

export function formatReferencedCompanyClass(value: string | null | undefined): string {
  if (!value) return 'Not available from Company & Incorporation';
  return formatCompanyClass(value);
}
