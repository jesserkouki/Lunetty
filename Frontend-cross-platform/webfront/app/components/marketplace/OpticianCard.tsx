"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Glasses, Heart, MapPin, Navigation, Star } from "lucide-react";
import type { Frame, Optician } from "../../lib/marketplace-types";
import { getFrameHref, getStoreHref } from "../../lib/marketplace";
import TiltCard from "./TiltCard";
import OpenStatusBadge from "./OpenStatusBadge";

const FAVORITES_KEY = "lunetty:favorites:opticians";

const FALLBACK_TONES = [
  ["#d9c6a9", "#87735b"],
  ["#c4c0af", "#626658"],
  ["#d6b1a3", "#7d5a50"],
  ["#c2b9a2", "#665e4e"],
];

function parseFavoriteIds(snapshot: string): string[] {
  try {
    const value: unknown = JSON.parse(snapshot);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getFavoriteSnapshot() {
  try {
    return JSON.stringify(parseFavoriteIds(localStorage.getItem(FAVORITES_KEY) ?? "[]"));
  } catch {
    return "[]";
  }
}

function subscribeToFavorites(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("lunetty:optician-favorites-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("lunetty:optician-favorites-changed", onChange);
  };
}

function getFallbackTone(id: string) {
  const index = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return FALLBACK_TONES[index % FALLBACK_TONES.length];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("fr");
}

function getDirectionsHref(optician: Optician) {
  const destination =
    typeof optician.latitude === "number" && typeof optician.longitude === "number"
      ? `${optician.latitude},${optician.longitude}`
      : [optician.address, optician.district, optician.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function FrameCollage({ optician }: { optician: Optician }) {
  const frames = optician.montures.slice(0, 3);
  const [light, dark] = getFallbackTone(optician.id);

  if (!frames.length) {
    return (
      <div
        role="img"
        aria-label={`Visuel de la boutique ${optician.name}`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
        style={{ background: `radial-gradient(circle at 50% 35%, ${light}, transparent 56%), linear-gradient(140deg, #f3eadb, ${dark})` }}
      >
        <Glasses aria-hidden="true" className="h-14 w-14 text-white/90 drop-shadow-md" strokeWidth={1.2} />
        <span className="font-serif text-4xl italic text-white">{optician.name}</span>
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{optician.city}</span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Quelques montures proposées par ${optician.name}`}
      className="absolute inset-[12%] grid grid-cols-3 gap-2 sm:gap-3"
    >
      {frames.map((frame) => (
        <div key={frame.id} className="relative overflow-hidden rounded-xl border border-white/60 bg-[#f7f2e9]/90 shadow-[0_8px_24px_rgba(54,41,26,0.12)]">
          <Image
            src={frame.image}
            alt={frame.imageAlt}
            fill
            unoptimized
            sizes="(max-width: 640px) 25vw, 9vw"
            className="object-contain p-[12%]"
          />
        </div>
      ))}
    </div>
  );
}

function FrameThumbnails({ optician }: { optician: Optician }) {
  const frames = optician.montures.slice(0, 3);
  const remaining = Math.max(0, optician.listingCount - frames.length);

  return (
    <div className="pointer-events-auto relative z-30 mt-4 flex items-center gap-2.5">
      {frames.map((frame: Frame) => (
        <Link
          key={frame.id}
          href={getFrameHref(frame)}
          aria-label={`Voir la monture ${frame.name} chez ${optician.name}`}
          className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-stone-200 bg-[#f8f4ec] transition hover:border-accent hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Image
            src={frame.image}
            alt={frame.imageAlt}
            fill
            unoptimized
            sizes="56px"
            className="object-contain p-2"
          />
        </Link>
      ))}
      {remaining > 0 && (
        <Link
          href={getStoreHref(optician)}
          aria-label={`Voir les ${remaining} autres montures de ${optician.name}`}
          className="inline-flex min-h-11 items-center rounded-full border border-stone-300 bg-[#eee7dc] px-3 text-sm font-semibold text-stone-800 transition hover:border-accent hover:bg-[#e7dcc9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        >
          +{remaining}
        </Link>
      )}
    </div>
  );
}

export default function OpticianCard({
  optician,
  distanceKm,
}: {
  optician: Optician;
  distanceKm?: number;
}) {
  const favoriteSnapshot = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteSnapshot,
    () => "[]",
  );
  const favorite = parseFavoriteIds(favoriteSnapshot).includes(optician.id);
  const logoSource = optician.logo !== "/images/boutiques.svg" ? optician.logo : undefined;
  const [failedLogoSource, setFailedLogoSource] = useState<string | null>(null);
  const [failedPhotoSource, setFailedPhotoSource] = useState<string | null>(null);
  const logoUnavailable = !logoSource || logoSource === failedLogoSource;
  const tone = getFallbackTone(optician.id);
  const storeHref = getStoreHref(optician);

  const toggleFavorite = () => {
    try {
      const favorites = parseFavoriteIds(getFavoriteSnapshot());
      const updated = favorite
        ? favorites.filter((id) => id !== optician.id)
        : [...new Set([...favorites, optician.id])];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("lunetty:optician-favorites-changed"));
    } catch (error) {
      console.error("Impossible d’enregistrer le favori de boutique.", error);
    }
  };

  return (
    <article className="group relative h-full min-w-0">
      <TiltCard
        className="h-full"
        maxTiltDegrees={6}
        touchEffect={false}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-stone-200/90 bg-[#f9f6f0] p-3.5 shadow-[0_12px_36px_rgba(54,41,26,0.1)] transition-[box-shadow,transform] duration-500 group-hover:shadow-[0_22px_48px_rgba(54,41,26,0.18)] dark:border-white/10 dark:bg-[#211e19] sm:p-4">
          <Link
            href={storeHref}
            aria-label={`Voir la boutique ${optician.name}`}
            className="absolute inset-0 z-10 rounded-[1.4rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="sr-only">Voir la boutique {optician.name}</span>
          </Link>

          <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[1.05rem] bg-[#e7dfd1] dark:bg-[#373128]">
            {optician.photo && optician.photo !== failedPhotoSource ? (
              <Image
                src={optician.photo}
                alt={optician.photoAlt || `Photo de la boutique ${optician.name}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 68vw, (max-width: 1024px) 45vw, 30vw"
                onError={() => setFailedPhotoSource(optician.photo ?? "")}
                className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
              />
            ) : (
              <FrameCollage optician={optician} />
            )}
            <div className="absolute left-3 top-3 z-20">
              <OpenStatusBadge hours={optician.hours} />
            </div>
            <button
              type="button"
              aria-label={favorite
                ? `Retirer ${optician.name} des boutiques favorites`
                : `Ajouter ${optician.name} aux boutiques favorites`}
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className="pointer-events-auto absolute right-3 top-3 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/75 bg-[#f9f6f0]/95 text-stone-900 shadow-sm transition hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <Heart aria-hidden="true" className={`h-5 w-5 ${favorite ? "fill-current text-[#9b564f]" : ""}`} />
            </button>
          </div>

          <FrameThumbnails optician={optician} />

          <div className="pointer-events-none relative z-20 mt-4 flex items-start gap-3">
            <div
              className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-stone-200 bg-[#eee7dc] text-sm font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
              style={{ backgroundColor: logoUnavailable ? tone[0] : undefined }}
            >
              {logoSource && logoSource !== failedLogoSource ? (
                <Image
                  src={logoSource}
                  alt=""
                  fill
                  unoptimized
                  sizes="48px"
                  onError={() => setFailedLogoSource(logoSource)}
                  className="object-cover"
                />
              ) : (
                <span aria-hidden="true">{getInitials(optician.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[1.55rem] italic leading-tight text-stone-900 dark:text-[#f5f0e7]">
                {optician.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-stone-700 dark:text-stone-200">
                {typeof optician.rating === "number" && (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Star aria-hidden="true" className="h-4 w-4 fill-current text-accent" />
                    {optician.rating.toFixed(1)}
                    {typeof optician.reviewCount === "number" && (
                      <span className="font-normal">· {optician.reviewCount} avis</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pointer-events-none relative z-20 mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            {typeof optician.independent === "boolean" && (
              <span className="rounded-full bg-[#e8dfd0] px-3 py-1.5 text-stone-800 dark:bg-stone-700 dark:text-stone-100">
                {optician.independent ? "Indépendant" : "Enseigne"}
              </span>
            )}
            {optician.inStoreTryOn && (
              <span className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-800 dark:border-stone-600 dark:text-stone-100">
                Essayage en magasin
              </span>
            )}
            {optician.isNew && (
              <span className="rounded-full bg-[#214532] px-3 py-1.5 text-white">
                Nouveau
              </span>
            )}
          </div>

          <div className="pointer-events-none relative z-20 mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-700 dark:text-stone-200">
            <p className="flex min-w-0 items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate">{[optician.district, optician.city].filter(Boolean).join(", ")}</span>
            </p>
            {typeof distanceKm === "number" && (
              <p className="shrink-0 text-base font-semibold text-stone-900 dark:text-[#f5f0e7]">
                {new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distanceKm)} km
              </p>
            )}
          </div>
          <p className="pointer-events-none relative z-20 mt-1 text-sm font-medium text-stone-700 dark:text-stone-200">
            {optician.listingCount} monture{optician.listingCount === 1 ? "" : "s"}
          </p>

          <div className="pointer-events-auto relative z-30 mt-5 grid grid-cols-2 gap-2">
            <Link
              href={storeHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-3 text-sm font-semibold text-[#f5f0e7] transition hover:bg-[#806334] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-[#e1c795] dark:text-stone-950 dark:hover:bg-[#f1dcb3]"
            >
              Voir la boutique
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a
              href={getDirectionsHref(optician)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-400 px-3 text-sm font-semibold text-stone-900 transition hover:bg-[#eee7dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-stone-600 dark:text-[#f5f0e7] dark:hover:bg-stone-800"
            >
              <Navigation aria-hidden="true" className="h-4 w-4" />
              Itinéraire
            </a>
          </div>
        </div>
      </TiltCard>
    </article>
  );
}
