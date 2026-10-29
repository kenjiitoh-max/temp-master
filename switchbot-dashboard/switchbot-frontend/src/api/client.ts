import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from '../types'

// 本番は FastAPI が同一オリジンで配信するので空文字（相対パス）。
// 別オリジンの API を叩きたい場合は VITE_API_URL で上書きする。
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // JSON でないレスポンスは statusText をそのまま使う
    }
    throw new ApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  return request<HistoryResponse>(`/api/meters/${encodeURIComponent(deviceId)}/history?${params}`)
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>('/api/meters/refresh', { method: 'POST' })
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
