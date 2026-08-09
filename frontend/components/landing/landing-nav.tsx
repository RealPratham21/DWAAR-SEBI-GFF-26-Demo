'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { DwaarLogo } from '@/components/dwaar-logo';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getNivaraDemoLoginHref } from '@/lib/demo/constants';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import { LandingNavCta } from '@/components/landing/landing-nav-cta';

const NAV_LINKS = [
  { href: '#why', label: 'Why Dwaar' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#platform', label: 'Platform' },
  { href: '#demo', label: 'Demo' },
] as const;

function DwaarLogoLink() {
  return (
    <Link href="/" className="min-w-0">
      <DwaarLogo size="sm" wordmarkClassName="font-semibold" />
    </Link>
  );
}

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <DwaarLogoLink />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <LandingNavCta />
      </div>
    </header>
  );
}

export function LandingDemoLink({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo } = useAuth();

  if (isRestoringSession) {
    return (
      <span className={`inline-block h-11 w-40 animate-pulse rounded-md bg-muted ${className}`} />
    );
  }

  const href =
    isAuthenticated && nextAction === 'open_dashboard'
      ? getRouteForNextAction(nextAction, redirectTo)
      : getNivaraDemoLoginHref();

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function LandingDashboardLink({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo } = useAuth();

  if (isRestoringSession) {
    return (
      <span className={`inline-block h-11 w-36 animate-pulse rounded-md bg-muted ${className}`} />
    );
  }

  const href = isAuthenticated
    ? getRouteForNextAction(nextAction ?? 'start_sme_onboarding', redirectTo)
    : AUTH_ROUTES.login;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
