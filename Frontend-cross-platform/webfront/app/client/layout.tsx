"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "guest") {
      const returnTo = window.location.pathname || "/client/dashboard";
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
    } else if (status === "authenticated" && user?.role === "SUPER_ADMIN") {
      router.replace("/admin");
    } else if (status === "authenticated" && user?.accountType === "OPTICIAN") {
      router.replace("/optician/dashboard");
    }
  }, [router, status, user?.accountType, user?.role]);

  if (
    status !== "authenticated" ||
    user?.accountType !== "CLIENT" ||
    user.role === "SUPER_ADMIN"
  ) {
    return (
      <main
        className="grid min-h-[60vh] place-items-center bg-[#f5f0e7] px-5 text-sm text-stone-600 dark:bg-[#181613] dark:text-stone-300"
        role="status"
      >
        Chargement de votre espace client…
      </main>
    );
  }

  return children;
}
