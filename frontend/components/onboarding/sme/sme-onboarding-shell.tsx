'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { BusinessClassificationStep } from '@/components/onboarding/sme/business-classification-step';
import { CompanyIdentityStep } from '@/components/onboarding/sme/company-identity-step';
import { InitialDocumentsStep } from '@/components/onboarding/sme/initial-documents-step';
import { IpoIntentStep } from '@/components/onboarding/sme/ipo-intent-step';
import { OnboardingNavigation } from '@/components/onboarding/sme/onboarding-navigation';
import { OnboardingReviewStep } from '@/components/onboarding/sme/onboarding-review-step';
import { OwnershipSnapshotStep } from '@/components/onboarding/sme/ownership-snapshot-step';
import { RoleAuthorityStep } from '@/components/onboarding/sme/role-authority-step';
import { SmeOnboardingStepper } from '@/components/onboarding/sme/sme-onboarding-stepper';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import {
  SME_ONBOARDING_STEPS,
  TOTAL_SME_ONBOARDING_STEPS,
} from '@/lib/onboarding/sme/constants';
import { useSmeSignup } from '@/lib/onboarding/sme/context';
import { backendStepToNumber } from '@/lib/onboarding/sme/step-mapping';
import type { SmeOnboardingStepId } from '@/lib/onboarding/sme/types';

export function SmeOnboardingShell() {
  const router = useRouter();
  const { user, loadCurrentUser, redirectTo } = useAuth();
  const {
    onboardingData,
    setOnboardingData,
    updateOnboardingSection,
    currentStep,
    setCurrentStep,
    completedSteps,
    isStepUnlocked,
    isStepCompleted,
    validateStep,
    persistStep,
    submitOnboarding,
    isSaving,
    saveError,
    fieldErrors,
    setDocumentFile,
  } = useSmeSignup();

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeStepMeta = SME_ONBOARDING_STEPS.find((step) => step.id === currentStep);
  const accountSummary = user
    ? {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      }
    : null;

  const mergedErrors = { ...stepErrors, ...fieldErrors };

  const scrollToFirstError = useCallback((errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey || !contentRef.current) return;
    const el =
      contentRef.current.querySelector<HTMLElement>(`[name="${firstKey}"]`) ??
      contentRef.current.querySelector<HTMLElement>(`#${firstKey}`) ??
      contentRef.current.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const goToStep = (step: SmeOnboardingStepId) => {
    if (!isStepUnlocked(step)) return;
    setStepErrors({});
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = async () => {
    const result = validateStep(currentStep);
    if (!result.success) {
      setStepErrors(result.errors ?? {});
      scrollToFirstError(result.errors ?? {});
      return;
    }

    setStepErrors({});

    if (currentStep === TOTAL_SME_ONBOARDING_STEPS) {
      try {
        const response = await submitOnboarding(onboardingData.submissionConfirmations);
        await loadCurrentUser();
        setSubmitSuccess(true);
        router.replace(getRouteForNextAction('open_dashboard', response.redirectTo ?? redirectTo));
      } catch {
        scrollToFirstError(fieldErrors);
      }
      return;
    }

    try {
      const application = await persistStep(currentStep);
      const nextStep = backendStepToNumber(application.currentStep);
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      scrollToFirstError(fieldErrors);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepErrors({});
      setCurrentStep((currentStep - 1) as SmeOnboardingStepId);
    }
  };

  if (submitSuccess) {
    return (
      <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to Home">
        <div className="bg-card border border-border rounded-lg p-8 text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Onboarding submitted</h2>
          <p className="text-muted-foreground">Redirecting you to the project workspace…</p>
        </div>
      </PublicAuthShell>
    );
  }

  return (
    <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to Home">
      <div className="space-y-8">
        <div className="space-y-4">
          <Link
            href={AUTH_ROUTES.login}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:hidden"
          >
            Account
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Set up your SME IPO preparation workspace
            </h1>
            <p className="text-muted-foreground">
              Provide an initial company and IPO-readiness snapshot. You can complete detailed
              disclosures and evidence inside the project workspace later.
            </p>
          </div>
        </div>

        {saveError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3"
          >
            <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{saveError}</p>
          </div>
        ) : null}

        {accountSummary ? (
          <div className="bg-card border border-border rounded-lg p-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Full name</p>
              <p className="font-medium text-foreground">{accountSummary.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{accountSummary.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mobile</p>
              <p className="font-medium text-foreground">{accountSummary.phone}</p>
            </div>
          </div>
        ) : null}

        <SmeOnboardingStepper
          currentStep={currentStep}
          completedSteps={completedSteps.map(backendStepToNumber)}
          onStepClick={(step) => goToStep(step as SmeOnboardingStepId)}
          isStepUnlocked={isStepUnlocked}
          isStepCompleted={isStepCompleted}
        />

        <div ref={contentRef} className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{activeStepMeta?.title}</h2>
          </div>

          {currentStep === 1 ? (
            <RoleAuthorityStep
              data={onboardingData.roleAuthority}
              errors={mergedErrors}
              onChange={(value) => updateOnboardingSection('roleAuthority', value)}
            />
          ) : null}

          {currentStep === 2 ? (
            <CompanyIdentityStep
              data={onboardingData.companyIdentity}
              errors={mergedErrors}
              onChange={(value) => updateOnboardingSection('companyIdentity', value)}
            />
          ) : null}

          {currentStep === 3 ? (
            <BusinessClassificationStep
              data={onboardingData.businessClassification}
              errors={mergedErrors}
              onChange={(value) => updateOnboardingSection('businessClassification', value)}
            />
          ) : null}

          {currentStep === 4 ? (
            <OwnershipSnapshotStep
              data={onboardingData.ownershipSnapshot}
              errors={mergedErrors}
              onChange={(value) => updateOnboardingSection('ownershipSnapshot', value)}
            />
          ) : null}

          {currentStep === 5 ? (
            <IpoIntentStep
              data={onboardingData.ipoIntent}
              errors={mergedErrors}
              onChange={(value) => updateOnboardingSection('ipoIntent', value)}
            />
          ) : null}

          {currentStep === 6 ? (
            <InitialDocumentsStep
              selections={onboardingData.initialDocuments.selections}
              skippedForNow={onboardingData.initialDocuments.skippedForNow}
              onSelectFile={(documentId, file) => setDocumentFile(documentId, file)}
              onRemoveFile={(documentId) => setDocumentFile(documentId, null)}
              onSkipForNow={() =>
                updateOnboardingSection('initialDocuments', {
                  ...onboardingData.initialDocuments,
                  skippedForNow: true,
                })
              }
            />
          ) : null}

          {currentStep === 7 ? (
            <OnboardingReviewStep
              data={onboardingData}
              accountSummary={accountSummary}
              errors={mergedErrors}
              onChange={(value) => {
                setStepErrors({});
                setOnboardingData(value);
              }}
              onEditStep={(step) => goToStep(step as SmeOnboardingStepId)}
            />
          ) : null}

          <OnboardingNavigation
            onBack={currentStep > 1 ? handleBack : undefined}
            onContinue={handleContinue}
            disableBack={currentStep === 1}
            disableContinue={currentStep > 1 && !isStepUnlocked(currentStep)}
            isSubmitting={isSaving}
            continueLabel={
              currentStep === TOTAL_SME_ONBOARDING_STEPS ? 'Submit onboarding' : 'Continue'
            }
          />
        </div>
      </div>
    </PublicAuthShell>
  );
}
