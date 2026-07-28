'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { SessionLoadingScreen } from '@/components/auth/session-loading-screen';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import { useSmeSignup } from '@/lib/onboarding/sme/context';
import { SmeOnboardingShell } from '@/components/onboarding/sme/sme-onboarding-shell';

export function SmeOnboardingPageContent() {
  const router = useRouter();
  const { nextAction, redirectTo, loadCurrentUser } = useAuth();
  const { hydrateOnboarding, isLoading, loadError, onboardingStatus } = useSmeSignup();

  const shouldRedirectToDashboard =
    nextAction === 'open_dashboard' || onboardingStatus === 'submitted';

  useEffect(() => {
    if (!shouldRedirectToDashboard) {
      return;
    }

    let cancelled = false;

    async function redirectToDashboard() {
      if (onboardingStatus === 'submitted') {
        await loadCurrentUser();
      }
      if (!cancelled) {
        router.replace(getRouteForNextAction('open_dashboard', redirectTo));
      }
    }

    void redirectToDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    shouldRedirectToDashboard,
    onboardingStatus,
    redirectTo,
    router,
    loadCurrentUser,
  ]);

  useEffect(() => {
    if (shouldRedirectToDashboard) {
      return;
    }
    void hydrateOnboarding();
  }, [hydrateOnboarding, shouldRedirectToDashboard]);

  if (shouldRedirectToDashboard || isLoading) {
    return <SessionLoadingScreen />;
  }

  if (loadError) {
    return (
      <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to Home">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      </PublicAuthShell>
    );
  }

  return <SmeOnboardingShell />;
}
