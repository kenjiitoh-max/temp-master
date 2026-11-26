import { BACKUP_URL } from '../api'
import type { TimeScale } from '../types'

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

interface ControlPanelProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function ControlPanel({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  isRefreshing,
}: ControlPanelProps) {
  return (
    <section className="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-3 rounded border border-border bg-surface p-[15px]">
      <label htmlFor="time-scale-select" className="mr-0.5 font-bold">
        Time Range:
      </label>
      <select
        id="time-scale-select"
        value={timeScale}
        onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
        className="mr-5 h-[34px] rounded border border-border bg-surface px-3 text-text"
      >
        {TIME_SCALE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        data-testid="btn-refresh"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-[34px] cursor-pointer rounded bg-primary px-3 text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button
        type="button"
        data-testid="btn-backup"
        onClick={() => window.open(BACKUP_URL, '_blank')}
        className="h-[34px] cursor-pointer rounded border border-border bg-surface px-3 text-text hover:bg-surface-muted"
      >
        Download Backup
      </button>
    </section>
  )
}
