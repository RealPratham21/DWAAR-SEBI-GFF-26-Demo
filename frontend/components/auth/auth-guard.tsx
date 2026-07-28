'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionLoadingScreen } from '@/components/auth/session-loading-screen';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { useHasMounted } from '@/lib/auth/use-has-mounted';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useHasMounted();
  const { isAuthenticated, isRestoringSession } = useAuth();

  useEffect(() => {
    if (mounted && !isRestoringSession && !isAuthenticated) {
      router.replace(AUTH_ROUTES.login);
    }
  }, [isAuthenticated, isRestoringSession, mounted, router]);

  if (!mounted || isRestoringSession || !isAuthenticated) {
    return <SessionLoadingScreen />;
  }

  return <>{children}</>;
}
