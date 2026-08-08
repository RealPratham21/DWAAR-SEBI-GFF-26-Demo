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
  fetchBusinessOperationsAssessment,
  fetchBusinessOperationsOverviewSummary,
  initializeBusinessOperationsWorkspace,
  saveBusinessOperationsSection,
} from '@/lib/api/business-operations';
import type {
  BusinessAssessmentResponse,
  BusinessOperationsOverviewSummary,
  CompanyReference,
  ComputationsResponse,
  WorkspaceProgress,
} from '@/lib/business-operations/api-types';
import {
  computeBusinessOperationsModel,
  type BusinessOperationsModel,
} from '@/lib/business-operations/compute';
import { createEmptyBusinessOperationsPayload } from '@/lib/business-operations/defaults';
import { calculateBusinessOperationsProgress } from '@/lib/business-operations/progress';
import {
  type BusinessOperationsProgress,
  type LinkedWorkstreamPlaceholder,
  type LinkedWorkstreamReferences,
} from '@/lib/business-operations/types';
import { useNotifications } from '@/lib/notifications/context';
import { applyWorkstreamSampleDraft } from '@/lib/demo-data/apply-sample-draft';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import { formatCompanyClass } from '@/lib/workspace/format';
import type {
  BusinessOperationsPayload,
  BusinessOperationsSectionId,
} from '@/lib/schemas/business-operations';

/** Payload keys that a section writes to. `schemaVersion` is never edited from the UI. */
export type BusinessOperationsSectionKey = Exclude<keyof BusinessOperationsPayload, 'schemaVersion'>;

export const BUSINESS_OPERATIONS_SECTION_PAYLOAD_KEYS: Record<
  BusinessOperationsSectionId,
  BusinessOperationsSectionKey
> = {
  'business-profile-operating-model': 'businessProfileAndOperatingModel',
  'products-services-revenue-mix': 'productsServicesAndRevenueMix',
  'customers-sales-distribution-geography': 'customersSalesDistributionAndGeography',
  'suppliers-procurement-inventory-logistics': 'suppliersProcurementInventoryAndLogistics',
  'facilities-capacity-operational-process': 'facilitiesCapacityAndOperationalProcess',
  'technology-quality-rd-ip': 'technologyQualityResearchAndIntellectualProperty',
  'workforce-collaborations-insurance-continuity':
    'workforceCollaborationsInsuranceAndContinuity',
  'competitive-strengths-strategy-confirmations':
    'competitiveStrengthsStrategyDependenciesAndConfirmations',
};

export type BusinessOperationsCompanyReference = CompanyReference;
export type { BusinessOperationsOverviewSummary };

const SECTION_ENTRIES = Object.entries(BUSINESS_OPERATIONS_SECTION_PAYLOAD_KEYS) as Array<
  [BusinessOperationsSectionId, BusinessOperationsSectionKey]
>;

const EMPTY_COMPANY_REFERENCE: BusinessOperationsCompanyReference = {
  available: false,
  legalName: null,
  companyClass: null,
  cin: null,
};

const EMPTY_LINKED_PLACEHOLDERS: {
  financials: LinkedWorkstreamPlaceholder;
  industry: LinkedWorkstreamPlaceholder;
  objectsOfTheIssue: LinkedWorkstreamPlaceholder;
  assets: LinkedWorkstreamPlaceholder;
  compliance: LinkedWorkstreamPlaceholder;
} = {
  financials: { available: false },
  industry: { available: false },
  objectsOfTheIssue: { available: false },
  assets: { available: false },
  compliance: { available: false },
};

