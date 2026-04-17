import { getToken } from './auth.js';

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
};

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  const url = `/api${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { ...authHeaders(), ...options.headers };

  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const errorBody = await tryParseJson<{ error?: { code?: string; message?: string } }>(response);
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? 'UNKNOWN',
      errorBody?.error?.message ?? `Request failed with status ${response.status}`
    );
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

async function requestRaw(method: string, path: string, options: RequestOptions = {}): Promise<Response> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { ...authHeaders(), ...options.headers };

  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  return fetch(url, init);
}

async function requestFormData<T>(method: string, path: string, formData: FormData): Promise<T> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method,
    headers: authHeaders(),
    body: formData
  });

  if (!response.ok) {
    const errorBody = await tryParseJson<{ error?: { code?: string; message?: string } }>(response);
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? 'UNKNOWN',
      errorBody?.error?.message ?? `Request failed with status ${response.status}`
    );
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

async function tryParseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
  postRaw: (path: string, body?: unknown) => requestRaw('POST', path, { body }),
  getRaw: (path: string) => requestRaw('GET', path),
  postFormData: <T>(path: string, formData: FormData) => requestFormData<T>('POST', path, formData)
};
