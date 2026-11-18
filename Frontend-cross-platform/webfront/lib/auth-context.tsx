'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import {
  AccountType, ApiError, AuthUser, CurrentUser,
  fetchMe, getSpace, getToken, resolveAccountType, setToken, syncClerkUser, toCurrentUser, setSpace
} from '@/lib/auth';
import { setClerkTokenGetter } from '@/services/api';

type Status = 'loading' | 'guest' | 'authenticated';

type AuthContextValue = {
  user: CurrentUser | null;
  status: Status;
  authError: string | null;
  signIn: (user: AuthUser, accountType: AccountType) => void;
  signOut: () => void;
  updateUserProfile: (patch: Partial<Pick<AuthUser,
    'prenom' | 'nom' | 'telephone' | 'url_image_profil' | 'langue_preferee' | 'email'
  >>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    isLoaded: clerkLoaded,
    isSignedIn: clerkSignedIn,
    getToken: getClerkToken,
    signOut: clerkSignOut,
  } = useClerkAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  const signIn = useCallback((u: AuthUser, type: AccountType) => {
    setClerkTokenGetter(null);
    setUser(toCurrentUser(u, type));
    setStatus('authenticated');
    setAuthError(null);
  }, []);

  const signInWithClerk = useCallback((u: AuthUser, type: AccountType) => {
    setClerkTokenGetter(getClerkToken);
    setToken(null);
    setUser(toCurrentUser(u, type));
    setStatus('authenticated');
    setAuthError(null);
  }, [getClerkToken]);

  const signOut = useCallback(() => {
    setClerkTokenGetter(null);
    setToken(null);
    setSpace(null);
    setUser(null);
    setStatus('guest');
    setAuthError(null);
    if (clerkSignedIn) {
      void clerkSignOut().catch(() => {
        setAuthError('La déconnexion Clerk a échoué. Veuillez réessayer.');
      });
    }
  }, [clerkSignedIn, clerkSignOut]);

  const updateUserProfile = useCallback(
    (patch: Partial<Pick<AuthUser,
      'prenom' | 'nom' | 'telephone' | 'url_image_profil' | 'langue_preferee' | 'email'
    >>) => {
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        return { ...next, name: `${next.prenom} ${next.nom}`.trim() };
      });
    },
    [],
  );

  // Restore session on first load
  useEffect(() => {
    if (!clerkLoaded) return;
    let active = true;

    (async () => {
      if (clerkSignedIn) {
        setStatus('loading');
        setAuthError(null);
        const token = await getClerkToken();
        if (!token) throw new ApiError(401, 'Votre session Clerk a expiré.');
        const clerkUser = await syncClerkUser(token, getSpace());
        if (active) {
          signInWithClerk(clerkUser, await resolveAccountType(token));
        }
        return;
      }

      setClerkTokenGetter(null);
      const token = getToken();
      if (!token) {
        if (active) {
          setUser(null);
          setStatus('guest');
        }
        return;
      }
      try {
        const u = await fetchMe(token);
        if (active) signIn(u, await resolveAccountType(token));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setToken(null);
        if (active) setStatus('guest');
      }
    })().catch((err: unknown) => {
      if (!active) return;
      setUser(null);
      setStatus('guest');
      setAuthError(
        err instanceof ApiError
          ? err.message
          : 'Impossible de synchroniser votre compte avec le serveur.',
      );
    });

    return () => {
      active = false;
    };
  }, [clerkLoaded, clerkSignedIn, getClerkToken, signIn, signInWithClerk]);

  // Token expired mid-session
  useEffect(() => {
    window.addEventListener('auth:expired', signOut);
    return () => window.removeEventListener('auth:expired', signOut);
  }, [signOut]);

  const value = useMemo(
    () => ({ user, status, authError, signIn, signOut, updateUserProfile }),
    [user, status, authError, signIn, signOut, updateUserProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};