import apiClient from './client';
import type { Monitor } from '../types';

export interface CreateMonitorPayload {
  name: string;
  url: string;
  interval: number;
  failureThreshold?: number;
}

export const monitorsApi = {
  getAll: () =>
    apiClient.get<{ data: Monitor[] } | Monitor[]>('/monitor/getAll'),

  create: (payload: CreateMonitorPayload) =>
    apiClient.post<{ status: string; data: Monitor }>('/monitor/create', payload),
};
