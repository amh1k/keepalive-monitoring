import apiClient from './client';

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post('/user/register', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/user/login', { email, password }),

  logout: () =>
    apiClient.post('/user/logout'),

  me: () =>
    apiClient.get('/user/me'),
};
