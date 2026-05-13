import type { ApiResponse } from '@shared/types/api/common';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:3000/api/v1';
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function tokenFor(path: string): string | null {
  if (path.startsWith('/admin/') || path.includes('/api/v1/admin/')) {
    return localStorage.getItem('auth.adminToken');
  }
  if (path.startsWith('/customer/') || path.includes('/api/v1/customer/')) {
    return localStorage.getItem('auth.tableToken');
  }
  return null;
}

function scopeFor(path: string): 'admin' | 'table' | null {
  if (path.startsWith('/admin/') || path.includes('/api/v1/admin/')) return 'admin';
  if (path.startsWith('/customer/') || path.includes('/api/v1/customer/')) return 'table';
  return null;
}

// Auth error handler — Unit 1 (Auth) registers here so token expiry triggers logout.
export type AuthErrorHandler = (scope: 'admin' | 'table', code: string) => void;
let onAuthError: AuthErrorHandler | null = null;
export function registerAuthErrorHandler(handler: AuthErrorHandler | null): void {
  onAuthError = handler;
}

async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const externalSignal = opts.signal;
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  };
  const token = tokenFor(path);
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === 'AbortError') {
      throw new ApiError('NETWORK_TIMEOUT', 'Request timed out', 0);
    }
    throw new ApiError('NETWORK_ERROR', (e as Error).message, 0);
  }
  clearTimeout(timeoutId);

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('INVALID_RESPONSE', 'Failed to parse server response', res.status);
  }

  if (!json.success) {
    if (
      res.status === 401 &&
      (json.error.code === 'AUTH_TOKEN_EXPIRED' || json.error.code === 'AUTH_TOKEN_INVALID')
    ) {
      const scope = scopeFor(path);
      if (scope && onAuthError) onAuthError(scope, json.error.code);
    }
    throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
  }
  return json.data;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
