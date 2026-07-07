import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from '../types'

const PRODUCTION_BACKEND = 'https://temp-master.fly.dev'

// Resolve the API base URL:
// - If VITE_API_URL is set (build/dev time), use it.
// - When opened directly as a file:// URL, fall back to the production backend.
// - Otherwise (served from the FastAPI backend, same origin), use an empty
//   string so requests are relative.
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return PRODUCTION_BACKEND
  }
  return ''
}

export const API_URL = resolveApiUrl()

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status')
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
  )
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${res.statusText}`)
  }
}

export function downloadBackup(): void {
  window.open(`${API_URL}/api/backup`, '_blank')
}
