import type { TimeScale } from '../lib/api';

const OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

interface Props {
  value: TimeScale;
  onChange: (value: TimeScale) => void;
}

export function TimeScaleSelect({ value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      Time Range:
      <select
        data-testid="time-scale-select"
        className="rounded-md border border-border bg-card px-3 py-2 text-fg focus:outline-2 focus:outline-accent"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeScale)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
