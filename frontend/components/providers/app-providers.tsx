'use client';

import { AuthProvider } from '@/lib/auth/context';
import { NotificationProvider } from '@/lib/notifications/context';
import { SmeSignupProvider } from '@/lib/onboarding/sme/context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SmeSignupProvider>{children}</SmeSignupProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
