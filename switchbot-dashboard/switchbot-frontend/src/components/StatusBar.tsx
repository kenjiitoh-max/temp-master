import { formatClock } from '../lib/format';
import type { StatusResponse } from '../lib/types';

interface StatusBarProps {
  status: StatusResponse;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count || 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2 rounded border border-border bg-info-bg px-4 py-3 text-sm text-info-fg">
        <span>
          Monitoring {count} {count === 1 ? 'meter' : 'meters'}
        </span>
        {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
      </div>
      {status.is_rate_limited && (
        <div
          role="alert"
          className="rounded border border-border bg-warning-bg px-4 py-3 text-sm text-warning-fg"
        >
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
          {status.backoff_remaining || 0} seconds.
        </div>
      )}
    </div>
  );
}
