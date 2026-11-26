"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { Heart, MapPin } from "lucide-react";
import type { Frame, FrameColorOption } from "../../lib/marketplace-types";
import { getFrameHref } from "../../lib/marketplace";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";
import ColorSwatches from "./ColorSwatches";
import TiltCard from "./TiltCard";
import { claimViewerCanvas, releaseViewerCanvas, useViewerCanvas } from "./viewerCanvas";

const FALLBACK_IMAGE = "/images/frame-placeholder.svg";
const LazyGlassesViewer3D = dynamic(() => import("./GlassesViewer3D"), { ssr: false });
const FAVORITES_KEY = "lunetty:favorites";

function parseFavoriteIds(snapshot: string) {
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
  window.addEventListener("lunetty:favorites-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("lunetty:favorites-changed", onChange);
  };
}

const COLOR_TONES: Record<string, [string, string, string]> = {
  noir: ["#343230", "#111110", "#c5c2bc"],
  argent: ["#343b3e", "#101315", "#d9e3e7"],
  dore: ["#3d352a", "#151311", "#dfc18d"],
  champagne: ["#3c352b", "#141210", "#ead5a9"],
  ecaille: ["#3c2b21", "#120e0b", "#d5a66d"],
  havane: ["#3b2b21", "#140f0c", "#d29a62"],
  brun: ["#392b23", "#130f0d", "#d4a778"],
  olive: ["#303329", "#12130f", "#c0c5a1"],
  bordeaux: ["#3b252b", "#150e11", "#d6939b"],
  rose: ["#3a2c31", "#130f11", "#e7b6ba"],
};

function cardTone(color: string) {
  const key = color.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tone = Object.entries(COLOR_TONES).find(([name]) => key.includes(name))?.[1] ?? ["#34312d", "#11100f", "#c6a674"];
  return {
    background: `radial-gradient(ellipse at 50% 34%, ${tone[2]}30 0%, transparent 48%), linear-gradient(145deg, ${tone[0]}, ${tone[1]})`,
  };
}

function formatCardPrice(price: number) {
  return `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 }).format(price)} DT`;
}

function FavoriteButton({ frame }: { frame: Frame }) {
  const snapshot = useSyncExternalStore(subscribeToFavorites, getFavoriteSnapshot, () => "[]");
  const saved = parseFavoriteIds(snapshot).includes(frame.productId);

  const toggle = () => {
    try {
      const favorites = parseFavoriteIds(getFavoriteSnapshot());
      const next = saved
        ? favorites.filter((id) => id !== frame.productId)
        : [...new Set([...favorites, frame.productId])];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("lunetty:favorites-changed"));
    } catch (error) {
      console.error("Impossible de mettre à jour les favoris locaux.", error);
    }
  };

  return (
    <button
      type="button"
      aria-label={saved ? `Retirer ${frame.name} des favoris` : `Ajouter ${frame.name} aux favoris`}
      aria-pressed={saved}
      onClick={toggle}
      className="absolute right-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <Heart aria-hidden="true" className={`h-5 w-5 ${saved ? "fill-white" : ""}`} />
    </button>
  );
}

