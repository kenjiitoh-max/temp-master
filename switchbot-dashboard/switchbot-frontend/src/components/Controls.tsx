import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  onDownloadBackup: () => void
  refreshing: boolean
}

const TIME_SCALES: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onDownloadBackup,
  refreshing,
}: ControlsProps) {
  return (
    <div className="panel">
      <div className="panel-body controls">
        <label htmlFor="time-scale-select">Time Range:</label>
        <select
          id="time-scale-select"
          className="control-select"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        >
          {TIME_SCALES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button type="button" className="btn" onClick={onDownloadBackup}>
          Download Backup
        </button>
      </div>
    </div>
  )
}
