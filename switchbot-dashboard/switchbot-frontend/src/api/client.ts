import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from './types'

// API base URL resolution (mirrors the legacy dashboard behavior):
//   - Same-origin serving (behind the FastAPI backend): empty string.
//   - Opened directly as a file:// URL: fall back to the production backend.
//   - Overridable via the VITE_API_URL environment variable.
function resolveApiUrl(): string {
  const override = import.meta.env.VITE_API_URL
  if (override !== undefined && override !== '') {
    return override
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'https://temp-master.fly.dev'
  }
  return ''
}

export const API_URL = resolveApiUrl()

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`)
  }
  return response.json() as Promise<T>
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

export async function triggerRefresh(): Promise<RefreshResponse> {
  const response = await fetch(`${API_URL}/api/meters/refresh`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Refresh failed (${response.status})`)
  }
  return response.json() as Promise<RefreshResponse>
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
