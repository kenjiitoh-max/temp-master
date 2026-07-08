import type { MeterDevice, TimeScale } from '../types'
import { getDisplayName } from '../utils/displayNames'
import { TemperatureChart } from './TemperatureChart'

interface MeterCardProps {
  meter: MeterDevice
  timeScale: TimeScale
  refreshTick: number
}

export function MeterCard({ meter, timeScale, refreshTick }: MeterCardProps) {
  const name = getDisplayName(meter.device_name)
  const lastUpdated = meter.last_updated ? new Date(meter.last_updated).toLocaleString() : null

  return (
    <div className="panel meter-card">
      <div className="panel-heading">
        <span className="meter-name">{name}</span>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="panel-body">
        <div className="meter-stats">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="stat-badge stat-temp">{`${meter.current_temperature}\u00b0C`}</span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="stat-badge stat-humidity">{`${meter.current_humidity}%`}</span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="stat-badge stat-battery">{`${meter.battery}%`}</span>
          )}
        </div>
        <TemperatureChart
          deviceId={meter.device_id}
          timeScale={timeScale}
          refreshTick={refreshTick}
        />
        {lastUpdated && <p className="meter-last-updated">{`Last updated: ${lastUpdated}`}</p>}
      </div>
    </div>
  )
}
