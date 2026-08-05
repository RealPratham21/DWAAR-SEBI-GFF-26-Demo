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
import { formatCompanyClass } from '@/lib/workspace/format';

const SECTION_PAYLOAD_KEYS: Record<IpoSetupSectionId, keyof IpoSetupPayload> = {
  'ipo-direction': 'ipoDirection',
  'offer-structure': 'offerStructure',
  'track-record-financial': 'trackRecordAndFinancialEligibility',
  'eligibility-declarations': 'eligibilityDeclarations',
  'process-readiness': 'processReadiness',
  'issuer-confirmations': 'issuerConfirmations',
};

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
  confirmLeave: () => boolean;
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
  const [dirtySections, setDirtySections] = useState<Set<IpoSetupSectionId>>(new Set());
  const [sectionSnapshots, setSectionSnapshots] = useState<
    Partial<Record<IpoSetupSectionId, unknown>>
  >({});
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
      sectionId: IpoSetupSectionId,
    ) => {
      setSectionSnapshots((current) => {
        if (current[sectionId] !== undefined) return current;
        return { ...current, [sectionId]: payload[sectionKey] };
      });
      setPayload((current) => ({ ...current, [sectionKey]: value }));
      setDirtySections((current) => new Set(current).add(sectionId));
      setSaveNotice(null);
      setSaveError(null);
    },
    [payload],
  );

  const discardSectionDraft = useCallback((sectionId: IpoSetupSectionId) => {
    const snapshot = sectionSnapshots[sectionId];
    const key = SECTION_PAYLOAD_KEYS[sectionId];
    if (snapshot !== undefined) {
      setPayload((current) => ({ ...current, [key]: snapshot }));
    }
    setDirtySections((current) => {
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });
    setSectionSnapshots((current) => {
      const next = { ...current };
      delete next[sectionId];
      return next;
    });
    setSaveError(null);
  }, [sectionSnapshots]);

  const clearSaveNotice = useCallback(() => setSaveNotice(null), []);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const saveActiveSection = useCallback(
    async (sectionId: IpoSetupSectionId) => {
      const key = SECTION_PAYLOAD_KEYS[sectionId];
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await saveIpoSetupSection(sectionId, version, payload[key] as never);
        setPayload(response.payload);
        setVersion(response.version);
        setProgress(response.progress);
        setPersistedOffer(offerResponseToComputations(response.offerComputations));
        setDirtySections((current) => {
          const next = new Set(current);
          next.delete(sectionId);
          return next;
        });
        setSectionSnapshots((current) => {
          const next = { ...current };
          delete next[sectionId];
          return next;
        });
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
              setPayload(details.payload);
              setVersion(details.currentVersion);
              setProgress(details.progress);
              if (details.offerComputations) {
                setPersistedOffer(offerResponseToComputations(details.offerComputations));
              }
              setDirtySections(new Set());
              setSectionSnapshots({});
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
    [payload, prependNotification, refreshDerived, version],
  );

  const confirmLeave = useCallback(() => {
    if (dirtySections.size === 0) return true;
    return window.confirm(
      'You have unsaved section changes. Leave without saving?',
    );
  }, [dirtySections]);

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
      refreshDerived,
    }),
    [
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
