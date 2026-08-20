import { formatClockTime } from '../utils/format'
import type { StatusResponse } from '../types'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null

  const count = status.meters_count ?? 0

  return (
    <>
      <div className="alert alert--info">
        <span>
          Monitoring {count} {count === 1 ? 'meter' : 'meters'}
        </span>
        {lastRefresh && <span>Last refresh: {formatClockTime(lastRefresh)}</span>}
      </div>
      {status.is_rate_limited && (
        <div className="alert alert--warning">
          <span>
            <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
            {status.backoff_remaining ?? 0} seconds.
          </span>
        </div>
      )}
    </>
  )
}
