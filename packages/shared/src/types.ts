/** Payload enqueued by the scheduler and consumed by the worker (README §4.1). */
export interface CheckJobMessage {
  monitorId: string;
  attempt: number;
}

/** Standard API error envelope (README §8). */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
