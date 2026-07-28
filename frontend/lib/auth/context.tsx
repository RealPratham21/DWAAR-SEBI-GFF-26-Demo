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
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  refreshSession as refreshSessionRequest,
  setAccessToken,
  setAccessTokenUpdatedHandler,
  setSessionExpiredHandler,
} from '@/lib/api/client';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import type {
  AuthUser,
  LoginRequest,
  MeResponse,
  NextAction,
  OnboardingSummary,
  RegisterRequest,
} from '@/lib/auth/types';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  onboarding: OnboardingSummary | null;
  nextAction: NextAction | null;
  redirectTo: string | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  register: (payload: RegisterRequest) => Promise<MeResponse>;
  login: (payload: LoginRequest) => Promise<MeResponse>;
  refreshSession: () => Promise<boolean>;
  loadCurrentUser: () => Promise<MeResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyMeState(
  response: MeResponse,
  setters: {
    setUser: (user: AuthUser) => void;
    setOnboarding: (onboarding: OnboardingSummary | null) => void;
    setNextAction: (nextAction: NextAction) => void;
    setRedirectTo: (redirectTo: string) => void;
  },
): MeResponse {
  setters.setUser(response.user);
  setters.setOnboarding(response.onboarding);
  setters.setNextAction(response.nextAction);
  setters.setRedirectTo(response.redirectTo);
  return response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingSummary | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const clearAuthState = useCallback(() => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setOnboarding(null);
    setNextAction(null);
    setRedirectTo(null);
  }, []);

  const applyAuthResponse = useCallback(
    (response: {
      accessToken: string;
      user: AuthUser;
      onboarding?: OnboardingSummary | null;
      nextAction: NextAction;
      redirectTo: string;
    }) => {
      setAccessToken(response.accessToken);
      setAccessTokenState(response.accessToken);
      setUser(response.user);
      setOnboarding(response.onboarding ?? null);
      setNextAction(response.nextAction);
      setRedirectTo(response.redirectTo);
      return response;
    },
    [],
  );

  const loadCurrentUser = useCallback(async () => {
    const response = await fetchCurrentUser();
    return applyMeState(response, {
      setUser,
      setOnboarding,
      setNextAction,
      setRedirectTo,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await refreshSessionRequest();
      setAccessToken(response.accessToken);
      setAccessTokenState(response.accessToken);
      await loadCurrentUser();
      return true;
    } catch {
      clearAuthState();
      return false;
    }
  }, [clearAuthState, loadCurrentUser]);

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerAccount(payload);
      applyAuthResponse(response);
      return {
        user: response.user,
        onboarding: null,
        nextAction: response.nextAction,
        redirectTo: response.redirectTo,
      };
    },
    [applyAuthResponse],
  );

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginAccount(payload);
      applyAuthResponse(response);
      return {
        user: response.user,
        onboarding: response.onboarding,
        nextAction: response.nextAction,
        redirectTo: response.redirectTo,
      };
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // Logout remains successful when the backend session is already missing.
    } finally {
      clearAuthState();
      router.replace(AUTH_ROUTES.home);
    }
  }, [clearAuthState, router]);

  useEffect(() => {
    setAccessTokenUpdatedHandler((token) => {
      setAccessTokenState(token);
    });
    setSessionExpiredHandler(() => {
      clearAuthState();
      router.replace(AUTH_ROUTES.login);
    });

    return () => {
      setAccessTokenUpdatedHandler(null);
      setSessionExpiredHandler(null);
    };
  }, [clearAuthState, router]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      setIsRestoringSession(true);
      try {
        const refreshed = await refreshSessionRequest();
        if (cancelled) return;

        setAccessToken(refreshed.accessToken);
        setAccessTokenState(refreshed.accessToken);
        await loadCurrentUser();
      } catch {
        if (!cancelled) {
          clearAuthState();
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuthState, loadCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: accessTokenState,
      onboarding,
      nextAction,
      redirectTo,
      isAuthenticated: user !== null && accessTokenState !== null,
      isRestoringSession,
      register,
      login,
      refreshSession,
      loadCurrentUser,
      logout,
    }),
    [
      user,
      accessTokenState,
      onboarding,
      nextAction,
      redirectTo,
      isRestoringSession,
      register,
      login,
      refreshSession,
      loadCurrentUser,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
