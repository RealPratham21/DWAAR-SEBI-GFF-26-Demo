import { getApiBaseUrl } from '@/lib/api/config';
import { ApiClientError, isNetworkError, parseApiError } from '@/lib/api/errors';
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/lib/auth/types';

const AUTH_ENDPOINTS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
]);

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  skipRefreshRetry?: boolean;
};

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onAccessTokenUpdated: ((token: string | null) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.has(path);
}

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return headers;
}

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as RefreshResponse;
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  onAccessTokenUpdated?.(token);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessTokenUpdatedHandler(
  handler: ((token: string | null) => void) | null,
): void {
  onAccessTokenUpdated = handler;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, skipRefreshRetry = false, ...init } = options;
  const url = buildUrl(path);
  const headers = buildHeaders({ ...options, auth, body });

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  let response: Response;

  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiClientError(
        0,
        'NETWORK_ERROR',
        'Unable to reach the server. Check your connection and try again.',
      );
    }
    throw error;
  }

  if (
    response.status === 401 &&
    auth &&
    accessToken &&
    !skipRefreshRetry &&
    !isAuthEndpoint(path)
  ) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`);
      const retryResponse = await fetch(url, { ...requestInit, headers });
      return parseSuccessResponse<T>(retryResponse);
    }

    setAccessToken(null);
    onSessionExpired?.();
    throw await parseApiError(response);
  }

  return parseSuccessResponse<T>(response);
}

export async function registerAccount(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
    skipRefreshRetry: true,
  });
}

export async function loginAccount(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
    skipRefreshRetry: true,
  });
}

export async function refreshSession(): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    auth: false,
    skipRefreshRetry: true,
  });
}

export async function logoutAccount(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('/auth/logout', {
    method: 'POST',
    auth: false,
    skipRefreshRetry: true,
  });
}

export async function fetchCurrentUser(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me', {
    method: 'GET',
  });
}
