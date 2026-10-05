import type { Meter } from '../api/types';
import type { TimeScale } from '../config';
import { getDisplayName } from '../displayNames';
import { useHistory } from '../hooks/useHistory';
import { MeterChart } from './MeterChart';

interface MeterCardProps {
  meter: Meter;
  timeScale: TimeScale;
  refreshToken: number | null;
}

function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function MeterCard({ meter, timeScale, refreshToken }: MeterCardProps) {
  const history = useHistory(meter.device_id, timeScale, refreshToken);

  return (
    <article className="panel meter-card" data-device-id={meter.device_id}>
      <header className="meter-card__header">
        <strong className="meter-card__name">{getDisplayName(meter.device_name)}</strong>
        <span className="device-type-tag">{meter.device_type}</span>
      </header>
      <div className="meter-card__body">
        <div className="meter-stats">
          {hasValue(meter.current_temperature) && (
            <span className="stat stat--temperature" title="Temperature">
              {meter.current_temperature}°C
            </span>
          )}
          {hasValue(meter.current_humidity) && (
            <span className="stat stat--humidity" title="Humidity">
              {meter.current_humidity}%
            </span>
          )}
          {hasValue(meter.battery) && (
            <span className="stat stat--battery" title="Battery">
              {meter.battery}%
            </span>
          )}
        </div>
        <div className="meter-chart-wrap">
          {history ? (
            <>
              <MeterChart history={history.history} timeScale={history.timeScale} />
              {history.history.length === 0 && <p className="meter-chart-empty">No readings in this range</p>}
            </>
          ) : (
            <p className="meter-chart-empty">Loading chart...</p>
          )}
        </div>
        {meter.last_updated && (
          <p className="meter-last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        )}
      </div>
    </article>
  );
}
