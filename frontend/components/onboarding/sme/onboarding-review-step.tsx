'use client';

import { LegalDocumentLink } from '@/components/auth/legal-document-link';
import { helperClassName } from '@/components/company-incorporation/form-primitives';
import {
  OnboardingReviewCard,
  ReviewField,
} from '@/components/onboarding/sme/onboarding-review-card';
import { SUBMISSION_CONFIRMATION_LABELS } from '@/lib/onboarding/sme/constants';
import { LEGAL_ROUTES } from '@/lib/auth/constants';
import { formatOnboardingReview } from '@/lib/onboarding/sme/review-labels';
import type { SmeOnboardingData } from '@/lib/onboarding/sme/types';
import type { AccountSummary } from '@/lib/auth/types';

export function OnboardingReviewStep({
  data,
  accountSummary,
  errors,
  onChange,
  onEditStep,
}: {
  data: SmeOnboardingData;
  accountSummary: AccountSummary | null;
  errors?: Record<string, string>;
  onChange: (data: SmeOnboardingData) => void;
  onEditStep: (step: number) => void;
}) {
  const review = formatOnboardingReview(
    data,
    accountSummary
      ? {
          fullName: accountSummary.fullName,
          email: accountSummary.email,
          mobile: accountSummary.phone,
        }
      : null,
  );
  const confirmations = data.submissionConfirmations;

  const updateConfirmation = (key: keyof typeof confirmations, value: boolean) => {
    onChange({
      ...data,
      submissionConfirmations: { ...confirmations, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      {accountSummary ? (
        <OnboardingReviewCard title="Account Representative" onEdit={() => onEditStep(1)}>
          {review.account.map((field) => (
            <ReviewField key={field.label} label={field.label} value={field.value} />
          ))}
        </OnboardingReviewCard>
      ) : null}

      <OnboardingReviewCard title="Role and Authority" onEdit={() => onEditStep(1)}>
        {review.roleAuthority.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <OnboardingReviewCard title="Company Identity" onEdit={() => onEditStep(2)}>
        {review.companyIdentity.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <OnboardingReviewCard title="Business Classification and Registrations" onEdit={() => onEditStep(3)}>
        {review.businessClassification.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <OnboardingReviewCard title="Ownership Snapshot" onEdit={() => onEditStep(4)}>
        {review.ownershipSnapshot.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <OnboardingReviewCard title="IPO Intent" onEdit={() => onEditStep(5)}>
        {review.ipoIntent.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <OnboardingReviewCard title="Initial Documents" onEdit={() => onEditStep(6)}>
        {review.initialDocuments.map((field) => (
          <ReviewField key={field.label} label={field.label} value={field.value} />
        ))}
      </OnboardingReviewCard>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Final confirmations</h3>
        <p className={helperClassName}>
          These management representations are separate from account registration acknowledgements.
        </p>

        {(
          [
            ['confirmAccuracy', SUBMISSION_CONFIRMATION_LABELS.accuracy],
            ['confirmAuthorised', SUBMISSION_CONFIRMATION_LABELS.authorised],
            ['confirmVerification', SUBMISSION_CONFIRMATION_LABELS.verification],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-input accent-accent"
              checked={confirmations[key]}
              onChange={(e) => updateConfirmation(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}

        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-input accent-accent"
            checked={confirmations.agreeTerms}
            onChange={(e) => updateConfirmation('agreeTerms', e.target.checked)}
          />
          <span>
            I agree to Dwaar’s{' '}
            <LegalDocumentLink label="Terms of Service" href={LEGAL_ROUTES.termsOfService} /> and{' '}
            <LegalDocumentLink label="Privacy Policy" href={LEGAL_ROUTES.privacyPolicy} />.
          </span>
        </label>

        {errors
          ? Object.entries(errors).map(([key, message]) => (
              <p key={key} className="text-sm text-destructive">
                {message}
              </p>
            ))
          : null}
      </div>
    </div>
  );
}
