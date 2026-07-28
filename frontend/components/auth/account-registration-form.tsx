'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import {
  fieldClassName,
  FormField,
} from '@/components/company-incorporation/form-primitives';
import { LegalDocumentLink } from '@/components/auth/legal-document-link';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth/context';
import {
  AUTH_ROUTES,
  LEGAL_ROUTES,
} from '@/lib/auth/constants';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import {
  accountRegistrationSchema,
  normalizeIndianMobile,
  type AccountRegistrationInput,
  type AccountRegistrationValues,
} from '@/lib/auth/schemas';
import type { RegisterFormStatus } from '@/lib/auth/types';

const STATUS_MESSAGES: Record<Exclude<RegisterFormStatus, 'idle' | 'submitting'>, string> = {
  'generic-error': 'Registration could not be completed. Please try again.',
  'validation-error': 'Please check the highlighted fields and try again.',
  'email-already-registered':
    'An account with this email already exists. Sign in or use a different email.',
  'network-unavailable':
    'Unable to reach the registration service. Check your connection and try again.',
};

export function AccountRegistrationForm() {
  const router = useRouter();
  const { register: registerAccount } = useAuth();
  const [status, setStatus] = useState<RegisterFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountRegistrationInput, unknown, AccountRegistrationValues>({
    resolver: zodResolver(accountRegistrationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    setStatus('submitting');
    setErrorMessage(null);

    try {
      const response = await registerAccount({
        fullName: values.fullName,
        email: values.email,
        phone: values.mobile,
        password: values.password,
        rememberMe: false,
      });

      setValue('password', '');
      setValue('confirmPassword', '');
      setStatus('idle');
      router.push(getRouteForNextAction(response.nextAction, response.redirectTo));
    } catch (error) {
      setValue('password', '');
      setValue('confirmPassword', '');

      if (error instanceof ApiClientError) {
        if (error.code === 'EMAIL_ALREADY_REGISTERED') {
          setStatus('email-already-registered');
          setErrorMessage(error.message);
          return;
        }
        if (error.code === 'VALIDATION_ERROR') {
          setStatus('validation-error');
          setErrorMessage(error.message);
          return;
        }
        if (error.code === 'NETWORK_ERROR') {
          setStatus('network-unavailable');
          setErrorMessage(error.message);
          return;
        }
      }

      setStatus('generic-error');
      setErrorMessage(
        error instanceof ApiClientError ? error.message : STATUS_MESSAGES['generic-error'],
      );
    }
  });

  const alertMessage =
    errorMessage ??
    (status !== 'idle' && status !== 'submitting' ? STATUS_MESSAGES[status] : null);

  return (
    <div className="space-y-6">
      {alertMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{alertMessage}</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
          <input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            className={fieldClassName}
            {...register('fullName')}
          />
        </FormField>

        <FormField
          label="Work email"
          htmlFor="email"
          required
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={fieldClassName}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Mobile number"
          htmlFor="mobile"
          required
          helper="Indian mobile number. Optional +91 prefix is accepted while typing."
          error={errors.mobile?.message}
        >
          <input
            id="mobile"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(errors.mobile)}
            className={fieldClassName}
            {...register('mobile', {
              onChange: (event) => {
                const normalized = normalizeIndianMobile(event.target.value);
                if (normalized.length <= 10) {
                  setValue('mobile', event.target.value, { shouldValidate: false });
                }
              },
              onBlur: (event) => {
                const normalized = normalizeIndianMobile(event.target.value);
                if (normalized.length === 10) {
                  setValue('mobile', normalized, { shouldValidate: true });
                }
              },
            })}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          helper="At least 8 characters with uppercase, lowercase, and a number."
          error={errors.password?.message}
        >
          <PasswordField
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(value) => setValue('password', value, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordField
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            value={watch('confirmPassword')}
            onChange={(value) =>
              setValue('confirmPassword', value, { shouldValidate: true })
            }
          />
        </FormField>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-input accent-accent"
              aria-invalid={Boolean(errors.acceptTerms)}
              {...register('acceptTerms')}
            />
            <span>
              I accept the <LegalDocumentLink label="Terms of Service" href={LEGAL_ROUTES.termsOfService} />
            </span>
          </label>
          {errors.acceptTerms ? (
            <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
          ) : null}

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-input accent-accent"
              aria-invalid={Boolean(errors.acceptPrivacy)}
              {...register('acceptPrivacy')}
            />
            <span>
              I accept the <LegalDocumentLink label="Privacy Policy" href={LEGAL_ROUTES.privacyPolicy} />
            </span>
          </label>
          {errors.acceptPrivacy ? (
            <p className="text-sm text-destructive">{errors.acceptPrivacy.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || status === 'submitting'}>
          {isSubmitting || status === 'submitting' ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={AUTH_ROUTES.login} className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
