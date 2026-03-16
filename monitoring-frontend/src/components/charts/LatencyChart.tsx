import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { LatencyDataPoint } from '../../types';
import styles from './LatencyChart.module.css';

interface Props {
  data: LatencyDataPoint[];
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LatencyChart({ data }: Props) {
  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    latency: d._avg.latency != null ? Math.round(d._avg.latency) : null,
  }));

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#388bfd" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#388bfd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#8b949e', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit="ms"
          />
          <Tooltip
            contentStyle={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#e6edf3',
            }}
            formatter={(val: any) => [`${val} ms`, 'Avg latency']}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="#388bfd"
            strokeWidth={2}
            fill="url(#latencyGrad)"
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
