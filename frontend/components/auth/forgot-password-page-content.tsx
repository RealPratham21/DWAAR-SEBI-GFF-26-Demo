'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { PublicAuthShell } from '@/components/auth/public-auth-shell';
import {
  fieldClassName,
  FormField,
} from '@/components/company-incorporation/form-primitives';
import { Button } from '@/components/ui/button';
import { AUTH_ROUTES, PASSWORD_RECOVERY_NOTICE } from '@/lib/auth/constants';
import { forgotPasswordSchema } from '@/lib/auth/schemas';

export default function ForgotPasswordPageContent() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  return (
    <PublicAuthShell backHref={AUTH_ROUTES.login} backLabel="Back to Sign in">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your work email and we will send recovery instructions when email delivery is
              connected.
            </p>
          </div>

          {isSubmitSuccessful ? (
            <div
              role="status"
              className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex items-start gap-3"
            >
              <Info size={18} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{PASSWORD_RECOVERY_NOTICE}</p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField label="Email address" htmlFor="email" required error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className={fieldClassName}
                {...register('email')}
              />
            </FormField>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Continue'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{' '}
            <Link href={AUTH_ROUTES.login} className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PublicAuthShell>
  );
}
