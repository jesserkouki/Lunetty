"use client";

import { useMemo, useState } from "react";
import { LocateFixed } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DEMO_STORES, type OpticianStore } from "../../data/marketplace-demo";
import { StoreCard } from "./MarketplaceUI";
import { useMarketplaceData } from "./useMarketplaceData";

type Coordinates = { latitude: number; longitude: number };

function getDistance(from: Coordinates, store: OpticianStore) {
  if (typeof store.latitude !== "number" || typeof store.longitude !== "number") return store.distanceKm;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(store.latitude - from.latitude);
  const dLng = radians(store.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(store.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function OpticiansPage() {
  const searchParams = useSearchParams();
  const { stores: apiStores, isDemo, notice } = useMarketplaceData();
  const stores = apiStores.some((store) => store.city !== "Ville non renseignée") ? apiStores : DEMO_STORES;
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [independentOnly, setIndependentOnly] = useState(
    () => searchParams.get("type") === "independant",
  );
  const [nearbyOnly, setNearbyOnly] = useState(
    () => searchParams.get("tri") === "proximite",
  );
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  const cities = [...new Set(stores.map((store) => store.city))].sort();
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("fr");
    return stores
      .filter((store) => {
        const searchMatches = !search || `${store.name} ${store.city} ${store.district}`.toLocaleLowerCase("fr").includes(search);
        const cityMatches = !city || store.city.toLocaleLowerCase("fr") === city.toLocaleLowerCase("fr");
        return searchMatches && cityMatches && (!independentOnly || store.independent);
      })
      .map((store) => ({ store, distance: coordinates ? getDistance(coordinates, store) : store.distanceKm }))
      .filter(({ distance }) => !nearbyOnly || typeof distance === "number")
      .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER));
  }, [city, coordinates, independentOnly, nearbyOnly, query, stores]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("La géolocalisation n’est pas disponible. Choisissez une ville dans la liste.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setNearbyOnly(true);
        setLocationMessage("");
      },
      () => {
        setNearbyOnly(false);
        setLocationMessage("La localisation n’a pas été autorisée. Choisissez une ville dans la liste.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pb-20 pt-32 text-stone-900 dark:bg-[#181613] dark:text-[#f5f0e7] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">Le réseau Lunetty</p>
        <h1 className="font-serif text-5xl sm:text-6xl">Nos opticiens</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">Des maisons optiques partenaires pour essayer, ajuster et découvrir votre prochaine monture.</p>

        {(notice || isDemo) && <p role="status" className="mt-8 border border-stone-300 bg-[#eee7dc] px-4 py-3 text-sm text-stone-700 dark:border-white/10 dark:bg-[#25221d] dark:text-stone-200">{notice ?? "Liste de boutiques de démonstration affichée."}</p>}

        <div className="my-8 grid gap-4 border-y border-stone-300 py-5 dark:border-white/10 md:grid-cols-[minmax(0,1fr)_220px_auto_auto] md:items-end">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Recherche</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom d’opticien ou ville" className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Ville</span>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="min-h-11 w-full border border-stone-300 bg-[#faf8f3] px-3 text-sm dark:border-stone-600 dark:bg-[#211e19]">
              <option value="">Toutes les villes</option>
              {cities.map((cityName) => <option key={cityName} value={cityName}>{cityName}</option>)}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={independentOnly} onChange={(event) => setIndependentOnly(event.target.checked)} className="accent-stone-900" />
            Indépendants
          </label>
          <button type="button" onClick={requestLocation} className="inline-flex min-h-11 items-center justify-center gap-2 border border-stone-400 px-4 text-sm font-semibold transition hover:bg-[#eee7dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent dark:border-stone-600 dark:hover:bg-stone-800">
            <LocateFixed aria-hidden="true" className="h-4 w-4" />
            Près de moi
          </button>
        </div>
        {locationMessage && <p role="status" className="mb-6 text-sm text-stone-600 dark:text-stone-300">{locationMessage}</p>}
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-300">{filtered.length} boutique{filtered.length === 1 ? "" : "s"}</p>
        {filtered.length ? (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ store, distance }) => <StoreCard key={store.id} store={store} distanceKm={distance} />)}
          </div>
        ) : (
          <p className="border-y border-stone-300 py-12 text-center text-stone-600 dark:border-white/10 dark:text-stone-300">Aucun opticien ne correspond à votre recherche. Modifiez la ville ou la recherche.</p>
        )}
      </div>
    </main>
  );
}
