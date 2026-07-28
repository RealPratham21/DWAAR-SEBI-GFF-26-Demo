'use client';

import { AuthProvider } from '@/lib/auth/context';
import { SmeSignupProvider } from '@/lib/onboarding/sme/context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SmeSignupProvider>{children}</SmeSignupProvider>
    </AuthProvider>
  );
}
