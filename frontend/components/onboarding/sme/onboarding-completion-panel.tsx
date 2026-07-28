'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';

export function OnboardingCompletionPanel({
  onReturnToReview,
}: {
  onReturnToReview: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-8 space-y-6 text-center max-w-2xl mx-auto">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Onboarding review complete</h2>
        <p className="text-muted-foreground">
          Your responses were validated in this browser session only. Permanent onboarding saving,
          issuer creation, and project workspace creation are not implemented yet.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={onReturnToReview}>
          Return to review
        </Button>
        <Link href={AUTH_ROUTES.home} className={cn(buttonVariants())}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
