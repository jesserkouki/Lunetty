"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Glasses,
  Heart,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Wrench,
} from "lucide-react";
import { DEMO_STORES, type Frame } from "../../data/marketplace-demo";
import { getShopDemoDetails } from "../../data/shops-demo";
import { findStore } from "../../lib/marketplace";
import { useAuth } from "../../../lib/auth-context";
import { isOpenDay, parseSchedule } from "./OpenStatusBadge";
import OpenStatusBadge from "./OpenStatusBadge";
import BookingDrawer from "./BookingDrawer";
import { CatalogueExperience } from "./CataloguePage";
import { useMarketplaceData } from "./useMarketplaceData";
import { FrameCard } from "./MarketplaceUI";

const FAVORITES_KEY = "lunetty:favorites:opticians";
const PENDING_BOOKING_KEY = "lunetty.pending-shop-booking";
const WEEK_DAYS = [
  { index: 1, label: "Lundi" },
  { index: 2, label: "Mardi" },
  { index: 3, label: "Mercredi" },
  { index: 4, label: "Jeudi" },
  { index: 5, label: "Vendredi" },
  { index: 6, label: "Samedi" },
  { index: 0, label: "Dimanche" },
];

function routeToMaps(store: { latitude?: number; longitude?: number; address: string; district: string; city: string }) {
  const place = typeof store.latitude === "number" && typeof store.longitude === "number"
    ? `${store.latitude},${store.longitude}`
    : [store.address, store.district, store.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;
}

function readFavorite(id: string) {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(value) && value.includes(id);
  } catch {
    return false;
  }
}

