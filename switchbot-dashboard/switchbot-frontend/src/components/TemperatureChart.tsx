import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TimeScale } from '../constants'
import { formatTimestamp } from '../format'
import { useMeterHistory } from '../hooks/useMeters'
import { useTheme } from '../theme/context'

// 点が多いと線が見づらくなるので、一定数を超えたら点 (dot) を描かない
const MAX_POINTS_WITH_DOTS = 48

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
}

export function TemperatureChart({ deviceId, timeScale }: TemperatureChartProps) {
  const { data: history, isPending, isError } = useMeterHistory(deviceId, timeScale)
  const { chartColors: c } = useTheme()
  const gradientId = `temp-fill-${useId().replace(/:/g, '')}`

  const points = useMemo(
    () =>
      (history ?? []).map((r) => ({
        label: formatTimestamp(r.timestamp, timeScale),
        temperature: r.temperature,
      })),
    [history, timeScale],
  )

  if (isPending) {
    return <div className="h-[200px] animate-pulse rounded-lg bg-surface-muted" />
  }

  if (isError || points.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        {isError ? 'Failed to load history' : 'No history data'}
      </div>
    )
  }

  return (
    <div className="h-[200px]" data-testid="temperature-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.line} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.line} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: c.axis }}
            stroke={c.grid}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: c.axis }}
            stroke={c.grid}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v}°`}
          />
          <Tooltip
            formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}°C` : '', 'Temperature']}
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              color: c.tooltipFg,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: c.tooltipFg }}
            itemStyle={{ color: c.tooltipFg }}
            cursor={{ stroke: c.axis, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={c.line}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={points.length <= MAX_POINTS_WITH_DOTS ? { r: 2.5, fill: c.line, stroke: c.line } : false}
            activeDot={{ r: 5, fill: c.activeDot, stroke: c.activeDot }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
