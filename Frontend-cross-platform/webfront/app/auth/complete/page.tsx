'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as usePortalAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/lib/auth-context';
import { safeInternalRedirect } from '@/lib/auth';

export default function AuthCompletePage() {
  const router = useRouter();
  const { user, loading } = usePortalAuth();
  const { status, authError } = useAuth();

  useEffect(() => {
    if (loading || status === 'loading') return;
    if (status !== 'authenticated' || !user) return;

    const savedRedirect = safeInternalRedirect(
      window.sessionStorage.getItem('lunetty.auth.redirect'),
      window.location.origin,
    );
    window.sessionStorage.removeItem('lunetty.auth.redirect');
    router.replace(
      user.role === 'SUPER_ADMIN'
        ? '/admin'
        : savedRedirect ??
          (user.accountType === 'OPTICIAN'
            ? '/optician/dashboard'
            : '/'),
    );
  }, [loading, router, status, user]);

  if (status === 'guest') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert">
          {authError ?? 'Impossible de synchroniser votre compte avec Lunetty.'}
        </p>
        <button
          type="button"
          className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          Réessayer la synchronisation
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p role="status">Synchronisation de votre compte…</p>
    </main>
  );
}
