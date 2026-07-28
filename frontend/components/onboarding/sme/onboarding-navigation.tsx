'use client';

import { Button } from '@/components/ui/button';

interface OnboardingNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  disableBack?: boolean;
  disableContinue?: boolean;
  isSubmitting?: boolean;
  secondaryAction?: React.ReactNode;
}

export function OnboardingNavigation({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  disableBack = false,
  disableContinue = false,
  isSubmitting = false,
  secondaryAction,
}: OnboardingNavigationProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
      <div className="flex gap-3">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack} disabled={disableBack || isSubmitting}>
            {backLabel}
          </Button>
        ) : null}
        {secondaryAction}
      </div>
      {onContinue ? (
        <Button type="button" onClick={onContinue} disabled={disableContinue || isSubmitting}>
          {isSubmitting ? 'Saving…' : continueLabel}
        </Button>
      ) : null}
    </div>
  );
}
