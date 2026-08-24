import type { StatusResponse } from '../types'

type StatusBarProps = {
  status: StatusResponse | null
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null
  const noun = status.meters_count === 1 ? 'meter' : 'meters'
  const refreshed = lastRefresh?.toLocaleTimeString() ?? '—'

  return (
    <section className="status-bar" aria-live="polite">
      <span>Monitoring {status.meters_count} {noun}</span>
      <span>Last refresh: {refreshed}</span>
    </section>
  )
}
