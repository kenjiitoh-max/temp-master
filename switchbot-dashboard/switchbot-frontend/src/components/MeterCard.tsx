import type { UseQueryResult } from '@tanstack/react-query';
import { getDisplayName } from '../config/displayNames';
import type { HistoryResponse, Meter, TimeScale } from '../lib/api';
import { TemperatureChart } from './TemperatureChart';

interface Props {
  meter: Meter;
  timeScale: TimeScale;
  history: UseQueryResult<HistoryResponse>;
}

function Stat({ value, unit, label, color }: { value: number | null; unit: string; label: string; color: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className={`text-xl font-bold ${color}`}>
        {value}
        {unit}
      </span>
    </div>
  );
}

export function MeterCard({ meter, timeScale, history }: Props) {
  return (
    <article
      data-testid="meter-card"
      className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-colors"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <h2 className="font-semibold">{getDisplayName(meter.device_name)}</h2>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
          {meter.device_type}
        </span>
      </header>

      <div className="mb-3 flex gap-6">
        <Stat value={meter.current_temperature} unit={'\u00b0C'} label="Temp" color="text-temp" />
        <Stat value={meter.current_humidity} unit="%" label="Humidity" color="text-humidity" />
        <Stat value={meter.battery} unit="%" label="Battery" color="text-battery" />
      </div>

      <div className="relative h-[200px]" data-testid="meter-chart">
        {history.isPending ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading chart...</div>
        ) : history.isError && !history.data ? (
          <div className="flex h-full items-center justify-center text-sm text-danger">Failed to load history</div>
        ) : (
          <TemperatureChart history={history.data?.history ?? []} timeScale={timeScale} />
        )}
      </div>

      {meter.last_updated && (
        <p className="mt-2 text-xs text-muted">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
      )}
    </article>
  );
}
