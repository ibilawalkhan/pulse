/** Payload enqueued by the scheduler and consumed by the worker */
export interface CheckJobMessage {
  monitorId: string;
  attempt: number;
}

/** Standard API error envelope */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

/** Public-safe representation of an authenticated user. */
export interface AuthUserDto {
  id: string;
  email: string;
}

/** Body returned by POST /auth/register and /auth/login (the refresh token is
 * delivered out-of-band as an httpOnly cookie, never in the JSON body). */
export interface AuthResponse {
  accessToken: string;
  user: AuthUserDto;
}

/** Body returned by POST /auth/refresh. */
export interface RefreshResponse {
  accessToken: string;
}