export default function ProductCard({ frame, badge }: { frame: Frame; badge?: string }) {
  const reducedMotion = useReducedMotion();
  const owner = useId();
  const ownsViewer = useViewerCanvas(owner);
  const [selectedColor, setSelectedColor] = useState<FrameColorOption | undefined>(
    () => frame.colorOptions?.find((option) => option.name === frame.color) ?? frame.colorOptions?.[0],
  );
  const [imageSource, setImageSource] = useState(frame.image || FALLBACK_IMAGE);
  const [viewerRequested, setViewerRequested] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  const requestViewer = useCallback(() => {
    if (!frame.modelUrl || reducedMotion) return;
    claimViewerCanvas(owner);
    setViewerRequested(true);
  }, [frame.modelUrl, owner, reducedMotion]);

  const releaseViewer = useCallback(() => {
    releaseViewerCanvas(owner);
    setViewerRequested(false);
    setViewerReady(false);
  }, [owner]);

  useEffect(() => () => releaseViewerCanvas(owner), [owner]);

  const selectColor = (option: FrameColorOption) => {
    setSelectedColor(option);
    setImageSource(option.image || frame.image || FALLBACK_IMAGE);
    setViewerReady(false);
  };
  const handleImageError = () => {
    if (imageSource !== FALLBACK_IMAGE) setImageSource(FALLBACK_IMAGE);
  };
  const imageFilter = selectedColor?.filter;
  const currentColor = selectedColor?.name ?? frame.color;
  const sponsored = frame.sponsored || badge?.toLocaleLowerCase("fr") === "sponsorisé";
  const href = getFrameHref(frame);
  const canvasActive = viewerRequested && ownsViewer && Boolean(frame.modelUrl);

  return (
    <article className="min-w-0 snap-start">
      <TiltCard
        className="h-full"
        onLongHover={requestViewer}
        onLongHoverEnd={releaseViewer}
      >
        <div className="product-card__surface relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 shadow-[0_14px_38px_rgba(12,10,8,0.2)]" style={cardTone(currentColor)}>
          <Link
            href={href}
            aria-label={`Découvrir ${frame.name}, ${formatCardPrice(frame.price)}, vendu par ${frame.storeName}`}
            className="absolute inset-0 z-10 rounded-[1.35rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="sr-only">Découvrir {frame.name}</span>
          </Link>

          <div className="pointer-events-none relative aspect-[5/4] overflow-hidden">
            <div aria-hidden="true" className="product-card__halo absolute inset-[14%] rounded-full" />
            <div className="absolute inset-y-[10%] inset-x-[12%] z-[2]">
              <Image
                src={imageSource}
                alt={`${frame.imageAlt} — ${currentColor}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 23vw"
                onError={handleImageError}
                style={{ filter: `${imageFilter ? `${imageFilter} ` : ""}drop-shadow(0 22px 18px rgba(0,0,0,.55))` }}
                className={`product-card__image object-contain ${viewerReady ? "opacity-0" : "opacity-100"}`}
              />
            </div>
            {canvasActive && frame.modelUrl && (
              <div className="absolute inset-[8%] z-20">
                <LazyGlassesViewer3D
                  url={frame.modelUrl}
                  autoRotate={!reducedMotion}
                  onReady={() => setViewerReady(true)}
                />
              </div>
            )}
            {sponsored ? (
              <span className="absolute bottom-3 left-3 z-30 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                Sponsorisé
              </span>
            ) : badge ? (
              <span className="absolute bottom-3 left-3 z-30 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                {badge}
              </span>
            ) : null}
            <FavoriteButton frame={frame} />
          </div>

          <div className="pointer-events-none relative z-20 flex flex-1 flex-col px-4 pb-4 pt-1.5 sm:px-5 sm:pb-5">
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">
              {frame.brand}
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h3 className="truncate font-serif text-[1.45rem] italic leading-tight text-[#f7f0e5] sm:text-2xl">
                {frame.name}
              </h3>
              <span className="shrink-0 text-xs font-medium text-[#ead7b4] sm:text-sm">
                {formatCardPrice(frame.price)}
              </span>
            </div>
            <div className="pointer-events-auto">
              <ColorSwatches
                options={frame.colorOptions ?? []}
                selected={currentColor}
                productName={frame.name}
                onSelect={selectColor}
              />
            </div>
            <Link
              href={`/opticiens/${encodeURIComponent(frame.storeSlug || frame.storeId)}`}
              title={frame.storeName}
              className="pointer-events-auto relative z-30 mt-auto flex min-w-0 items-center gap-1.5 pt-3 text-xs text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{frame.storeName}</span>
            </Link>
          </div>
        </div>
      </TiltCard>
    </article>
  );
}