const EMPTY_PROGRESS: WorkspaceProgress = {
  sections: {
    'business-profile-operating-model': 'not_started',
    'products-services-revenue-mix': 'not_started',
    'customers-sales-distribution-geography': 'not_started',
    'suppliers-procurement-inventory-logistics': 'not_started',
    'facilities-capacity-operational-process': 'not_started',
    'technology-quality-rd-ip': 'not_started',
    'workforce-collaborations-insurance-continuity': 'not_started',
    'competitive-strengths-strategy-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(payload: BusinessOperationsPayload): BusinessOperationsPayload {
  return structuredClone(payload);
}

/**
 * Server state wins for the section just saved and for sections the user has not touched,
 * while sections still holding edits keep their draft.
 */
function mergePersistedPayload(
  current: BusinessOperationsPayload,
  baseline: BusinessOperationsPayload,
  persisted: BusinessOperationsPayload,
  savedSectionId: BusinessOperationsSectionId,
): BusinessOperationsPayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type BusinessOperationsContextValue = {
  payload: BusinessOperationsPayload;
  version: number;
  progress: BusinessOperationsProgress;
  model: BusinessOperationsModel;
  assessment: BusinessAssessmentResponse | null;
  overview: BusinessOperationsOverviewSummary | null;
  computations: ComputationsResponse | null;
  companyReference: BusinessOperationsCompanyReference;
  linkedPlaceholders: typeof EMPTY_LINKED_PLACEHOLDERS;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<BusinessOperationsSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends BusinessOperationsSectionKey>(
    sectionKey: K,
    value: BusinessOperationsPayload[K],
    sectionId: BusinessOperationsSectionId,
  ) => void;
  saveActiveSection: (sectionId: BusinessOperationsSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: BusinessOperationsSectionId) => void;
  /** Prompts only when there is a real difference. Scoped to one section when an id is given. */
  confirmLeave: (sectionId?: BusinessOperationsSectionId) => boolean;
  applySampleDraft: (sample: BusinessOperationsPayload) => void;
  refreshDerived: () => Promise<void>;
};

const BusinessOperationsContext = createContext<BusinessOperationsContextValue | null>(null);

export function BusinessOperationsProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<BusinessOperationsPayload>(() =>
    createEmptyBusinessOperationsPayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<WorkspaceProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<BusinessAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<BusinessOperationsOverviewSummary | null>(null);
  const [companyReference, setCompanyReference] =
    useState<BusinessOperationsCompanyReference>(EMPTY_COMPANY_REFERENCE);
  const [linkedPlaceholders, setLinkedPlaceholders] = useState(EMPTY_LINKED_PLACEHOLDERS);
  /** Last state known to be persisted. Every dirty flag is derived from a diff against this. */
  const [baseline, setBaseline] = useState<BusinessOperationsPayload>(() =>
    createEmptyBusinessOperationsPayload(),
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
        fetchBusinessOperationsOverviewSummary(),
        fetchBusinessOperationsAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      if (overviewResponse.companyReference) {
        setCompanyReference(overviewResponse.companyReference);
      }
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Business Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeBusinessOperationsWorkspace();
        if (cancelled) return;
        const loaded = clonePayload(response.payload);
        setBaseline(loaded);
        setPayload(clonePayload(loaded));
        setVersion(response.version);
        setProgress(response.progress);
        setComputations(response.computations);
        setCompanyReference(response.companyReference);
        setLinkedPlaceholders({
          financials: response.linkedReferences.financials,
          industry: response.linkedReferences.industry,
          objectsOfTheIssue: response.linkedReferences.objectsOfTheIssue,
          assets: response.linkedReferences.assets,
          compliance: response.linkedReferences.compliance,
        });
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load Business & Operations workspace.');
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
    if (isLoading) return new Set<BusinessOperationsSectionId>();
    const next = new Set<BusinessOperationsSectionId>();
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

  const liveProgress = useMemo(() => calculateBusinessOperationsProgress(payload), [payload]);
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const model = useMemo(() => computeBusinessOperationsModel(payload), [payload]);

  const linkedReferences = useMemo<LinkedWorkstreamReferences>(
    () => ({
      company: companyReference,
      ...linkedPlaceholders,
    }),
    [companyReference, linkedPlaceholders],
  );

  const updateSection = useCallback(
    <K extends BusinessOperationsSectionKey>(
      sectionKey: K,
      value: BusinessOperationsPayload[K],
      _sectionId: BusinessOperationsSectionId,
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
    (sectionId: BusinessOperationsSectionId) => {
      const sectionKey = BUSINESS_OPERATIONS_SECTION_PAYLOAD_KEYS[sectionId];
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

  const applySampleDraft = useCallback(
    (sample: BusinessOperationsPayload) => {
      applyWorkstreamSampleDraft(sample, clonePayload, setPayload, () => {
        setSaveNotice(null);
        setSaveError(null);
      });
    },
    [],
  );

  const saveActiveSection = useCallback(
    async (sectionId: BusinessOperationsSectionId) => {
      const key = BUSINESS_OPERATIONS_SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveBusinessOperationsSection(
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
          if (error.code === 'BUSINESS_OPERATIONS_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: BusinessOperationsPayload;
                  progress?: WorkspaceProgress;
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
    (sectionId?: BusinessOperationsSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const value = useMemo<BusinessOperationsContextValue>(
    () => ({
      payload,
      version,
      progress: displayProgress,
      model,
      assessment,
      overview,
      computations,
      companyReference,
      linkedPlaceholders,
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
      companyReference,
      computations,
      confirmLeave,
      derivedError,
      dirtySections,
      discardSectionDraft,
      displayProgress,
      isLoading,
      isSaving,
      linkedPlaceholders,
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
    <BusinessOperationsContext.Provider value={value}>
      {children}
    </BusinessOperationsContext.Provider>
  );
}

export function useBusinessOperations(): BusinessOperationsContextValue {
  const context = useContext(BusinessOperationsContext);
  if (!context) {
    throw new Error('useBusinessOperations must be used within BusinessOperationsProvider');
  }
  return context;
}

export function formatReferencedCompanyClass(value: string | null | undefined): string {
  if (!value) return 'Not available from Company & Incorporation';
  return formatCompanyClass(value);
}
