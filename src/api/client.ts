// src/api/client.ts

import { ApiError } from './errors';
import type { ApiResponse } from './types';
import { reportError } from '@/lib/report-error';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const BASE_URL = API_URL ? `${API_URL}/api/v1` : null;
const TIMEOUT_MS = 15_000;

export type AuthHandlers = {
  getAccessToken: () => Promise<string | null>;
  refresh: () => Promise<string | null>;
  onSignedOut: () => void;
};

let handlers: AuthHandlers | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClient(next: AuthHandlers): void {
  handlers = next;
}

function refreshOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    const refresh = handlers?.refresh;
    if (!refresh) return Promise.resolve(null);
    refreshInFlight = Promise.resolve()
      .then(() => refresh())
      .catch(() => {
        throw new ApiError(0, 'network_error', 'Check your internet connection and try again.');
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

type Method = 'GET' | 'POST' | 'DELETE';

function reportApiFailure(error: unknown, method: Method): void {
  const tags: Record<string, string> = { 'api.method': method };
  const code = error instanceof ApiError ? error.code : 'unexpected';
  if (error instanceof ApiError) {
    tags['api.status'] = String(error.status);
    tags['api.error_code'] = error.code;
  }
  reportError({ source: 'api', tags, fingerprint: ['api-request', method, code] });
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function send(method: Method, url: string, token: string | null, body?: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, 'timeout', 'The request took too long. Please try again.');
    }
    throw new ApiError(0, 'network_error', 'Check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(response: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(response.status, 'server_error', 'Unexpected response from the server.');
  }
  if (json.ok) return json.data;
  const retryHeader = response.headers.get('Retry-After');
  const retryAfter = retryHeader ? Number.parseInt(retryHeader, 10) : null;
  throw new ApiError(
    response.status,
    json.error.code,
    json.error.message,
    Number.isFinite(retryAfter) ? retryAfter : null,
  );
}

async function request<T>(
  method: Method,
  path: string,
  options: { query?: Record<string, string | number | undefined>; body?: unknown } = {},
): Promise<T> {
  try {
    if (!BASE_URL) {
      throw new ApiError(
        0,
        'configuration_error',
        'The API server is not configured. Please try again later.',
      );
    }

    const url = `${BASE_URL}${path}${buildQuery(options.query)}`;
    const token = (await handlers?.getAccessToken()) ?? null;
    let response = await send(method, url, token, options.body);

    if (response.status === 401 && handlers) {
      const fresh = await refreshOnce();
      if (!fresh) {
        handlers.onSignedOut();
        return await parse<T>(response);
      }
      response = await send(method, url, fresh, options.body);
      if (response.status === 401) handlers.onSignedOut();
    }

    return await parse<T>(response);
  } catch (error) {
    reportApiFailure(error, method);
    throw error;
  }
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) =>
    request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
