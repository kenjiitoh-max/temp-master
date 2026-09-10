import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchHistory, fetchMeters, fetchStatus, triggerRefresh } from './client'
import type { TimeScale } from './types'

export const REFRESH_INTERVAL = 30000

export const queryKeys = {
  meters: ['meters'] as const,
  status: ['status'] as const,
  history: (deviceId: string, timeScale: TimeScale) => ['history', deviceId, timeScale] as const,
}

export function useMeters() {
  return useQuery({
    queryKey: queryKeys.meters,
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  })
}

export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  })
}

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: queryKeys.history(deviceId, timeScale),
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL,
  })
}

export function useRefreshMeters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerRefresh,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
