"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, MoveRight } from "lucide-react";
import { DEMO_STORES, type Frame, type OpticianStore } from "../../data/marketplace-demo";
import { getOpticians } from "../../lib/marketplace";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";
import FilterBar from "./FilterBar";
import OpticianCard from "./OpticianCard";

type Coordinates = { latitude: number; longitude: number };
type Props = {
  stores: OpticianStore[];
  frames: Frame[];
  loading: boolean;
  isDemo: boolean;
  error?: string;
};

function distanceBetween(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function OpticianSkeleton({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.4rem] border border-stone-200 bg-[#f9f6f0] p-4 dark:border-white/10 dark:bg-[#211e19]" aria-hidden="true">
      <div className={`aspect-[4/3] rounded-[1.05rem] bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
      <div className={`mt-4 h-14 rounded-lg bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
      <div className="mt-4 flex gap-2">
        <div className={`h-14 w-14 rounded-xl bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
        <div className={`h-14 w-14 rounded-xl bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
        <div className={`h-14 w-14 rounded-xl bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
      </div>
      <div className={`mt-5 h-16 rounded-lg bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
      <div className={`mt-4 h-12 rounded-full bg-stone-200 dark:bg-stone-700 ${reducedMotion ? "" : "animate-pulse"}`} />
    </div>
  );
}

export default function OpticiansSection({ stores, frames, loading, isDemo, error }: Props) {
  const reducedMotion = useReducedMotion();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  const opticians = useMemo(() => {
    const mapped = getOpticians(stores, frames, isDemo);
    const photoCounts = new Map<string, number>();
    mapped.forEach((store) => {
      if (store.photo) photoCounts.set(store.photo, (photoCounts.get(store.photo) ?? 0) + 1);
    });
    return mapped.map((store) => (
      store.photo && (photoCounts.get(store.photo) ?? 0) > 1
        ? { ...store, photo: undefined }
        : store
    ));
  }, [frames, isDemo, stores]);
  const cities = useMemo(
    () => [...new Set([...opticians, ...DEMO_STORES].map((store) => store.city).filter(Boolean))].sort(),
    [opticians],
  );
  const distances = useMemo(() => {
    if (!coordinates) return new Map<string, number>();
    return new Map(
      opticians.flatMap((optician) => (
        typeof optician.latitude === "number" && typeof optician.longitude === "number"
          ? [[optician.id, distanceBetween(coordinates, {
              latitude: optician.latitude,
              longitude: optician.longitude,
            })] as const]
          : []
      )),
    );
  }, [coordinates, opticians]);
  const filtered = useMemo(() => {
    const cityKey = city.toLocaleLowerCase("fr");
    return opticians
      .filter((optician) => !cityKey || optician.city.toLocaleLowerCase("fr") === cityKey)
      .sort((a, b) => {
        const distanceA = coordinates ? distances.get(a.id) : a.distanceKm;
        const distanceB = coordinates ? distances.get(b.id) : b.distanceKm;
        return (distanceA ?? Number.MAX_SAFE_INTEGER) - (distanceB ?? Number.MAX_SAFE_INTEGER);
      });
  }, [city, coordinates, distances, opticians]);
  const requestLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("La géolocalisation n’est pas disponible. Choisissez une ville manuellement.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setCity("");
        setLocationMessage("");
      },
      () => {
        setLocationMessage("La localisation n’a pas été autorisée. Vous pouvez choisir une ville manuellement.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const scrollCarousel = (direction: -1 | 1) => {
    const amount = carouselRef.current?.clientWidth ?? 0;
    carouselRef.current?.scrollBy({
      left: direction * amount * 0.75,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">À proximité</p>
          <h2 className="font-serif text-4xl text-stone-900 dark:text-[#f5f0e7] sm:text-5xl">
            Opticiens près de chez vous
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-700 dark:text-stone-200">
            Découvrez les maisons optiques et les montures disponibles autour de vous.
          </p>
        </div>
        <Link
          href="/opticiens?tri=proximite"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-70 dark:text-[#f5f0e7]"
        >
          Voir tous les opticiens
          <MoveRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <FilterBar
        cities={cities}
        city={city}
        count={filtered.length}
        loading={loading}
        nearbyActive={Boolean(coordinates)}
        onCityChange={(value) => {
          setCity(value);
          setCoordinates(null);
          setLocationMessage("");
        }}
        onRequestLocation={requestLocation}
      />

      {locationMessage && (
        <p role="status" className="mt-3 text-sm text-stone-700 dark:text-stone-200">
          {locationMessage}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-900/20 bg-[#f4e8d5] px-4 py-3 text-sm font-medium text-stone-800 dark:border-amber-100/20 dark:bg-[#33291d] dark:text-[#f5f0e7]">
          {error}
        </p>
      )}

      <div className="mt-5">
          {!loading && filtered.length > 1 && (
            <div className="mb-3 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Faire défiler les boutiques vers la gauche"
                onClick={() => scrollCarousel(-1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-stone-400 bg-[#f9f6f0] text-stone-900 transition hover:bg-[#eee7dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-stone-600 dark:bg-[#211e19] dark:text-[#f5f0e7]"
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Faire défiler les boutiques vers la droite"
                onClick={() => scrollCarousel(1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-stone-400 bg-[#f9f6f0] text-stone-900 transition hover:bg-[#eee7dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-stone-600 dark:bg-[#211e19] dark:text-[#f5f0e7]"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-hidden px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="w-[74%] shrink-0 snap-start sm:w-auto">
                  <OpticianSkeleton reducedMotion={reducedMotion} />
                </div>
              ))}
            </div>
          ) : filtered.length ? (
            <div
              ref={carouselRef}
              className="optician-carousel -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:gap-5 sm:px-0"
            >
              {filtered.map((optician, index) => (
                <motion.div
                  key={optician.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : Math.min(index, 3) * 0.06 }}
                  className="w-[74%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
                >
                  <OpticianCard
                    optician={optician}
                    distanceKm={coordinates ? distances.get(optician.id) : optician.distanceKm}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="my-8 rounded-2xl border border-stone-300 bg-[#f9f6f0] px-5 py-10 text-center text-base text-stone-700 dark:border-white/10 dark:bg-[#211e19] dark:text-stone-200">
              Aucun opticien dans cette ville, essayez une autre ville.
            </p>
          )}
      </div>
    </div>
  );
}
