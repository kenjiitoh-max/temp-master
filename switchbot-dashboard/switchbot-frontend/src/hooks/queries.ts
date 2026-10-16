import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TimeScale } from '../lib/types';

export const REFRESH_INTERVAL_MS = 30_000;

export const queryKeys = {
  meters: ['meters'] as const,
  status: ['status'] as const,
  historyAll: ['history'] as const,
  history: (deviceId: string, timeScale: TimeScale) => ['history', deviceId, timeScale] as const,
};

export function useMeters() {
  return useQuery({
    queryKey: queryKeys.meters,
    queryFn: api.getMeters,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: api.getStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useMeterHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: queryKeys.history(deviceId, timeScale),
    queryFn: () => api.getHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}

export function useRefreshMeters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.refreshMeters,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meters }),
        queryClient.invalidateQueries({ queryKey: queryKeys.status }),
        queryClient.invalidateQueries({ queryKey: queryKeys.historyAll }),
      ]),
  });
}
