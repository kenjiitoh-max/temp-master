import { backupUrl } from '../api/client'
import { TIME_SCALE_OPTIONS } from '../constants/timeScales'
import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  refreshing: boolean
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  refreshing,
}: ControlsProps) {
  return (
    <section className="panel controls">
      <label className="controls__field">
        Time Range:
        <select
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
        >
          {TIME_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="button button--primary" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <a className="button" href={backupUrl()} target="_blank" rel="noreferrer">
        Download Backup
      </a>
    </section>
  )
}
