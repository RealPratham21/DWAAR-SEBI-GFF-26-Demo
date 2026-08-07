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
  fetchGroupEntitiesAssessment,
  fetchGroupEntitiesOverviewSummary,
  initializeGroupEntitiesWorkspace,
  saveGroupEntitiesSection,
} from '@/lib/api/group-entities-related-parties';
import type {
  ComputationsResponse,
  GroupAssessmentResponse,
  GroupEntitiesOverviewSummaryResponse,
} from '@/lib/group-entities-related-parties/api-types';
import {
  computeGroupEntitiesModel,
  type GroupEntitiesModel,
} from '@/lib/group-entities-related-parties/compute';
import { createEmptyGroupEntitiesRelatedPartiesPayload } from '@/lib/group-entities-related-parties/defaults';
import { calculateGroupEntitiesProgress } from '@/lib/group-entities-related-parties/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type GroupEntitiesProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/group-entities-related-parties/types';
import { useNotifications } from '@/lib/notifications/context';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  GroupEntitiesRelatedPartiesPayload,
  GroupEntitiesSectionId,
} from '@/lib/schemas/group-entities-related-parties';

export type GroupEntitiesSectionKey = Exclude<
  keyof GroupEntitiesRelatedPartiesPayload,
  'schemaVersion'
>;

export const SECTION_PAYLOAD_KEYS: Record<GroupEntitiesSectionId, GroupEntitiesSectionKey> = {
  'group-structure-and-entity-master': 'groupStructureAndEntityMaster',
  'ownership-control-and-relationship-mapping': 'ownershipControlAndRelationshipMapping',
  'group-company-and-materiality-classification': 'groupCompanyAndMaterialityClassification',
  'related-party-universe-and-classification': 'relatedPartyUniverseAndClassification',
  'related-party-transactions-balances-and-commitments':
    'relatedPartyTransactionsBalancesAndCommitments',
  'common-pursuits-dependencies-and-conflicts': 'commonPursuitsDependenciesAndConflicts',
  'group-entity-financial-regulatory-and-litigation-readiness':
    'groupEntityFinancialRegulatoryAndLitigationReadiness',
  'changes-rpt-readiness-and-confirmations': 'changesRptReadinessAndConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [GroupEntitiesSectionId, GroupEntitiesSectionKey]
>;

const EMPTY_PROGRESS: GroupEntitiesProgress = {
  sections: {
    'group-structure-and-entity-master': 'not_started',
    'ownership-control-and-relationship-mapping': 'not_started',
    'group-company-and-materiality-classification': 'not_started',
    'related-party-universe-and-classification': 'not_started',
    'related-party-transactions-balances-and-commitments': 'not_started',
    'common-pursuits-dependencies-and-conflicts': 'not_started',
    'group-entity-financial-regulatory-and-litigation-readiness': 'not_started',
    'changes-rpt-readiness-and-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: GroupEntitiesRelatedPartiesPayload): GroupEntitiesRelatedPartiesPayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: GroupEntitiesRelatedPartiesPayload,
  baseline: GroupEntitiesRelatedPartiesPayload,
  persisted: GroupEntitiesRelatedPartiesPayload,
  savedSectionId: GroupEntitiesSectionId,
): GroupEntitiesRelatedPartiesPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type GroupEntitiesContextValue = {
  payload: GroupEntitiesRelatedPartiesPayload;
  version: number;
  progress: GroupEntitiesProgress;
  model: GroupEntitiesModel;
  assessment: GroupAssessmentResponse | null;
  overview: GroupEntitiesOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<GroupEntitiesSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends GroupEntitiesSectionKey>(
    sectionKey: K,
    value: GroupEntitiesRelatedPartiesPayload[K],
    sectionId: GroupEntitiesSectionId,
  ) => void;
  saveActiveSection: (sectionId: GroupEntitiesSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: GroupEntitiesSectionId) => void;
  confirmLeave: (sectionId?: GroupEntitiesSectionId) => boolean;
  refreshDerived: () => Promise<void>;
};

const GroupEntitiesContext = createContext<GroupEntitiesContextValue | null>(null);

export function GroupEntitiesProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<GroupEntitiesRelatedPartiesPayload>(() =>
    createEmptyGroupEntitiesRelatedPartiesPayload(),
  );
  const [baseline, setBaseline] = useState<GroupEntitiesRelatedPartiesPayload>(() =>
    createEmptyGroupEntitiesRelatedPartiesPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<GroupEntitiesProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<GroupAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<GroupEntitiesOverviewSummaryResponse | null>(null);
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
        fetchGroupEntitiesOverviewSummary(),
        fetchGroupEntitiesAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Group & RPT Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeGroupEntitiesWorkspace();
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
          setLoadError('Unable to load Group Entities & Related Parties workspace.');
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
    if (isLoading) return new Set<GroupEntitiesSectionId>();
    const next = new Set<GroupEntitiesSectionId>();
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
    () => computeGroupEntitiesModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const liveProgress = useMemo(() => calculateGroupEntitiesProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const updateSection = useCallback(
    <K extends GroupEntitiesSectionKey>(
      sectionKey: K,
      value: GroupEntitiesRelatedPartiesPayload[K],
      _sectionId: GroupEntitiesSectionId,
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
    (sectionId: GroupEntitiesSectionId) => {
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
    (sectionId?: GroupEntitiesSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const saveActiveSection = useCallback(
    async (sectionId: GroupEntitiesSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveGroupEntitiesSection(sectionId, version, payload[key] as never);
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
          if (error.code === 'GROUP_ENTITIES_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: GroupEntitiesRelatedPartiesPayload;
                  progress?: GroupEntitiesProgress;
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

  const value = useMemo<GroupEntitiesContextValue>(
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
    <GroupEntitiesContext.Provider value={value}>{children}</GroupEntitiesContext.Provider>
  );
}

export function useGroupEntities(): GroupEntitiesContextValue {
  const context = useContext(GroupEntitiesContext);
  if (!context) {
    throw new Error('useGroupEntities must be used within GroupEntitiesProvider');
  }
  return context;
}

export type {
  GroupEntitiesOverviewSummaryResponse as GroupEntitiesOverviewSummary,
  GroupAssessmentResponse,
};
