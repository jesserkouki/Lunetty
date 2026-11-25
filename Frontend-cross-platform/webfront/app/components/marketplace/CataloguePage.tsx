"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check, ChevronDown, ChevronRight, Circle, Diamond, Glasses, Grid2X2, Heart,
  LayoutGrid, Search, SlidersHorizontal, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FrameCard } from "./MarketplaceUI";
import PageHero from "./PageHero";
import { useMarketplaceData } from "./useMarketplaceData";
import type { Frame } from "../../data/marketplace-demo";
import { getFrameHref } from "../../lib/marketplace";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";

type Filters = {
  query: string;
  shape: string;
  style: string[];
  color: string[];
  material: string[];
  brand: string;
  store: string;
  minPrice: number;
  maxPrice: number;
  sort: string;
  sponsored: boolean;
};

const EMPTY_FILTERS: Filters = {
  query: "",
  shape: "",
  style: [],
  color: [],
  material: [],
  brand: "",
  store: "",
  minPrice: 0,
  maxPrice: 0,
  sort: "pertinence",
  sponsored: false,
};

const SORT_OPTIONS = [
  ["pertinence", "Pertinence"],
  ["nouveautes", "Nouveautés"],
  ["tendances", "Tendances"],
  ["meilleures-ventes", "Meilleures ventes"],
  ["prix-croissant", "Prix croissant"],
  ["prix-decroissant", "Prix décroissant"],
] as const;

function readFiltersFromUrl(minPrice: number, maxPrice: number): Filters {
  const params = new URLSearchParams(window.location.search);
  const price = params.get("prix")?.split(":").map(Number);
  return {
    query: params.get("q") ?? "",
    shape: params.get("forme") ?? "",
    style: params.getAll("style").flatMap((value) => value.split(",")).filter(Boolean),
    color: params.getAll("couleur").flatMap((value) => value.split(",")).filter(Boolean),
    material: params.getAll("matiere").flatMap((value) => value.split(",")).filter(Boolean),
    brand: params.get("marque") ?? "",
    store: params.get("opticien") ?? "",
    minPrice: price && Number.isFinite(price[0]) ? Math.max(minPrice, price[0]) : minPrice,
    maxPrice: price && Number.isFinite(price[1]) ? Math.min(maxPrice, price[1]) : maxPrice,
    sort: SORT_OPTIONS.some(([value]) => value === params.get("tri"))
      ? params.get("tri")!
      : "pertinence",
    sponsored: params.get("filtre") === "sponsorise",
  };
}

function filtersToSearchParams(filters: Filters, defaults: Filters) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.shape) params.set("forme", filters.shape);
  if (filters.style.length) params.set("style", filters.style.join(","));
  if (filters.color.length) params.set("couleur", filters.color.join(","));
  if (filters.material.length) params.set("matiere", filters.material.join(","));
  if (filters.brand) params.set("marque", filters.brand);
  if (filters.store) params.set("opticien", filters.store);
  if (filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice) {
    params.set("prix", `${filters.minPrice}:${filters.maxPrice}`);
  }
  if (filters.sort !== "pertinence") params.set("tri", filters.sort);
  if (filters.sponsored) params.set("filtre", "sponsorise");
  return params.toString();
}

function matches(frame: Frame, filters: Filters) {
  const search = filters.query.trim().toLocaleLowerCase("fr");
  const searchable = `${frame.name} ${frame.brand} ${frame.storeName} ${frame.city}`.toLocaleLowerCase("fr");
  if (search && !searchable.includes(search)) return false;
  if (filters.sponsored && !frame.sponsored) return false;
  if (filters.shape && !frame.faceShapes.includes(filters.shape)) return false;
  if (filters.style.length && !filters.style.includes(frame.style)) return false;
  if (filters.color.length && !filters.color.includes(frame.color)) return false;
  if (filters.material.length && !filters.material.includes(frame.material)) return false;
  if (filters.brand && frame.brand !== filters.brand) return false;
  if (filters.store && frame.storeId !== filters.store) return false;
  if (frame.price < filters.minPrice || frame.price > filters.maxPrice) return false;
  return true;
}

