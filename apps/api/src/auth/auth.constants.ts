/** Name of the httpOnly cookie carrying the refresh token. */
export const REFRESH_COOKIE_NAME = 'pulse_refresh_token';

/**
 * Path the refresh cookie is scoped to, so the browser only ever sends it to the
 * refresh endpoint, not to every request.
 */
export const REFRESH_COOKIE_PATH = '/auth/refresh';

/** Refresh cookie lifetime in ms — keep in sync with JWT_REFRESH_TTL (7 days). */
export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
