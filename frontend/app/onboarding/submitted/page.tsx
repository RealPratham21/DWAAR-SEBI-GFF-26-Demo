'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SessionLoadingScreen } from '@/components/auth/session-loading-screen';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import { useHasMounted } from '@/lib/auth/use-has-mounted';

function OnboardingSubmittedRedirect() {
  const router = useRouter();
  const mounted = useHasMounted();
  const { isRestoringSession, nextAction, redirectTo } = useAuth();

  useEffect(() => {
    if (mounted && !isRestoringSession && nextAction) {
      router.replace(getRouteForNextAction(nextAction, redirectTo));
    }
  }, [isRestoringSession, mounted, nextAction, redirectTo, router]);

  return <SessionLoadingScreen />;
}

export default function OnboardingSubmittedPage() {
  return (
    <AuthGuard>
      <OnboardingSubmittedRedirect />
    </AuthGuard>
  );
}
