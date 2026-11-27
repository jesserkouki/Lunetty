"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, MapPin, Search, Store, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Frame, OpticianStore } from "../../lib/marketplace-types";
import { getStoreOpenStatus } from "./OpenStatusBadge";
import OpticianCard from "./OpticianCard";
import PageHero from "./PageHero";
import { useMarketplaceData } from "./useMarketplaceData";

type SortMode = "distance" | "frames" | "newest";
type StoreFilter = "all" | "open" | "optique" | "solaires" | "enfants";

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesCategory(frame: Frame, filter: Exclude<StoreFilter, "all" | "open">) {
  const category = normalizeText(frame.category);
  if (filter === "optique") return category.includes("optiq");
  if (filter === "solaires") return category.includes("solaire");
  return category.includes("enfant") || category.includes("junior");
}

function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lon2 - lon1);
  const arc = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function StoreSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse rounded-3xl border border-lunetty-line bg-lunetty-surface p-4">
      <div className="aspect-[4/3] rounded-2xl bg-lunetty-cream" />
      <div className="mt-4 h-6 w-2/3 rounded bg-lunetty-cream" />
      <div className="mt-3 h-4 w-1/2 rounded bg-lunetty-cream" />
      <div className="mt-5 h-11 rounded-full bg-lunetty-cream" />
    </div>
  );
}

