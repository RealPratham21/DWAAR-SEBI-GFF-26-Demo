'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountRegistrationForm } from '@/components/auth/account-registration-form';
import { PublicAuthRedirect } from '@/components/auth/public-auth-redirect';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import {
  AUTH_ROUTES,
  SME_REGISTER_ROUTE,
  SUPPORTED_REGISTER_ROLES,
} from '@/lib/auth/constants';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRole = searchParams.get('role');

  useEffect(() => {
    if (
      !rawRole ||
      !SUPPORTED_REGISTER_ROLES.includes(rawRole as (typeof SUPPORTED_REGISTER_ROLES)[number])
    ) {
      router.replace(SME_REGISTER_ROUTE);
    }
  }, [rawRole, router]);

  if (
    !rawRole ||
    !SUPPORTED_REGISTER_ROLES.includes(rawRole as (typeof SUPPORTED_REGISTER_ROLES)[number])
  ) {
    return (
      <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to home">
        <p className="text-muted-foreground py-12 text-center">Loading registration…</p>
      </PublicAuthShell>
    );
  }

  return (
    <PublicAuthRedirect>
      <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to home">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your Dwaar account</h1>
            <p className="text-muted-foreground">
              Create your personal account for your company&apos;s IPO preparation workspace. Company
              and offering details are collected in onboarding after signup.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-8">
            <AccountRegistrationForm />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href={AUTH_ROUTES.login} className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </PublicAuthShell>
    </PublicAuthRedirect>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <PublicAuthShell backHref={AUTH_ROUTES.home} backLabel="Back to home">
          <p className="text-muted-foreground">Loading…</p>
        </PublicAuthShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
