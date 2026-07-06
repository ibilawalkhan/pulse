// API response types — mirror packages/shared. Kept local so the browser bundle
// doesn't pull in backend-only deps (class-validator etc.).

export type MonitorStatus = 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';
export type HttpMethod = 'GET' | 'POST' | 'HEAD';
export type AlertChannelType = 'EMAIL' | 'SLACK_WEBHOOK';
export type UptimeWindow = '24h' | '7d' | '30d';
export type ResultBucketSize = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  intervalSeconds: number;
  expectedStatus: number;
  timeoutMs: number;
  failureThreshold: number;
  status: MonitorStatus;
  consecutiveFailures: number;
  nextCheckAt: string;
  createdAt: string;
  uptime24h: number;
  lastResponseMs: number | null;
  lastCheckedAt: string | null;
}

export interface Incident {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
  cause: string | null;
  durationSeconds: number;
}

/** Incident enriched client-side with its monitor for the global views. */
export interface IncidentWithMonitor extends Incident {
  monitorId: string;
  monitorName: string;
}

export interface AlertChannel {
  id: string;
  type: AlertChannelType;
  destination: string;
  enabled: boolean;
}

export interface UptimeResult {
  window: UptimeWindow;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
}

export interface ResultBucket {
  bucketStart: string;
  avgResponseMs: number | null;
  totalChecks: number;
  successfulChecks: number;
}

export interface ResultsResult {
  from: string;
  to: string;
  bucket: ResultBucketSize;
  buckets: ResultBucket[];
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/** A point on the response-time chart, derived from a ResultBucket. */
export interface CheckPoint {
  t: string;
  responseMs: number;
  up: boolean;
}
