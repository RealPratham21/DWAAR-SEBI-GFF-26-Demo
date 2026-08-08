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
  fetchLitigationApprovalsComplianceAssessment,
  fetchLitigationApprovalsComplianceOverviewSummary,
  initializeLitigationApprovalsComplianceWorkspace,
  saveLitigationApprovalsComplianceSection,
} from '@/lib/api/litigation-approvals-compliance';
import type {
  ComputationsResponse,
  LacAssessmentResponse,
  LitigationApprovalsComplianceOverviewSummaryResponse,
} from '@/lib/litigation-approvals-compliance/api-types';
import {
  computeLitigationApprovalsComplianceModel,
  type LitigationApprovalsComplianceModel,
} from '@/lib/litigation-approvals-compliance/compute';
import { createEmptyLitigationApprovalsCompliancePayload } from '@/lib/litigation-approvals-compliance/defaults';
import { calculateLitigationApprovalsComplianceProgress } from '@/lib/litigation-approvals-compliance/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type LacProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/litigation-approvals-compliance/types';
import { useNotifications } from '@/lib/notifications/context';
import { applyWorkstreamSampleDraft } from '@/lib/demo-data/apply-sample-draft';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export type LitigationApprovalsComplianceSectionKey = Exclude<
  keyof LitigationApprovalsCompliancePayload,
  'schemaVersion'
>;

export const SECTION_PAYLOAD_KEYS: Record<
  LitigationApprovalsComplianceSectionId,
  LitigationApprovalsComplianceSectionKey
> = {
  'legal-universe-materiality-policy-and-party-mapping':
    'legalUniverseMaterialityPolicyAndPartyMapping',
  'litigation-and-proceedings-master': 'litigationAndProceedingsMaster',
  'criminal-regulatory-tax-and-enforcement-readiness':
    'criminalRegulatoryTaxAndEnforcementReadiness',
  'government-regulatory-and-business-approvals-master':
    'governmentRegulatoryAndBusinessApprovalsMaster',
  'approval-conditions-facility-compliance-and-renewal-readiness':
    'approvalConditionsFacilityComplianceAndRenewalReadiness',
  'corporate-statutory-and-operational-compliance-exceptions':
    'corporateStatutoryAndOperationalComplianceExceptions',
  'material-creditors-penalties-and-material-developments':
    'materialCreditorsPenaltiesAndMaterialDevelopments',
  'reconciliation-remediation-and-issuer-confirmations':
    'reconciliationRemediationAndIssuerConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [LitigationApprovalsComplianceSectionId, LitigationApprovalsComplianceSectionKey]
>;

const EMPTY_PROGRESS: LacProgress = {
  sections: {
    'legal-universe-materiality-policy-and-party-mapping': 'not_started',
    'litigation-and-proceedings-master': 'not_started',
    'criminal-regulatory-tax-and-enforcement-readiness': 'not_started',
    'government-regulatory-and-business-approvals-master': 'not_started',
    'approval-conditions-facility-compliance-and-renewal-readiness': 'not_started',
    'corporate-statutory-and-operational-compliance-exceptions': 'not_started',
    'material-creditors-penalties-and-material-developments': 'not_started',
    'reconciliation-remediation-and-issuer-confirmations': 'not_started',
  },
  sectionsComplete: 0,
  totalSections: 8,
  overallStatus: 'not_started',
};

function clonePayload(
  payload: LitigationApprovalsCompliancePayload,
): LitigationApprovalsCompliancePayload {
  return structuredClone(payload);
}

function mergePersistedPayload(
  current: LitigationApprovalsCompliancePayload,
  baseline: LitigationApprovalsCompliancePayload,
  persisted: LitigationApprovalsCompliancePayload,
  savedSectionId: LitigationApprovalsComplianceSectionId,
): LitigationApprovalsCompliancePayload {
  const merged = clonePayload(persisted);
  for (const [sectionId, sectionKey] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[sectionKey], baseline[sectionKey])) {
      merged[sectionKey] = structuredClone(current[sectionKey]) as never;
    }
  }
  return merged;
}

