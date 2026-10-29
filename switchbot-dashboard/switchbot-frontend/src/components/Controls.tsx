import { backupUrl } from '../api/client'
import type { TimeScale } from '../types'
import { TIME_SCALE_OPTIONS } from '../utils/format'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  refreshing: boolean
}

export function Controls({ timeScale, onTimeScaleChange, onRefresh, refreshing }: ControlsProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span>Time Range:</span>
          <select
            id="time-scale-select"
            className="rounded border border-border bg-surface px-2 py-1.5 text-fg focus:outline-none focus:ring-2 focus:ring-primary"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
          >
            {TIME_SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          id="btn-refresh"
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <a
          id="btn-backup"
          href={backupUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-border bg-surface-muted px-3 py-1.5 text-sm font-medium text-fg no-underline hover:opacity-90"
        >
          Download Backup
        </a>
      </div>
    </section>
  )
}
