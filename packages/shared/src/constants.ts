/** Allowed monitor check intervals in seconds (README §1, F2). */
export const CHECK_INTERVALS_SECONDS = [60, 300, 900] as const;
export type CheckIntervalSeconds = (typeof CHECK_INTERVALS_SECONDS)[number];

/** Supported HTTP methods for a monitor check. */
export const HTTP_METHODS = ['GET', 'POST', 'HEAD'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/** Alert channel delivery types. */
export const ALERT_CHANNEL_TYPES = ['EMAIL', 'SLACK_WEBHOOK'] as const;
export type AlertChannelType = (typeof ALERT_CHANNEL_TYPES)[number];

/** Bounds for monitor configuration values (validation + sane limits). */
export const MONITOR_LIMITS = {
  nameMaxLength: 120,
  expectedStatusMin: 100,
  expectedStatusMax: 599,
  timeoutMsMin: 1000,
  timeoutMsMax: 30_000,
  failureThresholdMin: 1,
  failureThresholdMax: 10,
} as const;

/** Default number of consecutive failures before UP -> DOWN (README §1, F4). */
export const DEFAULT_FAILURE_THRESHOLD = 2;

/** Default per-check HTTP timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Error taxonomy recorded on a failed check. */
export const CHECK_ERROR = {
  TIMEOUT: 'TIMEOUT',
  DNS: 'DNS',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  UNEXPECTED_STATUS: 'UNEXPECTED_STATUS',
  SSRF_BLOCKED: 'SSRF_BLOCKED',
  UNKNOWN: 'UNKNOWN',
} as const;
export type CheckErrorCode = (typeof CHECK_ERROR)[keyof typeof CHECK_ERROR];

/** Name of the SQS queue carrying check jobs. */
export const CHECK_JOBS_QUEUE_NAME = 'check-jobs';
