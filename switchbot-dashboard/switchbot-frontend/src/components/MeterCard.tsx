import type { MeterDevice, MeterReading, TimeScale } from '../types'
import { getDisplayName } from '../utils'
import { Chart } from './Chart'

type MeterCardProps = {
  meter: MeterDevice
  readings: MeterReading[]
  timeScale: TimeScale
  historyLoading: boolean
}

export function MeterCard({
  meter,
  readings,
  timeScale,
  historyLoading,
}: MeterCardProps) {
  return (
    <article className="meter-card">
      <header className="meter-card-header">
        <h2>{getDisplayName(meter.device_name)}</h2>
        <span className="device-type">{meter.device_type}</span>
      </header>
      <div className="meter-stats">
        {meter.current_temperature !== null && (
          <span className="metric metric-temperature">{meter.current_temperature}°C</span>
        )}
        {meter.current_humidity !== null && (
          <span className="metric metric-humidity">{meter.current_humidity}% humidity</span>
        )}
        {meter.battery !== null && (
          <span className="metric metric-battery">{meter.battery}% battery</span>
        )}
      </div>
      {historyLoading ? (
        <div className="chart-loading">Loading history…</div>
      ) : (
        <Chart readings={readings} timeScale={timeScale} />
      )}
      {meter.last_updated && (
        <p className="last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
      )}
    </article>
  )
}
