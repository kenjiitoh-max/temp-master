import type { MeterDevice, TimeScale } from '../types'
import { DeviceCard } from './DeviceCard'

interface DeviceListProps {
  meters: MeterDevice[]
  timeScale: TimeScale
  reloadToken: number
}

export function DeviceList({ meters, timeScale, reloadToken }: DeviceListProps) {
  if (meters.length === 0) {
    return (
      <p className="py-10 text-center text-fg-muted">
        No meters found. Configure SwitchBot credentials on the backend to start collecting data.
      </p>
    )
  }

  return (
    <div id="meters-container" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meters.map((meter) => (
        <DeviceCard
          key={meter.device_id}
          meter={meter}
          timeScale={timeScale}
          reloadToken={reloadToken}
        />
      ))}
    </div>
  )
}
