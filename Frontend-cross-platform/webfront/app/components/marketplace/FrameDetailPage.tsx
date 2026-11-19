"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { DEMO_FRAMES, DEMO_STORES } from "../../data/marketplace-demo";
import { findFrame, findStore, formatPrice, getStoreHref } from "../../lib/marketplace";
import { FrameCard } from "./MarketplaceUI";
import { useMarketplaceData } from "./useMarketplaceData";
import { claimViewerCanvas, releaseViewerCanvas, useViewerCanvas } from "./viewerCanvas";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";

const LazyGlassesViewer3D = dynamic(() => import("./GlassesViewer3D"), { ssr: false });

export default function FrameDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const reducedMotion = useReducedMotion();
  const { frames, stores } = useMarketplaceData();
  const frame = findFrame(frames, id) ?? findFrame(DEMO_FRAMES, id);
  const viewerOwner = `detail:${frame?.id ?? id}`;
  const ownsViewer = useViewerCanvas(viewerOwner);
  const [readyViewer, setReadyViewer] = useState<string | null>(null);
  const store = frame
    ? findStore(stores, frame.storeId) ?? findStore(DEMO_STORES, frame.storeId)
    : undefined;

  useEffect(() => {
    if (!frame?.modelUrl) return;
    claimViewerCanvas(viewerOwner);
    return () => releaseViewerCanvas(viewerOwner);
  }, [frame?.id, frame?.modelUrl, viewerOwner]);

  useEffect(() => {
    if (!frame) return;
    try {
      const current: unknown = JSON.parse(localStorage.getItem("lunetty:viewed-frames") ?? "[]");
      const history = Array.isArray(current)
        ? current.filter((value): value is string => typeof value === "string")
        : [];
      localStorage.setItem(
        "lunetty:viewed-frames",
        JSON.stringify([frame.id, ...history.filter((value) => value !== frame.id)].slice(0, 20)),
      );
      window.dispatchEvent(new Event("lunetty:viewed-frames-changed"));
    } catch {
      localStorage.setItem("lunetty:viewed-frames", JSON.stringify([frame.id]));
    }
  }, [frame]);

  const handleViewerReady = useCallback(() => setReadyViewer(viewerOwner), [viewerOwner]);
  const similar = frames
    .filter((candidate) => candidate.id !== frame?.id)
    .sort((a, b) =>
      Number(b.shape === frame?.shape || b.brand === frame?.brand) -
      Number(a.shape === frame?.shape || a.brand === frame?.brand),
    )
    .slice(0, 4);

  if (!frame) {
    return (
      <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7]">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="font-serif text-4xl">Monture introuvable</h1>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">Cette monture n’est plus disponible ou son adresse a changé.</p>
          <Link className="mt-8 inline-flex border border-stone-400 px-5 py-3 text-sm font-semibold hover:bg-[#eee7dc] dark:border-stone-600 dark:hover:bg-stone-800" href="/lunettes">Retour au catalogue</Link>
        </div>
      </main>
    );
  }

  return (
    <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-stone-600 dark:text-stone-300">
          <Link href="/lunettes" className="underline-offset-4 hover:underline">Lunettes</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span>{frame.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16">
          <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-[#e8e0d3] sm:aspect-[5/4] dark:bg-[#211e19]">
            <div className="absolute inset-y-[10%] inset-x-[12%]">
              <Image
                src={frame.image || "/images/frame-placeholder.svg"}
                alt={frame.imageAlt}
                fill
                unoptimized
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={`object-contain drop-shadow-[0_22px_18px_rgba(0,0,0,0.35)] transition-opacity duration-500 ${readyViewer === viewerOwner && ownsViewer ? "opacity-0" : "opacity-100"}`}
              />
            </div>
            {frame.modelUrl && ownsViewer && (
              <LazyGlassesViewer3D
                url={frame.modelUrl}
                autoRotate={!reducedMotion}
                onReady={handleViewerReady}
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{frame.brand}</p>
            <h1 className="mt-3 font-serif text-5xl sm:text-6xl">{frame.name}</h1>
            {typeof frame.rating === "number" && <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">★ {frame.rating.toFixed(1)} · Sélection partenaire</p>}
            <p className="mt-6 text-2xl font-semibold">{formatPrice(frame.price, frame.currency)}</p>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 dark:text-stone-200">{frame.description}</p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-stone-300 py-5 text-sm dark:border-white/10">
              <div><dt className="text-stone-500 dark:text-stone-400">Forme</dt><dd className="mt-1 font-medium">{frame.shape}</dd></div>
              <div><dt className="text-stone-500 dark:text-stone-400">Matière</dt><dd className="mt-1 font-medium">{frame.material}</dd></div>
              <div><dt className="text-stone-500 dark:text-stone-400">Coloris</dt><dd className="mt-1 font-medium">{frame.color}</dd></div>
              <div><dt className="text-stone-500 dark:text-stone-400">Style</dt><dd className="mt-1 font-medium">{frame.style}</dd></div>
            </dl>
            {store && (
              <Link href={getStoreHref(store)} className="mt-8 flex items-center gap-4 border border-stone-300 bg-[#faf8f3] p-4 transition hover:border-accent dark:border-stone-700 dark:bg-[#211e19]">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eee7dc] text-accent"><MapPin aria-hidden="true" className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">Vendu par</p>
                  <p className="mt-1 font-semibold">{store.name}</p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{store.city}</p>
                </div>
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-accent" />
              </Link>
            )}
            <Link href={store ? getStoreHref(store) : "/opticiens"} className="mt-5 inline-flex min-h-12 items-center justify-center bg-stone-950 px-6 text-sm font-semibold text-[#f5f0e7] transition hover:bg-accent dark:bg-[#f5f0e7] dark:text-stone-950">
              Contacter l’opticien
            </Link>
          </div>
        </div>
        <section className="mt-24 border-t border-stone-300 pt-14 dark:border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Dans le même esprit</p>
          <h2 className="mb-8 font-serif text-4xl">Montures similaires</h2>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((candidate) => <FrameCard key={candidate.id} frame={candidate} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
