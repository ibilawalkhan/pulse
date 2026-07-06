import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  AlertChannel,
  AlertChannelType,
  AuthResponse,
  HttpMethod,
  Incident,
  Monitor,
  ResultBucketSize,
  ResultsResult,
  UptimeResult,
  UptimeWindow,
} from './types';

// Same-origin: in dev the Vite proxy forwards these paths to the API; in prod
// the API serves the built app. The access token lives in memory only (XSS
// safety); the refresh token is an httpOnly cookie the browser sends automatically.
const client = axios.create({ withCredentials: true });

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function setOnUnauthorized(handler: () => void): void {
  onUnauthorized = handler;
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Coalesce concurrent refreshes into one in-flight request.
let refreshing: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const url = original?.url ?? '';
    if (error.response?.status === 401 && original && !original._retry && !url.includes('/auth/')) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      }
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

interface CreateMonitorInput {
  name: string;
  url: string;
  method?: HttpMethod;
  intervalSeconds: number;
  expectedStatus?: number;
}

interface CreateChannelInput {
  type: AlertChannelType;
  destination: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
    register: (email: string, password: string) =>
      client.post<AuthResponse>('/auth/register', { email, password }).then((r) => r.data),
    refresh: () => client.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data),
  },
  monitors: {
    list: () => client.get<Monitor[]>('/monitors').then((r) => r.data),
    get: (id: string) => client.get<Monitor>(`/monitors/${id}`).then((r) => r.data),
    create: (input: CreateMonitorInput) =>
      client.post<Monitor>('/monitors', input).then((r) => r.data),
    update: (id: string, patch: Partial<CreateMonitorInput> & { paused?: boolean }) =>
      client.patch<Monitor>(`/monitors/${id}`, patch).then((r) => r.data),
    remove: (id: string) => client.delete(`/monitors/${id}`).then(() => undefined),
    uptime: (id: string, window: UptimeWindow) =>
      client
        .get<UptimeResult>(`/monitors/${id}/uptime`, { params: { window } })
        .then((r) => r.data),
    results: (id: string, params: { from?: string; to?: string; bucket?: ResultBucketSize }) =>
      client.get<ResultsResult>(`/monitors/${id}/results`, { params }).then((r) => r.data),
    incidents: (id: string) =>
      client.get<Incident[]>(`/monitors/${id}/incidents`).then((r) => r.data),
  },
  alertChannels: {
    list: () => client.get<AlertChannel[]>('/alert-channels').then((r) => r.data),
    create: (input: CreateChannelInput) =>
      client.post<AlertChannel>('/alert-channels', input).then((r) => r.data),
    remove: (id: string) => client.delete(`/alert-channels/${id}`).then(() => undefined),
  },
};

// Extract a human-readable message from an axios error's API envelope.
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
