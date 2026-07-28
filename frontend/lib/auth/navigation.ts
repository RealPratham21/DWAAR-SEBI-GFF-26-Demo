import { AUTH_ROUTES } from '@/lib/auth/constants';
import type { NextAction } from '@/lib/auth/types';

export function getRouteForNextAction(nextAction: NextAction, redirectTo?: string | null): string {
  if (redirectTo) {
    return redirectTo;
  }

  switch (nextAction) {
    case 'start_sme_onboarding':
    case 'resume_sme_onboarding':
      return AUTH_ROUTES.smeOnboarding;
    case 'open_dashboard':
      return AUTH_ROUTES.demoDashboard;
    default:
      return AUTH_ROUTES.home;
  }
}

export function getPrimaryActionLabel(nextAction: NextAction | null): string {
  switch (nextAction) {
    case 'open_dashboard':
      return 'Open dashboard';
    case 'resume_sme_onboarding':
      return 'Continue onboarding';
    case 'start_sme_onboarding':
      return 'Continue onboarding';
    default:
      return 'Continue';
  }
}
