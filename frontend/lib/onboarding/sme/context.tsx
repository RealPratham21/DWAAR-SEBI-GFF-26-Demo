'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiClientError } from '@/lib/api/errors';
import {
  fetchCurrentSmeOnboarding,
  saveSmeOnboardingStep,
  submitSmeOnboarding,
  type OnboardingApplicationResponse,
} from '@/lib/api/onboarding';
import { createEmptySmeOnboardingData } from '@/lib/onboarding/sme/defaults';
import { stepSchemas } from '@/lib/onboarding/sme/schemas';
import {
  backendStepToNumber,
  DRAFT_KEY_BY_STEP,
  isStepCompleted as isBackendStepCompleted,
  isStepUnlocked as isBackendStepUnlocked,
  mergeDraftData,
} from '@/lib/onboarding/sme/step-mapping';
import type {
  SmeOnboardingData,
  SmeOnboardingStepId,
  SubmissionConfirmations,
} from '@/lib/onboarding/sme/types';

import type { ZodError } from 'zod';

interface SmeSignupContextValue {
  onboardingId: string | null;
  onboardingStatus: string | null;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  fieldErrors: Record<string, string>;
  onboardingData: SmeOnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<SmeOnboardingData>>;
  updateOnboardingSection: <K extends keyof SmeOnboardingData>(
    section: K,
    value: SmeOnboardingData[K],
  ) => void;
  currentStep: SmeOnboardingStepId;
  setCurrentStep: (step: SmeOnboardingStepId) => void;
  completedSteps: string[];
  isStepUnlocked: (step: number) => boolean;
  isStepCompleted: (step: number) => boolean;
  validateStep: (step: SmeOnboardingStepId) => { success: boolean; errors?: Record<string, string> };
  hydrateOnboarding: () => Promise<void>;
  persistStep: (step: SmeOnboardingStepId) => Promise<OnboardingApplicationResponse>;
  submitOnboarding: (confirmations: SubmissionConfirmations) => Promise<{ redirectTo: string }>;
  documentFiles: Record<string, File | null>;
  setDocumentFile: (documentId: string, file: File | null) => void;
}

const SmeSignupContext = createContext<SmeSignupContextValue | null>(null);

function flattenZodErrors(error: ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function mapApiValidationErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) {
    return {};
  }
  const errors: Record<string, string> = {};
  for (const item of details) {
    if (typeof item === 'object' && item !== null && 'field' in item && 'message' in item) {
      errors[String((item as { field: string }).field)] = String((item as { message: string }).message);
    }
  }
  return errors;
}

function applyApplicationState(
  application: OnboardingApplicationResponse,
  setters: {
    setOnboardingId: (value: string) => void;
    setOnboardingStatus: (value: string) => void;
    setOnboardingData: (value: SmeOnboardingData) => void;
    setCompletedSteps: (value: string[]) => void;
    setCurrentStep: (value: SmeOnboardingStepId) => void;
  },
) {
  setters.setOnboardingId(application.id);
  setters.setOnboardingStatus(application.status);
  setters.setOnboardingData(mergeDraftData(application.draftData));
  setters.setCompletedSteps(application.completedSteps);
  setters.setCurrentStep(backendStepToNumber(application.currentStep));
}

