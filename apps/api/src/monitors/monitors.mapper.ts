import type { Monitor } from '@pulse/db';
import type { HttpMethod, MonitorResponse, MonitorStatus } from '@pulse/shared';

/** Map a Monitor entity to its public API representation (drops userId). */
export function toMonitorResponse(monitor: Monitor): MonitorResponse {
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
  };
}
