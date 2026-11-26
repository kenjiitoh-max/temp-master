export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Meter {
  device_id: string;
  device_name: string;
  device_type: string;
  hub_device_id: string | null;
  current_temperature: number | null;
  current_humidity: number | null;
  battery: number | null;
  last_updated: string | null;
}

export interface MetersResponse {
  meters: Meter[];
  last_updated: string | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number;
  collection_interval: number;
}

export interface Reading {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery: number | null;
}

export interface HistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: Reading[];
  device: Meter | null;
}

// Same origin when served by FastAPI; production backend when opened as file://.
export const API_URL = window.location.protocol === 'file:' ? 'https://temp-master.fly.dev' : '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // non-JSON error body
    }
    throw new Error(`${res.status} ${detail}`.trim());
  }
  return (await res.json()) as T;
}

export const api = {
  getMeters: () => request<MetersResponse>('/api/meters'),
  getStatus: () => request<StatusResponse>('/api/status'),
  getHistory: (deviceId: string, timeScale: TimeScale) =>
    request<HistoryResponse>(
      `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
    ),
  refresh: () => request<{ status: string; message: string; meters_count: number }>('/api/meters/refresh', { method: 'POST' }),
  backupUrl: () => `${API_URL}/api/backup`,
};
