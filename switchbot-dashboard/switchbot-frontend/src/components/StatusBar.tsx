import { Activity, AlertTriangle } from 'lucide-react'
import type { StatusResponse } from '../api/types'
import { formatClock } from '../format'

interface StatusBarProps {
  status: StatusResponse
  lastRefresh: Date
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count || 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <div className="space-y-3">
      <div
        id="status-bar"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <Activity className="size-4" aria-hidden />
          Monitoring {count} {noun}
        </span>
        <span>Last refresh: {formatClock(lastRefresh)}</span>
      </div>

      {status.is_rate_limited && (
        <div
          id="rate-limit-warning"
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <strong>Rate Limited.</strong>
          <span>SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.</span>
        </div>
      )}
    </div>
  )
}
