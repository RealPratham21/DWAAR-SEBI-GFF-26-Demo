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
  fetchFinancialsKpisAssessment,
  fetchFinancialsKpisOverviewSummary,
  initializeFinancialsKpisWorkspace,
  saveFinancialsKpisSection,
} from '@/lib/api/financials-kpis';
import type {
  ComputationsResponse,
  FinancialAssessmentResponse,
  FinancialsKpisOverviewSummary,
} from '@/lib/financials-kpis/api-types';
import { computeFinancialsKpisModel, type FinancialsKpisModel } from '@/lib/financials-kpis/compute';
import { createEmptyFinancialsKpisPayload } from '@/lib/financials-kpis/defaults';
import { calculateFinancialsKpisProgress } from '@/lib/financials-kpis/progress';
import {
  createEmptyIpoSetupReference,
  createEmptyLinkedWorkstreamReferences,
  type FinancialsKpisProgress,
  type IpoSetupReference,
  type LinkedWorkstreamReferences,
} from '@/lib/financials-kpis/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import { formatCompanyClass } from '@/lib/workspace/format';
import type {
  FinancialsKpisPayload,
  FinancialsKpisSectionId,
} from '@/lib/schemas/financials-kpis';

export type FinancialsKpisSectionKey = Exclude<keyof FinancialsKpisPayload, 'schemaVersion'>;

export const SECTION_PAYLOAD_KEYS: Record<FinancialsKpisSectionId, FinancialsKpisSectionKey> = {
  'reporting-scope-periods-and-auditor-readiness': 'reportingScopePeriodsAndAuditorReadiness',
  'restated-statement-of-profit-and-loss': 'restatedStatementOfProfitAndLoss',
  'assets-liabilities-equity-and-cash-flows': 'assetsLiabilitiesEquityAndCashFlows',
  'restatement-adjustments-policies-and-auditor-matters':
    'restatementAdjustmentsPoliciesAndAuditorMatters',
  'other-financial-information': 'otherFinancialInformation',
  'ratios-capitalisation-and-issue-price-metrics': 'ratiosCapitalisationAndIssuePriceMetrics',
  'kpi-selection-governance-and-peer-comparison': 'kpiSelectionGovernanceAndPeerComparison',
  'mda-trends-material-developments-and-confirmations':
    'mdaTrendsMaterialDevelopmentsAndConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [FinancialsKpisSectionId, FinancialsKpisSectionKey]
>;

const EMPTY_PROGRESS: FinancialsKpisProgress = {
  sections: {
    'reporting-scope-periods-and-auditor-readiness': 'not_started',
    'restated-statement-of-profit-and-loss': 'not_started',
    'assets-liabilities-equity-and-cash-flows': 'not_started',
    'restatement-adjustments-policies-and-auditor-matters': 'not_started',
    'other-financial-information': 'not_started',
    'ratios-capitalisation-and-issue-price-metrics': 'not_started',
    'kpi-selection-governance-and-peer-comparison': 'not_started',
    'mda-trends-material-developments-and-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: FinancialsKpisPayload): FinancialsKpisPayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: FinancialsKpisPayload,
  baseline: FinancialsKpisPayload,
  persisted: FinancialsKpisPayload,
  savedSectionId: FinancialsKpisSectionId,
): FinancialsKpisPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type FinancialsKpisContextValue = {
  payload: FinancialsKpisPayload;
  version: number;
  progress: FinancialsKpisProgress;
  model: FinancialsKpisModel;
  assessment: FinancialAssessmentResponse | null;
  overview: FinancialsKpisOverviewSummary | null;
  computations: ComputationsResponse | null;
  ipoReference: IpoSetupReference;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<FinancialsKpisSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends FinancialsKpisSectionKey>(
    sectionKey: K,
    value: FinancialsKpisPayload[K],
    sectionId: FinancialsKpisSectionId,
  ) => void;
  saveActiveSection: (sectionId: FinancialsKpisSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: FinancialsKpisSectionId) => void;
  confirmLeave: (sectionId?: FinancialsKpisSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const FinancialsKpisContext = createContext<FinancialsKpisContextValue | null>(null);

export function FinancialsKpisProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<FinancialsKpisPayload>(() =>
    createEmptyFinancialsKpisPayload(),
  );
  const [baseline, setBaseline] = useState<FinancialsKpisPayload>(() =>
    createEmptyFinancialsKpisPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<FinancialsKpisProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<FinancialAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<FinancialsKpisOverviewSummary | null>(null);
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
        fetchFinancialsKpisOverviewSummary(),
        fetchFinancialsKpisAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Financial Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeFinancialsKpisWorkspace();
        if (cancelled) return;
        const loaded = clonePayload(response.payload);
        setBaseline(loaded);
        setPayload(clonePayload(loaded));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        setIpoReference(response.ipoSetupReference);
        setLinkedReferences({
          company: response.linkedReferences.company,
          capitalOwnership: response.linkedReferences.capitalOwnership,
          ipoSetup: response.ipoSetupReference,
          businessOperations: response.linkedReferences.businessOperations,
          objectsOfIssue: response.linkedReferences.objectsOfIssue,
          borrowings: response.linkedReferences.borrowings,
          groupEntities: response.linkedReferences.groupEntities,
        });
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Financials & KPIs workspace.');
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
    const next = new Set<FinancialsKpisSectionId>();
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

  const liveProgress = useMemo(() => calculateFinancialsKpisProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const model = useMemo(
    () => computeFinancialsKpisModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const updateSection = useCallback(
    <K extends FinancialsKpisSectionKey>(
      sectionKey: K,
      value: FinancialsKpisPayload[K],
      _sectionId: FinancialsKpisSectionId,
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
    (sectionId: FinancialsKpisSectionId) => {
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
    (sectionId?: FinancialsKpisSectionId) => {
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections],
  );

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const saveActiveSection = useCallback(
    async (sectionId: FinancialsKpisSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveFinancialsKpisSection(sectionId, version, payload[key] as never);
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
          if (error.code === 'FINANCIALS_KPIS_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: FinancialsKpisPayload;
                  progress?: FinancialsKpisProgress;
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

  const value = useMemo<FinancialsKpisContextValue>(
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
    <FinancialsKpisContext.Provider value={value}>{children}</FinancialsKpisContext.Provider>
  );
}

export function useFinancialsKpis(): FinancialsKpisContextValue {
  const context = useContext(FinancialsKpisContext);
  if (!context) {
    throw new Error('useFinancialsKpis must be used within FinancialsKpisProvider');
  }
  return context;
}

export function formatReferencedCompanyClass(value: string | null | undefined): string {
  if (!value) return 'Not available from Company & Incorporation';
  return formatCompanyClass(value);
}

export type { FinancialsKpisOverviewSummary, FinancialAssessmentResponse };
