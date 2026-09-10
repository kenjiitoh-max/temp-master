import { useHistory } from '../api/queries'
import type { Meter, TimeScale } from '../api/types'
import { getDisplayName } from '../constants/displayNames'
import { TemperatureChart } from './TemperatureChart'

interface MeterCardProps {
  meter: Meter
  timeScale: TimeScale
}

export function MeterCard({ meter, timeScale }: MeterCardProps) {
  const { data, isPending, isError } = useHistory(meter.device_id, timeScale)
  const history = data?.history ?? []

  return (
    <article className="card flex flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface-alt px-4 py-3">
        <strong className="truncate">{getDisplayName(meter.device_name)}</strong>
        <span className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted">{meter.device_type}</span>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {meter.current_temperature != null && (
            <span className="badge bg-temp text-sm">{meter.current_temperature}&deg;C</span>
          )}
          {meter.current_humidity != null && (
            <span className="badge bg-humidity text-sm">{meter.current_humidity}%</span>
          )}
          {meter.battery != null && <span className="badge bg-battery text-sm">{meter.battery}%</span>}
        </div>
        <div className="relative h-[200px]">
          {isPending ? (
            <p className="flex h-full items-center justify-center text-xs text-muted">Loading chart...</p>
          ) : isError ? (
            <p className="flex h-full items-center justify-center text-xs text-danger">Failed to load history</p>
          ) : (
            <TemperatureChart history={history} timeScale={timeScale} />
          )}
        </div>
        {meter.last_updated && (
          <p className="text-xs text-muted">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        )}
      </div>
    </article>
  )
}
