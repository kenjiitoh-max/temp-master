import { BatteryMedium, Droplets, Thermometer } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Meter } from '../api/types'
import { getDisplayName, type TimeScale } from '../constants'
import { TemperatureChart } from './TemperatureChart'

function StatBadge({ className, icon, children, label }: { className: string; icon: ReactNode; children: ReactNode; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm font-semibold tabular-nums ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}

export function MeterCard({ meter, timeScale }: { meter: Meter; timeScale: TimeScale }) {
  return (
    <article
      data-device-id={meter.device_id}
      className="flex flex-col rounded-xl border border-border bg-surface shadow-sm"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted/60 px-4 py-3">
        <h2 className="truncate font-semibold text-foreground">{getDisplayName(meter.device_name)}</h2>
        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
          {meter.device_type}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {meter.current_temperature != null && (
            <StatBadge label="Temperature" className="border-temp/30 bg-temp/10 text-temp" icon={<Thermometer className="size-3.5" aria-hidden />}>
              {meter.current_temperature}°C
            </StatBadge>
          )}
          {meter.current_humidity != null && (
            <StatBadge label="Humidity" className="border-humidity/30 bg-humidity/10 text-humidity" icon={<Droplets className="size-3.5" aria-hidden />}>
              {meter.current_humidity}%
            </StatBadge>
          )}
          {meter.battery != null && (
            <StatBadge label="Battery" className="border-battery/30 bg-battery/10 text-battery" icon={<BatteryMedium className="size-3.5" aria-hidden />}>
              {meter.battery}%
            </StatBadge>
          )}
        </div>

        <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />

        {meter.last_updated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  )
}
