import { useId, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reading, TimeScale } from '../lib/api';
import { formatTimestamp } from '../lib/format';

const MAX_POINTS_WITH_DOTS = 60;

interface Props {
  history: Reading[];
  timeScale: TimeScale;
}

export function TemperatureChart({ history, timeScale }: Props) {
  const gradientId = useId();
  const data = useMemo(
    () => history.map((r) => ({ label: formatTimestamp(r.timestamp, timeScale), temperature: r.temperature })),
    [history, timeScale],
  );

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No data for this range</div>;
  }

  const tick = { fontSize: 10, fill: 'var(--chart-axis)' };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={tick} stroke="var(--chart-grid)" minTickGap={24} />
        <YAxis
          tick={tick}
          stroke="var(--chart-grid)"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}\u00b0`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--muted)' }}
          formatter={(v: number) => [`${v.toFixed(1)}\u00b0C`, 'Temperature']}
        />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="var(--chart-line)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={data.length <= MAX_POINTS_WITH_DOTS ? { r: 2, fill: 'var(--chart-line)', strokeWidth: 0 } : false}
          activeDot={{ r: 5, fill: 'var(--humidity)' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
