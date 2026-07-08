import type { TimeScale } from "../api/types";

interface TimeScaleOption {
  value: TimeScale;
  label: string;
}

const TIME_SCALE_OPTIONS: TimeScaleOption[] = [
  { value: "hour", label: "Last Hour" },
  { value: "day", label: "Last 24 Hours" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
];

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (value: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
  refreshing: boolean;
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
}: ControlsProps) {
  return (
    <div className="panel">
      <div className="panel-body controls">
        <label className="control-label" htmlFor="time-scale-select">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          className="form-control"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
        >
          {TIME_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        <button type="button" className="btn" onClick={onBackup}>
          Download Backup
        </button>
      </div>
    </div>
  );
}