function ShopHero({
  store,
  favorite,
  onFavorite,
  onBooking,
}: {
  store: (typeof DEMO_STORES)[number];
  favorite: boolean;
  onFavorite: () => void;
  onBooking: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const cover = store.photo || store.cover;
  return (
    <>
      <header className="relative isolate min-h-[440px] overflow-hidden bg-[#241f18] pt-20 text-white sm:min-h-[500px]">
        {!imageFailed && (
          <Image
            src={cover}
            alt={store.photoAlt || `Vitrine de ${store.name}`}
            fill
            priority
            unoptimized
            sizes="100vw"
            onError={() => setImageFailed(true)}
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_22%,rgba(201,164,92,.2),transparent_44%),linear-gradient(90deg,rgba(17,15,12,.85),rgba(17,15,12,.25)),linear-gradient(0deg,rgba(17,15,12,.92),transparent_72%)]" />
        <div className="relative mx-auto flex min-h-[440px] max-w-[1600px] flex-col justify-end px-5 pb-12 sm:min-h-[500px] sm:px-8 sm:pb-16 lg:px-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#e2c47d]">La vitrine de votre opticien</p>
          <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">{store.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-white/85 sm:text-base">
            <MapPin aria-hidden="true" className="h-4 w-4 text-[#e2c47d]" />
            {[store.district, store.city].filter(Boolean).join(", ")}
            {store.independent && <span className="ml-1 rounded-full border border-white/35 px-3 py-1 text-xs font-semibold">Indépendant</span>}
          </p>
          <div className="mt-5">
            <OpenStatusBadge hours={store.hours} />
          </div>
          <div className="mt-7 hidden flex-wrap gap-3 sm:flex">
            <button type="button" onClick={onBooking} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d1b16e] px-6 text-sm font-bold text-[#1a1713] transition hover:bg-[#e2c786] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <CalendarDays aria-hidden="true" className="h-4 w-4" /> Réserver un essayage
            </button>
            <a href={routeToMaps(store)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/45 bg-white/10 px-5 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
              <Navigation aria-hidden="true" className="h-4 w-4" /> Itinéraire
            </a>
            {store.phone && <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/45 bg-white/10 px-5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"><Phone aria-hidden="true" className="h-4 w-4" /> Appeler</a>}
            <button type="button" onClick={onFavorite} aria-label={favorite ? "Retirer des boutiques favorites" : "Ajouter aux boutiques favorites"} aria-pressed={favorite} className="grid h-12 w-12 place-items-center rounded-full border border-white/45 bg-white/10 backdrop-blur transition hover:bg-white/20">
              <Heart aria-hidden="true" className={`h-5 w-5 ${favorite ? "fill-current text-[#e6bb76]" : ""}`} />
            </button>
          </div>
        </div>
      </header>
      <div className="relative z-10 mx-auto -mt-7 flex max-w-[1600px] items-center gap-4 px-5 sm:px-8 lg:px-12">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-lunetty-cream bg-lunetty-surface shadow-lg sm:h-20 sm:w-20">
          {store.logo && store.logo !== "/images/boutiques.svg"
            ? <Image src={store.logo} alt={`Logo de ${store.name}`} width={80} height={80} unoptimized className="h-full w-full object-cover" />
            : <span aria-hidden="true" className="font-serif text-xl font-bold text-lunetty-gold-dark">{store.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span>}
        </div>
        <div className="min-w-0 pt-7">
          <p className="truncate text-sm font-semibold text-lunetty-muted">{store.name}</p>
          <p className="text-sm text-lunetty-muted">{store.city} · {store.listingCount} montures</p>
        </div>
      </div>
    </>
  );
}

function ShopTabs({ activeId }: { activeId: string }) {
  const tabs = [
    ["montures", "Montures"],
    ["apropos", "À propos"],
    ["services", "Services"],
    ["infos", "Infos pratiques"],
  ];
  return (
    <nav aria-label="Sections de la boutique" className="sticky top-[68px] z-30 mt-5 border-y border-lunetty-line bg-lunetty-cream/95 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={activeId === id ? "location" : undefined} className={`flex min-h-12 shrink-0 items-center border-b-2 px-3 text-sm font-semibold transition ${activeId === id ? "border-lunetty-gold-dark text-lunetty-ink dark:text-white" : "border-transparent text-lunetty-muted hover:text-lunetty-ink"}`}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ShopStats({
  store,
  foundedYear,
}: {
  store: (typeof DEMO_STORES)[number];
  foundedYear: number;
}) {
  const stats = [
    { label: "Montures en boutique", value: String(store.listingCount) },
    { label: "Ville", value: store.city },
    { label: "Depuis", value: String(foundedYear) },
    ...(typeof store.distanceKm === "number" ? [{ label: "À proximité", value: `${store.distanceKm.toFixed(1)} km` }] : []),
  ];
  return (
    <div className="grid grid-cols-2 border-b border-lunetty-line bg-lunetty-surface sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="border-b border-r border-lunetty-line px-5 py-5 last:border-r-0 sm:border-b-0 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-lunetty-muted">{stat.label}</p>
          <p className="mt-2 text-lg font-bold text-lunetty-ink">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function ShopServices({ services }: { services: ReturnType<typeof getShopDemoDetails>["services"] }) {
  const icons = { eye: Eye, lens: Glasses, repair: Wrench, progressive: Eye, children: Check };
  if (!services.length) {
    return <p className="rounded-2xl border border-lunetty-line bg-lunetty-surface p-5 text-sm text-lunetty-muted">Les services de cette boutique seront bientôt renseignés.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => {
        const Icon = icons[service.icon];
        return (
          <article key={service.id} className="rounded-2xl border border-lunetty-line bg-lunetty-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-lunetty-gold/15 text-lunetty-gold-dark"><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <h3 className="mt-4 text-base font-bold">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-lunetty-muted">{service.description}</p>
          </article>
        );
      })}
    </div>
  );
}

function ShopInfo({
  store,
  extras,
  today,
}: {
  store: (typeof DEMO_STORES)[number];
  extras: ReturnType<typeof getShopDemoDetails>;
  today: number | null;
}) {
  const schedule = parseSchedule(store.hours);
  const dayHours = (day: number) => {
    if (!schedule || !isOpenDay(day, schedule)) return "Fermé";
    const format = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return `${format(schedule.opensAt)} – ${format(schedule.closesAt)}`;
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
      <div className="flex flex-col justify-center rounded-3xl border border-lunetty-line bg-lunetty-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="flex items-start gap-3 text-sm leading-6 text-lunetty-muted">
            <MapPin aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-lunetty-gold-dark" />
            <span>{[store.address, store.district, store.city].filter(Boolean).join(", ")}</span>
          </p>
          <a href={routeToMaps(store)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line px-4 text-sm font-semibold">
            <Navigation aria-hidden="true" className="h-4 w-4" /> Itinéraire
          </a>
        </div>
      </div>
      <aside className="rounded-3xl border border-lunetty-line bg-lunetty-surface p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lunetty-gold-dark">Nous rendre visite</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold">Informations pratiques</h3>
        <div className="mt-5 space-y-3">
          {WEEK_DAYS.map((day) => (
            <div key={day.index} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${today === day.index ? "bg-lunetty-gold/15 font-bold" : ""}`}>
              <span>{day.label}{today === day.index && <span className="sr-only">, aujourd’hui</span>}</span>
              <span className={dayHours(day.index) === "Fermé" ? "text-lunetty-muted" : ""}>{dayHours(day.index)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 border-t border-lunetty-line pt-5 text-sm">
          {store.phone && <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center gap-3 font-semibold"><Phone aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" />{store.phone}</a>}
          {extras.email && <a href={`mailto:${extras.email}`} className="flex min-h-11 items-center gap-3 font-semibold"><Mail aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" />{extras.email}</a>}
          <p className="flex items-center gap-3 text-lunetty-muted"><Clock3 aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" />{store.hours}</p>
        </div>
      </aside>
    </div>
  );
}

function ShopSectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-7 max-w-3xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-lunetty-gold-dark">{eyebrow}</p>
      <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-6 text-lunetty-muted sm:text-base">{description}</p>}
    </div>
  );
}

function readPendingBooking(storeId: string) {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(PENDING_BOOKING_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const pending = value as { storeId?: unknown; frameIds?: unknown; date?: unknown; time?: unknown };
    if (pending.storeId !== storeId || !Array.isArray(pending.frameIds)) return null;
    return {
      frameIds: pending.frameIds.filter((id): id is string => typeof id === "string"),
      date: typeof pending.date === "string" ? pending.date : "",
      time: typeof pending.time === "string" ? pending.time : "",
    };
  } catch (cause) {
    console.error("Impossible de restaurer la réservation en attente.", cause);
    return null;
  }
}

export default function OpticianShowcasePage() {
  const params = useParams<{ id: string }>();
  const { frames, stores, isDemo, notice, error, loading, reload } = useMarketplaceData();
  const { status } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [initialBooking, setInitialBooking] = useState<{ frameIds: string[]; date: string; time: string } | null>(null);
  const [activeSection, setActiveSection] = useState("montures");
  const [favorite, setFavorite] = useState(false);
  const [today, setToday] = useState<number | null>(null);
  const featuredRef = useRef<HTMLDivElement | null>(null);
  const store = findStore(stores, params.id) ?? findStore(DEMO_STORES, params.id);
  const extras = useMemo(() => store ? getShopDemoDetails(store) : null, [store]);
  const shopFrames = useMemo(
    () => store ? frames.filter((frame) => frame.storeId === store.id) : [],
    [frames, store],
  );
  const featuredFrames = useMemo(() => {
    if (!extras || !shopFrames.length) return [];
    const chosen = extras.featuredFrameIds
      .map((id) => shopFrames.find((frame) => frame.id === id))
      .filter((frame): frame is Frame => Boolean(frame));
    return (chosen.length ? chosen : shopFrames).slice(0, 4);
  }, [extras, shopFrames]);

  const closeBooking = useCallback(() => setBookingOpen(false), []);
  const openBooking = useCallback(() => {
    setInitialBooking(null);
    setBookingOpen(true);
  }, []);

  useEffect(() => {
    if (!store) return;
    const pending = status === "authenticated" ? readPendingBooking(store.id) : null;
    const frame = window.requestAnimationFrame(() => {
      setFavorite(readFavorite(store.id));
      setToday(new Date().getDay());
      if (pending) {
        setInitialBooking(pending);
        setBookingOpen(true);
        window.sessionStorage.removeItem(PENDING_BOOKING_KEY);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [store, status]);

  useEffect(() => {
    const sections = ["montures", "apropos", "services", "infos"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (current) setActiveSection(current.target.id);
    }, { rootMargin: "-25% 0px -65% 0px", threshold: [0, 0.25, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [store]);

  const toggleFavorite = () => {
    if (!store) return;
    try {
      const raw: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      const favorites = Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
      const updated = favorite
        ? favorites.filter((id) => id !== store.id)
        : [...new Set([...favorites, store.id])];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("lunetty:optician-favorites-changed"));
      setFavorite(!favorite);
    } catch (cause) {
      console.error("Impossible d’enregistrer le favori de boutique.", cause);
    }
  };

  if (!store || !extras) {
    if (loading) {
      return <main className="min-h-screen bg-lunetty-cream px-5 pt-32"><div role="status" className="mx-auto max-w-5xl animate-pulse space-y-4"><div className="h-72 rounded-3xl bg-lunetty-surface" /><div className="h-8 w-1/2 rounded bg-lunetty-surface" /></div></main>;
    }
    return (
      <main id="contenu" className="grid min-h-screen place-items-center bg-lunetty-cream px-5 pt-24 text-lunetty-ink">
        <div className="max-w-xl py-20 text-center">
          <Glasses aria-hidden="true" className="mx-auto h-12 w-12 text-lunetty-gold-dark" />
          <h1 className="mt-5 font-serif text-4xl font-semibold">Boutique introuvable</h1>
          <p className="mt-4 text-sm text-lunetty-muted">Cette vitrine n’est pas disponible pour le moment.</p>
          <Link className="mt-7 inline-flex min-h-12 items-center rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white dark:bg-lunetty-gold dark:text-lunetty-ink" href="/opticiens">Voir les opticiens</Link>
        </div>
      </main>
    );
  }

  const scrollFeatured = (direction: -1 | 1) => {
    featuredRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  };

  return (
    <main id="contenu" className="min-h-screen bg-lunetty-cream pb-24 text-lunetty-ink sm:pb-20">
      <ShopHero store={store} favorite={favorite} onFavorite={toggleFavorite} onBooking={openBooking} />
      <ShopTabs activeId={activeSection} />
      <ShopStats store={store} foundedYear={extras.foundedYear} />

      <section id="montures" className="scroll-mt-32 px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <ShopSectionTitle eyebrow="Choisies par la maison" title="Coups de cœur de l’opticien" description="Quelques montures qui reflètent l’esprit de cette boutique." />
            {featuredFrames.length > 1 && <div className="mb-7 hidden gap-2 sm:flex">
              <button type="button" aria-label="Montures précédentes" onClick={() => scrollFeatured(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-lunetty-line bg-lunetty-surface"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" aria-label="Montures suivantes" onClick={() => scrollFeatured(1)} className="grid h-11 w-11 place-items-center rounded-full border border-lunetty-line bg-lunetty-surface"><ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
            </div>}
          </div>
          {featuredFrames.length ? (
            <div ref={featuredRef} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-5 sm:mx-0 sm:px-0">
              {featuredFrames.map((frame) => <div key={frame.id} className="w-[min(82vw,340px)] shrink-0 snap-start"><FrameCard frame={frame} badge="Coup de cœur" /></div>)}
            </div>
          ) : (
            <div className="rounded-3xl border border-lunetty-line bg-lunetty-surface px-6 py-10 text-center">
              <p className="text-sm text-lunetty-muted">Cette boutique n’a pas encore de monture publiée dans le catalogue.</p>
              <button type="button" onClick={openBooking} className="mt-4 min-h-11 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white dark:bg-lunetty-gold dark:text-lunetty-ink">Réserver un essayage</button>
            </div>
          )}

          <div className="mt-16 border-t border-lunetty-line pt-12">
            <ShopSectionTitle eyebrow="La collection complète" title={`Montures chez ${store.name}`} description="Filtrez la sélection de cette boutique pour trouver la monture qui vous correspond." />
            <CatalogueExperience
              frames={shopFrames}
              isDemo={isDemo}
              notice={notice}
              error={error}
              loading={loading}
              reload={reload}
              showIntro={false}
              showDemoNotice={false}
            />
          </div>
        </div>
      </section>

      <section id="apropos" className="scroll-mt-32 bg-lunetty-surface px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)] lg:items-center">
          <div>
            <ShopSectionTitle eyebrow="Une maison de proximité" title="À propos de la boutique" />
            <p className="max-w-2xl text-base leading-8 text-lunetty-muted">{store.description}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {extras.values.map((value) => <span key={value} className="rounded-full border border-lunetty-line px-4 py-2 text-sm font-semibold">{value}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {extras.gallery.slice(0, 3).map((image, index) => (
              <div key={`${image}-${index}`} className={`relative overflow-hidden rounded-2xl bg-lunetty-cream ${index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}>
                <Image src={image} alt={`${store.name} — aperçu ${index + 1}`} fill unoptimized sizes="(max-width: 768px) 90vw, 42vw" className="object-cover transition duration-700 hover:scale-[1.03]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-32 px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <ShopSectionTitle eyebrow="À votre écoute" title="Services en boutique" description="Un accompagnement attentif, du choix de votre monture à son ajustage." />
          <ShopServices services={extras.services} />
        </div>
      </section>

      <section id="infos" className="scroll-mt-32 bg-lunetty-surface px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <ShopSectionTitle eyebrow="Nous trouver" title="Infos pratiques" description="Préparez votre visite et prenez rendez-vous directement avec notre équipe." />
          <ShopInfo store={store} extras={extras} today={today} />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_auto] gap-2 border-t border-lunetty-line bg-lunetty-cream/95 p-3 backdrop-blur-xl sm:hidden">
        <button type="button" onClick={openBooking} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lunetty-ink px-3 text-sm font-bold text-white dark:bg-lunetty-gold dark:text-lunetty-ink">
          <CalendarDays aria-hidden="true" className="h-4 w-4" /> Réserver un essayage
        </button>
        <button type="button" aria-label={favorite ? "Retirer des boutiques favorites" : "Ajouter aux boutiques favorites"} aria-pressed={favorite} onClick={toggleFavorite} className="grid h-12 w-12 place-items-center rounded-full border border-lunetty-line bg-lunetty-surface">
          <Heart aria-hidden="true" className={`h-5 w-5 ${favorite ? "fill-current text-red-800" : ""}`} />
        </button>
      </div>

      {bookingOpen && (
        <BookingDrawer
          key={`${store.id}-${initialBooking?.date ?? "new"}-${initialBooking?.time ?? ""}`}
          store={store}
          frames={shopFrames}
          initialFrameIds={initialBooking?.frameIds}
          initialDate={initialBooking?.date}
          initialTime={initialBooking?.time}
          initialStep={initialBooking ? 3 : 1}
          onClose={closeBooking}
        />
      )}
    </main>
  );
}
