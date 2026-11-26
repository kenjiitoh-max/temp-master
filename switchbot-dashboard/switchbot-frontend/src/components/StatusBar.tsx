import type { StatusResponse } from '../lib/api';
import { formatClock } from '../lib/format';

interface Props {
  status: StatusResponse;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: Props) {
  const count = status.meters_count || 0;
  return (
    <div className="space-y-3">
      <div
        data-testid="status-bar"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
      >
        <span>
          Monitoring {count} {count === 1 ? 'meter' : 'meters'}
        </span>
        {lastRefresh && <span className="text-muted">Last refresh: {formatClock(lastRefresh)}</span>}
      </div>
      {status.is_rate_limited && (
        <div
          role="alert"
          data-testid="rate-limit-warning"
          className="rounded-lg border border-warning/50 bg-warning/15 px-4 py-3 text-sm"
        >
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.
        </div>
      )}
    </div>
  );
}

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      data-testid="connection-status"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        connected ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  );
}
