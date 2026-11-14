"use client";
import React, { useEffect, useMemo, useState } from "react";
import Band from "../Site/SiteBand";
import { Star, ChevronRight, Sparkles, Calendar, MapPin, BadgeCheck, Megaphone } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types minimaux (compatibles avec MOCK_PRODUCTS / MOCK_STORES)       */
/* ------------------------------------------------------------------ */
export type HomeProduct = {
  id: string; nom: string; marque: string; categorie: string; prix: number; devise: string;
  rating: number; reviewsCount: number; frameShape: string; imageUrl: string;
  lensCoating: string; opticianStore: string; storeId: string; city: string;
};
export type HomeStore = {
  id: string; nom: string; ville: string; quartier: string; rating: number; reviewsCount: number;
  verified: boolean; badge: string; isOpenNow: boolean; hoursToday: string; image: string;
  availableModelsCount: number;
};

type Common = {
  themeMode: string;
  products: HomeProduct[];
  onTryOn: (p: HomeProduct) => void;
  onReserve: (p: HomeProduct) => void;
  onCatalog: () => void;
};

/* Données "métier" simulées : à remplacer par votre base (API) */
const META: Record<string, { publishedAt: string; sales: number; engagement: number; sponsored?: boolean }> = {
  p1: { publishedAt: "2026-11-10", sales: 128, engagement: 540 },
  p2: { publishedAt: "2026-11-12", sales: 96, engagement: 710, sponsored: true },
  p3: { publishedAt: "2026-10-28", sales: 61, engagement: 380 },
  p4: { publishedAt: "2026-11-13", sales: 74, engagement: 890, sponsored: true },
};
const meta = (id: string) => META[id] ?? { publishedAt: "2026-01-01", sales: 0, engagement: 0 };

