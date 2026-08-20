import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../theme/useTheme'
import { formatTimestamp } from '../utils/format'
import type { Reading, TimeScale } from '../types'

interface TemperatureChartProps {
  history: Reading[]
  timeScale: TimeScale
}

export function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const { theme } = useTheme()
  const tokens = theme.tokens

  if (history.length === 0) {
    return <p className="chart-empty">No history available for this range.</p>
  }

  const data = history.map((reading) => ({
    label: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }))

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={tokens.chartGrid} />
          <XAxis
            dataKey="label"
            stroke={tokens.chartAxis}
            tick={{ fill: tokens.chartAxis, fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            stroke={tokens.chartAxis}
            tick={{ fill: tokens.chartAxis, fontSize: 10 }}
            tickFormatter={(value: number) => `${value}°`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tokens.chartTooltipBg,
              border: `1px solid ${tokens.border}`,
              color: tokens.text,
              fontSize: 12,
            }}
            labelStyle={{ color: tokens.textMuted }}
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={tokens.chartLine}
            strokeWidth={2}
            fill={tokens.chartFill}
            dot={false}
            activeDot={{ r: 4, fill: tokens.chartLine }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
