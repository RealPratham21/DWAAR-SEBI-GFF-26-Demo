'use client';

import { useSearchParams } from 'next/navigation';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { PublicAuthRedirect } from '@/components/auth/public-auth-redirect';
import { LoginForm } from '@/components/auth/login-form';
import { DwaarLogo } from '@/components/dwaar-logo';
import { NIVARA_DEMO } from '@/lib/demo/constants';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const isDemoLogin = emailParam.toLowerCase() === NIVARA_DEMO.email;

  return (
    <PublicAuthRedirect>
      <PublicAuthShell>
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="text-center mb-8">
              <DwaarLogo size="sm" className="mb-4 justify-center" wordmarkClassName="font-semibold" />
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground text-sm mt-2">
                {isDemoLogin
                  ? 'Sign in to the pre-filled Nivara demonstration workspace.'
                  : 'Sign in to your account to continue'}
              </p>
            </div>
            <LoginForm defaultEmail={emailParam} />
          </div>
        </div>
      </PublicAuthShell>
    </PublicAuthRedirect>
  );
}
