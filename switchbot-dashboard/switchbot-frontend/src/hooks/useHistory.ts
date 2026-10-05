import { useEffect, useState } from 'react';
import { fetchHistory } from '../api/client';
import type { MeterReading } from '../api/types';
import type { TimeScale } from '../config';

interface HistoryState {
  key: string;
  timeScale: TimeScale;
  history: MeterReading[];
}

export interface HistoryResult {
  timeScale: TimeScale;
  history: MeterReading[];
}

/**
 * Fetches a meter's temperature history. Re-fetches whenever `refreshToken`
 * changes (each dashboard poll) and when the time scale changes. While a new
 * time scale is loading, returns null instead of stale data from another range.
 */
export function useHistory(
  deviceId: string,
  timeScale: TimeScale,
  refreshToken: number | null,
): HistoryResult | null {
  const [state, setState] = useState<HistoryState | null>(null);
  const key = `${deviceId}::${timeScale}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((data) => {
        setState({ key: `${deviceId}::${timeScale}`, timeScale, history: data.history ?? [] });
      })
      .catch(() => {
        // Keep whatever is currently shown; the next poll will retry.
      });
    return () => controller.abort();
  }, [deviceId, timeScale, refreshToken]);

  if (!state || state.key !== key) return null;
  return { timeScale: state.timeScale, history: state.history };
}
