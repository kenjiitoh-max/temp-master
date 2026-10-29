import type { StatusResponse } from '../types'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: string | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null

  const count = status.meters_count ?? 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <>
      <div
        id="status-bar"
        className="flex items-center justify-between rounded-lg border border-border bg-info-bg px-4 py-3 text-sm text-info-fg"
      >
        <span>
          Monitoring {count} {noun}
        </span>
        {lastRefresh && <span>Last refresh: {lastRefresh}</span>}
      </div>
      {status.is_rate_limited && (
        <div
          id="rate-limit-warning"
          className="rounded-lg border border-border bg-warning-bg px-4 py-3 text-sm text-warning-fg"
        >
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
          {status.backoff_remaining ?? 0} seconds.
        </div>
      )}
    </>
  )
}
