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
  fetchIntermediariesFilingOverviewSummary,
  fetchIntermediariesFilingReadiness,
  initializeIntermediariesFilingWorkspace,
  saveIntermediariesFilingSection,
} from '@/lib/api/intermediaries-filing';
import type {
  ComputationsResponse,
  IfAssessmentResponse,
  IntermediariesFilingOverviewSummaryResponse,
} from '@/lib/intermediaries-filing/api-types';
import {
  computeIntermediariesFilingModel,
  type IntermediariesFilingModel,
} from '@/lib/intermediaries-filing/compute';
import { createEmptyIntermediariesFilingPayload } from '@/lib/intermediaries-filing/defaults';
import { calculateIntermediariesFilingProgress } from '@/lib/intermediaries-filing/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type IfProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/intermediaries-filing/types';
import { useNotifications } from '@/lib/notifications/context';
import { applyWorkstreamSampleDraft } from '@/lib/demo-data/apply-sample-draft';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  IntermediariesFilingPayload,
  IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

export type IntermediariesFilingSectionKey = Exclude<
  keyof IntermediariesFilingPayload,
  'schemaVersion'
>;

export const SECTION_PAYLOAD_KEYS: Record<
  IntermediariesFilingSectionId,
  IntermediariesFilingSectionKey