type LitigationApprovalsComplianceContextValue = {
  payload: LitigationApprovalsCompliancePayload;
  version: number;
  progress: LacProgress;
  model: LitigationApprovalsComplianceModel;
  assessment: LacAssessmentResponse | null;
  overview: LitigationApprovalsComplianceOverviewSummaryResponse | null;
  computations: ComputationsResponse | null;
  linkedReferences: LinkedWorkstreamReferences;
  dirtySections: Set<LitigationApprovalsComplianceSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  derivedError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends LitigationApprovalsComplianceSectionKey>(
    sectionKey: K,
    value: LitigationApprovalsCompliancePayload[K],
    sectionId: LitigationApprovalsComplianceSectionId,
  ) => void;
  saveActiveSection: (sectionId: LitigationApprovalsComplianceSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: LitigationApprovalsComplianceSectionId) => void;
  confirmLeave: (sectionId?: LitigationApprovalsComplianceSectionId) => boolean;
  applySampleDraft: (sample: LitigationApprovalsCompliancePayload) => void;
  refreshDerived: () => Promise<void>;
};

const LitigationApprovalsComplianceContext =
  createContext<LitigationApprovalsComplianceContextValue | null>(null);

export function LitigationApprovalsComplianceProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<LitigationApprovalsCompliancePayload>(() =>
    createEmptyLitigationApprovalsCompliancePayload(),
  );
  const [baseline, setBaseline] = useState<LitigationApprovalsCompliancePayload>(() =>
    createEmptyLitigationApprovalsCompliancePayload(),
  );
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<LacProgress>(EMPTY_PROGRESS);
  const [computations, setComputations] = useState<ComputationsResponse | null>(null);
  const [assessment, setAssessment] = useState<LacAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<LitigationApprovalsComplianceOverviewSummaryResponse | null>(
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
        fetchLitigationApprovalsComplianceOverviewSummary(),
        fetchLitigationApprovalsComplianceAssessment(),
      ]);
      setOverview(overviewResponse);
      setAssessment(assessmentResponse);
      setDerivedError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDerivedError(error.message);
      } else {
        setDerivedError('Unable to refresh Overview or Legal & Compliance Assessment.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeLitigationApprovalsComplianceWorkspace();
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
          setLoadError('Unable to load Litigation, Approvals & Compliance workspace.');
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
    if (isLoading) return new Set<LitigationApprovalsComplianceSectionId>();
    const next = new Set<LitigationApprovalsComplianceSectionId>();
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
    () => computeLitigationApprovalsComplianceModel(payload, linkedReferences),
    [linkedReferences, payload],
  );

  const liveProgress = useMemo(
    () => calculateLitigationApprovalsComplianceProgress(payload),
    [payload],
  );
  const displayProgress = dirtySections.size > 0 ? liveProgress : progress;

  const updateSection = useCallback(
    <K extends LitigationApprovalsComplianceSectionKey>(
      sectionKey: K,
      value: LitigationApprovalsCompliancePayload[K],
      _sectionId: LitigationApprovalsComplianceSectionId,
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
    (sectionId: LitigationApprovalsComplianceSectionId) => {
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
    (sectionId?: LitigationApprovalsComplianceSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const saveActiveSection = useCallback(
    async (sectionId: LitigationApprovalsComplianceSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveLitigationApprovalsComplianceSection(
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
          if (error.code === 'LITIGATION_APPROVALS_COMPLIANCE_VERSION_CONFLICT') {
            const details = error.details as
              | {
                  currentVersion?: number;
                  payload?: LitigationApprovalsCompliancePayload;
                  progress?: LacProgress;
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
    (sample: LitigationApprovalsCompliancePayload) => {
      applyWorkstreamSampleDraft(sample, clonePayload, setPayload, () => {
        setSaveNotice(null);
        setSaveError(null);
      });
    },
    [],
  );

  const value = useMemo<LitigationApprovalsComplianceContextValue>(
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
    <LitigationApprovalsComplianceContext.Provider value={value}>
      {children}
    </LitigationApprovalsComplianceContext.Provider>
  );
}

export function useLitigationApprovalsCompliance(): LitigationApprovalsComplianceContextValue {
  const context = useContext(LitigationApprovalsComplianceContext);
  if (!context) {
    throw new Error(
      'useLitigationApprovalsCompliance must be used within LitigationApprovalsComplianceProvider',
    );
  }
  return context;
}

export type {
  LacAssessmentResponse,
  LitigationApprovalsComplianceOverviewSummaryResponse as LitigationApprovalsComplianceOverviewSummary,
};
