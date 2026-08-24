import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHistory,
  fetchMeters,
  fetchStatus,
  triggerRefresh
} from "../api";
import { REFRESH_INTERVAL } from "../constants";
import type {
  HistoryReading,
  Meter,
  StatusResponse,
  TimeScale
} from "../types";

interface DashboardData {
  meters: Meter[];
  histories: Record<string, HistoryReading[]>;
  status: StatusResponse | null;
  loading: boolean;
  refreshing: boolean;
  connected: boolean | null;
  error: string | null;
  lastRefresh: Date | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(timeScale: TimeScale): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [histories, setHistories] = useState<
    Record<string, HistoryReading[]>
  >({});
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const requestId = useRef(0);

  const loadData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const [metersResponse, statusResponse] = await Promise.all([
        fetchMeters(),
        fetchStatus()
      ]);
      const nextMeters = metersResponse.meters ?? [];
      const historyResults = await Promise.all(
        nextMeters.map(async (meter) => {
          try {
            const response = await fetchHistory(meter.device_id, timeScale);
            return [meter.device_id, response.history ?? []] as const;
          } catch {
            return [meter.device_id, []] as const;
          }
        })
      );
      if (currentRequest !== requestId.current) return;
      setMeters(nextMeters);
      setStatus(statusResponse);
      setHistories(Object.fromEntries(historyResults));
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      const message =
        loadError instanceof Error ? loadError.message : String(loadError);
      setConnected(false);
      setError(`Failed to fetch data: ${message}`);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [timeScale]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await loadData();
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : String(refreshError);
      setConnected(false);
      setError(`Failed to refresh: ${message}`);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => void loadData(), REFRESH_INTERVAL);
    return () => {
      window.clearInterval(interval);
      requestId.current += 1;
    };
  }, [loadData]);

  return {
    meters,
    histories,
    status,
    loading,
    refreshing,
    connected,
    error,
    lastRefresh,
    refresh
  };
}
