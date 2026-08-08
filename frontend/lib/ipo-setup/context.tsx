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
  fetchIpoSetupEligibilityAssessment,
  fetchIpoSetupOverviewSummary,
  initializeIpoSetupWorkspace,
  saveIpoSetupSection,
} from '@/lib/api/ipo-setup';
import type {
  CompanyReference,
  EligibilityAssessmentResponse,
  IpoSetupOverviewSummary,
  OfferComputationsResponse,
  WorkspaceProgress,
} from '@/lib/ipo-setup/api-types';
import { createEmptyIpoSetupPayload } from '@/lib/ipo-setup/defaults';
import { computeOfferFromPayload, type OfferComputations } from '@/lib/ipo-setup/offer-compute';
import { useNotifications } from '@/lib/notifications/context';
import type { IpoSetupPayload, IpoSetupSectionId } from '@/lib/schemas/ipo-setup';
import { applyWorkstreamSampleDraft } from '@/lib/demo-data/apply-sample-draft';
import { isDeepEqual } from '@/lib/workspace/deep-equal';
import { formatCompanyClass } from '@/lib/workspace/format';

const SECTION_PAYLOAD_KEYS: Record<IpoSetupSectionId, keyof IpoSetupPayload> = {
  'ipo-direction': 'ipoDirection',
  'offer-structure': 'offerStructure',
  'track-record-financial': 'trackRecordAndFinancialEligibility',
  'eligibility-declarations': 'eligibilityDeclarations',
  'process-readiness': 'processReadiness',
  'issuer-confirmations': 'issuerConfirmations',
};

const SECTION_ENTRIES = Object.entries(SECTION_PAYLOAD_KEYS) as Array<
  [IpoSetupSectionId, keyof IpoSetupPayload]
>;

function clonePayload(payload: IpoSetupPayload): IpoSetupPayload {
  return structuredClone(payload);
}

/**
 * Server state wins for the section just saved and for sections the user has not touched,
 * while sections still holding edits keep their draft.
 */
function mergePersistedPayload(
  current: IpoSetupPayload,
  baseline: IpoSetupPayload,
  persisted: IpoSetupPayload,
  savedSectionId: IpoSetupSectionId,
): IpoSetupPayload {
  const merged: Record<string, unknown> = { ...persisted };
  for (const [sectionId, key] of SECTION_ENTRIES) {
    if (sectionId === savedSectionId) continue;
    if (!isDeepEqual(current[key], baseline[key])) merged[key] = current[key];
  }
  return merged as IpoSetupPayload;
}

function parseNullableNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function offerResponseToComputations(
  response: OfferComputationsResponse,
): OfferComputations {
  return {
    includesFreshIssue: response.includesFreshIssue,
    includesOfs: response.includesOfs,
    totalSharesOffered: parseNullableNumber(response.totalSharesOffered),
    totalOfferAmount: parseNullableNumber(response.totalOfferAmount),
    freshIssuePercentageOfOffer: parseNullableNumber(response.freshIssuePercentageOfOffer),
    ofsPercentageOfOffer: parseNullableNumber(response.ofsPercentageOfOffer),
    proposedPostIssueShares: parseNullableNumber(response.proposedPostIssueShares),
    proposedPostIssuePaidUpCapital: parseNullableNumber(response.proposedPostIssuePaidUpCapital),
    offerAsPercentageOfPostIssueCapital: parseNullableNumber(
      response.offerAsPercentageOfPostIssueCapital,
    ),
    paidUpCapitalIncreaseFromOffer: parseNullableNumber(response.paidUpCapitalIncreaseFromOffer),
  };
}

type IpoSetupContextValue = {
  payload: IpoSetupPayload;
  version: number;
  progress: WorkspaceProgress | null;
  offerComputations: OfferComputations;
  assessment: EligibilityAssessmentResponse | null;
  overview: IpoSetupOverviewSummary | null;
  companyReference: CompanyReference;
  dirtySections: Set<IpoSetupSectionId>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveNotice: string | null;
  saveError: string | null;
  clearSaveNotice: () => void;
  clearSaveError: () => void;
  updateSection: <K extends keyof IpoSetupPayload>(
    sectionKey: K,
    value: IpoSetupPayload[K],
    sectionId: IpoSetupSectionId,
  ) => void;
  saveActiveSection: (sectionId: IpoSetupSectionId) => Promise<boolean>;
  discardSectionDraft: (sectionId: IpoSetupSectionId) => void;
  /** Prompts only when there is a real difference. Scoped to one section when an id is given. */
  confirmLeave: (sectionId?: IpoSetupSectionId) => boolean;
  applySampleDraft: (sample: IpoSetupPayload) => void;
  refreshDerived: () => Promise<void>;
};

const IpoSetupContext = createContext<IpoSetupContextValue | null>(null);

const emptyCompanyReference: CompanyReference = {
  legalName: null,
  companyClass: null,
  cin: null,
  available: false,
};

