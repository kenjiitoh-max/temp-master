import type { ReactNode } from 'react';
import { useMeterHistory } from '../hooks/queries';
import { getDisplayName } from '../lib/displayNames';
import type { MeterDevice, TimeScale } from '../lib/types';
import { TemperatureChart } from './TemperatureChart';

interface MeterCardProps {
  meter: MeterDevice;
  timeScale: TimeScale;
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`rounded px-2 py-1 text-sm font-semibold text-badge-fg ${className}`}>
      {children}
    </span>
  );
}

export function MeterCard({ meter, timeScale }: MeterCardProps) {
  const history = useMeterHistory(meter.device_id, timeScale);

  return (
    <article className="overflow-hidden rounded border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-2">
        <strong className="truncate">{getDisplayName(meter.device_name)}</strong>
        <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted">
          {meter.device_type}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {meter.current_temperature != null && (
            <Badge className="bg-temp">{meter.current_temperature}°C</Badge>
          )}
          {meter.current_humidity != null && (
            <Badge className="bg-humidity">{meter.current_humidity}%</Badge>
          )}
          {meter.battery != null && <Badge className="bg-battery">{meter.battery}%</Badge>}
        </div>

        {history.isPending ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted">
            Loading chart...
          </div>
        ) : history.isError && !history.data ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-danger-fg">
            Failed to load history
          </div>
        ) : (
          <TemperatureChart history={history.data?.history ?? []} timeScale={timeScale} />
        )}

        {meter.last_updated && (
          <p className="text-xs text-muted">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}
