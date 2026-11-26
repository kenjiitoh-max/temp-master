import { getDisplayName } from '../lib/displayNames'
import type { MeterDevice, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

const BADGE_CLASS = 'rounded px-2 py-1 text-sm font-bold text-on-badge'

interface MeterCardProps {
  meter: MeterDevice
  timeScale: TimeScale
}

export function MeterCard({ meter, timeScale }: MeterCardProps) {
  return (
    <article
      data-testid="meter-card"
      className="mb-5 rounded border border-border bg-surface shadow-sm"
    >
      <header className="flex items-center justify-between gap-2 rounded-t border-b border-border bg-surface-muted px-[15px] py-2.5">
        <strong>{getDisplayName(meter.device_name)}</strong>
        <span className="rounded-full bg-border/70 px-2 py-0.5 text-[11px] text-text-muted">
          {meter.device_type}
        </span>
      </header>
      <div className="p-[15px]">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {meter.current_temperature != null ? (
            <span className={`${BADGE_CLASS} bg-danger`} title="Temperature">
              {meter.current_temperature}°C
            </span>
          ) : null}
          {meter.current_humidity != null ? (
            <span className={`${BADGE_CLASS} bg-info`} title="Humidity">
              {meter.current_humidity}%
            </span>
          ) : null}
          {meter.battery != null ? (
            <span className={`${BADGE_CLASS} bg-success`} title="Battery">
              {meter.battery}%
            </span>
          ) : null}
        </div>
        <div className="h-[200px]">
          <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />
        </div>
        {meter.last_updated ? (
          <p className="mt-2 text-xs text-text-muted">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : null}
      </div>
    </article>
  )
}
