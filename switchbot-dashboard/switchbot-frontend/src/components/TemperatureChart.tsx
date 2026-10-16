import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatTimestamp } from '../lib/format';
import type { MeterReading, TimeScale } from '../lib/types';

interface TemperatureChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
}

const tooltipStyle = {
  backgroundColor: 'var(--tm-surface)',
  border: '1px solid var(--tm-border)',
  color: 'var(--tm-fg)',
  fontSize: 12,
};

export function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const data = useMemo(
    () =>
      history.map((r) => ({
        label: formatTimestamp(r.timestamp, timeScale),
        temperature: r.temperature,
      })),
    [history, timeScale],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted">
        No history for this range
      </div>
    );
  }

  return (
    <div className="tm-chart h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid vertical={true} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v}°`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'var(--tm-muted)' }}
            formatter={(v: number) => [`${v.toFixed(1)}°C`, 'Temperature']}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke="currentColor"
            strokeWidth={2}
            fill="currentColor"
            fillOpacity={0.15}
            dot={{ r: 2, fill: 'currentColor', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
