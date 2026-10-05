import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, fetchMeters, fetchStatus, isAbortError } from '../api/client';
import type { Meter, StatusResponse } from '../api/types';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface DashboardData {
  meters: Meter[];
  status: StatusResponse | null;
  connection: ConnectionState;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  reload: () => Promise<void>;
}

function labelled<T>(promise: Promise<T>, label: string): Promise<T> {
  return promise.catch((err: unknown) => {
    if (isAbortError(err)) throw err;
    throw new Error(`${label}: ${errorMessage(err)}`);
  });
}

/**
 * Loads meters and status in parallel and re-polls every `intervalMs`.
 * Previously loaded meters are kept on screen when a poll fails.
 */
export function useDashboardData(intervalMs: number): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const [metersResp, statusResp] = await Promise.all([
        labelled(fetchMeters(controller.signal), 'Failed to fetch meters'),
        labelled(fetchStatus(controller.signal), 'Failed to fetch status'),
      ]);
      setMeters(metersResp.meters ?? []);
      setStatus(statusResp);
      setError(null);
      setConnection('connected');
      setLastRefresh(new Date());
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errorMessage(err));
      setConnection('disconnected');
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => void reload(), intervalMs);
    return () => {
      window.clearInterval(id);
      controllerRef.current?.abort();
    };
  }, [reload, intervalMs]);

  return { meters, status, connection, loading, error, lastRefresh, reload };
}
