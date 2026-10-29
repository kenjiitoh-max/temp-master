import type { MeterDevice, TimeScale } from '../types'
import { getDisplayName } from '../utils/displayNames'
import { TemperatureChart } from './TemperatureChart'

interface DeviceCardProps {
  meter: MeterDevice
  timeScale: TimeScale
  reloadToken: number
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`rounded px-2 py-1 text-sm font-semibold text-white ${className}`}>
      {children}
    </span>
  )
}

export function DeviceCard({ meter, timeScale, reloadToken }: DeviceCardProps) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
      data-device-id={meter.device_id}
    >
      <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
        <strong className="truncate text-fg">{getDisplayName(meter.device_name)}</strong>
        <span className="ml-2 shrink-0 rounded-full bg-bg px-2 py-0.5 text-[11px] text-fg-muted">
          {meter.device_type}
        </span>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {meter.current_temperature != null && (
            <Badge className="bg-temp">{meter.current_temperature}°C</Badge>
          )}
          {meter.current_humidity != null && (
            <Badge className="bg-humidity">{meter.current_humidity}%</Badge>
          )}
          {meter.battery != null && <Badge className="bg-battery">{meter.battery}%</Badge>}
        </div>
        <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} reloadToken={reloadToken} />
        {meter.last_updated && (
          <p className="m-0 text-xs text-fg-muted">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  )
}
