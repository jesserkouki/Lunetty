"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { findStore } from "../../lib/marketplace";
import { FrameCard } from "./MarketplaceUI";
import { useMarketplaceData } from "./useMarketplaceData";

export default function OpticianShowcasePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { frames, stores, loading, error } = useMarketplaceData();
  const store = findStore(stores, id);
  const storeFrames = store
    ? frames.filter((frame) => frame.storeId === store.id)
    : [];

  if (!store && loading) {
    return <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-center text-stone-700 dark:bg-[#181613] dark:text-[#f5f0e7]" role="status">Chargement de la boutique…</main>;
  }
  if (!store) {
    return (
      <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7]">
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="font-serif text-4xl">Boutique introuvable</h1>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">{error ?? "Cette vitrine n’est pas disponible pour le moment."}</p>
          <Link className="mt-8 inline-flex border border-stone-400 px-5 py-3 text-sm font-semibold hover:bg-[#eee7dc] dark:border-stone-600 dark:hover:bg-stone-800" href="/opticiens">Voir les opticiens</Link>
        </div>
      </main>
    );
  }

  return (
    <main id="contenu" className="min-h-screen bg-[#f5f0e7] pb-20 pt-20 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7]">
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden bg-[#e8e0d3]">
        <Image src={store.cover} alt={`Vitrine de ${store.name}`} fill unoptimized priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-8 text-white sm:px-8 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Opticien partenaire</p>
          <h1 className="mt-3 font-serif text-5xl sm:text-6xl">{store.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/85"><MapPin aria-hidden="true" className="h-4 w-4" />{[store.district, store.city].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-12">
        <section>
          <p className="max-w-3xl text-base leading-7 text-stone-700 dark:text-stone-200">{store.description}</p>
          <div className="mt-12 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">La sélection en boutique</p>
              <h2 className="font-serif text-4xl">Ses montures</h2>
            </div>
            <Link href={`/lunettes?opticien=${encodeURIComponent(store.id)}`} className="text-sm font-semibold underline underline-offset-4 hover:text-accent">Voir le catalogue</Link>
          </div>
          {storeFrames.length ? (
            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {storeFrames.map((frame) => <FrameCard key={frame.id} frame={frame} />)}
            </div>
          ) : (
            <p className="mt-8 border-y border-stone-300 py-10 text-sm text-stone-600 dark:border-white/10 dark:text-stone-300">Cette boutique n’a pas encore de monture publiée dans le catalogue.</p>
          )}
        </section>

        <aside className="h-fit border border-stone-300 bg-[#faf8f3] p-6 dark:border-stone-700 dark:bg-[#211e19]">
          <div className="mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[#eee7dc]">
            <Image src={store.logo} alt={`Logo de ${store.name}`} width={64} height={64} unoptimized className="h-full w-full object-cover" />
          </div>
          <h2 className="font-serif text-2xl">{store.name}</h2>
          <p className="mt-4 flex gap-2 text-sm leading-6 text-stone-600 dark:text-stone-300"><MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />{store.address || [store.district, store.city].filter(Boolean).join(", ")}</p>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300"><span className="font-semibold text-stone-900 dark:text-[#f5f0e7]">Horaires</span><br />{store.hours}</p>
          {store.phone && <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-accent"><Phone aria-hidden="true" className="h-4 w-4" />{store.phone}</a>}
        </aside>
      </div>
    </main>
  );
}
