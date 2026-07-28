'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountRegistrationForm } from '@/components/auth/account-registration-form';
import { PublicAuthRedirect } from '@/components/auth/public-auth-redirect';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { AUTH_ROUTES, SUPPORTED_REGISTER_ROLES } from '@/lib/auth/constants';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  useEffect(() => {
    if (!role || !SUPPORTED_REGISTER_ROLES.includes(role as (typeof SUPPORTED_REGISTER_ROLES)[number])) {
      router.replace(AUTH_ROUTES.roleSelection);
    }
  }, [role, router]);

  if (!role || !SUPPORTED_REGISTER_ROLES.includes(role as (typeof SUPPORTED_REGISTER_ROLES)[number])) {
    return (
      <PublicAuthShell backHref={AUTH_ROUTES.roleSelection} backLabel="Back to role selection">
        <div className="text-center space-y-4 py-12">
          <p className="text-muted-foreground">Select your role to create an account.</p>
          <Link href={AUTH_ROUTES.roleSelection} className="text-accent font-medium hover:underline">
            Go to role selection
          </Link>
        </div>
      </PublicAuthShell>
    );
  }

  return (
    <PublicAuthRedirect>
      <PublicAuthShell backHref={AUTH_ROUTES.roleSelection} backLabel="Back to role selection">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your Dwaar account</h1>
            <p className="text-muted-foreground">
              Create your personal account first. Your company and IPO preparation details will be
              collected in the next step.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-8">
            <AccountRegistrationForm />
          </div>
        </div>
      </PublicAuthShell>
    </PublicAuthRedirect>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <PublicAuthShell backHref={AUTH_ROUTES.roleSelection} backLabel="Back to role selection">
          <p className="text-muted-foreground">Loading…</p>
        </PublicAuthShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