export function SmeSignupProvider({ children }: { children: ReactNode }) {
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [onboardingData, setOnboardingData] = useState<SmeOnboardingData>(
    createEmptySmeOnboardingData,
  );
  const [currentStep, setCurrentStep] = useState<SmeOnboardingStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});

  const applyResponse = useCallback((application: OnboardingApplicationResponse) => {
    applyApplicationState(application, {
      setOnboardingId,
      setOnboardingStatus,
      setOnboardingData,
      setCompletedSteps,
      setCurrentStep,
    });
  }, []);

  const hydrateOnboarding = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const application = await fetchCurrentSmeOnboarding();
      applyResponse(application);
    } catch (error) {
      setLoadError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to load onboarding progress.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyResponse]);

  const updateOnboardingSection = useCallback(
    <K extends keyof SmeOnboardingData>(section: K, value: SmeOnboardingData[K]) => {
      setOnboardingData((current) => ({ ...current, [section]: value }));
    },
    [],
  );

  const isStepCompleted = useCallback(
    (step: number) => isBackendStepCompleted(completedSteps, step as SmeOnboardingStepId),
    [completedSteps],
  );

  const isStepUnlocked = useCallback(
    (step: number) => isBackendStepUnlocked(completedSteps, step as SmeOnboardingStepId),
    [completedSteps],
  );

  const validateStep = useCallback(
    (step: SmeOnboardingStepId) => {
      const schema = stepSchemas[step];
      const draftKey = DRAFT_KEY_BY_STEP[step];
      const result = schema.safeParse(onboardingData[draftKey]);
      if (result.success) {
        return { success: true };
      }
      return { success: false, errors: flattenZodErrors(result.error) };
    },
    [onboardingData],
  );

  const persistStep = useCallback(
    async (step: SmeOnboardingStepId) => {
      if (!onboardingId) {
        throw new Error('Onboarding application is not loaded.');
      }
      setIsSaving(true);
      setSaveError(null);
      setFieldErrors({});
      const draftKey = DRAFT_KEY_BY_STEP[step];
      try {
        const application = await saveSmeOnboardingStep(
          onboardingId,
          step,
          onboardingData[draftKey] as object,
        );
        applyResponse(application);
        return application;
      } catch (error) {
        if (error instanceof ApiClientError && error.code === 'ONBOARDING_VALIDATION_ERROR') {
          setFieldErrors(mapApiValidationErrors(error.details));
        }
        setSaveError(
          error instanceof ApiClientError ? error.message : 'Unable to save this step.',
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [applyResponse, onboardingData, onboardingId],
  );

  const submitOnboarding = useCallback(
    async (confirmations: SubmissionConfirmations) => {
      if (!onboardingId) {
        throw new Error('Onboarding application is not loaded.');
      }
      setIsSaving(true);
      setSaveError(null);
      setFieldErrors({});
      try {
        const response = await submitSmeOnboarding(onboardingId, confirmations);
        setOnboardingStatus(response.status);
        return { redirectTo: response.redirectTo };
      } catch (error) {
        if (error instanceof ApiClientError && error.code === 'ONBOARDING_VALIDATION_ERROR') {
          setFieldErrors(mapApiValidationErrors(error.details));
        }
        setSaveError(
          error instanceof ApiClientError ? error.message : 'Unable to submit onboarding.',
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [onboardingId],
  );

  const setDocumentFile = useCallback((documentId: string, file: File | null) => {
    setDocumentFiles((current) => ({ ...current, [documentId]: file }));
    setOnboardingData((current) => ({
      ...current,
      initialDocuments: {
        ...current.initialDocuments,
        selections: {
          ...current.initialDocuments.selections,
          [documentId]: file
            ? {
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
              }
            : null,
        },
      },
    }));
  }, []);

  const value = useMemo<SmeSignupContextValue>(
    () => ({
      onboardingId,
      onboardingStatus,
      isLoading,
      loadError,
      isSaving,
      saveError,
      fieldErrors,
      onboardingData,
      setOnboardingData,
      updateOnboardingSection,
      currentStep,
      setCurrentStep,
      completedSteps,
      isStepUnlocked,
      isStepCompleted,
      validateStep,
      hydrateOnboarding,
      persistStep,
      submitOnboarding,
      documentFiles,
      setDocumentFile,
    }),
    [
      onboardingId,
      onboardingStatus,
      isLoading,
      loadError,
      isSaving,
      saveError,
      fieldErrors,
      onboardingData,
      updateOnboardingSection,
      currentStep,
      completedSteps,
      isStepUnlocked,
      isStepCompleted,
      validateStep,
      hydrateOnboarding,
      persistStep,
      submitOnboarding,
      documentFiles,
      setDocumentFile,
    ],
  );

  return <SmeSignupContext.Provider value={value}>{children}</SmeSignupContext.Provider>;
}

export function useSmeSignup() {
  const context = useContext(SmeSignupContext);
  if (!context) {
    throw new Error('useSmeSignup must be used within SmeSignupProvider');
  }
  return context;
}
