import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "../api/client";
import type { Meter, TimeScale } from "../api/types";
import { REFRESH_INTERVAL } from "../config";
import { getDisplayName } from "../utils/displayNames";
import { MeterChart } from "./MeterChart";

interface MeterCardProps {
  meter: Meter;
  timeScale: TimeScale;
}

export function MeterCard({ meter, timeScale }: MeterCardProps) {
  const { data } = useQuery({
    queryKey: ["history", meter.device_id, timeScale],
    queryFn: () => fetchHistory(meter.device_id, timeScale),
    refetchInterval: REFRESH_INTERVAL,
  });

  const history = data?.history ?? [];

  return (
    <div className="meter-card">
      <div className="meter-card-header">
        <span className="meter-name">{getDisplayName(meter.device_name)}</span>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card-body">
        <div className="meter-stats">
          {meter.current_temperature != null && (
            <span className="badge badge-temp">
              {meter.current_temperature}&#176;C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="badge badge-humidity">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="badge badge-battery">{meter.battery}%</span>
          )}
        </div>
        <div className="meter-chart-wrap">
          <MeterChart history={history} timeScale={timeScale} />
        </div>
        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
