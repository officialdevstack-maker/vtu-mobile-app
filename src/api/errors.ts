// src/api/errors.ts

export type ApiErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'account_suspended'
  | 'pin_required'
  | 'not_found'
  | 'purchase_failed'
  | 'rate_limited'
  | 'unavailable'
  | 'server_error'
  | 'network_error'
  | 'timeout';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | (string & {});
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    code: ApiErrorCode | (string & {}),
    message: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isOutcomeUnknown(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.code === 'network_error' || error.code === 'timeout' || error.status >= 500)
  );
}

export function errorMessage(error: unknown): string {
  return isApiError(error) ? error.message : 'Something went wrong. Please try again.';
}
