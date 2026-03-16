import apiClient from './client';
import type { ChannelType, NotificationChannel } from '../types';

export interface CreateChannelPayload {
  type: ChannelType;
  value: string;
}

export const notificationsApi = {
  create: (payload: CreateChannelPayload) =>
    apiClient.post<{ status: string; data: NotificationChannel }>(
      '/notifications/create-webhook',
      payload
    ),
};
