'use client';

import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';

function AuthSkeleton() {
  return <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />;
}

export function LandingNavCta() {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo, logout } = useAuth();

  if (isRestoringSession) {
    return <AuthSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={AUTH_ROUTES.login}
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
        >
          Log in
        </Link>
        <Link
          href={AUTH_ROUTES.login}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open Dashboard
        </Link>
      </div>
    );
  }

  const dashboardHref = getRouteForNextAction(nextAction ?? 'start_sme_onboarding', redirectTo);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void logout()}
        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
      >
        Log out
      </button>
      <Link
        href={dashboardHref}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Open Dashboard
      </Link>
    </div>
  );
}
