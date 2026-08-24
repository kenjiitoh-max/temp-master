import { getDisplayName } from "../constants";
import type { HistoryReading, Meter, TimeScale } from "../types";
import { TemperatureChart } from "./TemperatureChart";

interface MeterCardProps {
  meter: Meter;
  history: HistoryReading[];
  timeScale: TimeScale;
  isDark: boolean;
}

function Metric({
  value,
  suffix,
  color
}: {
  value: number | null;
  suffix: string;
  color: string;
}) {
  if (value === null) return null;
  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-semibold ${color}`}>
      {value}
      {suffix}
    </span>
  );
}

export function MeterCard({
  meter,
  history,
  timeScale,
  isDark
}: MeterCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <header className="flex items-start justify-between gap-3 border-b border-border bg-background/60 px-4 py-3">
        <h2 className="font-semibold text-foreground">
          {getDisplayName(meter.device_name)}
        </h2>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {meter.device_type}
        </span>
      </header>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Metric
            value={meter.current_temperature}
            suffix="°C"
            color="bg-danger/15 text-danger"
          />
          <Metric
            value={meter.current_humidity}
            suffix="%"
            color="bg-info/15 text-info"
          />
          <Metric
            value={meter.battery}
            suffix="%"
            color="bg-success/15 text-success"
          />
        </div>
        <TemperatureChart
          history={history}
          timeScale={timeScale}
          isDark={isDark}
        />
        {meter.last_updated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}
