import { TIME_SCALES, TIME_SCALE_LABELS, type TimeScale } from '../api/types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

export function Controls({ timeScale, onTimeScaleChange, onRefresh, onBackup, refreshing }: ControlsProps) {
  return (
    <div className="card flex flex-wrap items-center gap-4 p-4">
      <label className="flex items-center gap-2 text-sm">
        <span>Time Range:</span>
        <select
          id="time-scale-select"
          className="select"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        >
          {TIME_SCALES.map((scale) => (
            <option key={scale} value={scale}>
              {TIME_SCALE_LABELS[scale]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn-primary" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button type="button" className="btn-secondary" onClick={onBackup}>
        Download Backup
      </button>
    </div>
  )
}
