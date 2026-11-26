"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Glasses, Heart, MapPin, Navigation, Star } from "lucide-react";
import type { Frame, Optician } from "../../data/marketplace-demo";
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

function getSpecialties(optician: Optician) {
  const categories = optician.montures.map((frame) =>
    frame.category.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  );
  return [
    { label: "Optique", matches: (category: string) => category.includes("optiq") },
    { label: "Solaires", matches: (category: string) => category.includes("solaire") },
    { label: "Enfants", matches: (category: string) => category.includes("enfant") || category.includes("junior") },
  ]
    .filter(({ matches }) => categories.some(matches))
    .map(({ label }) => label);
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
  const frames = optician.montures.slice(0, 2);
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
  const [failedPhotoSource, setFailedPhotoSource] = useState<string | null>(null);
  const tone = getFallbackTone(optician.id);
  const storeHref = getStoreHref(optician);
  const photoSource = optician.photo ||
    (optician.cover !== "/images/boutiques.svg" ? optician.cover : undefined);
  const specialties = getSpecialties(optician);

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
    <article className="group relative h-full min-w-0 transition-transform duration-300 hover:-translate-y-[6px]">
      <TiltCard
        className="h-full"
        maxTiltDegrees={6}
        touchEffect={false}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-lunetty-gold/35 bg-lunetty-surface p-4 shadow-[0_12px_36px_rgba(54,41,26,0.1)] transition-shadow duration-300 group-hover:shadow-[0_22px_48px_rgba(54,41,26,0.2)] sm:p-5">
          <Link
            href={storeHref}
            aria-label={`Voir la boutique ${optician.name}`}
            className="absolute inset-0 z-10 rounded-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="sr-only">Voir la boutique {optician.name}</span>
          </Link>

          <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[28px] bg-lunetty-cream">
            {photoSource && photoSource !== failedPhotoSource ? (
              <Image
                src={photoSource}
                alt={optician.photoAlt || `Photo de la boutique ${optician.name}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 68vw, (max-width: 1024px) 45vw, 30vw"
                onError={() => setFailedPhotoSource(photoSource)}
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
              className="pointer-events-auto absolute right-3 top-3 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/75 bg-lunetty-surface/80 text-stone-900 shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <Heart aria-hidden="true" className={`h-5 w-5 ${favorite ? "fill-current text-[#9b564f]" : ""}`} />
            </button>
          </div>

          <FrameThumbnails optician={optician} />

          <div className="pointer-events-none relative z-20 mt-4 flex min-w-0 items-start gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-lunetty-gold/40 text-sm font-semibold text-lunetty-ink"
              style={{ backgroundColor: tone[0] }}
            >
              <span aria-hidden="true">{getInitials(optician.name)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-serif text-[1.55rem] italic leading-tight text-lunetty-ink">
                {optician.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-lunetty-muted">
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
            {specialties.map((specialty) => (
              <span key={specialty} className="rounded-full border border-lunetty-gold/35 bg-lunetty-cream px-3 py-1.5 text-lunetty-ink">
                {specialty}
              </span>
            ))}
            {typeof optician.independent === "boolean" && (
              <span className="rounded-full bg-[#e8dfd0] px-3 py-1.5 text-stone-800">
                {optician.independent ? "Indépendant" : "Enseigne"}
              </span>
            )}
            {optician.inStoreTryOn && (
              <span className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-800">
                Essayage en magasin
              </span>
            )}
            {optician.isNew && (
              <span className="rounded-full bg-[#214532] px-3 py-1.5 text-white">
                Nouveau
              </span>
            )}
          </div>

          <div className="pointer-events-none relative z-20 mt-3 flex min-w-0 items-start gap-2 text-sm text-lunetty-muted">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 break-words leading-5">
              {optician.address && <p>{optician.address}</p>}
              <p>{[optician.district, optician.city].filter(Boolean).join(", ")}</p>
            </div>
            {typeof distanceKm === "number" && (
              <p className="ml-auto shrink-0 text-sm font-semibold text-lunetty-ink">
                {new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distanceKm)} km
              </p>
            )}
          </div>
          <p className="pointer-events-none relative z-20 mt-2 text-sm font-medium text-lunetty-muted">
            {optician.listingCount} monture{optician.listingCount === 1 ? "" : "s"}
          </p>

          <div className="pointer-events-auto relative z-30 mt-5 grid grid-cols-2 gap-2">
            <Link
              href={storeHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lunetty-ink px-3 text-sm font-semibold text-white transition hover:bg-lunetty-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-lunetty-gold dark:text-lunetty-ink"
            >
              Voir la boutique
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a
              href={getDirectionsHref(optician)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-lunetty-gold/45 px-3 text-sm font-semibold text-lunetty-ink transition hover:bg-lunetty-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
