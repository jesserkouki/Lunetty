"use client";

import { LocateFixed, MapPin, Map, List } from "lucide-react";

export type OpticianView = "list" | "map";

type Props = {
  cities: string[];
  city: string;
  count: number;
  loading: boolean;
  nearbyActive: boolean;
  view: OpticianView;
  onCityChange: (city: string) => void;
  onRequestLocation: () => void;
  onViewChange: (view: OpticianView) => void;
};

const control =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function FilterBar({
  cities,
  city,
  count,
  loading,
  nearbyActive,
  view,
  onCityChange,
  onRequestLocation,
  onViewChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border-y border-stone-300/80 py-5 dark:border-white/15 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={nearbyActive}
          onClick={onRequestLocation}
          className={`${control} ${nearbyActive
            ? "border-stone-900 bg-stone-900 text-[#f5f0e7] dark:border-[#e1c795] dark:bg-[#e1c795] dark:text-stone-950"
            : "border-stone-400 bg-[#f9f6f0] text-stone-900 hover:bg-[#eee7dc] dark:border-stone-600 dark:bg-[#211e19] dark:text-[#f5f0e7] dark:hover:bg-stone-800"
          }`}
        >
          <LocateFixed aria-hidden="true" className="h-4 w-4" />
          Près de moi
        </button>

        <label className="flex min-h-12 items-center gap-2 rounded-full border border-stone-300 bg-[#f9f6f0] px-4 text-sm text-stone-800 dark:border-stone-600 dark:bg-[#211e19] dark:text-[#f5f0e7]">
          <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
          <span className="sr-only">Choisir une ville</span>
          <select
            aria-label="Choisir une ville"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            className="min-w-32 bg-transparent text-sm outline-none"
          >
            <option value="">Toutes les villes</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>{cityName}</option>
            ))}
          </select>
        </label>

        <p aria-live="polite" className="px-1 text-sm font-semibold text-stone-800 dark:text-stone-100">
          {loading
            ? "Chargement des opticiens…"
            : `${count} opticien${count === 1 ? "" : "s"}`}
        </p>
      </div>

      <div aria-label="Type d’affichage" className="inline-flex w-fit rounded-full border border-stone-300 bg-[#f9f6f0] p-1 dark:border-stone-600 dark:bg-[#211e19]">
        <button
          type="button"
          aria-pressed={view === "list"}
          onClick={() => onViewChange("list")}
          className={`${control} min-h-10 border-transparent px-4 ${
            view === "list"
              ? "bg-stone-900 text-[#f5f0e7] dark:bg-[#e1c795] dark:text-stone-950"
              : "text-stone-700 hover:bg-[#eee7dc] dark:text-stone-200 dark:hover:bg-stone-800"
          }`}
        >
          <List aria-hidden="true" className="h-4 w-4" />
          Liste
        </button>
        <button
          type="button"
          aria-pressed={view === "map"}
          onClick={() => onViewChange("map")}
          className={`${control} min-h-10 border-transparent px-4 ${
            view === "map"
              ? "bg-stone-900 text-[#f5f0e7] dark:bg-[#e1c795] dark:text-stone-950"
              : "text-stone-700 hover:bg-[#eee7dc] dark:text-stone-200 dark:hover:bg-stone-800"
          }`}
        >
          <Map aria-hidden="true" className="h-4 w-4" />
          Carte
        </button>
      </div>
    </div>
  );
}
