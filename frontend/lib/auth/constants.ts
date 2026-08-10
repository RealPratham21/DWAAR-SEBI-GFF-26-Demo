/** Central route constants for authentication and signup flows. */
export const AUTH_ROUTES = {
  home: '/',
  roleSelection: '/role-selection',
  register: '/register',
  login: '/login',
  forgotPassword: '/forgot-password',
  smeOnboarding: '/onboarding/sme',
  demoDashboard: '/projects/demo',
} as const;

/** Default signup entry — SME / Company is the only supported onboarding persona in the prototype. */
export const SME_REGISTER_ROUTE = `${AUTH_ROUTES.register}?role=sme` as const;

/** Published legal pages for the prototype. */
export const LEGAL_ROUTES = {
  termsOfService: '/terms',
  privacyPolicy: '/privacy',
} as const;

export const SUPPORTED_REGISTER_ROLES = ['sme'] as const;

export type SupportedRegisterRole = (typeof SUPPORTED_REGISTER_ROLES)[number];

export const REMEMBER_ME_HELPER =
  'Stay signed in on this device for up to 30 days when selected.';

export const PASSWORD_RECOVERY_NOTICE =
  'Password recovery will become available when email delivery is connected.';

export const ONBOARDING_SUBMITTED_NOTICE =
  'Your SME onboarding has been submitted. You can now access the demo project workspace.';
