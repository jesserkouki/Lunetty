"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Optician } from "../../data/marketplace-demo";
import { getStoreHref } from "../../lib/marketplace";

type Coordinates = { latitude: number; longitude: number };

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function markerIcon(active: boolean) {
  return L.divIcon({
    className: "lunetty-map-marker-shell",
    html: `<span class="lunetty-map-marker${active ? " is-active" : ""}" aria-hidden="true"></span>`,
    iconSize: [32, 40],
    iconAnchor: [16, 36],
  });
}

export default function OpticiansMap({
  stores,
  selectedId,
  center,
  onSelect,
}: {
  stores: Optician[];
  selectedId?: string;
  center?: Coordinates | null;
  onSelect: (id: string) => void;
}) {
  const locations = stores.filter(
    (store) => typeof store.latitude === "number" && typeof store.longitude === "number",
  );
  const defaultCenter: [number, number] = center
    ? [center.latitude, center.longitude]
    : locations[0]
      ? [locations[0].latitude!, locations[0].longitude!]
      : [36.8, 10.18];

  if (!locations.length) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-2xl border border-stone-300 bg-[#eee7dc] px-6 text-center text-sm text-stone-700 dark:border-white/10 dark:bg-[#25221d] dark:text-stone-200">
        La carte sera disponible lorsque les coordonnées des boutiques seront renseignées.
      </div>
    );
  }

  return (
    <div className="relative z-0 h-[380px] overflow-hidden rounded-2xl border border-stone-300 shadow-sm dark:border-white/10 sm:h-[480px]">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label="Carte interactive des opticiens"
      >
        <MapController center={defaultCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude!, store.longitude!]}
            icon={markerIcon(store.id === selectedId)}
            title={`Afficher ${store.name}`}
            alt={`Repère pour ${store.name}`}
            eventHandlers={{ click: () => onSelect(store.id) }}
          >
            <Popup>
              <div className="min-w-40">
                <p className="font-serif text-lg font-semibold">{store.name}</p>
                <p className="mt-1 text-sm">{[store.district, store.city].filter(Boolean).join(", ")}</p>
                <Link
                  href={getStoreHref(store)}
                  className="mt-2 inline-flex text-sm font-semibold text-[#71542f] underline underline-offset-2"
                >
                  Découvrir la boutique
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
