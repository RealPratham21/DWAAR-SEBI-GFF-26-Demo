import type { ApiErrorBody } from '@/lib/auth/types';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function formatValidationDetail(detail: unknown): string {
  if (!Array.isArray(detail)) {
    return 'Please check your input and try again.';
  }

  const messages = detail
    .map((item) => {
      if (typeof item !== 'object' || item === null || !('msg' in item)) {
        return null;
      }
      return String((item as { msg: string }).msg);
    })
    .filter(Boolean);

  return messages.length > 0
    ? messages.join(' ')
    : 'Please check your input and try again.';
}

export async function parseApiError(response: Response): Promise<ApiClientError> {
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error: ApiErrorBody }).error;
    return new ApiClientError(
      response.status,
      error.code,
      error.message,
      error.details,
    );
  }

  if (body && typeof body === 'object' && 'detail' in body) {
    return new ApiClientError(
      response.status,
      'VALIDATION_ERROR',
      formatValidationDetail((body as { detail: unknown }).detail),
      (body as { detail: unknown }).detail,
    );
  }

  if (response.status >= 500) {
    return new ApiClientError(
      response.status,
      'SERVER_ERROR',
      'The service is temporarily unavailable. Please try again.',
    );
  }

  return new ApiClientError(
    response.status,
    'UNEXPECTED_ERROR',
    'An unexpected error occurred. Please try again.',
  );
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
