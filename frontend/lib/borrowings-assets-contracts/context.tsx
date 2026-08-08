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
  fetchBorrowingsAssetsContractsAssessment,
  fetchBorrowingsAssetsContractsOverviewSummary,
  initializeBorrowingsAssetsContractsWorkspace,
  saveBorrowingsAssetsContractsSection,
} from '@/lib/api/borrowings-assets-contracts';
import type {
  BacAssessmentResponse,
  BorrowingsAssetsContractsOverviewSummaryResponse,
  ComputationsResponse,
} from '@/lib/borrowings-assets-contracts/api-types';
import {
  computeBorrowingsAssetsContractsModel,
  type BorrowingsAssetsContractsModel,
} from '@/lib/borrowings-assets-contracts/compute';
import { createEmptyBorrowingsAssetsContractsPayload } from '@/lib/borrowings-assets-contracts/defaults';
import { calculateBorrowingsAssetsContractsProgress } from '@/lib/borrowings-assets-contracts/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type BorrowingsAssetsContractsProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/borrowings-assets-contracts/types';
import { useNotifications } from '@/lib/notifications/context';
import { applyWorkstreamSampleDraft } from '@/lib/demo-data/apply-sample-draft';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  BorrowingsAssetsContractsPayload,
  BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export type BorrowingsAssetsContractsSectionKey = Exclude<
  keyof BorrowingsAssetsContractsPayload,
  'schemaVersion'
>;

export const SECTION_PAYLOAD_KEYS: Record<
  BorrowingsAssetsContractsSectionId,
  BorrowingsAssetsContractsSectionKey
> = {
  'financial-indebtedness-and-facility-master': 'financialIndebtednessAndFacilityMaster',
  'security-charges-guarantees-and-borrowing-powers': 'securityChargesGuaranteesAndBorrowingPowers',
  'covenants-defaults-waivers-and-lender-consents': 'covenantsDefaultsWaiversAndLenderConsents',
  'immovable-properties-and-occupancy-rights': 'immovablePropertiesAndOccupancyRights',
  'material-assets-encumbrance-and-insurance-linkage':
    'materialAssetsEncumbranceAndInsuranceLinkage',
  'material-business-strategic-and-other-contracts': 'materialBusinessStrategicAndOtherContracts',
  'contract-materiality-expiry-and-inspection-readiness':
    'contractMaterialityExpiryAndInspectionReadiness',
  'reconciliation-changes-and-issuer-confirmations':
    'reconciliationChangesAndIssuerConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [BorrowingsAssetsContractsSectionId, BorrowingsAssetsContractsSectionKey]
>;

const EMPTY_PROGRESS: BorrowingsAssetsContractsProgress = {
  sections: {
    'financial-indebtedness-and-facility-master': 'not_started',
    'security-charges-guarantees-and-borrowing-powers': 'not_started',
    'covenants-defaults-waivers-and-lender-consents': 'not_started',
    'immovable-properties-and-occupancy-rights': 'not_started',
    'material-assets-encumbrance-and-insurance-linkage': 'not_started',
    'material-business-strategic-and-other-contracts': 'not_started',
    'contract-materiality-expiry-and-inspection-readiness': 'not_started',
    'reconciliation-changes-and-issuer-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: BorrowingsAssetsContractsPayload): BorrowingsAssetsContractsPayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: BorrowingsAssetsContractsPayload,
  baseline: BorrowingsAssetsContractsPayload,
  persisted: BorrowingsAssetsContractsPayload,
  savedSectionId: BorrowingsAssetsContractsSectionId,
): BorrowingsAssetsContractsPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type BorrowingsAssetsContractsContextValue = {
  payload: BorrowingsAssetsContractsPayload;
  version: number;
  progress: BorrowingsAssetsContractsProgress;
  model: BorrowingsAssetsContractsModel;
  assessment: BacAssessmentResponse | null;
  overview: BorrowingsAssetsContractsOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<BorrowingsAssetsContractsSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends BorrowingsAssetsContractsSectionKey>(
    sectionKey: K,
    value: BorrowingsAssetsContractsPayload[K],
    sectionId: BorrowingsAssetsContractsSectionId,
  ) => void;
  saveActiveSection: (sectionId: BorrowingsAssetsContractsSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: BorrowingsAssetsContractsSectionId) => void;
  confirmLeave: (sectionId?: BorrowingsAssetsContractsSectionId) => boolean;
  applySampleDraft: (sample: BorrowingsAssetsContractsPayload) => void;
  refreshDerived: () => Promise<void>;
};

const BorrowingsAssetsContractsContext =
  createContext<BorrowingsAssetsContractsContextValue | null>(null);

export function BorrowingsAssetsContractsProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<BorrowingsAssetsContractsPayload>(() =>
    createEmptyBorrowingsAssetsContractsPayload(),
  );
  const [baseline, setBaseline] = useState<BorrowingsAssetsContractsPayload>(() =>
    createEmptyBorrowingsAssetsContractsPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<BorrowingsAssetsContractsProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<BacAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<BorrowingsAssetsContractsOverviewSummaryResponse | null>(
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
        fetchBorrowingsAssetsContractsOverviewSummary(),
        fetchBorrowingsAssetsContractsAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Borrowings & Contracts Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeBorrowingsAssetsContractsWorkspace();
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
          setLoadError('Unable to load Borrowings, Assets & Contracts workspace.');
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
    if (isLoading) return new Set<BorrowingsAssetsContractsSectionId>();
    const next = new Set<BorrowingsAssetsContractsSectionId>();
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
    () => computeBorrowingsAssetsContractsModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const liveProgress = useMemo(() => calculateBorrowingsAssetsContractsProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const updateSection = useCallback(
    <K extends BorrowingsAssetsContractsSectionKey>(
      sectionKey: K,
      value: BorrowingsAssetsContractsPayload[K],
      _sectionId: BorrowingsAssetsContractsSectionId,
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
    (sectionId: BorrowingsAssetsContractsSectionId) => {
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
    (sectionId?: BorrowingsAssetsContractsSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const saveActiveSection = useCallback(
    async (sectionId: BorrowingsAssetsContractsSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveBorrowingsAssetsContractsSection(
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
          if (error.code === 'BORROWINGS_ASSETS_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: BorrowingsAssetsContractsPayload;
                  progress?: BorrowingsAssetsContractsProgress;
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

  const applySampleDraft = useCallback(
    (sample: BorrowingsAssetsContractsPayload) => {
      applyWorkstreamSampleDraft(sample, clonePayload, setPayload, () => {
        setSaveNotice(null);
        setSaveError(null);
      });
    },
    [],
  );

  const value = useMemo<BorrowingsAssetsContractsContextValue>(
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
    <BorrowingsAssetsContractsContext.Provider value={value}>
      {children}
    </BorrowingsAssetsContractsContext.Provider>
  );
}

export function useBorrowingsAssetsContracts(): BorrowingsAssetsContractsContextValue {
  const context = useContext(BorrowingsAssetsContractsContext);
  if (!context) {
    throw new Error(
      'useBorrowingsAssetsContracts must be used within BorrowingsAssetsContractsProvider',
    );
  }
  return context;
}

export type {
  BorrowingsAssetsContractsOverviewSummaryResponse as BorrowingsAssetsContractsOverviewSummary,
  BacAssessmentResponse,
};
