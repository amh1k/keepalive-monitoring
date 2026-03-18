import { useQuery } from "@tanstack/react-query";
import { statsApi } from "../api/stats.api";
import StatCard from "../components/shared/StatCard";
import AlertsList from "../components/shared/AlertsList";
import LatencyChart from "../components/charts/LatencyChart";
import UptimeBar from "../components/charts/UptimeBar";
import type { MonitorStatusCount } from "../types";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const countsQuery = useQuery({
    queryKey: ["stats", "counts"],
    queryFn: async () => {
      const res = await statsApi.getCounts();
      return res.data.data;
    },
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  const uptimeQuery = useQuery({
    queryKey: ["stats", "uptime"],
    queryFn: async () => {
      const res = await statsApi.getUptime();
      return res.data.data;
    },
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  const latencyQuery = useQuery({
    queryKey: ["stats", "latency"],
    queryFn: async () => {
      const res = await statsApi.getLatency();
      return res.data.data;
    },
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const statusMap = new Map<string, number>();
  countsQuery.data?.monitorStatus?.forEach((s: MonitorStatusCount) => {
    statusMap.set(s.status, s._count);
  });

  const upCount = statusMap.get("UP") ?? 0;
  const downCount = statusMap.get("DOWN") ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Overview of all your monitors and alerts
        </p>
      </div>

      {/* Stats Row — 5 cards */}
      <div className={styles.statsGrid}>
        {countsQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Monitors"
              value={countsQuery.data?.counts.monitors ?? 0}
              icon="⬡"
            />
            <StatCard
              label="Monitors Up"
              value={upCount}
              icon="✓"
              accent="up"
            />
            <StatCard
              label="Monitors Down"
              value={downCount}
              icon="✕"
              accent="down"
            />
            <StatCard
              label="Notification Channels"
              value={countsQuery.data?.counts.channels ?? 0}
              icon="🔔"
            />
            <StatCard
              label="Anomalies (24h)"
              value={(countsQuery.data?.counts as any).anomalies ?? 0}
              icon="⚠"
              accent="pending"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <section className={`card ${styles.chartCard}`}>
          <h2 className={styles.sectionTitle}>Avg Latency — Last 24h</h2>
          {latencyQuery.isLoading ? (
            <div className={`skeleton ${styles.chartSkeleton}`} />
          ) : latencyQuery.data?.length ? (
            <LatencyChart data={latencyQuery.data} />
          ) : (
            <p className={styles.empty}>No latency data yet</p>
          )}
        </section>

        <section className={`card ${styles.chartCard}`}>
          <h2 className={styles.sectionTitle}>Uptime per Monitor</h2>
          {uptimeQuery.isLoading ? (
            <div className={`skeleton ${styles.chartSkeleton}`} />
          ) : (
            <UptimeBar data={uptimeQuery.data ?? []} />
          )}
        </section>
      </div>

      {/* Alerts */}
      <section className={`card ${styles.alertsCard}`}>
        <h2 className={styles.sectionTitle}>Recent Alerts</h2>
        {countsQuery.isLoading ? (
          <div className={`skeleton ${styles.alertSkeleton}`} />
        ) : (
          <AlertsList alerts={countsQuery.data?.alerts ?? []} />
        )}
      </section>

      {/* Anomalies — only renders if there are any in the last 24h */}
      {((countsQuery.data as any)?.anomalies?.length ?? 0) > 0 && (
        <section className={`card ${styles.alertsCard}`}>
          <h2 className={styles.sectionTitle}>Latency Anomalies (24h)</h2>
          {countsQuery.isLoading ? (
            <div className={`skeleton ${styles.alertSkeleton}`} />
          ) : (
            <div className={styles.anomalyList}>
              {(countsQuery.data as any)?.anomalies.map((a: any) => (
                <div key={a.id} className={styles.anomalyItem}>
                  <span className={styles.anomalyName}>{a.monitor.name}</span>
                  <span className={styles.anomalyLatency}>{a.latency}ms</span>
                  <span className={styles.anomalyTime}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
