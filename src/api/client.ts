// src/api/client.ts

import { ApiError } from './errors';
import { isMockMode } from './mock-mode';
import type { ApiResponse } from './types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/v1`;
const TIMEOUT_MS = 15_000;

export type AuthHandlers = {
  getAccessToken: () => Promise<string | null>;
  refresh: () => Promise<string | null>;
  onSignedOut: () => void;
};

let handlers: AuthHandlers | null = null;

export function configureApiClient(next: AuthHandlers): void {
  handlers = next;
}

type Method = 'GET' | 'POST';

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
  if (isMockMode) {
    throw new ApiError(0, 'mock_mode', 'Live API requests are disabled while demo data is active.');
  }

  const url = `${BASE_URL}${path}${buildQuery(options.query)}`;
  const token = (await handlers?.getAccessToken()) ?? null;
  let response = await send(method, url, token, options.body);

  if (response.status === 401 && handlers) {
    const fresh = await handlers.refresh();
    if (!fresh) {
      handlers.onSignedOut();
      return parse<T>(response);
    }
    response = await send(method, url, fresh, options.body);
    if (response.status === 401) handlers.onSignedOut();
  }
  return parse<T>(response);
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) =>
    request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
};
