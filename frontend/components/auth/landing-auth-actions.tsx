'use client';

import Link from 'next/link';
import { AUTH_ROUTES, SME_REGISTER_ROUTE } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getPrimaryActionLabel, getRouteForNextAction } from '@/lib/auth/navigation';

function AuthActionSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
      <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
    </div>
  );
}

export function LandingAuthActions() {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo, logout } = useAuth();

  if (isRestoringSession) {
    return <AuthActionSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={AUTH_ROUTES.login}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Log in
        </Link>
        <Link
          href={SME_REGISTER_ROUTE}
          className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Register
        </Link>
      </div>
    );
  }

  const primaryHref = getRouteForNextAction(nextAction ?? 'start_sme_onboarding', redirectTo);

  return (
    <div className="flex items-center gap-4">
      <Link
        href={primaryHref}
        className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        {getPrimaryActionLabel(nextAction)}
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Log out
      </button>
    </div>
  );
}

export function LandingHeroActions() {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo, logout } = useAuth();

  if (isRestoringSession) {
    return <div className="h-12 w-72 rounded-md bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-4">
        <Link
          href={SME_REGISTER_ROUTE}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        <Link
          href={AUTH_ROUTES.login}
          className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
        >
          I Already Have Access
        </Link>
      </div>
    );
  }

  const primaryHref = getRouteForNextAction(nextAction ?? 'start_sme_onboarding', redirectTo);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <Link
        href={primaryHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        {getPrimaryActionLabel(nextAction)}
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
      >
        Log out
      </button>
    </div>
  );
}

export function LandingCtaAction() {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo } = useAuth();

  if (isRestoringSession) {
    return <div className="mx-auto h-12 w-48 rounded-md bg-muted animate-pulse" />;
  }

  const href = isAuthenticated
    ? getRouteForNextAction(nextAction ?? 'start_sme_onboarding', redirectTo)
    : SME_REGISTER_ROUTE;
  const label = isAuthenticated ? getPrimaryActionLabel(nextAction) : 'Get Started Now';

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity text-lg"
    >
      {label}
    </Link>
  );
}
