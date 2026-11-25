"use client";

import { ArrowRight, Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { CatalogProduct } from "@/services/products.service";
import CatalogProductCard from "@/app/components/Catalog/CatalogProductCard";

type Props = {
  dark: boolean;
  onBrowse: () => void;
  onReserve?: (product: CatalogProduct) => void;
};

export default function FavoritesPage({ dark, onBrowse, onReserve }: Props) {
  const { favorites, isLoading, error, refresh } = useFavorites();
  const products = favorites.map((favorite) => favorite.produit);
  const title = dark ? "text-white" : "text-stone-900";
  const muted = dark ? "text-stone-400" : "text-stone-600";

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-200">
          Votre sélection
        </span>
        <h1 className={`mt-2 text-3xl font-light font-display ${title}`}>
          Mes favoris
        </h1>
        <p className={`mt-1 text-sm ${muted}`}>
          Retrouvez ici les montures que vous avez enregistrées.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className={`mb-6 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm ${
            dark
              ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="shrink-0 font-semibold underline underline-offset-4"
          >
            Réessayer
          </button>
        </div>
      )}

      {isLoading ? (
        <div
          role="status"
          className={`rounded-3xl border p-10 text-center text-sm ${
            dark
              ? "border-white/10 bg-[#171514]/90 text-stone-300"
              : "border-stone-200 bg-white text-stone-600"
          }`}
        >
          Chargement de vos favoris…
        </div>
      ) : products.length === 0 ? (
        <div
          className={`rounded-3xl border px-6 py-14 text-center ${
            dark
              ? "border-white/10 bg-[#171514]/90"
              : "border-stone-200 bg-white"
          }`}
        >
          <Heart
            className="mx-auto h-10 w-10 text-amber-500"
            aria-hidden
          />
          <h2 className={`mt-4 text-xl font-semibold ${title}`}>
            Aucun favori pour le moment
          </h2>
          <p className={`mx-auto mt-2 max-w-md text-sm ${muted}`}>
            Explorez le catalogue et touchez le cœur d’une monture pour la
            retrouver ici.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              dark
                ? "bg-stone-100 text-stone-950 hover:bg-amber-100"
                : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            Découvrir le catalogue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {products.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              dark={dark}
              onReserve={onReserve}
            />
          ))}
        </div>
      )}
    </section>
  );
}
