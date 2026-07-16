import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HistoryPoint, TimeScale } from "../api/types";
import { formatTimestamp } from "../utils/format";
import { getChartColors } from "../theme/themes";
import { useTheme } from "../theme/useTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

interface MeterChartProps {
  history: HistoryPoint[];
  timeScale: TimeScale;
}

export function MeterChart({ history, timeScale }: MeterChartProps) {
  // Depend on the active theme so colors are re-read from CSS variables and the
  // chart re-renders whenever the theme changes.
  const { theme } = useTheme();

  const data = useMemo<ChartData<"line">>(() => {
    const colors = getChartColors();
    return {
      labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
      datasets: [
        {
          label: "Temperature (C)",
          data: history.map((point) => point.temperature),
          borderColor: colors.line,
          backgroundColor: colors.fill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: colors.point,
          pointBorderColor: colors.point,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: colors.pointHover,
          fill: true,
          tension: 0.4,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, timeScale, theme]);

  const options = useMemo<ChartOptions<"line">>(() => {
    const colors = getChartColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (item: TooltipItem<"line">) => {
              const value = item.parsed.y;
              if (value === null || value === undefined) return "";
              return `${value.toFixed(1)}\u00b0C`;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return <Line data={data} options={options} />;
}
