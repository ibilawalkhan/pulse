import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { currentUser } from './mock';
import type { CurrentUser } from './types';

interface AuthCtx {
  user: CurrentUser | null;
  login: (email: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const STORAGE_KEY = 'pulse-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    return localStorage.getItem(STORAGE_KEY) ? currentUser : null;
  });

  // Dummy auth: accept any credentials and sign in as the demo user.
  const login = (email: string): void => {
    const u: CurrentUser = { ...currentUser, email: email || currentUser.email };
    localStorage.setItem(STORAGE_KEY, '1');
    setUser(u);
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
