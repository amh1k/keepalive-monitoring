import apiClient from './client';
import type { CountsData, UptimeStat, LatencyDataPoint } from '../types';

export const statsApi = {
  getCounts: () =>
    apiClient.get<{ status: string; data: CountsData }>('/stats/counts'),

  getUptime: () =>
    apiClient.get<{ status: string; data: UptimeStat[] }>('/stats/uptime'),

  getLatency: () =>
    apiClient.get<{ status: string; data: LatencyDataPoint[] }>('/stats/latency'),
};
