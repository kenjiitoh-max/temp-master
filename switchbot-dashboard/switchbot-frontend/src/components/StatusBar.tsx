import { formatClock } from '../utils/format'

interface StatusBarProps {
  metersCount: number
  lastRefresh: Date | null
}

export function StatusBar({ metersCount, lastRefresh }: StatusBarProps) {
  const noun = metersCount === 1 ? 'meter' : 'meters'
  return (
    <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
      <span>
        Monitoring {metersCount} {noun}
      </span>
      {lastRefresh && <span className="text-muted">Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  )
}
