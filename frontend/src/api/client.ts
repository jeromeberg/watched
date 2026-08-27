import type { LibraryTitle } from '../types';

const BASE_URL = '/api';

export interface ApiRequestOptions {
  signal?: AbortSignal;
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Format the message returned by NestJS for one failed request. */
export function formatApiErrorMessage(payload: unknown, status: number): string {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return `HTTP ${status}`;
  }

  const message = payload.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const messages = message
      .filter((item): item is string => typeof item === 'string' && !!item.trim())
      .map((item) => item.trim());
    if (messages.length > 0) return messages.join(', ');
  }

  return `HTTP ${status}`;
}

/** Report whether a rejected request was deliberately cancelled. */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Return a readable error without exposing non-error rejection values. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Register the active session handler and clean up only that registration. */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

async function request<T>(path: string, init: RequestInit = {}, options: ApiRequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    signal: options.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}));
    if (response.status === 401) unauthorizedHandler?.();
    throw new ApiError(formatApiErrorMessage(payload, response.status), response.status);
  }

  const responseText = await response.text();
  if (!responseText) return null as T;
  return JSON.parse(responseText) as T;
}

/** Load the complete movie and TV library without hiding either request failure. */
async function getMyLibrary(options: ApiRequestOptions = {}): Promise<LibraryTitle[]> {
  const [movies, shows] = await Promise.all([
    request<LibraryTitle[]>('/movies', {}, options),
    request<LibraryTitle[]>('/shows', {}, options),
  ]);
  return [...movies, ...shows];
}

export const api = {
  get: <T>(path: string, options: ApiRequestOptions = {}) => request<T>(path, {}, options),
  post: <T>(path: string, body: unknown, options: ApiRequestOptions = {}) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, options),
  patch: <T>(path: string, body: unknown, options: ApiRequestOptions = {}) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, options),
  delete: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>(path, { method: 'DELETE' }, options),
  getMyLibrary,
};
