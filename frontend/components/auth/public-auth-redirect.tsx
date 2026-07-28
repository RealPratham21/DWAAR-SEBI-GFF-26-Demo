'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionLoadingScreen } from '@/components/auth/session-loading-screen';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import { useHasMounted } from '@/lib/auth/use-has-mounted';

export function PublicAuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useHasMounted();
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo } = useAuth();

  useEffect(() => {
    if (mounted && !isRestoringSession && isAuthenticated && nextAction) {
      router.replace(getRouteForNextAction(nextAction, redirectTo));
    }
  }, [isAuthenticated, isRestoringSession, mounted, nextAction, redirectTo, router]);

  if (!mounted || isRestoringSession || isAuthenticated) {
    return <SessionLoadingScreen />;
  }

  return <>{children}</>;
}
