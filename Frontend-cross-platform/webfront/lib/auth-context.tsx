'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AccountType, ApiError, AuthUser, CurrentUser,
  fetchMe, getToken, resolveAccountType, setToken, toCurrentUser,setSpace
} from '@/lib/auth';

type Status = 'loading' | 'guest' | 'authenticated';

type AuthContextValue = {
  user: CurrentUser | null;
  status: Status;
  signIn: (user: AuthUser, accountType: AccountType) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const signIn = useCallback((u: AuthUser, type: AccountType) => {
    setUser(toCurrentUser(u, type));
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setSpace(null);
    setUser(null);
    setStatus('guest');
  }, []);

  // Restore session on first load
  useEffect(() => {
    (async () => {
      await Promise.resolve();
      const token = getToken();
      if (!token) {
        setStatus('guest');
        return;
      }
      try {
        const u = await fetchMe(token);
        signIn(u, await resolveAccountType(token));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setToken(null);
        setStatus('guest');
      }
    })();
  }, [signIn]);

  // Token expired mid-session
  useEffect(() => {
    window.addEventListener('auth:expired', signOut);
    return () => window.removeEventListener('auth:expired', signOut);
  }, [signOut]);

  const value = useMemo(() => ({ user, status, signIn, signOut }), [user, status, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};