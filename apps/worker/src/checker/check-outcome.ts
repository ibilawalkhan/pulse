import type { CheckErrorCode } from '@pulse/shared';

/** Result of executing a single HTTP check against a monitored endpoint. */
export interface CheckOutcome {
  success: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  error: CheckErrorCode | null;
}
