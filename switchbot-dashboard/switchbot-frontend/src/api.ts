import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from './types'

export const API_URL =
  window.location.protocol === 'file:' ? 'https://temp-master.fly.dev' : ''

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // Keep the HTTP status as the error when the response is not JSON.
    }
    throw new Error(detail)
  }
  return (await response.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>('/api/status')
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  return fetchJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
  )
}

export function triggerRefresh(): Promise<{ status: string; meters_count: number }> {
  return fetchJson('/api/meters/refresh', { method: 'POST' })
}
