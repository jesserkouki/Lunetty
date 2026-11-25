'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/app/components/Auth/AuthModal';
import { useAuth } from '@/lib/auth-context';
import {
  safeInternalRedirect,
  type AccountType,
  type AuthUser,
} from '@/lib/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const redirectUrl = searchParams.get('redirect_url');
  const errorParam = searchParams.get('error');
  const initialError =
    errorParam === 'additional-requirement'
      ? 'Clerk requiert des informations supplémentaires pour terminer cette connexion.'
      : errorParam === 'sso'
        ? 'La connexion Google n’a pas pu aboutir. Réessayez.'
        : '';
  const safeRedirectUrl = safeInternalRedirect(
    redirectUrl,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );
  const initialSpace: AccountType = safeRedirectUrl?.startsWith('/optician/')
    ? 'OPTICIAN'
    : 'CLIENT';

  useEffect(() => {
    if (safeRedirectUrl) {
      window.sessionStorage.setItem('lunetty.auth.redirect', safeRedirectUrl);
    }
  }, [safeRedirectUrl]);

  const handleSuccess = (user: AuthUser, accountType: AccountType) => {
    signIn(user, accountType);
    const savedRedirect = safeInternalRedirect(
      window.sessionStorage.getItem('lunetty.auth.redirect'),
      window.location.origin,
    );
    window.sessionStorage.removeItem('lunetty.auth.redirect');
    router.replace(
      user.role === 'SUPER_ADMIN'
        ? '/admin'
        : savedRedirect ??
          (accountType === 'OPTICIAN'
            ? '/optician/dashboard'
            : '/'),
    );
  };

  return (
    <main className="min-h-screen">
      <AuthModal
        open
        initialMode={searchParams.get('mode') === 'signup' ? 'signup' : 'login'}
        initialSpace={initialSpace}
        initialError={initialError}
        onClose={() => router.replace('/')}
        onSuccess={handleSuccess}
      />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <SignInContent />
    </Suspense>
  );
}
