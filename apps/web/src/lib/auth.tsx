import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken, setOnUnauthorized } from './api';
import type { AuthUser } from './types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthCtx {
  user: AuthUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

/** Decode the user (sub/email) from a JWT access token without verifying it. */
function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub: string; email: string };
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // If a 401 survives a refresh attempt, drop the session.
    setOnUnauthorized(() => {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    });

    // Restore a session from the httpOnly refresh cookie on first load.
    api.auth
      .refresh()
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(decodeUser(data.accessToken));
        setStatus('authenticated');
      })
      .catch(() => setStatus('anonymous'));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await api.auth.login(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  };

  const register = async (email: string, password: string): Promise<void> => {
    const data = await api.auth.register(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  };

  const logout = (): void => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  };

  return <Ctx.Provider value={{ user, status, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
