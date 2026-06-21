/** Claims carried by the short-lived access token. */
export interface AccessTokenPayload {
  /** Subject — the user id. */
  sub: string;
  email: string;
}

/** Claims carried by the long-lived refresh token (minimal by design). */
export interface RefreshTokenPayload {
  sub: string;
}

/** Shape attached to `request.user` by the JWT strategy. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/** Result of a successful authentication, before the refresh token is split
 * out into an httpOnly cookie by the controller. */
export interface AuthResult {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}
