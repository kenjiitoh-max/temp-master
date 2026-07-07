import { useEffect, useMemo, useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { fetchHistory } from '../api/client'
import type { MeterReading, TimeScale } from '../api/types'
import { formatTimestamp } from '../utils/formatTimestamp'
import { getChartColors } from '../utils/chartColors'
import { useTheme } from '../theme/useTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
)

interface Props {
  deviceId: string
  timeScale: TimeScale
  // Bumped by the parent to force a history refetch on poll/refresh.
  refreshKey: number
}

export function TemperatureChart({ deviceId, timeScale, refreshKey }: Props) {
  const { theme } = useTheme()
  const [history, setHistory] = useState<MeterReading[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (!cancelled) setHistory(resp.history ?? [])
      })
      .catch(() => {
        // Keep previous data on transient errors (matches legacy behavior).
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, refreshKey])

  // Recompute colors whenever the theme changes so the chart stays readable.
  const colors = useMemo(() => getChartColors(theme), [theme])

  const data: ChartData<'line'> = useMemo(
    () => ({
      labels: history.map((h) => formatTimestamp(h.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((h) => h.temperature),
          borderColor: colors.line,
          backgroundColor: colors.fill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: colors.point,
          pointBorderColor: colors.point,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale, colors],
  )

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              return v === null || v === undefined ? '' : `${v.toFixed(1)}\u00b0C`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 },
            color: colors.tick,
          },
        },
        y: {
          grid: { color: colors.grid },
          ticks: {
            font: { size: 10 },
            color: colors.tick,
            callback: (value) => `${value}\u00b0`,
          },
        },
      },
    }),
    [colors],
  )

  return (
    <div className="meter-chart-wrap">
      <Line data={data} options={options} />
    </div>
  )
}
