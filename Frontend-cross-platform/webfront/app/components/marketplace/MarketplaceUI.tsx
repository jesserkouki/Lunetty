"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight, Star } from "lucide-react";
import type { Frame, OpticianStore } from "../../data/marketplace-demo";
import { getStoreHref } from "../../lib/marketplace";
import ProductCard from "./ProductCard";

export { ProductCard };
export const FrameCard = ProductCard;

export function StoreCard({
  store,
  distanceKm,
}: {
  store: OpticianStore;
  distanceKm?: number;
}) {
  return (
    <Link
      href={getStoreHref(store)}
      className="group min-w-0 snap-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#e8e0d3]">
        <Image
          src={store.cover}
          alt={`Vitrine de ${store.name}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 30vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {store.independent && (
          <span className="absolute left-3 top-3 bg-[#f4efe5]/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900">
            Indépendant
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-stone-200 bg-[#f4efe5]">
          <Image src={store.logo} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-2xl leading-tight text-stone-900 dark:text-[#f5f0e7]">{store.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-stone-600 dark:text-stone-300">
            <span>{[store.district, store.city].filter(Boolean).join(", ")}</span>
            {typeof distanceKm === "number" && <span>· {distanceKm.toFixed(1)} km</span>}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {store.listingCount ? `${store.listingCount} montures` : "Montures disponibles en boutique"}
          </p>
        </div>
        <MoveRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  href,
  linkText = "Voir tout",
}: {
  kicker: string;
  title: string;
  description?: string;
  href: string;
  linkText?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{kicker}</p>
        <h2 className="font-serif text-4xl leading-tight text-stone-900 dark:text-[#f5f0e7] sm:text-5xl">{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">{description}</p>}
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-65 dark:text-[#f5f0e7]">
        {linkText}
        <MoveRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function FrameCarousel({
  frames,
  badge,
}: {
  frames: Frame[];
  badge?: string;
}) {
  if (!frames.length) {
    return <p className="py-8 text-sm text-stone-600 dark:text-stone-300">Aucune monture à afficher pour le moment.</p>;
  }
  return (
    <div className="marketplace-carousel -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:gap-6 sm:px-0">
      {frames.slice(0, 6).map((frame) => (
        <div key={frame.id} className="w-[78%] shrink-0 sm:w-[42%] lg:w-[calc((100%-4.5rem)/4)]">
          <FrameCard frame={frame} badge={badge} />
        </div>
      ))}
    </div>
  );
}

export function StoreCarousel({
  stores,
  distances,
}: {
  stores: OpticianStore[];
  distances?: Map<string, number>;
}) {
  if (!stores.length) {
    return <p className="py-8 text-sm text-stone-600 dark:text-stone-300">Aucun opticien trouvé pour ces critères.</p>;
  }
  return (
    <div className="marketplace-carousel -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:gap-6 sm:px-0">
      {stores.slice(0, 6).map((store) => (
        <div key={store.id} className="w-[78%] shrink-0 sm:w-[42%] lg:w-[calc((100%-3rem)/3)]">
          <StoreCard store={store} distanceKm={distances?.get(store.id) ?? store.distanceKm} />
        </div>
      ))}
    </div>
  );
}

export function Rating({ rating }: { rating?: number }) {
  if (typeof rating !== "number") return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300">
      <Star aria-hidden="true" className="h-4 w-4 fill-current text-accent" />
      {rating.toFixed(1)}
    </span>
  );
}
