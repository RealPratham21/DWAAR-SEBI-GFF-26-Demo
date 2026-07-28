export type NextAction =
  | 'start_sme_onboarding'
  | 'resume_sme_onboarding'
  | 'open_dashboard';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
}

export interface OnboardingSummary {
  id: string;
  status: string;
  currentStep: string;
  completedSteps: unknown[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterResponse extends AuthTokenResponse {
  user: AuthUser;
  nextAction: NextAction;
  redirectTo: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse extends AuthTokenResponse {
  user: AuthUser;
  onboarding: OnboardingSummary | null;
  nextAction: NextAction;
  redirectTo: string;
}

export type RefreshResponse = AuthTokenResponse;

export interface LogoutResponse {
  success: boolean;
}

export interface MeResponse {
  user: AuthUser;
  onboarding: OnboardingSummary | null;
  nextAction: NextAction;
  redirectTo: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export type RegisterFormStatus =
  | 'idle'
  | 'submitting'
  | 'generic-error'
  | 'validation-error'
  | 'email-already-registered'
  | 'network-unavailable';

export type LoginFormStatus =
  | 'idle'
  | 'submitting'
  | 'invalid-credentials'
  | 'account-inactive'
  | 'network-error'
  | 'unexpected-error';

/** Account summary shape used in onboarding review UI. */
export interface AccountSummary {
  fullName: string;
  email: string;
  phone: string;
}