> = {
  'issue-team-and-intermediary-master': 'issueTeamAndIntermediaryMaster',
  'issue-configuration-and-filing-snapshot': 'issueConfigurationAndFilingSnapshot',
  'filing-and-regulatory-milestone-tracker': 'filingAndRegulatoryMilestoneTracker',
  'due-diligence-certificates-consents-and-signoffs':
    'dueDiligenceCertificatesConsentsAndSignoffs',
  'depositories-banking-asba-upi-and-issue-infrastructure':
    'depositoriesBankingAsbaUpiAndIssueInfrastructure',
  'underwriting-market-making-and-distribution-arrangements':
    'underwritingMarketMakingAndDistributionArrangements',
  'issue-programme-allotment-listing-and-post-issue-execution':
    'issueProgrammeAllotmentListingAndPostIssueExecution',
  'final-offer-document-advertisements-material-documents-and-filing-readiness':
    'finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [IntermediariesFilingSectionId, IntermediariesFilingSectionKey]
>;

const EMPTY_PROGRESS: IfProgress = {
  sections: {
    'issue-team-and-intermediary-master': 'not_started',
    'issue-configuration-and-filing-snapshot': 'not_started',
    'filing-and-regulatory-milestone-tracker': 'not_started',
    'due-diligence-certificates-consents-and-signoffs': 'not_started',
    'depositories-banking-asba-upi-and-issue-infrastructure': 'not_started',
    'underwriting-market-making-and-distribution-arrangements': 'not_started',
    'issue-programme-allotment-listing-and-post-issue-execution': 'not_started',
    'final-offer-document-advertisements-material-documents-and-filing-readiness': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
  currentFilingStage: '',
};

function clonePayload(payload: IntermediariesFilingPayload): IntermediariesFilingPayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: IntermediariesFilingPayload,
  baseline: IntermediariesFilingPayload,
  persisted: IntermediariesFilingPayload,
  savedSectionId: IntermediariesFilingSectionId,
): IntermediariesFilingPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type IntermediariesFilingContextValue = {
  payload: IntermediariesFilingPayload;
  version: number;
  progress: IfProgress;
  model: IntermediariesFilingModel;
  assessment: IfAssessmentResponse | null;
  overview: IntermediariesFilingOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<IntermediariesFilingSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends IntermediariesFilingSectionKey>(
    sectionKey: K,
    value: IntermediariesFilingPayload[K],
    sectionId: IntermediariesFilingSectionId,
  ) => void;
  saveActiveSection: (sectionId: IntermediariesFilingSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: IntermediariesFilingSectionId) => void;
  confirmLeave: (sectionId?: IntermediariesFilingSectionId) => boolean;
  applySampleDraft: (sample: IntermediariesFilingPayload) => void;
  refreshDerived: () => Promise<void>;
};

const IntermediariesFilingContext = createContext<IntermediariesFilingContextValue | null>(null);

export function IntermediariesFilingProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<IntermediariesFilingPayload>(() =>
    createEmptyIntermediariesFilingPayload(),
  );
  const [baseline, setBaseline] = useState<IntermediariesFilingPayload>(() =>
    createEmptyIntermediariesFilingPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<IfProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<IfAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<IntermediariesFilingOverviewSummaryResponse | null>(
    null,
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
        fetchIntermediariesFilingOverviewSummary(),
        fetchIntermediariesFilingReadiness(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Filing Readiness.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeIntermediariesFilingWorkspace();
        if (cancelled) return;
        const loaded = clonePayload(response.payload);
        setBaseline(loaded);
        setPayload(clonePayload(loaded));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        setLinkedReferences(response.linkedReferences);
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Intermediaries & Filing workspace.');
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
    if (isLoading) return new Set<IntermediariesFilingSectionId>();
    const next = new Set<IntermediariesFilingSectionId>();
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

  const model = useMemo(
    () => computeIntermediariesFilingModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const liveProgress = useMemo(() => calculateIntermediariesFilingProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const updateSection = useCallback(
    <K extends IntermediariesFilingSectionKey>(
      sectionKey: K,
      value: IntermediariesFilingPayload[K],
      _sectionId: IntermediariesFilingSectionId,
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
    (sectionId: IntermediariesFilingSectionId) => {
      const sectionKey = SECTION_PAYLOAD_KEYS[sectionId];
      setPayload((current) => ({
        ...current,
        [sectionKey]: structuredClone(baseline[sectionKey]),
      }));
      setSaveError(null);
    },
    [baseline],
  );

  const confirmLeave = useCallback(
    (sectionId?: IntermediariesFilingSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const saveActiveSection = useCallback(
    async (sectionId: IntermediariesFilingSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveIntermediariesFilingSection(
          sectionId,
          version,
          payload[key] as never,
        );
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
          if (error.code === 'INTERMEDIARIES_FILING_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: IntermediariesFilingPayload;
                  progress?: IfProgress;
                  computations?: ComputationsResponse;
                }
              | undefined;
            if (details?.payload && details.currentVersion && details.progress) {
              const loaded = clonePayload(details.payload);
              setBaseline(loaded);
              setPayload((current) => mergePersistedPayload(current, baseline, loaded, sectionId));
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

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const applySampleDraft = useCallback(
    (sample: IntermediariesFilingPayload) => {
      applyWorkstreamSampleDraft(sample, clonePayload, setPayload, () => {
        setSaveNotice(null);
        setSaveError(null);
      });
    },
    [],
  );

  const value = useMemo<IntermediariesFilingContextValue>(
    () => ({
      payload,
      version,
      progress: displayProgress,
      model,
      assessment,
      overview,
      computations,
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
      applySampleDraft,
      refreshDerived,
    }),
    [
      applySampleDraft,
      assessment,
      clearSaveError,
      clearSaveNotice,
      computations,
      confirmLeave,
      derivedError,
      dirtySections,
      discardSectionDraft,
      displayProgress,
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
    <IntermediariesFilingContext.Provider value={value}>
      {children}
    </IntermediariesFilingContext.Provider>
  );
}

export function useIntermediariesFiling(): IntermediariesFilingContextValue {
  const context = useContext(IntermediariesFilingContext);
  if (!context) {
    throw new Error('useIntermediariesFiling must be used within IntermediariesFilingProvider');
  }
  return context;
}

export type {
  IfAssessmentResponse,
  IntermediariesFilingOverviewSummaryResponse as IntermediariesFilingOverviewSummary,
};
