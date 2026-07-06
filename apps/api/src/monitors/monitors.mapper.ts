import type { Monitor } from '@pulse/db';
import type { HttpMethod, MonitorResponse, MonitorStatus } from '@pulse/shared';

/** Derived stats merged into the monitor response. */
export interface MonitorStats {
  uptime24h: number;
  lastResponseMs: number | null;
  lastCheckedAt: Date | null;
}

/** Defaults for a monitor with no checks yet (freshly created). */
const EMPTY_STATS: MonitorStats = { uptime24h: 1, lastResponseMs: null, lastCheckedAt: null };

/** Map a Monitor entity (+ derived stats) to its public API representation. */
export function toMonitorResponse(
  monitor: Monitor,
  stats: MonitorStats = EMPTY_STATS,
): MonitorResponse {
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    method: monitor.method as HttpMethod,
    intervalSeconds: monitor.intervalSeconds,
    expectedStatus: monitor.expectedStatus,
    timeoutMs: monitor.timeoutMs,
    failureThreshold: monitor.failureThreshold,
    status: monitor.status as MonitorStatus,
    consecutiveFailures: monitor.consecutiveFailures,
    nextCheckAt: monitor.nextCheckAt.toISOString(),
    createdAt: monitor.createdAt.toISOString(),
    uptime24h: stats.uptime24h,
    lastResponseMs: stats.lastResponseMs,
    lastCheckedAt: stats.lastCheckedAt ? stats.lastCheckedAt.toISOString() : null,
  };
}
