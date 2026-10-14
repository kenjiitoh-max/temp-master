import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { REFRESH_INTERVAL_MS, type TimeScale } from '../constants'

export const queryKeys = {
  meters: ['meters'] as const,
  status: ['status'] as const,
  history: (deviceId: string, timeScale: TimeScale) => ['history', deviceId, timeScale] as const,
}

export function useMeters() {
  return useQuery({
    queryKey: queryKeys.meters,
    queryFn: api.getMeters,
    select: (data) => data.meters,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: api.getStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useMeterHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: queryKeys.history(deviceId, timeScale),
    queryFn: () => api.getHistory(deviceId, timeScale),
    select: (data) => data.history,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}

export function useRefreshMeters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.refresh,
    // 成功・失敗どちらでも最新のキャッシュを取り直す (旧実装と同じ挙動)
    onSettled: () => queryClient.invalidateQueries(),
  })
}
