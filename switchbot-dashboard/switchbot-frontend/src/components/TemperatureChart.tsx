import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatTimestamp } from "../utils";
import type { HistoryReading, TimeScale } from "../types";

interface TemperatureChartProps {
  history: HistoryReading[];
  timeScale: TimeScale;
  isDark: boolean;
}

export function TemperatureChart({
  history,
  timeScale,
  isDark
}: TemperatureChartProps) {
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tooltipBackground = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#475569" : "#cbd5e1";

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 10, right: 8, left: -18, bottom: 4 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value: string) => formatTimestamp(value, timeScale)}
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={{ stroke: axisColor }}
            axisLine={{ stroke: axisColor }}
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={{ stroke: axisColor }}
            axisLine={{ stroke: axisColor }}
            tickFormatter={(value: number) => `${value}°`}
            width={42}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBackground,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "0.5rem",
              color: isDark ? "#f8fafc" : "#0f172a"
            }}
            labelFormatter={(value) => formatTimestamp(String(value), timeScale)}
            formatter={(value) => [
              `${Number(value).toFixed(1)}°C`,
              "Temperature"
            ]}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            name="Temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 2, fill: "#ef4444" }}
            activeDot={{ r: 5, fill: "#06b6d4" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
