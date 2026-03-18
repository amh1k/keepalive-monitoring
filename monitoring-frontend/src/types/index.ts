export interface User {
  id: string;
  email: string;
}

export type MonitorStatus = 'UP' | 'DOWN' | 'PENDING';
export type SslStatus = 'VALID' | 'INVALID' | 'EXPIRING_SOON';

export interface Check {
  id: string;
  monitorId: string;
  statusCode: number | null;
  latency: number;
  isUp: boolean;
  errorMessage: string | null;
  timestamp: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  interval: number;
  timeout: number;
  failureThreshold: number;
  currentFails: number;
  status: MonitorStatus;
  lastCheck: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  sslStatus: SslStatus | null;
  sslExpirationDate: string | null;
  sslIssuer: string | null;
  sslLastCheck: string | null;
  checks: Check[];
}

export interface Incident {
  id: string;
  monitorId: string;
  startedAt: string;
  endedAt: string | null;
  cause: string | null;
}

export type ChannelType = 'EMAIL' | 'SLACK' | 'DISCORD' | 'WEBHOOK';

export interface NotificationChannel {
  id: string;
  userId: string;
  type: ChannelType;
  value: string;
  isEnabled: boolean;
}

export interface UptimeStat {
  id: string;
  name: string;
  uptimePercentage: string;
}

export interface LatencyDataPoint {
  timestamp: string;
  _avg: { latency: number | null };
}

export interface MonitorStatusCount {
  status: MonitorStatus;
  _count: number;
}

export interface RecentAlert {
  id: string;
  statusCode: number | null;
  timestamp: string;
  monitor: { name: string };
}

export interface CountsData {
  counts: { monitors: number; channels: number };
  monitorStatus: MonitorStatusCount[];
  alerts: RecentAlert[];
}
