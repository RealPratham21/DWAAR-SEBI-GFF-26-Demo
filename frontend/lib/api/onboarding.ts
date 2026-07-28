import { apiRequest } from '@/lib/api/client';
import type { SmeOnboardingData, SubmissionConfirmations } from '@/lib/onboarding/sme/types';
import { STEP_NUMBER_TO_ROUTE } from '@/lib/onboarding/sme/step-mapping';
import type { SmeOnboardingStepId } from '@/lib/onboarding/sme/types';

export interface OnboardingApplicationResponse {
  id: string;
  status: string;
  currentStep: string;
  completedSteps: string[];
  draftData: SmeOnboardingData;
  schemaVersion: number;
  version: number;
  submittedAt?: string | null;
}

export interface SubmitOnboardingResponse {
  id: string;
  status: string;
  nextAction: 'open_dashboard';
  redirectTo: string;
}

export async function createOrGetSmeOnboarding(): Promise<OnboardingApplicationResponse> {
  return apiRequest<OnboardingApplicationResponse>('/onboarding/sme', { method: 'POST' });
}

export async function fetchCurrentSmeOnboarding(): Promise<OnboardingApplicationResponse> {
  return apiRequest<OnboardingApplicationResponse>('/onboarding/sme/current', { method: 'GET' });
}

export async function saveSmeOnboardingStep<T extends object>(
  onboardingId: string,
  step: SmeOnboardingStepId,
  payload: T,
): Promise<OnboardingApplicationResponse> {
  const route = STEP_NUMBER_TO_ROUTE[step];
  return apiRequest<OnboardingApplicationResponse>(
    `/onboarding/sme/${onboardingId}/${route}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function submitSmeOnboarding(
  onboardingId: string,
  confirmations: SubmissionConfirmations,
): Promise<SubmitOnboardingResponse> {
  return apiRequest<SubmitOnboardingResponse>(`/onboarding/sme/${onboardingId}/submit`, {
    method: 'POST',
    body: { submissionConfirmations: confirmations },
  });
}
