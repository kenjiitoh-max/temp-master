import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { fetchHistory } from '../api/client'
import type { HistoryReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { useTheme } from '../theme/useTheme'
import { CHART_COLORS } from '../theme/themes'

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
  refreshTick: number
}

interface ChartPoint {
  label: string
  temperature: number
}

function TemperatureTooltip({
  active,
  payload,
  colors,
}: TooltipProps<number, string> & { colors: (typeof CHART_COLORS)[keyof typeof CHART_COLORS] }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const value = payload[0].value
  if (value === null || value === undefined) {
    return null
  }
  return (
    <div
      style={{
        background: colors.tooltipBg,
        color: colors.tooltipText,
        border: `1px solid ${colors.grid}`,
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 12,
      }}
    >
      {`${value.toFixed(1)}\u00b0C`}
    </div>
  )
}

export function TemperatureChart({ deviceId, timeScale, refreshTick }: TemperatureChartProps) {
  const { theme } = useTheme()
  const colors = CHART_COLORS[theme]
  const [history, setHistory] = useState<HistoryReading[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((data) => {
        if (!cancelled) {
          setHistory(data.history ?? [])
        }
      })
      .catch(() => {
        /* per-chart failures are non-fatal */
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, refreshTick])

  const data = useMemo<ChartPoint[]>(
    () =>
      history.map((h) => ({
        label: formatTimestamp(h.timestamp, timeScale),
        temperature: h.temperature,
      })),
    [history, timeScale],
  )

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={colors.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: colors.axis }}
            stroke={colors.axis}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: colors.axis }}
            stroke={colors.axis}
            tickFormatter={(value: number) => `${value}\u00b0`}
            width={40}
          />
          <Tooltip content={<TemperatureTooltip colors={colors} />} />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={colors.line}
            strokeWidth={2}
            fill={colors.fill}
            dot={{ r: 3, fill: colors.point, stroke: colors.point }}
            activeDot={{ r: 5, fill: colors.pointHover, stroke: colors.pointHover }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
