import type { TimeScale } from '../types'

type TimeScaleSelectorProps = {
  value: TimeScale
  onChange: (value: TimeScale) => void
}

const options: Array<{ value: TimeScale; label: string }> = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export function TimeScaleSelector({ value, onChange }: TimeScaleSelectorProps) {
  return (
    <label className="control-group">
      <span>Time Range</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TimeScale)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
