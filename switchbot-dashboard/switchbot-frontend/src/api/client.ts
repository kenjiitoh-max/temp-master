import { API_URL, type TimeScale } from '../config';
import type { HistoryResponse, MetersResponse, RefreshResponse, StatusResponse } from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`.trim();
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Non-JSON error body: keep the status line.
    }
    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

export function fetchMeters(signal?: AbortSignal): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters', { signal });
}

export function fetchStatus(signal?: AbortSignal): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status', { signal });
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const query = new URLSearchParams({ time_scale: timeScale });
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${query.toString()}`,
    { signal },
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>('/api/meters/refresh', { method: 'POST' });
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}
