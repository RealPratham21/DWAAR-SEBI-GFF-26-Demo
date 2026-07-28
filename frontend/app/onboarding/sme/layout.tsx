'use client';

import { AuthGuard } from '@/components/auth/auth-guard';

export default function SmeOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
