"use client";

import { Glasses, MapPin } from "lucide-react";
import type { CatalogProduct } from "@/services/products.service";
import FavoriteButton from "@/app/components/Favorites/FavoriteButton";

type Props = {
  product: CatalogProduct;
  dark: boolean;
  onReserve?: (product: CatalogProduct) => void;
};

export default function CatalogProductCard({
  product,
  dark,
  onReserve,
}: Props) {
  const price = product.price === null ? null : Number(product.price);
  const priceLabel =
    price !== null && Number.isFinite(price)
      ? `${price.toFixed(3)} ${product.currency ?? ""}`.trim()
      : "Prix non communiqué";

  return (
    <article
      className={`flex flex-col justify-between overflow-hidden rounded-3xl border shadow-xl transition-all hover:border-amber-500/40 ${
        dark
          ? "border-white/10 bg-[#171514]/90"
          : "border-stone-200 bg-white"
      }`}
    >
      <div>
        <div
          className={`relative aspect-[4/3] overflow-hidden ${
            dark ? "bg-[#100f0e]" : "bg-stone-100"
          }`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.nom}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Glasses className="h-12 w-12 text-stone-400" aria-hidden />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-xl border px-3 py-1 text-[10px] font-semibold backdrop-blur-md ${
              dark
                ? "border-white/10 bg-[#121110]/80 text-stone-300"
                : "border-stone-200 bg-white/90 text-stone-700"
            }`}
          >
            {product.marque ?? product.fabricant ?? "Sans marque"}
          </span>
          <FavoriteButton
            productId={product.id}
            product={product}
            dark={dark}
          />
        </div>

        <div className="p-6">
          <h3
            className={`text-base font-bold ${
              dark ? "text-white" : "text-stone-900"
            }`}
          >
            {product.nom}
          </h3>
          {product.storeName && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                dark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-stone-500" />
              {product.storeName}
            </p>
          )}
        </div>
      </div>

      <div
        className={`mt-3 flex items-center justify-between border-t p-6 pt-4 ${
          dark ? "border-white/10" : "border-stone-200"
        }`}
      >
        <span
          className={`text-sm font-bold ${
            dark ? "text-white" : "text-stone-900"
          }`}
        >
          {priceLabel}
        </span>
        {onReserve && product.storeId && (
          <button
            type="button"
            onClick={() => onReserve(product)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              dark
                ? "bg-stone-100 text-stone-950 hover:bg-amber-100"
                : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            Réserver
          </button>
        )}
      </div>
    </article>
  );
}
