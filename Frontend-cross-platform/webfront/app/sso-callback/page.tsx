'use client';

import { HandleSSOCallback } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p role="status">Finalisation de votre connexion…</p>
      <HandleSSOCallback
        navigateToApp={({ session, decorateUrl }) => {
          if (session?.currentTask) {
            router.replace('/sign-in?error=additional-requirement');
            return;
          }
          const url = decorateUrl('/auth/complete');
          if (url.startsWith('http')) {
            window.location.href = url;
          } else {
            router.replace(url);
          }
        }}
        navigateToSignIn={() => router.replace('/sign-in?error=sso')}
        navigateToSignUp={() =>
          router.replace('/sign-in?mode=signup&error=additional-requirement')
        }
      />
    </main>
  );
}