/* ------------------------------------------------------------------ */
/* Briques d'interface                                                 */
/* ------------------------------------------------------------------ */
function Head({
  dark, eyebrow, title, rule, onAll, allLabel = "Voir tout",
}: { dark: boolean; eyebrow: string; title: string; rule: string; onAll?: () => void; allLabel?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
      <div>
        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-200 uppercase tracking-[0.3em] block mb-1">
          {eyebrow}
        </span>
        <h2 className={`text-3xl sm:text-4xl font-light font-display tracking-wide ${dark ? "text-white" : "text-stone-900"}`}>
          {title}
        </h2>
        <p className={`mt-2 text-xs inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
          dark ? "border-white/10 bg-white/5 text-stone-400" : "border-stone-200 bg-stone-100 text-stone-600"
        }`}>
          <span className="font-semibold uppercase tracking-wider text-[10px]">Sélection</span>
          <span className="opacity-40">•</span>
          {rule}
        </p>
      </div>
      {onAll && (
        <button
          onClick={onAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-200 hover:underline tracking-wider uppercase self-start sm:self-auto"
        >
          {allLabel} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Card({
  p, dark, onTryOn, onReserve, badge, rank, sponsored,
}: {
  p: HomeProduct; dark: boolean; onTryOn: (p: HomeProduct) => void; onReserve: (p: HomeProduct) => void;
  badge?: string; rank?: number; sponsored?: boolean;
}) {
  return (
    <article className={`group relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
      dark ? "bg-[#1A1816]/90 border-white/10" : "bg-white border-stone-200"
    }`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={p.imageUrl} alt={p.nom} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {rank && (
          <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white text-stone-900 font-black text-sm flex items-center justify-center shadow-lg">
            {rank}
          </span>
        )}
        {badge && !rank && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-200 text-stone-900 text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </span>
        )}
        {sponsored && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Megaphone className="w-3 h-3" /> Sponsorisé
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-widest text-amber-600 dark:text-amber-200">{p.marque}</span>
          <span className={`flex items-center gap-1 ${dark ? "text-stone-400" : "text-stone-500"}`}>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {p.rating} ({p.reviewsCount})
          </span>
        </div>
        <h3 className={`text-lg font-medium leading-snug ${dark ? "text-white" : "text-stone-900"}`}>{p.nom}</h3>
        <p className={`text-xs flex items-center gap-1 ${dark ? "text-stone-400" : "text-stone-500"}`}>
          <MapPin className="w-3 h-3" /> {p.opticianStore} · {p.city}
        </p>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className={`text-base font-bold ${dark ? "text-white" : "text-stone-900"}`}>
            {p.prix.toFixed(3)} <span className="text-xs font-semibold">{p.devise}</span>
          </span>
          <div className="flex gap-2">
            <button onClick={() => onTryOn(p)} title="Essayer en 3D" aria-label="Essayer en 3D"
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                dark ? "border-white/15 text-amber-200 hover:bg-white/10" : "border-stone-300 text-stone-800 hover:bg-stone-100"
              }`}>
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => onReserve(p)}
              className={`h-10 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                dark ? "bg-stone-100 text-stone-950 hover:bg-amber-100" : "bg-stone-900 text-white hover:bg-stone-800"
              }`}>
              <Calendar className="w-3.5 h-3.5" /> Réserver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{children}</div>
);

/* Bannière publicitaire plein format */
function AdBanner({
  image, kicker, title, text, cta, onClick, align = "left", position = "center", bleed = false,
}: {
  image: string; kicker: string; title: string; text: string; cta: string; onClick: () => void;
  align?: "left" | "right"; position?: string; bleed?: boolean;
}) {
  const right = align === "right";
  return (
    <div className={`relative overflow-hidden flex items-center group ${
      bleed
        ? "min-h-[440px] lg:min-h-[560px] rounded-none"
        : "min-h-[320px] sm:min-h-[380px] rounded-[32px] shadow-2xl"
    }`}>
      <img src={image} alt="" loading="lazy" style={{ objectPosition: position }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" />
      <div className={`absolute inset-0 ${
        right
          ? "bg-gradient-to-l from-black/80 via-black/45 to-transparent"
          : "bg-gradient-to-r from-black/80 via-black/45 to-transparent"
      }`} />
      <span className={`absolute top-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 border border-white/25 rounded-full px-2.5 py-1 backdrop-blur ${
        bleed ? "left-4 sm:left-8 lg:left-12 2xl:left-16" : "left-5"
      }`}>
        Publicité
      </span>
      {/* Conteneur aligné sur la grille du site (même marges que les sections) */}
      <div className={`relative z-10 w-full ${bleed ? "max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-16" : "p-8 sm:p-14"}`}>
        <div className={`max-w-xl text-white flex flex-col ${right ? "ml-auto text-right items-end" : ""}`}>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200 mb-3">{kicker}</span>
          <h3 className={`font-extrabold leading-[1.02] tracking-tight mb-4 ${bleed ? "text-4xl sm:text-6xl lg:text-7xl" : "text-3xl sm:text-5xl"}`}>{title}</h3>
          <p className="text-sm sm:text-base text-white/80 mb-6 max-w-md">{text}</p>
          <button onClick={onClick}
            className="self-start inline-flex items-center gap-2 bg-white text-stone-900 font-bold text-sm px-7 py-3.5 rounded-full shadow-xl hover:-translate-y-0.5 transition-transform">
            {cta} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const wrap = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

/* ------------------------------------------------------------------ */
/* PARTIE HAUTE : Recommandés · Nouveautés · Tendance                  */
/* ------------------------------------------------------------------ */
export function HomeSectionsTop({ themeMode, products, onTryOn, onReserve, onCatalog }: Common) {
  const dark = themeMode === "dark";

  // Recommandés : préférences + historique (ici : mieux notés, à remplacer par l'historique réel)
  const recommended = useMemo(() => [...products].sort((a, b) => b.rating - a.rating), [products]);
  // Nouveautés : publiés récemment
  const arrivals = useMemo(
    () => [...products].sort((a, b) => +new Date(meta(b.id).publishedAt) - +new Date(meta(a.id).publishedAt)),
    [products]
  );
  // Tendance : engagement + ventes récents
  const trending = useMemo(
    () => [...products].sort((a, b) =>
      (meta(b.id).engagement + meta(b.id).sales * 2) - (meta(a.id).engagement + meta(a.id).sales * 2)),
    [products]
  );

  return (
    <>
      <section className="relative">
        <AdBanner
          image="/videos/hero-poster.jpg"
          kicker="Offre de lancement"
          title="Essayez en 3D. Réservez en boutique."
          text="Trouvez la monture qui vous va vraiment, puis retirez-la chez un opticien près de chez vous. Essai virtuel offert."
          cta="Essayer maintenant"
          onClick={() => onTryOn(products[0])}
          position="50% 25%"
          bleed
        />
      </section>

      <Band dark={dark} tone="soft">
        <Head dark={dark} eyebrow="Pour vous" title="Recommandé pour vous"
          rule="Vos préférences et votre historique de navigation" onAll={onCatalog} allLabel="Tout le catalogue" />
        <Grid>
          {recommended.map((p) => <Card key={p.id} p={p} dark={dark} onTryOn={onTryOn} onReserve={onReserve} />)}
        </Grid>
      </Band>

      <Band dark={dark} tone="plain">
        <Head dark={dark} eyebrow="Fraîchement ajoutés" title="Nouveautés" rule="Produits récemment publiés" onAll={onCatalog} />
        <Grid>
          {arrivals.map((p) => <Card key={p.id} p={p} dark={dark} badge="Nouveau" onTryOn={onTryOn} onReserve={onReserve} />)}
        </Grid>
      </Band>

      <Band dark={dark} tone="soft">
        <Head dark={dark} eyebrow="Du moment" title="Montures tendance" rule="Engagement et ventes récents" onAll={onCatalog} />
        <Grid>
          {trending.map((p) => <Card key={p.id} p={p} dark={dark} badge="Tendance" onTryOn={onTryOn} onReserve={onReserve} />)}
        </Grid>
      </Band>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* PARTIE BASSE : Indépendants · Meilleures ventes · Sponsorisés       */
/* ------------------------------------------------------------------ */
export function HomeSectionsBottom({
  themeMode, products, stores, onTryOn, onReserve, onCatalog, onStore,
}: Common & { stores: HomeStore[]; onStore: (storeId: string) => void }) {
  const dark = themeMode === "dark";

  // Opticiens indépendants : exposition aléatoire des petites boutiques (mélange côté client)
  const small = useMemo(() => stores.filter((s) => s.availableModelsCount <= 60), [stores]);
  const [indep, setIndep] = useState<HomeStore[]>(small);
  useEffect(() => {
    const a = [...small];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setIndep(a);
  }, [small]);

  // Meilleures ventes : performances de vente réelles
  const best = useMemo(() => [...products].sort((a, b) => meta(b.id).sales - meta(a.id).sales), [products]);
  // Sponsorisés : placement promotionnel payant
  const sponsored = useMemo(() => products.filter((p) => meta(p.id).sponsored), [products]);

  return (
    <>
      <Band dark={dark} tone="soft">
        <Head dark={dark} eyebrow="Boutiques de quartier" title="Découvrez les opticiens indépendants"
          rule="Mise en avant aléatoire des petites boutiques" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {indep.slice(0, 3).map((s) => (
            <button key={s.id} onClick={() => onStore(s.id)}
              className="group relative text-left rounded-3xl overflow-hidden aspect-[4/3] shadow-xl">
              <img src={s.image} alt={s.nom} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-white/90 text-stone-900 text-[10px] font-bold uppercase tracking-wider">
                  {s.badge}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  s.isOpenNow ? "bg-emerald-400/90 text-stone-900" : "bg-stone-700/90 text-white"
                }`}>
                  {s.isOpenNow ? "Ouvert" : "Fermé"}
                </span>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <h3 className="text-xl font-semibold flex items-center gap-1.5">
                  {s.nom} {s.verified && <BadgeCheck className="w-4 h-4 text-amber-200" />}
                </h3>
                <p className="text-xs text-white/75 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.quartier}, {s.ville}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-300 fill-amber-300" />{s.rating} ({s.reviewsCount})</span>
                </p>
                <p className="text-[11px] mt-2 text-amber-200 font-semibold uppercase tracking-wider">
                  {s.availableModelsCount} modèles · {s.hoursToday}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Band>

      <Band dark={dark} tone="plain">
        <Head dark={dark} eyebrow="Top des ventes" title="Meilleures ventes" rule="Performances de vente réelles" onAll={onCatalog} />
        <Grid>
          {best.map((p, i) => <Card key={p.id} p={p} dark={dark} rank={i + 1} onTryOn={onTryOn} onReserve={onReserve} />)}
        </Grid>
      </Band>

      <Band dark={dark} tone="soft">
        <Head dark={dark} eyebrow="Partenaires" title="Produits sponsorisés" rule="Placement promotionnel payant" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <AdBanner
              image="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=1400"
              kicker="Verres Lumière Bleue"
              title="-20% sur vos verres écran"
              text="Protégez vos yeux au quotidien. Offre réservée aux opticiens partenaires Lunetty, jusqu'au 31 décembre."
              cta="Profiter de l'offre"
              onClick={onCatalog}
            />
          </div>
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            {sponsored.slice(0, 2).map((p) => (
              <Card key={p.id} p={p} dark={dark} sponsored onTryOn={onTryOn} onReserve={onReserve} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <AdBanner
            image="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=1800"
            kicker="Édition limitée"
            title="Or 24K & Titane brossé"
            text="Quatre pièces exclusives, numérotées, disponibles uniquement en boutique partenaire."
            cta="Découvrir la collection"
            onClick={onCatalog}
            align="right"
          />
        </div>
      </Band>
    </>
  );
}
