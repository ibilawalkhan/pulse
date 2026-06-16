// Frontend domain types — mirror the API responses described in README §8.
// These will be replaced by generated/shared DTOs once the API is wired up.

export type MonitorStatus = 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';
export type HttpMethod = 'GET' | 'POST' | 'HEAD';
export type AlertChannelType = 'EMAIL' | 'SLACK_WEBHOOK';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  intervalSeconds: 60 | 300 | 900;
  expectedStatus: number;
  timeoutMs: number;
  status: MonitorStatus;
  consecutiveFailures: number;
  /** Uptime ratio over the last 24h, 0..1. */
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  /** Most recent response time in ms (null if never checked). */
  lastResponseMs: number | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface CheckPoint {
  /** ISO timestamp of the bucket. */
  t: string;
  /** Average response time in ms for the bucket. */
  responseMs: number;
  /** Whether the endpoint was up for this bucket. */
  up: boolean;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  startedAt: string;
  resolvedAt: string | null;
  cause: string;
  /** Duration in seconds; for ongoing incidents this is "so far". */
  durationSeconds: number;
}

export interface AlertChannel {
  id: string;
  type: AlertChannelType;
  destination: string;
  enabled: boolean;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export type UptimeWindow = '24h' | '7d' | '30d';
