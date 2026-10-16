import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function normalizeBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl ?? '').trim().replace(/\/+$/, '');
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      return body.detail;
    }
  } catch {
    // Non-JSON error body: fall back to the status text.
  }
  return res.statusText || `HTTP ${res.status}`;
}

export function createApiClient(baseUrl = '', fetchImpl: FetchLike = (...args) => fetch(...args)) {
  const base = normalizeBaseUrl(baseUrl);
  const url = (path: string) => `${base}${path}`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetchImpl(url(path), {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      throw new ApiError(await readErrorMessage(res), res.status);
    }
    return (await res.json()) as T;
  }

  return {
    url,
    getMeters: () => request<MetersResponse>('/api/meters'),
    getStatus: () => request<StatusResponse>('/api/status'),
    getHistory: (deviceId: string, timeScale: TimeScale) =>
      request<HistoryResponse>(
        `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
      ),
    refreshMeters: () => request<RefreshResponse>('/api/meters/refresh', { method: 'POST' }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient(import.meta.env.VITE_API_BASE_URL);
