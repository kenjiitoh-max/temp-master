import type { TimeScale } from '../lib/types';

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  backupUrl: string;
}

export function Controls({ timeScale, onTimeScaleChange, backupUrl }: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded border border-border bg-surface px-4 py-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        Time Range:
        <select
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
          className="rounded border border-border bg-surface px-2 py-1 font-normal text-fg"
        >
          {TIME_SCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <a
        href={backupUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
      >
        Download Backup
      </a>
    </div>
  );
}
