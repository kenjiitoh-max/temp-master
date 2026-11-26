import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useHistory } from '../hooks/queries'
import { formatTimestamp } from '../lib/formatTimestamp'
import type { TimeScale } from '../types'

// 色は CSS カスタムプロパティ経由で参照するため、テーマ切替に自動で追従する
const TICK = { fontSize: 10, fill: 'var(--chart-text)' }
const AXIS_LINE = { stroke: 'var(--chart-grid)' }
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  fontSize: 12,
}
const MARGIN = { top: 5, right: 8, bottom: 0, left: 0 }

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
}

export function TemperatureChart({ deviceId, timeScale }: TemperatureChartProps) {
  const { data, isPending, isError } = useHistory(deviceId, timeScale)

  const points = useMemo(
    () =>
      (data?.history ?? []).map((reading) => ({
        time: new Date(reading.timestamp).getTime(),
        temperature: reading.temperature,
      })),
    [data],
  )

  if (isPending || isError || points.length === 0) {
    const message = isPending ? 'Loading chart...' : isError ? 'Failed to load history' : 'No data'
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-muted">
        {message}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={MARGIN}>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickCount={8}
          tickFormatter={(value: number) => formatTimestamp(value, timeScale)}
          tick={TICK}
          axisLine={AXIS_LINE}
          tickLine={AXIS_LINE}
        />
        <YAxis
          width={36}
          domain={['auto', 'auto']}
          tickFormatter={(value: number) => `${value}°`}
          tick={TICK}
          axisLine={AXIS_LINE}
          tickLine={AXIS_LINE}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(value) => formatTimestamp(Number(value), timeScale)}
          formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
        />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="var(--chart-line)"
          strokeWidth={2}
          fill="var(--chart-line)"
          fillOpacity={0.15}
          dot={points.length <= 60 ? { r: 2, fill: 'var(--chart-line)' } : false}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
