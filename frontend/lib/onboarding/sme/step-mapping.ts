import { createEmptySmeOnboardingData } from '@/lib/onboarding/sme/defaults';
import type { SmeOnboardingData, SmeOnboardingStepId } from '@/lib/onboarding/sme/types';

export const STEP_NUMBER_TO_BACKEND: Record<SmeOnboardingStepId, string> = {
  1: 'role_authority',
  2: 'company_identity',
  3: 'business_classification',
  4: 'ownership_snapshot',
  5: 'ipo_intent',
  6: 'initial_documents',
  7: 'review_submit',
};

export const BACKEND_STEP_TO_NUMBER: Record<string, SmeOnboardingStepId> = {
  role_authority: 1,
  company_identity: 2,
  business_classification: 3,
  ownership_snapshot: 4,
  ipo_intent: 5,
  initial_documents: 6,
  review_submit: 7,
};

export const STEP_NUMBER_TO_ROUTE: Record<SmeOnboardingStepId, string> = {
  1: 'role-authority',
  2: 'company-identity',
  3: 'business-classification',
  4: 'ownership-snapshot',
  5: 'ipo-intent',
  6: 'initial-documents',
  7: 'review-submit',
};

export const DRAFT_KEY_BY_STEP: Record<SmeOnboardingStepId, keyof SmeOnboardingData> = {
  1: 'roleAuthority',
  2: 'companyIdentity',
  3: 'businessClassification',
  4: 'ownershipSnapshot',
  5: 'ipoIntent',
  6: 'initialDocuments',
  7: 'submissionConfirmations',
};

export function backendStepToNumber(step: string): SmeOnboardingStepId {
  return BACKEND_STEP_TO_NUMBER[step] ?? 1;
}

export function isStepCompleted(completedSteps: string[], stepNumber: SmeOnboardingStepId): boolean {
  return completedSteps.includes(STEP_NUMBER_TO_BACKEND[stepNumber]);
}

export function isStepUnlocked(completedSteps: string[], stepNumber: SmeOnboardingStepId): boolean {
  if (stepNumber === 1) return true;
  return isStepCompleted(completedSteps, (stepNumber - 1) as SmeOnboardingStepId);
}

export function mergeDraftData(draftData: Partial<SmeOnboardingData>): SmeOnboardingData {
  const empty = createEmptySmeOnboardingData();
  return {
    ...empty,
    ...draftData,
    roleAuthority: { ...empty.roleAuthority, ...draftData.roleAuthority },
    companyIdentity: {
      ...empty.companyIdentity,
      ...draftData.companyIdentity,
      registeredOffice: {
        ...empty.companyIdentity.registeredOffice,
        ...draftData.companyIdentity?.registeredOffice,
      },
    },
    businessClassification: {
      ...empty.businessClassification,
      ...draftData.businessClassification,
      gstRegistrations: draftData.businessClassification?.gstRegistrations ?? [],
    },
    ownershipSnapshot: { ...empty.ownershipSnapshot, ...draftData.ownershipSnapshot },
    ipoIntent: { ...empty.ipoIntent, ...draftData.ipoIntent },
    initialDocuments: {
      ...empty.initialDocuments,
      ...draftData.initialDocuments,
      selections: {
        ...empty.initialDocuments.selections,
        ...draftData.initialDocuments?.selections,
      },
    },
    submissionConfirmations: {
      ...empty.submissionConfirmations,
      ...draftData.submissionConfirmations,
    },
  };
}
