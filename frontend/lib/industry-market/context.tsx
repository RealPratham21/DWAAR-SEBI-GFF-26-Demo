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
  fetchIndustryMarketAssessment,
  fetchIndustryMarketOverviewSummary,
  initializeIndustryMarketWorkspace,
  saveIndustryMarketSection,
} from '@/lib/api/industry-market';
import type {
  ComputationsResponse,
  IndustryAssessmentResponse,
  IndustryMarketOverviewSummaryResponse,
} from '@/lib/industry-market/api-types';
import {
  computeIndustryMarketModel,
  type IndustryMarketModel,
} from '@/lib/industry-market/compute';
import { createEmptyIndustryMarketPayload } from '@/lib/industry-market/defaults';
import { calculateIndustryMarketProgress } from '@/lib/industry-market/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type LinkedWorkstreamReferences,
  type IndustryMarketProgress,
} from '@/lib/industry-market/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

export type IndustryMarketSectionKey = Exclude<keyof IndustryMarketPayload, 'schemaVersion'>;

export const SECTION_PAYLOAD_KEYS: Record<IndustryMarketSectionId, IndustryMarketSectionKey> = {
  'industry-scope-and-company-market-mapping': 'industryScopeAndCompanyMarketMapping',
  'research-sources-and-industry-report-governance':
    'researchSourcesAndIndustryReportGovernance',
  'macroeconomic-and-industry-context': 'macroeconomicAndIndustryContext',
  'market-size-segmentation-and-growth': 'marketSizeSegmentationAndGrowth',
  'demand-drivers-end-markets-trends-and-policy': 'demandDriversEndMarketsTrendsAndPolicy',
  'value-chain-supply-structure-and-entry-barriers':
    'valueChainSupplyStructureAndEntryBarriers',
  'competition-market-share-and-issuer-positioning':
    'competitionMarketShareAndIssuerPositioning',
  'outlook-industry-risks-and-confirmations': 'outlookIndustryRisksAndConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [IndustryMarketSectionId, IndustryMarketSectionKey]
>;

const EMPTY_PROGRESS: IndustryMarketProgress = {
  sections: {
    'industry-scope-and-company-market-mapping': 'not_started',
    'research-sources-and-industry-report-governance': 'not_started',
    'macroeconomic-and-industry-context': 'not_started',
    'market-size-segmentation-and-growth': 'not_started',
    'demand-drivers-end-markets-trends-and-policy': 'not_started',
    'value-chain-supply-structure-and-entry-barriers': 'not_started',
    'competition-market-share-and-issuer-positioning': 'not_started',
    'outlook-industry-risks-and-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: IndustryMarketPayload): IndustryMarketPayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: IndustryMarketPayload,
  baseline: IndustryMarketPayload,
  persisted: IndustryMarketPayload,
  savedSectionId: IndustryMarketSectionId,
): IndustryMarketPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type IndustryMarketContextValue = {
  payload: IndustryMarketPayload;
  version: number;
  progress: IndustryMarketProgress;
  model: IndustryMarketModel;
  assessment: IndustryAssessmentResponse | null;
  overview: IndustryMarketOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<IndustryMarketSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends IndustryMarketSectionKey>(
    sectionKey: K,
    value: IndustryMarketPayload[K],
    sectionId: IndustryMarketSectionId,
  ) => void;
  saveActiveSection: (sectionId: IndustryMarketSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: IndustryMarketSectionId) => void;
  confirmLeave: (sectionId?: IndustryMarketSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const IndustryMarketContext = createContext<IndustryMarketContextValue | null>(null);

export function IndustryMarketProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<IndustryMarketPayload>(() =>
    createEmptyIndustryMarketPayload(),
  );
  const [baseline, setBaseline] = useState<IndustryMarketPayload>(() =>
    createEmptyIndustryMarketPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<IndustryMarketProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<IndustryAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<IndustryMarketOverviewSummaryResponse | null>(null);
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
        fetchIndustryMarketOverviewSummary(),
        fetchIndustryMarketAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Industry Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeIndustryMarketWorkspace();
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
          setLoadError('Unable to load Industry & Market workspace.');
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
    const next = new Set<IndustryMarketSectionId>();
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

  const model = useMemo(
    () => computeIndustryMarketModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const liveProgress = useMemo(() => calculateIndustryMarketProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const updateSection = useCallback(
    <K extends IndustryMarketSectionKey>(
      sectionKey: K,
      value: IndustryMarketPayload[K],
      _sectionId: IndustryMarketSectionId,
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
    (sectionId: IndustryMarketSectionId) => {
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
    (sectionId?: IndustryMarketSectionId) => {
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections],
  );

  const saveActiveSection = useCallback(
    async (sectionId: IndustryMarketSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveIndustryMarketSection(sectionId, version, payload[key] as never);
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
          if (error.code === 'INDUSTRY_MARKET_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: IndustryMarketPayload;
                  progress?: IndustryMarketProgress;
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

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const value = useMemo<IndustryMarketContextValue>(
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
    <IndustryMarketContext.Provider value={value}>{children}</IndustryMarketContext.Provider>
  );
}

export function useIndustryMarket(): IndustryMarketContextValue {
  const context = useContext(IndustryMarketContext);
  if (!context) {
    throw new Error('useIndustryMarket must be used within IndustryMarketProvider');
  }
  return context;
}

export type {
  IndustryMarketOverviewSummaryResponse as IndustryMarketOverviewSummary,
  IndustryAssessmentResponse,
};
