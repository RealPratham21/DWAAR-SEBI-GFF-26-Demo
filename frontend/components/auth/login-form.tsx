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
  helperClassName,
} from '@/components/company-incorporation/form-primitives';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth/context';
import {
  AUTH_ROUTES,
  REMEMBER_ME_HELPER,
} from '@/lib/auth/constants';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import { loginSchema, type LoginInput, type LoginValues } from '@/lib/auth/schemas';
import type { LoginFormStatus } from '@/lib/auth/types';

const STATUS_MESSAGES: Record<Exclude<LoginFormStatus, 'idle' | 'submitting'>, string> = {
  'invalid-credentials': 'The email or password you entered is incorrect.',
  'account-inactive': 'This account is inactive. Contact support for assistance.',
  'network-error': 'Unable to reach the authentication service. Check your connection.',
  'unexpected-error': 'An unexpected error occurred. Please try again.',
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState<LoginFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    setStatus('submitting');
    setErrorMessage(null);

    try {
      const response = await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      setValue('password', '');
      setStatus('idle');
      router.push(getRouteForNextAction(response.nextAction, response.redirectTo));
    } catch (error) {
      setValue('password', '');

      if (error instanceof ApiClientError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setStatus('invalid-credentials');
          setErrorMessage(error.message);
          return;
        }
        if (error.code === 'ACCOUNT_INACTIVE') {
          setStatus('account-inactive');
          setErrorMessage(error.message);
          return;
        }
        if (error.code === 'NETWORK_ERROR') {
          setStatus('network-error');
          setErrorMessage(error.message);
          return;
        }
        setStatus('unexpected-error');
        setErrorMessage(error.message);
        return;
      }

      setStatus('unexpected-error');
      setErrorMessage(STATUS_MESSAGES['unexpected-error']);
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

        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <PasswordField
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(value) => setValue('password', value, { shouldValidate: true })}
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-input accent-accent"
                {...register('rememberMe')}
              />
              <span className="text-foreground">Remember me</span>
            </label>
            <Link
              href={AUTH_ROUTES.forgotPassword}
              className="text-accent hover:underline whitespace-nowrap"
            >
              Forgot password?
            </Link>
          </div>
          <p className={helperClassName + ' pl-6'}>{REMEMBER_ME_HELPER}</p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || status === 'submitting'}>
          {isSubmitting || status === 'submitting' ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        New to Dwaar?{' '}
        <Link href={AUTH_ROUTES.roleSelection} className="text-accent font-medium hover:underline">
          Choose how you are joining
        </Link>
      </p>
    </div>
  );
}
