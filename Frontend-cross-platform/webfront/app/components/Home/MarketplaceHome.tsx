"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DEMO_FRAMES, DEMO_STORES } from "../../data/marketplace-demo";
import type { OpticianStore } from "../../data/marketplace-demo";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";
import { FrameCarousel, SectionHeading, StoreCarousel } from "../marketplace/MarketplaceUI";
import OpticiansSection from "../marketplace/OpticiansSection";
import { useMarketplaceData } from "../marketplace/useMarketplaceData";

const VIEWED_FRAMES_KEY = "lunetty:viewed-frames";

function getViewedFramesSnapshot() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(VIEWED_FRAMES_KEY) ?? "[]");
    return JSON.stringify(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return "[]";
  }
}

function subscribeToViewedFrames(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("lunetty:viewed-frames-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("lunetty:viewed-frames-changed", onChange);
  };
}

function parseViewedFrames(snapshot: string): string[] {
  const value: unknown = JSON.parse(snapshot);
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function RevealSection({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      id={id}
      className={`px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-[1600px]">{children}</div>
    </motion.section>
  );
}

export default function MarketplaceHome() {
  const { frames, stores, isDemo, notice, loading, error } = useMarketplaceData();
  const { status } = useAuth();
  const historySnapshot = useSyncExternalStore(
    subscribeToViewedFrames,
    getViewedFramesSnapshot,
    () => "[]",
  );
  const history = useMemo(() => parseViewedFrames(historySnapshot), [historySnapshot]);
  const [independentStores, setIndependentStores] = useState<OpticianStore[]>([]);

  useEffect(() => {
    const independent = stores.filter((store) => store.independent);
    const frame = window.requestAnimationFrame(() => {
      setIndependentStores(shuffle(independent.length ? independent : DEMO_STORES));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stores]);

  const engagementFrames = useMemo(
    () => frames.some((frame) => frame.engagement > 0) ? frames : DEMO_FRAMES,
    [frames],
  );
  const trending = useMemo(
    () => [...engagementFrames].sort((a, b) => b.engagement - a.engagement),
    [engagementFrames],
  );
  const lastViewed = history.length ? frames.find((frame) => frame.id === history[0] || frame.productId === history[0]) : undefined;
  const recommended = status === "authenticated" && lastViewed
    ? frames
        .filter((frame) => frame.id !== lastViewed.id)
        .sort((a, b) =>
          Number(b.brand === lastViewed.brand || b.shape === lastViewed.shape) -
          Number(a.brand === lastViewed.brand || a.shape === lastViewed.shape),
        )
    : trending;

  const arrivals = useMemo(
    () => [...frames].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    [frames],
  );
  const hasSalesMetrics = frames.some((frame) => typeof frame.salesCount === "number");
  const bestSellers = useMemo(
    () => [...(hasSalesMetrics ? frames : DEMO_FRAMES)].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)),
    [frames, hasSalesMetrics],
  );
  const sponsoredFrames = frames.some((frame) => frame.sponsored)
    ? frames.filter((frame) => frame.sponsored)
    : DEMO_FRAMES.filter((frame) => frame.sponsored);
  const hasRealEngagement = frames.some((frame) => frame.engagement > 0);

  return (
    <>
      {(notice || !hasRealEngagement || !hasSalesMetrics) && (
        <div className="border-y border-stone-200 bg-[#eee7dc] px-5 py-3 text-center text-sm text-stone-700 dark:border-white/10 dark:bg-[#25221d] dark:text-stone-200">
          {notice ?? "Les tendances et ventes sont présentées à titre de démonstration tant que ces indicateurs ne sont pas fournis par l’API."}
          {isDemo && <span className="ml-1 font-semibold">Données de démonstration.</span>}
        </div>
      )}

      <RevealSection id="selection" className="bg-[#f5f0e7] dark:bg-[#181613]">
        <SectionHeading
          kicker="Votre sélection"
          title="Choisies pour vous"
          description={status === "authenticated" && lastViewed
            ? "Des montures rapprochées de vos dernières découvertes."
            : "Une sélection tendance pour découvrir nos montures."}
          href="/lunettes?tri=pertinence"
        />
        <FrameCarousel frames={recommended} />
      </RevealSection>

      <RevealSection className="border-y border-stone-200/70 bg-[#eee7dc] dark:border-white/10 dark:bg-[#211e19]">
        <SectionHeading
          kicker="À peine arrivées"
          title="Nouveautés"
          description="Les montures récemment publiées par nos opticiens partenaires."
          href="/lunettes?tri=nouveautes"
        />
        <FrameCarousel frames={arrivals} badge="Nouveau" />
      </RevealSection>

      <RevealSection className="bg-[#f5f0e7] dark:bg-[#181613]">
        <SectionHeading
          kicker="Le regard du moment"
          title="Montures tendance"
          description="Les modèles qui retiennent l’attention cette saison."
          href="/lunettes?tri=tendances"
        />
        <FrameCarousel frames={trending} badge="Tendance" />
      </RevealSection>

      <RevealSection className="border-y border-stone-200/70 bg-[#eee7dc] dark:border-white/10 dark:bg-[#211e19]">
        <OpticiansSection
          stores={stores}
          frames={frames}
          loading={loading}
          isDemo={isDemo}
          error={error}
        />
      </RevealSection>

      <RevealSection className="bg-[#f5f0e7] dark:bg-[#181613]">
        <SectionHeading
          kicker="Plébiscitées"
          title="Les plus vendues"
          description={hasSalesMetrics ? "Les montures en tête des ventes disponibles." : "Sélection de démonstration : les ventes ne sont pas encore exposées par l’API."}
          href="/lunettes?tri=meilleures-ventes"
        />
        <FrameCarousel frames={bestSellers} badge="Best-seller" />
      </RevealSection>

      <RevealSection className="border-y border-stone-200/70 bg-[#eee7dc] dark:border-white/10 dark:bg-[#211e19]">
        <SectionHeading
          kicker="Adresses singulières"
          title="Découvrez les opticiens indépendants"
          description="Des maisons de proximité, sélectionnées pour leur regard et leur savoir-faire."
          href="/opticiens?type=independant"
        />
        <StoreCarousel stores={independentStores} />
      </RevealSection>

      <RevealSection className="bg-[#f5f0e7] dark:bg-[#181613]">
        <SectionHeading
          kicker="La sélection partenaire"
          title="Sélection partenaire"
          description="Des mises en avant promotionnelles clairement identifiées."
          href="/lunettes?filtre=sponsorise"
        />
        <FrameCarousel frames={sponsoredFrames} badge="Sponsorisé" />
      </RevealSection>

      <RevealSection className="bg-[#f5f0e7] dark:bg-[#181613]">
        <Link
          href="/opticiens"
          aria-label="Découvrir les opticiens partenaires Lunetty"
          className="group block overflow-hidden rounded-[1.75rem] border border-stone-200 shadow-[0_18px_50px_rgba(54,41,26,0.12)] transition-shadow hover:shadow-[0_24px_60px_rgba(54,41,26,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent dark:border-white/10"
        >
          <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[16/8]">
            <Image
              src="/images/lunetty-optician-campaign.jpg"
              alt="Un opticien aide une cliente à essayer ses lunettes dans une boutique Lunetty."
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1600px"
              className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
            />
            <span className="absolute left-4 top-4 rounded-full border border-stone-900/10 bg-[#f9f6f0]/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-900 shadow-sm backdrop-blur sm:left-6 sm:top-6">
              Publicité
            </span>
          </div>
          <div className="flex flex-col gap-4 bg-[#eee7dc] px-5 py-5 dark:bg-[#211e19] sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Lunetty · Conseil en boutique</p>
              <p className="mt-1 font-serif text-2xl italic text-stone-900 dark:text-[#f5f0e7]">
                Une monture bien choisie, accompagnée par un opticien.
              </p>
            </div>
            <span className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-semibold text-[#f5f0e7] transition-colors group-hover:bg-[#806334] dark:bg-[#e1c795] dark:text-stone-950 dark:group-hover:bg-[#f1dcb3]">
              Découvrir les boutiques
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </RevealSection>

      <section className="bg-stone-950 px-5 py-16 text-[#f5f0e7] dark:bg-[#0e0d0c] sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Conseil IA
            </p>
            <h2 className="max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">Trouvez la monture qui vous ressemble.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">Un conseil personnalisé pour explorer les formes, les styles et les opticiens partenaires.</p>
          </div>
          <Link href="/conseiller" className="inline-flex min-h-12 items-center justify-center border border-[#d3bd93] px-6 text-sm font-semibold text-[#f5f0e7] transition hover:bg-[#f5f0e7] hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">
            Parler au conseiller <span className="ml-3" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
