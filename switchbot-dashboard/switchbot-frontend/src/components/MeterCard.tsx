import { getDisplayName } from '../constants/displayNames'
import { useHistory } from '../hooks/useHistory'
import { TemperatureChart } from './TemperatureChart'
import type { Meter, TimeScale } from '../types'

interface MeterCardProps {
  meter: Meter
  timeScale: TimeScale
  revision: number
}

export function MeterCard({ meter, timeScale, revision }: MeterCardProps) {
  const { history } = useHistory(meter.device_id, timeScale, revision)

  return (
    <article className="panel meter-card">
      <div className="meter-card__header">
        <strong>{getDisplayName(meter.device_name)}</strong>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card__body">
        <div className="meter-card__stats">
          {meter.current_temperature !== null && (
            <span className="badge badge--temperature">{meter.current_temperature}°C</span>
          )}
          {meter.current_humidity !== null && (
            <span className="badge badge--humidity">{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && (
            <span className="badge badge--battery">{meter.battery}%</span>
          )}
        </div>
        <TemperatureChart history={history} timeScale={timeScale} />
        {meter.last_updated && (
          <p className="meter-card__updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  )
}
