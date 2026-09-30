import type { ListParams, PageResponse } from './types';

/** Error thrown for any non-2xx response; built from the backend's RFC 7807 body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(detail || title);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Network error', 'Cannot reach the server. Is the backend running?');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? safeJson(text) : undefined;

  if (!response.ok) {
    const problem = (body ?? {}) as { title?: string; detail?: string; errors?: Record<string, string> };
    throw new ApiError(
      response.status,
      problem.title ?? response.statusText ?? 'Error',
      problem.detail ?? problem.title ?? `Request failed with status ${response.status}`,
      problem.errors ?? {},
    );
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Builds "?a=1&b=x", skipping undefined, null and blank values. */
export function toQuery(params: ListParams | Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function getPage<T>(path: string, params: ListParams): Promise<PageResponse<T>> {
  return request<PageResponse<T>>(path + toQuery(params));
}

export const json = (value: unknown): string => JSON.stringify(value);
