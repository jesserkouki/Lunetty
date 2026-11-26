"use client";

import { LocateFixed, MapPin } from "lucide-react";

type Props = {
  cities: string[];
  city: string;
  count: number;
  loading: boolean;
  nearbyActive: boolean;
  onCityChange: (city: string) => void;
  onRequestLocation: () => void;
};

const control =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function FilterBar({
  cities,
  city,
  count,
  loading,
  nearbyActive,
  onCityChange,
  onRequestLocation,
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

    </div>
  );
}
