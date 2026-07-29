'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { SessionLoadingScreen } from '@/components/auth/session-loading-screen';
import { fetchDashboardBootstrap } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/errors';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { useAuth } from '@/lib/auth/context';
import { getRouteForNextAction } from '@/lib/auth/navigation';
import type {
  DashboardBootstrapErrorDetails,
  DashboardBootstrapResponse,
} from '@/lib/workspace/types';

interface WorkspaceContextValue {
  bootstrap: DashboardBootstrapResponse | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isRestoringSession, nextAction, redirectTo } = useAuth();
  const [bootstrap, setBootstrap] = useState<DashboardBootstrapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectForIncompleteOnboarding = useCallback(
    (details?: DashboardBootstrapErrorDetails) => {
      const action = details?.nextAction ?? nextAction ?? 'start_sme_onboarding';
      const route = getRouteForNextAction(action, details?.redirectTo ?? redirectTo);
      router.replace(route);
    },
    [nextAction, redirectTo, router],
  );

  const loadBootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardBootstrap();
      setBootstrap(response);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'ONBOARDING_NOT_SUBMITTED') {
          redirectForIncompleteOnboarding(err.details as DashboardBootstrapErrorDetails);
          return;
        }
        setError(err.message);
      } else {
        setError('Unable to load workspace data.');
      }
      setBootstrap(null);
    } finally {
      setIsLoading(false);
    }
  }, [redirectForIncompleteOnboarding]);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }
    if (!isAuthenticated) {
      router.replace(AUTH_ROUTES.login);
      return;
    }
    if (nextAction && nextAction !== 'open_dashboard') {
      router.replace(getRouteForNextAction(nextAction, redirectTo));
      return;
    }
    void loadBootstrap();
  }, [
    isAuthenticated,
    isRestoringSession,
    loadBootstrap,
    nextAction,
    redirectTo,
    router,
  ]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      bootstrap,
      isLoading,
      error,
      reload: loadBootstrap,
    }),
    [bootstrap, error, isLoading, loadBootstrap],
  );

  if (isRestoringSession || isLoading || !bootstrap) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => void loadBootstrap()}
              className="text-sm font-medium text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return <SessionLoadingScreen message="Loading your workspace…" />;
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}

export function useOptionalWorkspaceBootstrap() {
  const context = useContext(WorkspaceContext);
  return context?.bootstrap ?? null;
}

export function useWorkspaceBootstrap() {
  const { bootstrap } = useWorkspace();
  if (!bootstrap) {
    throw new Error('Workspace bootstrap is not available.');
  }
  return bootstrap;
}
