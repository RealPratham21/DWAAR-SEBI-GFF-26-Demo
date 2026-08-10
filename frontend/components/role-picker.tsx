'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { DwaarLogo } from '@/components/dwaar-logo';
import { AUTH_ROUTES, SME_REGISTER_ROUTE } from '@/lib/auth/constants';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Preserved for a future merchant-banker invitation flow — not exposed in the prototype.
 * See components/review/merchant-banker-review-page.tsx for related UI scaffolding.
 */
export const FUTURE_MERCHANT_BANKER_ROLE = {
  id: 'merchant-banker',
  label: 'Merchant Banker',
  description: 'Review and guide IPO preparation',
  features: [
    'Review client submissions',
    'Add comments and recommendations',
    'Track multiple company projects',
    'Generate readiness reports',
  ],
} as const;

const SME_ROLE = {
  id: 'sme',
  label: 'SME / Company',
  description: 'Prepare DRHP documentation for your IPO',
  icon: Building2,
  features: [
    'Complete workstreams and checklists',
    'Manage company information and evidence',
    'Track DRHP progress and readiness',
    'Export draft and readiness reports',
  ],
  href: SME_REGISTER_ROUTE,
} as const;

/** Legacy role picker — prototype signup bypasses this via /role-selection → /register?role=sme. */
export function RolePicker() {
  const role = SME_ROLE;
  const Icon = role.icon;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <DwaarLogo size="md" className="mb-4 justify-center" wordmarkClassName="text-2xl font-bold" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Start your IPO preparation workspace</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dwaar helps SMEs organize issuer information, evidence, and DRHP draft preparation in one
            workspace.
          </p>
        </div>

        <div className="border border-border rounded-lg p-8 bg-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-accent/10">
              <Icon size={28} className="text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{role.label}</h2>
              <p className="text-muted-foreground">{role.description}</p>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {role.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
                <span className="text-foreground text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={role.href}
            className={cn(buttonVariants(), 'w-full px-4 py-3 h-auto font-semibold justify-center')}
          >
            Continue to registration
          </Link>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href={AUTH_ROUTES.login} className="text-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
