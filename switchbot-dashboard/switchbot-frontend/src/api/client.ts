import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from '../types'

/**
 * When served from the FastAPI backend (same origin), the base URL stays empty.
 * When opened directly as a file:// URL, fall back to the production backend.
 * `VITE_API_URL` overrides both (used by `npm run dev`).
 */
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (configured) return configured.replace(/\/$/, '')
  if (window.location.protocol === 'file:') return 'https://temp-master.fly.dev'
  return ''
}

export const API_URL = resolveApiUrl()

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export function fetchMeters(signal?: AbortSignal): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters', { signal })
}

export function fetchStatus(signal?: AbortSignal): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status', { signal })
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const path = `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`
  return getJson<HistoryResponse>(path, { signal })
}

export function triggerRefresh(): Promise<{ status: string; meters_count: number }> {
  return getJson('/api/meters/refresh', { method: 'POST' })
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
