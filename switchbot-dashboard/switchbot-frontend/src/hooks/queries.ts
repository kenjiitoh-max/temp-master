import { useQuery } from '@tanstack/react-query'
import { fetchHistory, fetchMeters, fetchStatus } from '../api'
import type { TimeScale } from '../types'

export const REFRESH_INTERVAL = 30_000

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  })
}

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  })
}

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    // 時間範囲をキーに含めることで、変更時に全チャートが再取得される
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL,
  })
}
