import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  Status,
  TimeScale,
} from './types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<Status> {
  return request<Status>('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  return request<HistoryResponse>(`/api/meters/${encodeURIComponent(deviceId)}/history?${params}`)
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>('/api/meters/refresh', { method: 'POST' })
}

export function openBackup(): void {
  window.open(`${API_URL}/api/backup`, '_blank', 'noopener')
}
