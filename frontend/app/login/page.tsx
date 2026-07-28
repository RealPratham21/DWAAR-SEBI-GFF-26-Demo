'use client';

import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import { PublicAuthRedirect } from '@/components/auth/public-auth-redirect';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <PublicAuthRedirect>
      <PublicAuthShell>
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <span className="font-semibold text-foreground">Dwaar</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Sign in to your account to continue
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </PublicAuthShell>
    </PublicAuthRedirect>
  );
}