function sortFrames(frames: Frame[], sort: string, query: string) {
  const copy = [...frames];
  if (sort === "nouveautes") return copy.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (sort === "tendances") return copy.sort((a, b) => b.engagement - a.engagement);
  if (sort === "meilleures-ventes") return copy.sort((a, b) => (b.salesCount ?? b.engagement) - (a.salesCount ?? a.engagement));
  if (sort === "prix-croissant") return copy.sort((a, b) => a.price - b.price);
  if (sort === "prix-decroissant") return copy.sort((a, b) => b.price - a.price);
  if (sort === "pertinence" && query.trim()) {
    const needle = query.trim().toLocaleLowerCase("fr");
    return copy.sort((a, b) => {
      const score = (frame: Frame) =>
        Number(frame.name.toLocaleLowerCase("fr").includes(needle)) * 2 +
        Number(frame.brand.toLocaleLowerCase("fr").includes(needle));
      return score(b) - score(a);
    });
  }
  return copy;
}

function normalizeText(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function colorValue(name: string) {
  const key = normalizeText(name);
  if (key.includes("noir")) return "#292725";
  if (key.includes("dore") || key.includes("champagne")) return "#c9a45c";
  if (key.includes("argent")) return "#bfc5ca";
  if (key.includes("ecaille") || key.includes("havane")) return "#875a3c";
  if (key.includes("brun")) return "#684b38";
  if (key.includes("olive") || key.includes("vert")) return "#68745c";
  if (key.includes("bordeaux")) return "#803c49";
  if (key.includes("rose")) return "#c88b91";
  return "#9a8d7a";
}

function countActiveFilters(filters: Filters, defaults: Filters) {
  return Number(Boolean(filters.shape)) +
    filters.style.length + filters.color.length + filters.material.length +
    Number(Boolean(filters.brand)) + Number(Boolean(filters.store)) +
    Number(filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice) +
    Number(filters.sponsored);
}

function ShapeGlyph({ name }: { name: string }) {
  const normalized = normalizeText(name);
  if (normalized.includes("rond")) return <Circle aria-hidden="true" className="h-4 w-4" />;
  if (normalized.includes("carre") || normalized.includes("rectang")) {
    return <span aria-hidden="true" className="h-3.5 w-3.5 rounded-[3px] border-2 border-current" />;
  }
  if (normalized.includes("coeur")) return <Heart aria-hidden="true" className="h-4 w-4" />;
  if (normalized.includes("diamant")) return <Diamond aria-hidden="true" className="h-4 w-4" />;
  return <Glasses aria-hidden="true" className="h-4 w-4" />;
}

export default function CataloguePage() {
  const data = useMarketplaceData();
  return <CatalogueExperience {...data} />;
}

export function CatalogueExperience({
  frames,
  isDemo,
  notice,
  error,
  loading,
  reload,
  showIntro = true,
  showDemoNotice = true,
}: {
  frames: Frame[];
  isDemo: boolean;
  notice?: string;
  error?: string;
  loading: boolean;
  reload: () => Promise<void>;
  showIntro?: boolean;
  showDemoNotice?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const initialized = useRef(false);
  const previousUrl = useRef("");
  const searchSectionRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [quickView, setQuickView] = useState<Frame | null>(null);

  const priceBounds = useMemo(() => ({
    min: frames.length ? Math.min(...frames.map((frame) => frame.price)) : 0,
    max: frames.length ? Math.max(...frames.map((frame) => frame.price)) : 1000,
  }), [frames]);
  const defaults = useMemo<Filters>(() => ({
    ...EMPTY_FILTERS,
    minPrice: priceBounds.min,
    maxPrice: priceBounds.max,
  }), [priceBounds]);

  useEffect(() => {
    const initial = window.requestAnimationFrame(() => {
      const next = readFiltersFromUrl(priceBounds.min, priceBounds.max);
      setFilters(next);
      previousUrl.current = window.location.search;
      initialized.current = true;
    });
    const onPopState = () => {
      previousUrl.current = window.location.search;
      setFilters(readFiltersFromUrl(priceBounds.min, priceBounds.max));
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.cancelAnimationFrame(initial);
      window.removeEventListener("popstate", onPopState);
    };
  }, [priceBounds]);

  useEffect(() => {
    if (!initialized.current) return;
    const query = filtersToSearchParams(filters, defaults);
    const nextSearch = query ? `?${query}` : "";
    if (window.location.search === nextSearch) {
      previousUrl.current = nextSearch;
      return;
    }
    const previous = new URLSearchParams(previousUrl.current);
    const next = new URLSearchParams(nextSearch);
    const keys = new Set([...previous.keys(), ...next.keys()]);
    const changedKeys = [...keys].filter((key) => previous.get(key) !== next.get(key));
    const searchOnly = changedKeys.length > 0 && changedKeys.every((key) => key === "q");
    window.history[searchOnly ? "replaceState" : "pushState"](null, "", `${window.location.pathname}${nextSearch}`);
    previousUrl.current = nextSearch;
  }, [defaults, filters]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = drawerRef.current;
    const trigger = drawerTriggerRef.current;
    panel?.querySelector<HTMLElement>("button, input")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [drawerOpen]);

  const options = useMemo(() => ({
    shapes: [...new Set(frames.flatMap((frame) => frame.faceShapes))].sort(),
    styles: [...new Set(frames.map((frame) => frame.style))].sort(),
    colors: [...new Set(frames.map((frame) => frame.color).filter((value) => !value.includes("découvrir")))].sort(),
    materials: [...new Set(frames.map((frame) => frame.material).filter((value) => !value.includes("découvrir")))].sort(),
    brands: [...new Set(frames.map((frame) => frame.brand))].sort(),
    stores: [...new Map(frames.map((frame) => [frame.storeId, frame.storeName])).entries()],
  }), [frames]);
  const visibleFrames = useMemo(
    () => sortFrames(frames.filter((frame) => matches(frame, filters)), filters.sort, filters.query),
    [filters, frames],
  );
  const visibleSuggestions = useMemo(() => {
    const query = normalizeText(filters.query.trim());
    if (!query) return [];
    const candidates = [
      ...frames.flatMap((frame) => [
        { label: frame.name, type: "Monture" },
        { label: frame.brand, type: "Marque" },
        { label: frame.storeName, type: "Opticien" },
      ]),
    ];
    const unique = new Map<string, { label: string; type: string }>();
    for (const item of candidates) {
      if (normalizeText(item.label).includes(query)) unique.set(`${item.type}:${item.label}`, item);
    }
    return [...unique.values()].slice(0, 5);
  }, [filters.query, frames]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setVisibleCount(8);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const toggleMulti = (key: "style" | "color" | "material", value: string) => {
    setFilter(key, filters[key].includes(value)
      ? filters[key].filter((item) => item !== value)
      : [...filters[key], value]);
  };
  const clearFilters = () => {
    setFilters(defaults);
    setVisibleCount(8);
  };
  const selectSuggestion = (value: string) => {
    setFilter("query", value);
    setSuggestionsOpen(false);
  };
  const selectedSort = SORT_OPTIONS.find(([value]) => value === filters.sort)?.[1] ?? "Pertinence";
  const activeCount = countActiveFilters(filters, defaults);
  const Root = showIntro ? "main" : "div";
  return (
    <Root id={showIntro ? "contenu" : undefined} className={`min-h-screen bg-lunetty-cream px-4 pb-20 text-lunetty-ink sm:px-8 lg:px-12 ${showIntro ? "pt-28" : "pt-10"}`}>
      <div className="mx-auto max-w-[1600px]">
        {showIntro && (
          <PageHero
            image="/images/catalogue/boutique-hero-v2.jpg"
            alt="Une cliente découvre son style dans une boutique Lunetty"
            surtitre="La sélection Lunetty"
            titre="Toutes les montures"
            sousTitre="Explorez les créations de nos opticiens partenaires et trouvez la monture qui vous ressemble."
            imagePosition={{ mobile: "55% 25%", desktop: "center 35%" }}
            layout="contained"
            imageSizes="(min-width: 1728px) 1664px, calc(100vw - 32px)"
            zoomStart={1.03}
            parallax={false}
            badge={showDemoNotice && isDemo && process.env.NODE_ENV !== "production" ? "Démo" : undefined}
            actions={[
              {
                label: "Explorer la sélection",
                onClick: () => searchSectionRef.current?.scrollIntoView({
                  behavior: reducedMotion ? "auto" : "smooth",
                  block: "center",
                }),
              },
              { label: "Conseil personnalisé", href: "/conseiller", variant: "secondary" },
            ]}
          />
        )}

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lunetty-danger/30 bg-lunetty-danger/5 px-4 py-3 text-sm text-lunetty-danger">
            <span>{error}</span>
            <button type="button" onClick={() => void reload()} className="inline-flex min-h-11 items-center rounded-full border border-current/30 px-4 font-semibold">Réessayer</button>
          </div>
        )}
        {showDemoNotice && notice && !error && (
          <p role="status" className="mb-5 inline-flex rounded-full border border-lunetty-line bg-lunetty-surface px-3 py-1.5 text-sm text-lunetty-muted">{notice}</p>
        )}

        <div id={showIntro ? "catalogue-search" : undefined} ref={searchSectionRef} className="relative z-40 mb-4 scroll-mt-32">
          <label className="relative block">
            <span className="sr-only">Rechercher par nom, marque ou opticien</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-lunetty-gold-strong" />
            <input
              ref={searchRef}
              value={filters.query}
              onChange={(event) => {
                setFilter("query", event.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestionsOpen(false);
                if (event.key === "Enter" && visibleSuggestions[0]) selectSuggestion(visibleSuggestions[0].label);
              }}
              placeholder="Nom, marque ou opticien"
              role="combobox"
              aria-expanded={suggestionsOpen && visibleSuggestions.length > 0}
              aria-controls="catalog-search-suggestions"
              className="min-h-14 w-full rounded-2xl border border-lunetty-line bg-lunetty-surface/75 py-3 pl-14 pr-24 text-base text-lunetty-ink shadow-[0_12px_35px_rgba(26,23,19,0.06)] outline-none backdrop-blur-xl placeholder:text-lunetty-muted focus:border-lunetty-gold focus:ring-2 focus:ring-lunetty-gold/20"
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-lunetty-line px-2 py-1 text-xs text-lunetty-muted sm:inline-flex">
              <span className="text-base leading-none">/</span>
            </span>
            {filters.query && (
              <button type="button" aria-label="Effacer la recherche" onMouseDown={(event) => event.preventDefault()} onClick={() => { setFilter("query", ""); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-lunetty-muted hover:bg-lunetty-cream">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </label>
          {suggestionsOpen && visibleSuggestions.length > 0 && (
            <div id="catalog-search-suggestions" role="listbox" aria-label="Suggestions" className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-lunetty-line bg-lunetty-surface p-2 shadow-xl">
              {visibleSuggestions.map((suggestion) => (
                <button key={`${suggestion.type}-${suggestion.label}`} type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(suggestion.label)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-lunetty-cream">
                  <span>{suggestion.label}</span><span className="text-xs text-lunetty-muted">{suggestion.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sticky top-20 z-30 -mx-4 mb-5 border-y border-lunetty-line bg-lunetty-cream/95 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
            <div className="flex shrink-0 items-center gap-1.5 pr-2">
              {options.shapes.map((shape) => (
                <button
                  key={shape}
                  type="button"
                  aria-label={`Forme du visage : ${shape}`}
                  aria-pressed={filters.shape === shape}
                  onClick={() => setFilter("shape", filters.shape === shape ? "" : shape)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition ${filters.shape === shape ? "border-lunetty-gold bg-lunetty-gold/15 text-lunetty-gold-strong" : "border-lunetty-line bg-lunetty-surface text-lunetty-muted hover:border-lunetty-gold/50"}`}
                >
                  <ShapeGlyph name={shape} />{shape}
                </button>
              ))}
            </div>
            <MultiFilterPopover
              label="Style"
              values={options.styles}
              selected={filters.style}
              onToggle={(value) => toggleMulti("style", value)}
            />
            <ColorQuickFilter
              values={options.colors}
              selected={filters.color}
              onToggle={(value) => toggleMulti("color", value)}
            />
            <MultiFilterPopover
              label="Matière"
              values={options.materials}
              selected={filters.material}
              onToggle={(value) => toggleMulti("material", value)}
            />
            <PricePopover
              min={priceBounds.min}
              max={priceBounds.max}
              minValue={filters.minPrice}
              maxValue={filters.maxPrice}
              active={filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice}
              onChange={(minPrice, maxPrice) => setFilters((current) => ({ ...current, minPrice, maxPrice }))}
            />
            <button
              ref={drawerTriggerRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lunetty-ink px-4 text-sm font-semibold text-lunetty-cream transition hover:bg-lunetty-gold-strong"
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Tous les filtres{activeCount ? ` (${activeCount})` : ""}
            </button>
          </div>
        </div>

        <ActiveFilters filters={filters} defaults={defaults} options={options} onRemove={(key, value) => {
          if (key === "style" || key === "color" || key === "material") {
            toggleMulti(key, value);
          } else if (key === "price") {
            setFilters((current) => ({ ...current, minPrice: defaults.minPrice, maxPrice: defaults.maxPrice }));
          } else if (key === "sponsored") {
            setFilter("sponsored", false);
          } else {
            setFilter(key, "" as never);
          }
        }} onClear={clearFilters} />

        <section aria-label="Résultats du catalogue" className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-lunetty-line pb-4">
          <p aria-live="polite" aria-atomic="true" className="text-base font-semibold text-lunetty-ink">
            {loading ? "Recherche des montures…" : `${visibleFrames.length} monture${visibleFrames.length === 1 ? "" : "s"}`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button type="button" aria-haspopup="listbox" aria-expanded={sortOpen} onClick={() => setSortOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-surface px-4 text-sm font-semibold">
                Trier : {selectedSort}<ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              {sortOpen && (
                <div role="listbox" aria-label="Trier les montures" className="absolute right-0 top-full z-30 mt-2 min-w-56 rounded-2xl border border-lunetty-line bg-lunetty-surface p-2 shadow-xl">
                  {SORT_OPTIONS.map(([value, label]) => (
                    <button key={value} type="button" role="option" aria-selected={filters.sort === value} onClick={() => { setFilter("sort", value); setSortOpen(false); }} className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm ${filters.sort === value ? "bg-lunetty-cream text-lunetty-ink" : "text-lunetty-muted hover:bg-lunetty-cream"}`}>
                      {label}{filters.sort === value && <Check aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div role="group" aria-label="Affichage des montures" className="hidden items-center rounded-full border border-lunetty-line bg-lunetty-surface p-1 sm:flex">
              <button type="button" aria-label="Grille large" aria-pressed={!compact} onClick={() => setCompact(false)} className={`grid h-9 w-9 place-items-center rounded-full ${!compact ? "bg-lunetty-ink text-lunetty-cream" : "text-lunetty-muted"}`}><LayoutGrid aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" aria-label="Grille compacte" aria-pressed={compact} onClick={() => setCompact(true)} className={`grid h-9 w-9 place-items-center rounded-full ${compact ? "bg-lunetty-ink text-lunetty-cream" : "text-lunetty-muted"}`}><Grid2X2 aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`grid gap-5 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"}`} aria-label="Chargement des montures" role="status">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[0.73] animate-pulse rounded-[1.35rem] bg-lunetty-surface shadow-sm" />)}
            </motion.div>
          ) : visibleFrames.length ? (
            <motion.div key={`${filters.query}-${filters.shape}-${filters.style.join()}-${filters.color.join()}-${filters.material.join()}-${filters.brand}-${filters.store}-${filters.minPrice}-${filters.maxPrice}-${filters.sponsored}-${filters.sort}-${compact}`} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }} className={`grid items-stretch gap-x-4 gap-y-7 sm:gap-x-5 sm:gap-y-9 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"}`}>
              {visibleFrames.slice(0, visibleCount).map((frame, index) => (
                <motion.div key={frame.id} initial={reducedMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.32, delay: reducedMotion ? 0 : Math.min(index, 7) * 0.035 }} className="group relative min-w-0">
                  <FrameCard frame={frame} badge={frame.sponsored ? "Sponsorisé" : undefined} />
                  <button type="button" onClick={() => setQuickView(frame)} className="absolute left-3 top-3 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-black/55 px-3 text-sm font-semibold text-white opacity-100 backdrop-blur transition hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    Aperçu rapide<ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.section key="empty" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-lunetty-line bg-lunetty-surface/60 px-6 py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-lunetty-gold/15 text-lunetty-gold-strong"><Glasses aria-hidden="true" className="h-8 w-8" /></span>
              <h2 className="mt-5 text-2xl font-bold">Aucune monture ne correspond à ces filtres.</h2>
              <p className="mt-2 max-w-md text-base text-lunetty-muted">Essayez de retirer un filtre pour découvrir d’autres modèles.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filters.query && <button type="button" onClick={() => setFilter("query", "")} className="min-h-11 rounded-full border border-lunetty-line px-4 text-sm font-semibold">Effacer la recherche</button>}
                {filters.shape && <button type="button" onClick={() => setFilter("shape", "")} className="min-h-11 rounded-full border border-lunetty-line px-4 text-sm font-semibold">Retirer la forme</button>}
                {(filters.style.length > 0 || filters.color.length > 0 || filters.material.length > 0 || activeCount > 0) && <button type="button" onClick={clearFilters} className="min-h-11 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream">Tout effacer</button>}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {!loading && visibleFrames.length > visibleCount && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 8)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-surface px-6 text-sm font-semibold transition hover:border-lunetty-gold">
              Voir {Math.min(8, visibleFrames.length - visibleCount)} montures de plus<ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }}>
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-filter-title"
              initial={reducedMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reducedMotion ? undefined : { x: "100%" }}
              transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 flex h-[min(94dvh,900px)] flex-col rounded-t-[1.75rem] bg-lunetty-surface shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[min(540px,94vw)] sm:rounded-none sm:rounded-l-[1.75rem]"
            >
              <header className="flex items-center justify-between border-b border-lunetty-line px-5 py-5 sm:px-7">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-lunetty-gold-strong">Personnalisez votre sélection</p>
                  <h2 id="catalog-filter-title" className="mt-1 text-2xl font-bold">Tous les filtres</h2>
                </div>
                <button type="button" aria-label="Fermer les filtres" onClick={() => setDrawerOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-lunetty-cream"><X aria-hidden="true" className="h-5 w-5" /></button>
              </header>
              <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
                <FilterSection title="Forme du visage">
                  <div className="flex flex-wrap gap-2">
                    {options.shapes.map((shape) => <button key={shape} type="button" aria-pressed={filters.shape === shape} onClick={() => setFilter("shape", filters.shape === shape ? "" : shape)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${filters.shape === shape ? "border-lunetty-gold bg-lunetty-gold/15 text-lunetty-gold-strong" : "border-lunetty-line"}`}><ShapeGlyph name={shape} />{shape}</button>)}
                  </div>
                </FilterSection>
                <FilterSection title="Style">
                  <ChoiceList values={options.styles} selected={filters.style} onToggle={(value) => toggleMulti("style", value)} />
                </FilterSection>
                <FilterSection title="Couleur">
                  <ChoiceList values={options.colors} selected={filters.color} onToggle={(value) => toggleMulti("color", value)} swatches />
                </FilterSection>
                <FilterSection title="Matière">
                  <ChoiceList values={options.materials} selected={filters.material} onToggle={(value) => toggleMulti("material", value)} />
                </FilterSection>
                <FilterSection title="Marque">
                  <SearchableChoices label="Rechercher une marque" query={brandSearch} onQuery={setBrandSearch} options={options.brands} value={filters.brand} onSelect={(value) => setFilter("brand", value)} />
                </FilterSection>
                <FilterSection title="Opticien">
                  <SearchableChoices label="Rechercher un opticien" query={storeSearch} onQuery={setStoreSearch} options={options.stores.map(([id, name]) => ({ value: id, label: name }))} value={filters.store} onSelect={(value) => setFilter("store", value)} />
                </FilterSection>
                <FilterSection title="Budget">
                  <PriceRange min={priceBounds.min} max={priceBounds.max} minValue={filters.minPrice} maxValue={filters.maxPrice} onChange={(minPrice, maxPrice) => setFilters((current) => ({ ...current, minPrice, maxPrice }))} />
                </FilterSection>
                <button type="button" role="switch" aria-checked={filters.sponsored} onClick={() => setFilter("sponsored", !filters.sponsored)} className="flex min-h-14 w-full items-center justify-between gap-4 border-t border-lunetty-line pt-4 text-left text-base font-semibold">
                  <span>Sélection partenaire</span><SwitchThumb checked={filters.sponsored} />
                </button>
              </div>
              <footer className="sticky bottom-0 flex items-center gap-3 border-t border-lunetty-line bg-lunetty-surface/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-7">
                <button type="button" onClick={clearFilters} className="inline-flex min-h-12 shrink-0 items-center rounded-full border border-lunetty-line px-5 text-sm font-semibold">Effacer</button>
                <button type="button" onClick={() => setDrawerOpen(false)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream">
                  Voir {visibleFrames.length} monture{visibleFrames.length === 1 ? "" : "s"}
                </button>
              </footer>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickView && <QuickViewModal frame={quickView} onClose={() => setQuickView(null)} />}
      </AnimatePresence>
    </Root>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      {children}
    </section>
  );
}

function SwitchThumb({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-lunetty-gold" : "bg-stone-300 dark:bg-stone-600"}`}>
      <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </span>
  );
}

function ColorQuickFilter({
  values,
  selected,
  onToggle,
}: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div role="group" aria-label="Filtrer par couleur" className="flex shrink-0 items-center gap-1.5 rounded-full border border-lunetty-line bg-lunetty-surface px-2">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            title={value}
            aria-label={`Couleur ${value}`}
            aria-pressed={active}
            onClick={() => onToggle(value)}
            className={`grid h-10 w-10 place-items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunetty-gold-strong ${active ? "ring-2 ring-lunetty-gold ring-offset-2 ring-offset-lunetty-surface" : ""}`}
          >
            <span aria-hidden="true" className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: colorValue(value) }} />
          </button>
        );
      })}
    </div>
  );
}

function ChoiceList({
  values,
  selected,
  onToggle,
  swatches = false,
}: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  swatches?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <button key={value} type="button" aria-pressed={active} onClick={() => onToggle(value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition ${active ? "border-lunetty-gold bg-lunetty-gold/15 text-lunetty-gold-strong" : "border-lunetty-line hover:border-lunetty-gold/50"}`}>
            {swatches && <span aria-hidden="true" className={`h-4 w-4 rounded-full border ${active ? "border-lunetty-gold" : "border-black/10"}`} style={{ backgroundColor: colorValue(value) }} />}
            {value}
            {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

function MultiFilterPopover({
  label,
  values,
  selected,
  onToggle,
  swatches = false,
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  swatches?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${selected.length ? "border-lunetty-gold bg-lunetty-gold/10 text-lunetty-gold-strong" : "border-lunetty-line bg-lunetty-surface text-lunetty-muted"}`}>
        {label}{selected.length ? ` · ${selected.length}` : ""}<ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 max-h-72 min-w-52 overflow-y-auto rounded-2xl border border-lunetty-line bg-lunetty-surface p-2 shadow-xl">
          {values.map((value) => {
            const active = selected.includes(value);
            return (
              <button key={value} type="button" aria-pressed={active} onClick={() => onToggle(value)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm hover:bg-lunetty-cream">
                {swatches && <span aria-hidden="true" className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: colorValue(value) }} />}
                <span className="flex-1">{value}</span>{active && <Check aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />}
              </button>
            );
          })}
          {!values.length && <p className="px-3 py-2 text-sm text-lunetty-muted">Aucune option disponible.</p>}
        </div>
      )}
    </div>
  );
}

function PriceRange({
  min,
  max,
  minValue,
  maxValue,
  onChange,
}: {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
}) {
  const step = Math.max(1, Math.ceil((max - min) / 100));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{minValue} DT</span><span className="text-lunetty-muted">—</span><span>{maxValue} DT</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-lunetty-muted">Prix minimum
          <input type="range" min={min} max={maxValue} step={step} value={minValue} onChange={(event) => onChange(Math.min(Number(event.target.value), maxValue), maxValue)} className="mt-2 block min-h-11 w-full accent-[var(--lunetty-gold)]" />
        </label>
        <label className="text-sm text-lunetty-muted">Prix maximum
          <input type="range" min={minValue} max={max} step={step} value={maxValue} onChange={(event) => onChange(minValue, Math.max(Number(event.target.value), minValue))} className="mt-2 block min-h-11 w-full accent-[var(--lunetty-gold)]" />
        </label>
      </div>
    </div>
  );
}

function PricePopover({
  min,
  max,
  minValue,
  maxValue,
  active,
  onChange,
}: {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  active: boolean;
  onChange: (minValue: number, maxValue: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${active ? "border-lunetty-gold bg-lunetty-gold/10 text-lunetty-gold-strong" : "border-lunetty-line bg-lunetty-surface text-lunetty-muted"}`}>
        Budget{active ? ` · ${minValue}–${maxValue}` : ""}<ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && <div className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-lunetty-line bg-lunetty-surface p-4 shadow-xl"><PriceRange min={min} max={max} minValue={minValue} maxValue={maxValue} onChange={onChange} /></div>}
    </div>
  );
}

function SearchableChoices({
  label,
  query,
  onQuery,
  options,
  value,
  onSelect,
}: {
  label: string;
  query: string;
  onQuery: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const normalizedOptions = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  const filtered = normalizedOptions.filter((option) => normalizeText(option.label).includes(normalizeText(query)));
  return (
    <div>
      <label className="relative block">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lunetty-muted" />
        <input aria-label={label} value={query} onChange={(event) => onQuery(event.target.value)} placeholder={label} className="min-h-11 w-full rounded-xl border border-lunetty-line bg-lunetty-cream pl-10 pr-3 text-sm outline-none focus:border-lunetty-gold" />
      </label>
      <div className="mt-2 max-h-40 overflow-y-auto">
        <button type="button" aria-pressed={!value} onClick={() => onSelect("")} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm hover:bg-lunetty-cream">Tous{!value && <Check aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />}</button>
        {filtered.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onSelect(option.value)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm hover:bg-lunetty-cream">{option.label}{value === option.value && <Check aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />}</button>)}
      </div>
    </div>
  );
}

function ActiveFilters({
  filters,
  defaults,
  options,
  onRemove,
  onClear,
}: {
  filters: Filters;
  defaults: Filters;
  options: { stores: [string, string][] };
  onRemove: (key: keyof Filters | "price", value: string) => void;
  onClear: () => void;
}) {
  const chips: { key: keyof Filters | "price"; value: string; label: string }[] = [];
  if (filters.query) chips.push({ key: "query", value: filters.query, label: `Recherche : ${filters.query}` });
  if (filters.shape) chips.push({ key: "shape", value: filters.shape, label: filters.shape });
  for (const value of filters.style) chips.push({ key: "style", value, label: value });
  for (const value of filters.color) chips.push({ key: "color", value, label: value });
  for (const value of filters.material) chips.push({ key: "material", value, label: value });
  if (filters.brand) chips.push({ key: "brand", value: filters.brand, label: filters.brand });
  if (filters.store) chips.push({ key: "store", value: filters.store, label: options.stores.find(([id]) => id === filters.store)?.[1] ?? filters.store });
  if (filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice) chips.push({ key: "price", value: "price", label: `${filters.minPrice}–${filters.maxPrice} DT` });
  if (filters.sponsored) chips.push({ key: "sponsored", value: "sponsored", label: "Sélection partenaire" });
  if (!chips.length) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => <button key={`${chip.key}-${chip.value}`} type="button" onClick={() => onRemove(chip.key, chip.value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-gold/40 bg-lunetty-gold/10 px-3.5 text-sm font-semibold text-lunetty-ink hover:bg-lunetty-gold/20">{chip.label}<X aria-hidden="true" className="h-3.5 w-3.5" /></button>)}
      <button type="button" onClick={onClear} className="inline-flex min-h-11 items-center rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-muted hover:text-lunetty-ink">Tout effacer</button>
    </div>
  );
}

function QuickViewModal({ frame, onClose }: { frame: Frame; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="quick-view-title" tabIndex={-1} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative grid max-h-[92dvh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-t-[1.75rem] bg-lunetty-surface shadow-2xl outline-none sm:grid-cols-2 sm:rounded-[1.75rem]">
        <button type="button" aria-label="Fermer l’aperçu" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-lunetty-line bg-lunetty-surface/90"><X aria-hidden="true" className="h-5 w-5" /></button>
        <div className="relative min-h-64 bg-[radial-gradient(ellipse_at_50%_40%,rgba(201,164,92,.25),transparent_55%),linear-gradient(145deg,#34312d,#11100f)] sm:min-h-[420px]">
          <Image src={frame.image || "/images/frame-placeholder.svg"} alt={frame.imageAlt} fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-contain p-8 sm:p-12" />
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-lunetty-gold-strong">{frame.brand}</p>
          <h2 id="quick-view-title" className="mt-2 text-3xl font-bold">{frame.name}</h2>
          <p className="mt-2 text-xl font-semibold">{new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 }).format(frame.price)} DT</p>
          <p className="mt-4 text-sm leading-6 text-lunetty-muted">{frame.description}</p>
          <p className="mt-4 text-sm text-lunetty-muted">Proposée par <span className="font-semibold text-lunetty-ink">{frame.storeName}</span></p>
          {frame.colorOptions && frame.colorOptions.length > 1 && <div className="mt-5"><p className="mb-2 text-sm font-semibold">Coloris disponibles</p><div className="flex flex-wrap gap-2">{frame.colorOptions.map((option) => <span key={option.name} title={option.name} className="h-7 w-7 rounded-full border-2 border-lunetty-surface outline outline-1 outline-lunetty-line" style={{ backgroundColor: option.swatch }} />)}</div></div>}
          <Link href={getFrameHref(frame)} onClick={onClose} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream">
            Voir la fiche complète<ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
