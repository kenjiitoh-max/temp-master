import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

export const BACKUP_URL = '/api/backup'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // JSON 以外のエラーレスポンスは statusText をそのまま使う
    }
    throw new Error(detail || `HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchMeters(): Promise<MetersResponse> {
  return request('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return request('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  return request(`/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`)
}

export function triggerRefresh(): Promise<unknown> {
  return request('/api/meters/refresh', { method: 'POST' })
}