export function IpoSetupProvider({ children }: { children: ReactNode }) {
  const { prependNotification } = useNotifications();
  const [payload, setPayload] = useState<IpoSetupPayload>(() => createEmptyIpoSetupPayload());
  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<WorkspaceProgress | null>(null);
  const [persistedOffer, setPersistedOffer] = useState<OfferComputations | null>(null);
  const [assessment, setAssessment] = useState<EligibilityAssessmentResponse | null>(null);
  const [overview, setOverview] = useState<IpoSetupOverviewSummary | null>(null);
  const [companyReference, setCompanyReference] =
    useState<CompanyReference>(emptyCompanyReference);
  /** Last state known to be persisted. Every dirty flag is derived from a diff against this. */
  const [baseline, setBaseline] = useState<IpoSetupPayload>(() => payload);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshDerived = useCallback(async () => {
    const [overviewResponse, assessmentResponse] = await Promise.all([
      fetchIpoSetupOverviewSummary(),
      fetchIpoSetupEligibilityAssessment(),
    ]);
    setOverview(overviewResponse);
    setAssessment(assessmentResponse);
    setPersistedOffer(offerResponseToComputations(assessmentResponse.offerComputations));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await initializeIpoSetupWorkspace();
        if (cancelled) return;
        setBaseline(response.payload);
        setPayload(response.payload);
        setVersion(response.version);
        setProgress(response.progress);
        setCompanyReference(response.companyReference);
        setPersistedOffer(offerResponseToComputations(response.offerComputations));
        await refreshDerived();
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setLoadError(error.message);
        } else {
          setLoadError('Unable to load IPO Setup & Eligibility workspace.');
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
    if (isLoading) return new Set<IpoSetupSectionId>();
    const next = new Set<IpoSetupSectionId>();
    for (const [sectionId, key] of SECTION_ENTRIES) {
      if (!isDeepEqual(payload[key], baseline[key])) next.add(sectionId);
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

  const liveOffer = useMemo(() => computeOfferFromPayload(payload), [payload]);
  const offerComputations = dirtySections.has('offer-structure') || dirtySections.has('ipo-direction')
    ? liveOffer
    : persistedOffer ?? liveOffer;

  const updateSection = useCallback(
    <K extends keyof IpoSetupPayload>(
      sectionKey: K,
      value: IpoSetupPayload[K],
      _sectionId: IpoSetupSectionId,
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
    (sectionId: IpoSetupSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setPayload((current) => ({ ...current, [key]: baseline[key] }));
      setSaveError(null);
    },
    [baseline],
  );

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const applySampleDraft = useCallback(
    (sample: IpoSetupPayload) => {
      applyWorkstreamSampleDraft(sample, clonePayload, setPayload, () => {
        setSaveNotice(null);
        setSaveError(null);
      });
    },
    [],
  );

  const saveActiveSection = useCallback(
    async (sectionId: IpoSetupSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveIpoSetupSection(sectionId, version, payload[key] as never);
        setBaseline(response.payload);
        setPayload((current) =>
          mergePersistedPayload(current, baseline, response.payload, sectionId),
        );
        setVersion(response.version);
        setProgress(response.progress);
        setPersistedOffer(offerResponseToComputations(response.offerComputations));
        prependNotification(response.notification);
        setSaveNotice(response.acknowledgement.message);
        await refreshDerived();
        return true;
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.code === 'IPO_SETUP_VERSION_CONFLICT') {
            const details = error.details as {
              currentVersion?: number;
              payload?: IpoSetupPayload;
              progress?: WorkspaceProgress;
              offerComputations?: OfferComputationsResponse;
            } | undefined;
            if (details?.payload && details.currentVersion && details.progress) {
              setBaseline(details.payload);
              setPayload(details.payload);
              setVersion(details.currentVersion);
              setProgress(details.progress);
              if (details.offerComputations) {
                setPersistedOffer(offerResponseToComputations(details.offerComputations));
              }
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
    (sectionId?: IpoSetupSectionId) => {
      if (isLoading) return true;
      const hasChanges = sectionId ? dirtySections.has(sectionId) : dirtySections.size > 0;
      if (!hasChanges) return true;
      return window.confirm('You have unsaved section changes. Leave without saving?');
    },
    [dirtySections, isLoading],
  );

  const value = useMemo<IpoSetupContextValue>(
    () => ({
      payload,
      version,
      progress,
      offerComputations,
      assessment,
      overview,
      companyReference,
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
      applySampleDraft,
      refreshDerived,
    }),
    [
      applySampleDraft,
      assessment,
      clearSaveError,
      clearSaveNotice,
      companyReference,
      confirmLeave,
      dirtySections,
      discardSectionDraft,
      isLoading,
      isSaving,
      loadError,
      offerComputations,
      overview,
      payload,
      progress,
      refreshDerived,
      saveActiveSection,
      saveError,
      saveNotice,
      updateSection,
      version,
    ],
  );

  return <IpoSetupContext.Provider value={value}>{children}</IpoSetupContext.Provider>;
}

export function useIpoSetup(): IpoSetupContextValue {
  const ctx = useContext(IpoSetupContext);
  if (!ctx) {
    throw new Error('useIpoSetup must be used within IpoSetupProvider');
  }
  return ctx;
}

export function formatReferencedCompanyClass(value: string | null | undefined): string {
  if (!value) return 'Not available from Company & Incorporation';
  return formatCompanyClass(value);
}
