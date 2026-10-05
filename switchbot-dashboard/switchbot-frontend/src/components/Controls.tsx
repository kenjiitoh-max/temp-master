import { TIME_SCALE_OPTIONS, type TimeScale } from '../config';

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onBackup: () => void;
}

export function Controls({ timeScale, onTimeScaleChange, refreshing, onRefresh, onBackup }: ControlsProps) {
  return (
    <section className="panel controls" aria-label="Controls">
      <div className="controls__group">
        <label htmlFor="time-scale-select" className="controls__label">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          className="select"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        >
          {TIME_SCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="controls__actions">
        <button
          type="button"
          id="btn-refresh"
          className="btn btn--primary"
          disabled={refreshing}
          onClick={onRefresh}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button type="button" id="btn-backup" className="btn btn--secondary" onClick={onBackup}>
          Download Backup
        </button>
      </div>
    </section>
  );
}
