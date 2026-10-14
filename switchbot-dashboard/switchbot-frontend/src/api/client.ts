import type { TimeScale } from '../constants'
import type { HistoryResponse, MetersResponse, RefreshResponse, StatusResponse } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init)
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body: unknown = await res.json()
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // レスポンスが JSON でなければ statusText をそのまま使う
    }
    throw new ApiError(res.status, `${res.status} ${detail}`.trim())
  }
  return (await res.json()) as T
}

export const api = {
  getMeters: () => request<MetersResponse>('/api/meters'),
  getStatus: () => request<StatusResponse>('/api/status'),
  getHistory: (deviceId: string, timeScale: TimeScale) =>
    request<HistoryResponse>(
      `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
    ),
  refresh: () => request<RefreshResponse>('/api/meters/refresh', { method: 'POST' }),
  backupUrl: () => `${API_URL}/api/backup`,
}
