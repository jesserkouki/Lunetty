"use client";

import { useEffect, useMemo, useState } from "react";
import { FrameCard } from "./MarketplaceUI";
import { useMarketplaceData } from "./useMarketplaceData";
import type { Frame } from "../../data/marketplace-demo";

type Filters = {
  query: string;
  shape: string;
  style: string;
  color: string;
  material: string;
  brand: string;
  store: string;
  price: string;
  sort: string;
  sponsored: boolean;
};

const EMPTY_FILTERS: Filters = {
  query: "",
  shape: "",
  style: "",
  color: "",
  material: "",
  brand: "",
  store: "",
  price: "",
  sort: "pertinence",
  sponsored: false,
};

function matches(frame: Frame, filters: Filters) {
  const search = filters.query.trim().toLocaleLowerCase("fr");
  const searchable = `${frame.name} ${frame.brand} ${frame.storeName} ${frame.city}`.toLocaleLowerCase("fr");
  if (search && !searchable.includes(search)) return false;
  if (filters.sponsored && !frame.sponsored) return false;
  if (filters.shape && !frame.faceShapes.includes(filters.shape)) return false;
  if (filters.style && frame.style !== filters.style) return false;
  if (filters.color && frame.color !== filters.color) return false;
  if (filters.material && frame.material !== filters.material) return false;
  if (filters.brand && frame.brand !== filters.brand) return false;
  if (filters.store && frame.storeId !== filters.store) return false;
  if (filters.price) {
    const [min, max] = filters.price.split(":").map(Number);
    if (frame.price < min || frame.price > max) return false;
  }
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

export default function CataloguePage() {
  const { frames, isDemo, notice } = useMarketplaceData();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        query: params.get("q") ?? "",
        shape: params.get("forme") ?? "",
        style: params.get("style") ?? "",
        color: params.get("couleur") ?? "",
        material: params.get("matiere") ?? "",
        brand: params.get("marque") ?? "",
        store: params.get("opticien") ?? "",
        price: params.get("prix") ?? "",
        sort: params.get("tri") ?? "pertinence",
        sponsored: params.get("filtre") === "sponsorise",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const options = useMemo(() => ({
    shapes: [...new Set(frames.flatMap((frame) => frame.faceShapes))].sort(),
    styles: [...new Set(frames.map((frame) => frame.style))].sort(),
    colors: [...new Set(frames.map((frame) => frame.color).filter((value) => value !== "Coloris à découvrir"))].sort(),
    materials: [...new Set(frames.map((frame) => frame.material).filter((value) => value !== "Matière à découvrir"))].sort(),
    brands: [...new Set(frames.map((frame) => frame.brand))].sort(),
    stores: [...new Map(frames.map((frame) => [frame.storeId, frame.storeName])).entries()],
  }), [frames]);
  const visibleFrames = useMemo(
    () => sortFrames(frames.filter((frame) => matches(frame, filters)), filters.sort, filters.query),
    [filters, frames],
  );

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    window.history.replaceState(null, "", "/lunettes");
  };

  return (
    <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">La sélection Lunetty</p>
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-5xl sm:text-6xl">Toutes les montures</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">Explorez les créations de nos opticiens partenaires et trouvez la monture qui vous ressemble.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            Trier par
            <select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)} className="min-h-11 border border-stone-300 bg-[#faf8f3] px-3 text-stone-900 dark:border-stone-600 dark:bg-[#211e19] dark:text-[#f5f0e7]">
              <option value="pertinence">Pertinence</option>
              <option value="nouveautes">Nouveautés</option>
              <option value="tendances">Tendances</option>
              <option value="meilleures-ventes">Meilleures ventes</option>
              <option value="prix-croissant">Prix croissant</option>
              <option value="prix-decroissant">Prix décroissant</option>
            </select>
          </label>
        </div>

        {(notice || isDemo) && (
          <p role="status" className="mb-6 border border-stone-300 bg-[#eee7dc] px-4 py-3 text-sm text-stone-700 dark:border-white/10 dark:bg-[#25221d] dark:text-stone-200">
            {notice ?? "Catalogue de démonstration affiché."}
          </p>
        )}

        <div className="mb-8 grid gap-3 border-y border-stone-300 py-5 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Rechercher</span>
            <input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder="Nom, marque ou opticien" className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]" />
          </label>
          <FilterSelect label="Forme du visage" value={filters.shape} onChange={(value) => setFilter("shape", value)} options={options.shapes} />
          <FilterSelect label="Style" value={filters.style} onChange={(value) => setFilter("style", value)} options={options.styles} />
          <FilterSelect label="Couleur" value={filters.color} onChange={(value) => setFilter("color", value)} options={options.colors} />
          <FilterSelect label="Matière" value={filters.material} onChange={(value) => setFilter("material", value)} options={options.materials} />
          <FilterSelect label="Marque" value={filters.brand} onChange={(value) => setFilter("brand", value)} options={options.brands} />
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={filters.sponsored} onChange={(event) => setFilter("sponsored", event.target.checked)} className="h-4 w-4 accent-accent" />
            Sélection partenaire
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Opticien</span>
            <select value={filters.store} onChange={(event) => setFilter("store", event.target.value)} className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]">
              <option value="">Tous les opticiens</option>
              {options.stores.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Budget</span>
            <select value={filters.price} onChange={(event) => setFilter("price", event.target.value)} className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]">
              <option value="">Tous les prix</option>
              <option value="0:300">Jusqu’à 300 TND</option>
              <option value="300:400">300–400 TND</option>
              <option value="400:100000">Plus de 400 TND</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={clearFilters} className="min-h-11 px-2 text-sm font-semibold text-stone-700 underline decoration-stone-400 underline-offset-4 hover:text-accent dark:text-stone-200">Effacer les filtres</button>
          </div>
        </div>

        <div className="mb-6 flex items-baseline justify-between">
          <p className="text-sm text-stone-600 dark:text-stone-300">{visibleFrames.length} monture{visibleFrames.length === 1 ? "" : "s"}</p>
        </div>
        {visibleFrames.length ? (
          <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleFrames.map((frame) => <FrameCard key={frame.id} frame={frame} badge={frame.sponsored ? "Sponsorisé" : undefined} />)}
          </div>
        ) : (
          <p className="border-y border-stone-300 py-12 text-center text-stone-600 dark:border-white/10 dark:text-stone-300">Aucune monture ne correspond à ces filtres.</p>
        )}
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]">
        <option value="">Toutes</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
