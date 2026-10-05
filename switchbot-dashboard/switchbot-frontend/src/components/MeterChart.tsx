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
} from 'chart.js';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { MeterReading } from '../api/types';
import type { TimeScale } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { formatTimestamp } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface MeterChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
}

export function MeterChart({ history, timeScale }: MeterChartProps) {
  const { chartPalette: p } = useTheme();

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: history.map((r) => formatTimestamp(r.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((r) => r.temperature),
          borderColor: p.line,
          backgroundColor: p.fill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: p.line,
          pointBorderColor: p.line,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: p.pointHover,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale, p],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: p.tooltipBg,
          titleColor: p.tooltipText,
          bodyColor: p.tooltipText,
          borderColor: p.tooltipBorder,
          borderWidth: 1,
          titleFont: { family: p.fontFamily },
          bodyFont: { family: p.fontFamily },
          callbacks: {
            label: (item) => {
              const v = item.parsed.y;
              if (v === null || v === undefined) return '';
              return `${v.toFixed(1)}°C`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: p.grid },
          border: { color: p.grid },
          ticks: { maxTicksLimit: 8, color: p.tick, font: { size: 10, family: p.fontFamily } },
        },
        y: {
          display: true,
          grid: { display: true, color: p.grid },
          border: { color: p.grid },
          ticks: {
            color: p.tick,
            font: { size: 10, family: p.fontFamily },
            callback: (value) => `${value}°`,
          },
        },
      },
    }),
    [p],
  );

  return <Line data={data} options={options} aria-label="Temperature history chart" role="img" />;
}
