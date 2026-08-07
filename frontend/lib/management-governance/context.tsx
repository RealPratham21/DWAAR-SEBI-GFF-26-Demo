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
  fetchManagementGovernanceAssessment,
  fetchManagementGovernanceOverviewSummary,
  initializeManagementGovernanceWorkspace,
  saveManagementGovernanceSection,
} from '@/lib/api/management-governance';
import type {
  ComputationsResponse,
  GovernanceAssessmentResponse,
  ManagementGovernanceOverviewSummaryResponse,
} from '@/lib/management-governance/api-types';
import {
  computeManagementGovernanceModel,
  type ManagementGovernanceModel,
} from '@/lib/management-governance/compute';
import { createEmptyManagementGovernancePayload } from '@/lib/management-governance/defaults';
import { calculateManagementGovernanceProgress } from '@/lib/management-governance/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  createEmptyManagementGovernanceIpoSetupReference,
  type LinkedWorkstreamReferences,
  type ManagementGovernanceIpoSetupReference,
  type ManagementGovernanceProgress,
} from '@/lib/management-governance/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  ManagementGovernancePayload,
  ManagementGovernanceSectionId,
} from '@/lib/schemas/management-governance';

export type ManagementGovernanceSectionKey = Exclude<
  keyof ManagementGovernancePayload,
  'schemaVersion'
>;

export const SECTION_PAYLOAD_KEYS: Record<
  ManagementGovernanceSectionId,
  ManagementGovernanceSectionKey
> = {
  'board-structure-and-ipo-governance-readiness': 'boardStructureAndIpoGovernanceReadiness',
  'directors-profiles-appointments-and-eligibility':
    'directorsProfilesAppointmentsAndEligibility',
  'kmp-senior-management-and-organisation-structure':
    'kmpSeniorManagementAndOrganisationStructure',
  'board-committees-and-governance-bodies': 'boardCommitteesAndGovernanceBodies',
  'remuneration-service-contracts-esops-and-benefits':
    'remunerationServiceContractsEsopsAndBenefits',
  'interests-conflicts-and-management-relationships':
    'interestsConflictsAndManagementRelationships',
  'changes-continuity-and-succession': 'changesContinuityAndSuccession',
  'governance-policies-rpt-oversight-and-confirmations':
    'governancePoliciesRptOversightAndConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [ManagementGovernanceSectionId, ManagementGovernanceSectionKey]
>;

const EMPTY_PROGRESS: ManagementGovernanceProgress = {
  sections: {
    'board-structure-and-ipo-governance-readiness': 'not_started',
    'directors-profiles-appointments-and-eligibility': 'not_started',
    'kmp-senior-management-and-organisation-structure': 'not_started',
    'board-committees-and-governance-bodies': 'not_started',
    'remuneration-service-contracts-esops-and-benefits': 'not_started',
    'interests-conflicts-and-management-relationships': 'not_started',
    'changes-continuity-and-succession': 'not_started',
    'governance-policies-rpt-oversight-and-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: ManagementGovernancePayload): ManagementGovernancePayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: ManagementGovernancePayload,
  baseline: ManagementGovernancePayload,
  persisted: ManagementGovernancePayload,
  savedSectionId: ManagementGovernanceSectionId,
): ManagementGovernancePayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type ManagementGovernanceContextValue = {
  payload: ManagementGovernancePayload;
  version: number;
  progress: ManagementGovernanceProgress;
  model: ManagementGovernanceModel;
  assessment: GovernanceAssessmentResponse | null;
  overview: ManagementGovernanceOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  ipoReference: ManagementGovernanceIpoSetupReference;
  dirtySections: Set<ManagementGovernanceSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends ManagementGovernanceSectionKey>(
    sectionKey: K,
    value: ManagementGovernancePayload[K],
    sectionId: ManagementGovernanceSectionId,
  ) => void;
  saveActiveSection: (sectionId: ManagementGovernanceSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: ManagementGovernanceSectionId) => void;
  confirmLeave: (sectionId?: ManagementGovernanceSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const ManagementGovernanceContext = createContext<ManagementGovernanceContextValue | null>(null);

export function ManagementGovernanceProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<ManagementGovernancePayload>(() =>
    createEmptyManagementGovernancePayload(),
  );
  const [baseline, setBaseline] = useState<ManagementGovernancePayload>(() =>
    createEmptyManagementGovernancePayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<ManagementGovernanceProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<GovernanceAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<ManagementGovernanceOverviewSummaryResponse | null>(
    null,
  );
  const [ipoReference, setIpoReference] = useState<ManagementGovernanceIpoSetupReference>(() =>
    createEmptyManagementGovernanceIpoSetupReference(),
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
        fetchManagementGovernanceOverviewSummary(),
        fetchManagementGovernanceAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Governance Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeManagementGovernanceWorkspace();
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
          ipoSetup: response.ipoSetupReference,
          capitalOwnership: response.linkedReferences.capitalOwnership,
          financialsKpis: response.linkedReferences.financialsKpis,
          businessOperations: response.linkedReferences.businessOperations,
          groupEntities: response.linkedReferences.groupEntities,
          litigation: response.linkedReferences.litigation,
        });
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Management & Governance workspace.');
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
    if (isLoading) return new Set<ManagementGovernanceSectionId>();
    const next = new Set<ManagementGovernanceSectionId>();
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

  const liveProgress = useMemo(() => calculateManagementGovernanceProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const model = useMemo(
    () => computeManagementGovernanceModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const updateSection = useCallback(
    <K extends ManagementGovernanceSectionKey>(
      sectionKey: K,
      value: ManagementGovernancePayload[K],
      _sectionId: ManagementGovernanceSectionId,
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
    (sectionId: ManagementGovernanceSectionId) => {
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
    (sectionId?: ManagementGovernanceSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const saveActiveSection = useCallback(
    async (sectionId: ManagementGovernanceSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveManagementGovernanceSection(
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
          if (error.code === 'MANAGEMENT_GOVERNANCE_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: ManagementGovernancePayload;
                  progress?: ManagementGovernanceProgress;
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

  const value = useMemo<ManagementGovernanceContextValue>(
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
    <ManagementGovernanceContext.Provider value={value}>{children}</ManagementGovernanceContext.Provider>
  );
}

export function useManagementGovernance(): ManagementGovernanceContextValue {
  const context = useContext(ManagementGovernanceContext);
  if (!context) {
    throw new Error('useManagementGovernance must be used within ManagementGovernanceProvider');
  }
  return context;
}

export type {
  ManagementGovernanceOverviewSummaryResponse as ManagementGovernanceOverviewSummary,
  GovernanceAssessmentResponse,
};
