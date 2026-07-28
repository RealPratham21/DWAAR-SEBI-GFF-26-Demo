import { z } from 'zod';

const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeTrim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

/** Normalize Indian mobile to 10 digits for form state. */
export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
}

export const indianMobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .transform(normalizeIndianMobile)
  .refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: 'Enter a valid 10-digit Indian mobile number',
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const accountRegistrationSchema = z
  .object({
    fullName: z
      .preprocess(normalizeTrim, z.string().min(1, 'Full name is required'))
      .pipe(z.string().min(2, 'Full name must be at least 2 characters').max(100)),
    email: z.preprocess(
      normalizeEmail,
      z
        .string()
        .min(1, 'Work email is required')
        .email('Enter a valid email address')
        .max(254, 'Email must be at most 254 characters'),
    ),
    mobile: indianMobileSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'You must accept the Terms of Service',
    }),
    acceptPrivacy: z.boolean().refine((value) => value === true, {
      message: 'You must accept the Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AccountRegistrationInput = z.input<typeof accountRegistrationSchema>;
export type AccountRegistrationValues = z.output<typeof accountRegistrationSchema>;

export const loginSchema = z.object({
  email: z.preprocess(
    normalizeEmail,
    z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
  ),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.preprocess(
    normalizeEmail,
    z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
  ),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
