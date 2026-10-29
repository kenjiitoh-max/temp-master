import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchHistory } from '../api/client'
import type { MeterReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils/format'

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
  /** 親が再取得したいときに変える値（Refresh 押下や自動更新で増える） */
  reloadToken: number
}

interface ChartPoint {
  label: string
  temperature: number
}

export function TemperatureChart({ deviceId, timeScale, reloadToken }: TemperatureChartProps) {
  const [history, setHistory] = useState<MeterReading[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (cancelled) return
        setHistory(res.history ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, reloadToken])

  const data: ChartPoint[] = history.map((r) => ({
    label: formatTimestamp(r.timestamp, timeScale),
    temperature: r.temperature,
  }))

  if (error) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-danger-fg">
        Chart error: {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-fg-muted">
        No history for this range
      </div>
    )
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`fill-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-temp)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent-temp)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--fg-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}°`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--fg)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--fg-muted)' }}
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke="var(--accent-temp)"
            strokeWidth={2}
            fill={`url(#fill-${deviceId})`}
            dot={{ r: 2, fill: 'var(--accent-temp)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--accent-humidity)', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
