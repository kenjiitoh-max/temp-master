import { useMemo } from 'react'
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
import type { Reading, TimeScale } from '../api/types'
import { readChartPalette } from '../theme/themes'
import { useTheme } from '../theme/useTheme'
import { formatTimestamp } from '../utils/format'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface TemperatureChartProps {
  history: Reading[]
  timeScale: TimeScale
}

export function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const { theme } = useTheme()

  const palette = useMemo(() => readChartPalette(theme), [theme])

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: history.map((r) => formatTimestamp(r.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((r) => r.temperature),
          borderColor: palette.line,
          backgroundColor: palette.fill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: palette.point,
          pointBorderColor: palette.point,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: palette.pointHover,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale, palette],
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: palette.tooltipBg,
          titleColor: palette.tooltipFg,
          bodyColor: palette.tooltipFg,
          callbacks: {
            label: (item) => {
              const v = item.parsed.y
              return v === null || v === undefined ? '' : `${v.toFixed(1)}\u00b0C`
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: palette.grid },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: palette.tick },
        },
        y: {
          display: true,
          grid: { display: true, color: palette.grid },
          ticks: {
            font: { size: 10 },
            color: palette.tick,
            callback: (value) => `${value}\u00b0`,
          },
        },
      },
    }),
    [palette],
  )

  return <Line data={data} options={options} />
}