function ShopsList({
  stores,
  framesByStore,
}: {
  stores: OpticianStore[];
  framesByStore: Map<string, Frame[]>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
      {stores.map((store) => (
        <div key={store.id} className="min-w-0">
          <OpticianCard
            optician={{
              ...store,
              montures: framesByStore.get(store.id) ?? [],
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function OpticiansPage() {
  const searchParams = useSearchParams();
  const { stores, frames, isDemo, error, notice, loading, reload } = useMarketplaceData();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toutes les villes");
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");
  const [sort, setSort] = useState<SortMode>("distance");
  const [independentOnly, setIndependentOnly] = useState(
    () => searchParams.get("type") === "independant",
  );
  const [nearbyOnly, setNearbyOnly] = useState(
    () => searchParams.get("tri") === "proximite",
  );
  const [openStoreIds, setOpenStoreIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    let timer = 0;
    let animationFrame = 0;
    const update = () => {
      const current = new Date();
      setOpenStoreIds(
        stores
          .filter((store) => getStoreOpenStatus(store.hours, current).open === true)
          .map((store) => store.id),
      );
    };
    animationFrame = window.requestAnimationFrame(update);
    timer = window.setInterval(update, 60_000);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(timer);
    };
  }, [stores]);

  const cities = useMemo(
    () => [...new Set(stores.map((store) => store.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [stores],
  );

  const framesByStore = useMemo(() => {
    const grouped = new Map<string, Frame[]>();
    for (const frame of frames) {
      const storeFrames = grouped.get(frame.storeId) ?? [];
      storeFrames.push(frame);
      grouped.set(frame.storeId, storeFrames);
    }
    return grouped;
  }, [frames]);

  const storesWithDistance = useMemo(
    () => stores.map((store) => userLocation &&
      typeof store.latitude === "number" &&
      typeof store.longitude === "number"
      ? {
          ...store,
          distanceKm: distanceBetween(
            userLocation.latitude,
            userLocation.longitude,
            store.latitude,
            store.longitude,
          ),
        }
      : store),
    [stores, userLocation],
  );

  const visibleStores = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    const filtered = storesWithDistance.filter((store) => {
      const searchableText = normalizeText(`${store.name} ${store.address} ${store.city} ${store.district}`);
      const storeFrames = framesByStore.get(store.id) ?? [];
      const matchesFilter = storeFilter === "all" ||
        (storeFilter === "open"
          ? openStoreIds.includes(store.id)
          : storeFrames.some((frame) => matchesCategory(frame, storeFilter)));
      return (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (city === "Toutes les villes" || store.city === city) &&
        (!independentOnly || store.independent === true) &&
        (!nearbyOnly || typeof store.distanceKm === "number") &&
        matchesFilter;
    });
    return filtered.sort((left, right) => {
      if (sort === "frames") return right.listingCount - left.listingCount;
      if (sort === "newest") return Number(right.isNew) - Number(left.isNew);
      return (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER);
    });
  }, [storesWithDistance, framesByStore, query, city, storeFilter, openStoreIds, sort, independentOnly, nearbyOnly]);

  const resetFilters = () => {
    setQuery("");
    setCity("Toutes les villes");
    setStoreFilter("all");
    setSort("distance");
    setIndependentOnly(false);
    setNearbyOnly(false);
    setUserLocation(null);
    setLocationMessage("");
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("La localisation n’est pas disponible sur cet appareil. Choisissez une ville dans la liste.");
      return;
    }
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setCity("Toutes les villes");
        setSort("distance");
        setNearbyOnly(true);
      },
      () => {
        setUserLocation(null);
        setNearbyOnly(false);
        setLocationMessage("Localisation refusée. Choisissez une ville dans la liste.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  return (
    <main id="contenu" className="min-h-screen bg-lunetty-cream px-4 pb-20 pt-28 text-lunetty-ink sm:px-8 lg:px-12">
      <PageHero
        image="/images/opticiens/boutiques-hero-panorama.jpg"
        alt="Un opticien conseille une cliente dans une boutique d'optique Lunetty"
        surtitre="Nos opticiens"
        titre="Nos opticiens partenaires"
        sousTitre="Des boutiques indépendantes près de chez vous, choisies pour leur savoir‑faire."
        imagePosition={{ desktop: "center 30%", mobile: "70% 30%" }}
        layout="contained"
        imageSizes="(min-width: 1728px) 1664px, calc(100vw - 64px)"
        zoomStart={1.03}
        parallax={false}
        statistic={stores.length
          ? `${stores.length} boutique${stores.length === 1 ? "" : "s"} partenaire${stores.length === 1 ? "" : "s"}`
          : undefined}
        badge={isDemo && process.env.NODE_ENV !== "production" ? "Démo" : undefined}
        actions={[
          {
            label: "Près de moi",
            ariaLabel: "Afficher les opticiens près de ma position",
            onClick: requestLocation,
          },
        ]}
      />

      <div className="mx-auto max-w-[1600px]">
        <section aria-label="Rechercher et filtrer les boutiques" className="mb-6 rounded-[1.7rem] border border-lunetty-line bg-lunetty-surface/85 p-4 shadow-[0_12px_42px_rgba(54,41,26,0.07)] backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="font-serif text-xl font-semibold text-lunetty-ink">
              {visibleStores.length} boutique{visibleStores.length === 1 ? "" : "s"}
            </p>
            {visibleStores.length !== stores.length && (
              <span className="text-sm text-lunetty-muted">sur {stores.length}</span>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_auto_auto] lg:items-center">
            <label className="flex min-h-12 items-center gap-3 rounded-full border border-lunetty-line bg-lunetty-cream/70 px-4 focus-within:ring-2 focus-within:ring-lunetty-gold">
              <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-lunetty-muted" />
              <span className="sr-only">Rechercher une boutique par nom, adresse ou ville</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, adresse ou ville"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-lunetty-muted"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="grid h-9 w-9 place-items-center rounded-full hover:bg-lunetty-surface">
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </label>
            <label className="flex min-h-12 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-cream/70 px-4 text-sm">
              <MapPin aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" />
              <span className="sr-only">Choisir une ville</span>
              <select value={city} onChange={(event) => setCity(event.target.value)} className="min-w-36 bg-transparent outline-none">
                <option>Toutes les villes</option>
                {cities.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="flex min-h-12 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-cream/70 px-4 text-sm">
              <ArrowDownUp aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" />
              <span className="sr-only">Trier les boutiques</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="bg-transparent outline-none">
                <option value="distance">Distance</option>
                <option value="frames">Nombre de montures</option>
                <option value="newest">Nouveautés</option>
              </select>
            </label>
          </div>
          <div role="group" aria-label="Filtrer les boutiques" className="mt-4 flex flex-wrap gap-2">
            {([
              ["all", "Tous"],
              ["open", "Ouvert maintenant"],
              ["optique", "Optique"],
              ["solaires", "Solaires"],
              ["enfants", "Enfants"],
            ] as const).map(([filter, label]) => (
              <button
                key={filter}
                type="button"
                aria-pressed={storeFilter === filter}
                onClick={() => setStoreFilter(filter)}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunetty-gold ${storeFilter === filter ? "border-lunetty-gold bg-lunetty-ink text-white dark:bg-lunetty-gold dark:text-lunetty-ink" : "border-lunetty-line bg-lunetty-surface text-lunetty-ink hover:border-lunetty-gold"}`}
              >
                {label}
              </button>
            ))}
            <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-surface px-4 text-sm font-semibold">
              <input
                type="checkbox"
                checked={independentOnly}
                onChange={(event) => setIndependentOnly(event.target.checked)}
                className="accent-lunetty-gold-dark"
              />
              Indépendants
            </label>
          </div>
          {locationMessage && <p role="status" className="mt-3 text-sm text-lunetty-muted">{locationMessage}</p>}
        </section>

        {notice && !error && <p role="status" className="mt-8 border border-stone-300 bg-[#eee7dc] px-4 py-3 text-sm text-stone-700 dark:border-white/10 dark:bg-[#25221d] dark:text-stone-200">{notice}</p>}
        {error && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <p>{error}</p>
            <button type="button" onClick={() => void reload()} className="min-h-11 rounded-full border border-current px-4 font-semibold">Réessayer</button>
          </div>
        )}
        <p className="mb-6 mt-8 text-sm text-stone-600 dark:text-stone-300">{visibleStores.length} boutique{visibleStores.length === 1 ? "" : "s"}</p>
        {loading && stores.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
            {[0, 1, 2, 3].map((index) => <StoreSkeleton key={index} />)}
          </div>
        ) : visibleStores.length ? (
          <ShopsList stores={visibleStores} framesByStore={framesByStore} />
        ) : (
          <div className="rounded-[1.7rem] border border-lunetty-line bg-lunetty-surface px-6 py-16 text-center">
            <Store aria-hidden="true" className="mx-auto h-10 w-10 text-lunetty-gold-dark" />
            <h2 className="mt-4 font-serif text-2xl font-semibold">Aucune boutique ne correspond</h2>
            <button type="button" onClick={resetFilters} className="mt-5 min-h-11 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white dark:bg-lunetty-gold dark:text-lunetty-ink">Tout effacer</button>
          </div>
        )}
      </div>
    </main>
  );
}
