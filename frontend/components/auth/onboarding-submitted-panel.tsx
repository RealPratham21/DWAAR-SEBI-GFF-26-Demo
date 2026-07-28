'use client';

import Link from 'next/link';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { buttonVariants } from '@/components/ui/button';
import { AUTH_ROUTES, ONBOARDING_SUBMITTED_NOTICE } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';

export function OnboardingSubmittedPanel() {
  return (
    <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to Home">
      <div className="bg-card border border-border rounded-lg p-8 space-y-6 text-center max-w-2xl mx-auto">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Onboarding submitted</h1>
          <p className="text-muted-foreground">{ONBOARDING_SUBMITTED_NOTICE}</p>
          <p className="text-sm text-muted-foreground">
            Your account is active. A project workspace will be created after backend onboarding
            persistence and project provisioning are implemented.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={AUTH_ROUTES.home} className={cn(buttonVariants())}>
            Back to home
          </Link>
        <Link href={AUTH_ROUTES.login} className={cn(buttonVariants({ variant: 'outline' }))}>
          Sign in again
        </Link>
        </div>
      </div>
    </PublicAuthShell>
  );
}
