import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../useTheme'
import type { MeterReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils'

type ChartProps = {
  readings: MeterReading[]
  timeScale: TimeScale
}

export function Chart({ readings, timeScale }: ChartProps) {
  const { chartColors } = useTheme()

  return (
    <div className="meter-chart" aria-label="Temperature history chart">
      {readings.length === 0 ? (
        <p className="chart-empty">No readings for this range.</p>
      ) : (
        <ResponsiveContainer width="100%" height={196}>
          <LineChart data={readings} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => formatTimestamp(String(value), timeScale)}
              tick={{ fill: chartColors.axis, fontSize: 10 }}
              stroke={chartColors.axis}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value) => `${value}°`}
              tick={{ fill: chartColors.axis, fontSize: 10 }}
              stroke={chartColors.axis}
              tickLine={false}
              width={40}
            />
            <Tooltip
              labelFormatter={(label) => formatTimestamp(String(label), timeScale)}
              formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
              contentStyle={{
                backgroundColor: chartColors.tooltipBackground,
                border: `1px solid ${chartColors.grid}`,
                color: chartColors.tooltipText,
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: chartColors.tooltipText }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={chartColors.line}
              strokeWidth={2}
              dot={{ r: 2, fill: chartColors.line }}
              activeDot={{ r: 5 }}
              name="Temperature"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
