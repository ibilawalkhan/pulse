import type { AlertChannelType, HttpMethod, ResultBucketSize, UptimeWindow } from './constants';

// Payload enqueued by the scheduler and consumed by the worker
export interface CheckJobMessage {
  monitorId: string;
  attempt: number;
}

// Standard API error envelope
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Public-safe representation of an authenticated user.
export interface AuthUserDto {
  id: string;
  email: string;
}

// Body returned by POST /auth/register and /auth/login (the refresh token is
// delivered out-of-band as an httpOnly cookie, never in the JSON body).
export interface AuthResponse {
  accessToken: string;
  user: AuthUserDto;
}

// Body returned by POST /auth/refresh.
export interface RefreshResponse {
  accessToken: string;
}

export type MonitorStatus = 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';

// Public representation of a monitor returned by the API (no owner id).
export interface MonitorResponse {
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

// Public representation of an alert channel returned by the API.
export interface AlertChannelResponse {
  id: string;
  type: AlertChannelType;
  destination: string;
  enabled: boolean;
}

// Public representation of an incident (outage) returned by the API.
export interface IncidentResponse {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
  cause: string | null;
  durationSeconds: number;
}

// Response for GET /monitors/:id/uptime.
export interface UptimeResponse {
  window: UptimeWindow;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
}

// One time bucket of the response-time series.
export interface ResultBucket {
  bucketStart: string;
  avgResponseMs: number | null;
  totalChecks: number;
  successfulChecks: number;
}

// Response for GET /monitors/:id/results.
export interface ResultsResponse {
  from: string;
  to: string;
  bucket: ResultBucketSize;
  buckets: ResultBucket[];
}
