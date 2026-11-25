"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";

type Props = {
  productId: string;
  dark: boolean;
};

export default function FavoriteButton({
  productId,
  dark,
}: Props) {
  const {
    isFavorite,
    isLoading,
    pendingProductIds,
    toggleFavorite,
  } = useFavorites();
  const active = isFavorite(productId);
  const disabled = isLoading || pendingProductIds.has(productId);

  const label = active
      ? "Retirer des favoris"
      : "Ajouter aux favoris";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={() => void toggleFavorite(productId)}
      className={`group pointer-events-auto absolute top-3 right-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
        dark
          ? "border-white/15 bg-[#121110]/80 text-white hover:bg-[#121110]"
          : "border-white/80 bg-white/90 text-stone-700 hover:bg-white"
      } ${active ? "text-rose-500" : ""}`}
    >
      <Heart
        className={`h-5 w-5 transition-all duration-200 group-hover:scale-110 ${
          active ? "scale-110 fill-rose-500 text-rose-500" : "fill-transparent"
        }`}
      />
    </button>
  );
}
