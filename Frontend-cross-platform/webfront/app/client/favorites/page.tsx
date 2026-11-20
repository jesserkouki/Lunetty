"use client";

import { useRouter } from "next/navigation";
import FavoritesPage from "@/app/components/Favorites/FavoritesPage";
import { useTheme } from "@/contexts/ThemeContext";

export default function ClientFavoritesPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <main className="min-h-screen bg-[#f5f0e7] pt-20 dark:bg-[#181613]">
      <FavoritesPage
        dark={resolvedTheme === "dark"}
        onBrowse={() => router.push("/lunettes")}
      />
    </main>
  );
}
