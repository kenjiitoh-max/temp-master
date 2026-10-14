import { Download, RefreshCw } from 'lucide-react'
import { TIME_SCALES, TIME_SCALE_LABELS, type TimeScale } from '../constants'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (value: TimeScale) => void
  onRefresh: () => void
  isRefreshing: boolean
  onBackup: () => void
}

const buttonBase =
  'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'

export function Controls({ timeScale, onTimeScaleChange, onRefresh, isRefreshing, onBackup }: ControlsProps) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <label htmlFor="time-scale-select" className="text-sm font-medium text-foreground">
        Time Range:
      </label>
      <select
        id="time-scale-select"
        value={timeScale}
        onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        {TIME_SCALES.map((scale) => (
          <option key={scale} value={scale}>
            {TIME_SCALE_LABELS[scale]}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2 sm:ml-4">
        <button
          id="btn-refresh"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`}
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          id="btn-backup"
          type="button"
          onClick={onBackup}
          className={`${buttonBase} border border-border bg-surface-muted text-foreground hover:bg-surface`}
        >
          <Download className="size-4" aria-hidden />
          Download Backup
        </button>
      </div>
    </section>
  )
}
