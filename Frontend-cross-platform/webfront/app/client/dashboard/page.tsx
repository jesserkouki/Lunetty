"use client";

import { useRouter } from "next/navigation";
import UserDashboard from "@/app/components/Dashboard/UserDashboard";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/lib/auth-context";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f5f0e7] pt-20 dark:bg-[#181613]">
      <UserDashboard
        user={user}
        dark={resolvedTheme === "dark"}
        onNavigate={(destination) => {
          const paths = {
            landing: "/",
            tryon: "/client/try-on",
            catalog: "/lunettes",
            favorites: "/client/favorites",
          } as const;
          router.push(paths[destination]);
        }}
        onSettings={(section) => router.push(`/account/settings${section ? `#${section}` : ""}`)}
      />
    </main>
  );
}
