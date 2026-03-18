import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LatencyDataPoint } from "../../types";
import styles from "./LatencyChart.module.css";

interface Props {
  data: LatencyDataPoint[];
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Custom dot — red for anomalies, invisible for normal points
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload.hasAnomaly) return null; // no dot for normal points
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--color-down)"
      stroke="var(--color-bg)"
      strokeWidth={2}
    />
  );
}

// Custom tooltip — shows anomaly warning if applicable
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${point?.hasAnomaly ? "var(--color-down-border)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "8px 12px",
        fontSize: "13px",
        color: "var(--color-text-primary)",
      }}
    >
      <p style={{ color: "var(--color-text-muted)", marginBottom: 4 }}>
        {label}
      </p>
      <p
        style={{
          color: point?.hasAnomaly
            ? "var(--color-down)"
            : "var(--color-accent)",
        }}
      >
        {payload[0]?.value} ms
      </p>
      {point?.hasAnomaly && (
        <p
          style={{ color: "var(--color-down)", fontSize: "11px", marginTop: 4 }}
        >
          ⚠ Latency anomaly detected
        </p>
      )}
    </div>
  );
}

export default function LatencyChart({ data }: Props) {
  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    latency: d._avg.latency != null ? Math.round(d._avg.latency) : null,
    hasAnomaly: d.hasAnomaly ?? false,
  }));

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-accent)"
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor="var(--color-accent)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />

          <XAxis
            dataKey="time"
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit="ms"
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="latency"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#latencyGrad)"
            dot={<CustomDot />} // normal points invisible, anomalies red
            activeDot={{ r: 4, fill: "var(--color-accent)" }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
