"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, X } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import type { Frame, OpticianStore } from "../../data/marketplace-demo";
import { getDemoAppointmentDates, getDemoAppointmentSlots } from "../../data/shops-demo";
import { featuresService } from "../../../services/features.service";

const PENDING_BOOKING_KEY = "lunetty.pending-shop-booking";

function formatDay(value: string) {
  return new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long" })
    .format(new Date(`${value}T12:00:00`));
}

function isPastSlot(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() <= Date.now();
}

function calendarHref(store: OpticianStore, date: string, time: string) {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 30 * 60_000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Essayage chez ${store.name}`,
    `LOCATION:${store.address || store.city}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

export default function BookingDrawer({
  store,
  frames,
  initialFrameIds = [],
  initialDate = "",
  initialTime = "",
  initialStep = 1,
  onClose,
}: {
  store: OpticianStore;
  frames: Frame[];
  initialFrameIds?: string[];
  initialDate?: string;
  initialTime?: string;
  initialStep?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const { status } = useAuth();
  const panelRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(initialStep);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialFrameIds);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const slots = date ? getDemoAppointmentSlots(store, date) : [];
  const selectedFrames = frames.filter((frame) => selectedIds.includes(frame.id));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDates(getDemoAppointmentDates(store, new Date()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [store]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const toggleFrame = (id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  };

  const continueToConfirmation = () => {
    setError("");
    if (status !== "authenticated") {
      try {
        window.sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({
          storeId: store.id,
          frameIds: selectedIds,
          date,
          time,
        }));
      } catch (cause) {
        console.error("Impossible de conserver la sélection avant connexion.", cause);
        setError("Votre sélection n’a pas pu être sauvegardée. Réessayez avant de vous connecter.");
        return;
      }
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setStep(3);
  };

  const submitBooking = async () => {
    if (!date || !time || selectedFrames.length === 0) return;
    if (status !== "authenticated") {
      continueToConfirmation();
      return;
    }
    if (!slots.includes(time) || isPastSlot(date, time)) {
      setError("Ce créneau n’est plus disponible. Choisissez une nouvelle date ou une autre heure.");
      setStep(2);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + 30 * 60_000);
      await featuresService.createAppointment({
        type_service: "ESSAYAGE_MONTURE",
        commence_le: start.toISOString(),
        termine_le: end.toISOString(),
        note_client: `Montures souhaitées : ${selectedFrames.map((frame) => frame.name).join(", ")}`,
        magasin_id: store.id,
      });
      window.sessionStorage.removeItem(PENDING_BOOKING_KEY);
      setSuccess(true);
    } catch (cause: unknown) {
      console.error("La réservation en boutique a échoué.", cause);
      setError(cause instanceof Error
        ? cause.message
        : "La réservation n’a pas pu être confirmée. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeFromBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      role="presentation"
      onMouseDown={closeFromBackdrop}
      className="fixed inset-0 z-[100] flex justify-end bg-black/55 backdrop-blur-sm"
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-lunetty-line bg-lunetty-cream text-lunetty-ink shadow-2xl motion-safe:animate-[lunetty-drawer-in_.3s_ease-out] dark:bg-[#1d1a16]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-lunetty-line bg-lunetty-cream/95 px-5 py-4 backdrop-blur-xl dark:bg-[#1d1a16]/95 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lunetty-gold-dark">Réservation en boutique</p>
            <h2 id="booking-title" className="mt-1 font-serif text-2xl font-semibold">{store.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer la réservation" className="grid h-11 w-11 place-items-center rounded-full border border-lunetty-line hover:bg-lunetty-surface">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="mx-5 mt-5 flex items-center gap-2 sm:mx-7">
          {[1, 2, 3].map((number) => (
            <div key={number} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${step >= number ? "bg-lunetty-ink text-white dark:bg-lunetty-gold dark:text-lunetty-ink" : "border border-lunetty-line text-lunetty-muted"}`}>
                {step > number ? <Check aria-hidden="true" className="h-4 w-4" /> : number}
              </span>
              <span className={`hidden text-xs font-semibold sm:block ${step === number ? "text-lunetty-ink dark:text-white" : "text-lunetty-muted"}`}>
                {number === 1 ? "Montures" : number === 2 ? "Créneau" : "Confirmation"}
              </span>
              {number < 3 && <span className="h-px flex-1 bg-lunetty-line" />}
            </div>
          ))}
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-800 text-white"><Check aria-hidden="true" className="h-8 w-8" /></span>
            <h3 className="mt-5 font-serif text-3xl font-semibold">Votre essayage est réservé</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-lunetty-muted">
              {formatDay(date)} à {time} · {store.name}
            </p>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
              <a href={calendarHref(store, date, time)} download="lunetty-essayage.ics" className="inline-flex min-h-12 items-center justify-center rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white dark:bg-lunetty-gold dark:text-lunetty-ink">Ajouter à mon calendrier</a>
              <Link href="/client/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-full border border-lunetty-line px-5 text-sm font-semibold">Mes réservations</Link>
              <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold text-lunetty-muted">Fermer</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-6 sm:px-7">
              {step === 1 && (
                <div>
                  <h3 className="font-serif text-2xl font-semibold">Quelles montures souhaitez-vous essayer ?</h3>
                  <p className="mt-2 text-sm text-lunetty-muted">Choisissez une ou plusieurs montures. Vous pourrez aussi découvrir la sélection en boutique.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {frames.map((frame) => {
                      const selected = selectedIds.includes(frame.id);
                      return (
                        <button key={frame.id} type="button" aria-pressed={selected} onClick={() => toggleFrame(frame.id)} className={`flex min-h-24 items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lunetty-gold ${selected ? "border-lunetty-gold bg-lunetty-gold/10" : "border-lunetty-line bg-lunetty-surface"}`}>
                          <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#27231e]">
                            <Image src={frame.image} alt="" fill unoptimized sizes="80px" className="object-contain p-2" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{frame.name}</span>
                            <span className="mt-1 block text-xs text-lunetty-muted">{frame.brand}</span>
                          </span>
                          {selected && <Check aria-hidden="true" className="ml-auto h-5 w-5 shrink-0 text-lunetty-gold-dark" />}
                        </button>
                      );
                    })}
                  </div>
                  {!frames.length && <p className="mt-5 rounded-2xl bg-lunetty-surface p-4 text-sm text-lunetty-muted">La sélection en ligne est momentanément vide. Vous pourrez découvrir les montures directement en boutique.</p>}
                </div>
              )}
              {step === 2 && (
                <div>
                  <h3 className="font-serif text-2xl font-semibold">Choisissez votre créneau</h3>
                  <p className="mt-2 text-sm text-lunetty-muted">Disponibilités de démonstration, à confirmer avec la boutique.</p>
                  <fieldset className="mt-5">
                    <legend className="text-sm font-bold">Jour</legend>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {dates.map((day) => (
                        <button key={day} type="button" aria-pressed={date === day} onClick={() => { setDate(day); setTime(""); }} className={`min-h-12 rounded-xl border px-3 text-left text-sm font-semibold capitalize ${date === day ? "border-lunetty-gold bg-lunetty-gold/15" : "border-lunetty-line bg-lunetty-surface"}`}>
                          {formatDay(day)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="mt-6">
                    <legend className="inline-flex items-center gap-2 text-sm font-bold"><Clock3 aria-hidden="true" className="h-4 w-4 text-lunetty-gold-dark" /> Heure</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button key={slot} type="button" aria-pressed={time === slot} disabled={!date} onClick={() => setTime(slot)} className={`min-h-11 min-w-20 rounded-full border px-4 text-sm font-semibold disabled:opacity-40 ${time === slot ? "border-lunetty-gold bg-lunetty-ink text-white dark:bg-lunetty-gold dark:text-lunetty-ink" : "border-lunetty-line bg-lunetty-surface"}`}>
                          {slot}
                        </button>
                      ))}
                      {date && !slots.length && <span className="text-sm text-lunetty-muted">Aucun créneau disponible ce jour-là.</span>}
                    </div>
                  </fieldset>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h3 className="font-serif text-2xl font-semibold">Vérifiez votre réservation</h3>
                  <div className="mt-5 rounded-2xl border border-lunetty-line bg-lunetty-surface p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-lunetty-gold-dark">Boutique</p>
                    <p className="mt-1 font-semibold">{store.name}</p>
                    <p className="mt-1 text-sm text-lunetty-muted">{store.address || store.city}</p>
                    <div className="my-4 border-t border-lunetty-line" />
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-lunetty-gold-dark">Date et heure</p>
                    <p className="mt-1 font-semibold capitalize">{formatDay(date)} à {time}</p>
                    <div className="my-4 border-t border-lunetty-line" />
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-lunetty-gold-dark">Montures ({selectedFrames.length})</p>
                    <p className="mt-1 text-sm">{selectedFrames.map((frame) => frame.name).join(", ")}</p>
                  </div>
                  {status === "guest" && <p className="mt-4 rounded-xl bg-lunetty-gold/10 p-4 text-sm leading-6">Connectez-vous pour confirmer. Votre sélection sera conservée.</p>}
                  {status === "loading" && <p role="status" className="mt-4 text-sm text-lunetty-muted">Vérification de votre connexion…</p>}
                </div>
              )}
              {error && <p role="alert" className="mt-5 rounded-xl border border-red-800/20 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-100">{error}</p>}
            </div>

            <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-lunetty-line bg-lunetty-cream/95 px-5 py-4 backdrop-blur-xl dark:bg-[#1d1a16]/95 sm:px-7">
              {step > 1 ? (
                <button type="button" onClick={() => { setError(""); setStep((current) => current - 1); }} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-lunetty-line px-4 text-sm font-semibold"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Retour</button>
              ) : <span className="text-sm text-lunetty-muted">{selectedIds.length} sélectionnée{selectedIds.length === 1 ? "" : "s"}</span>}
              {step === 1 ? (
                <button type="button" disabled={selectedIds.length === 0} onClick={() => setStep(2)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-lunetty-gold dark:text-lunetty-ink">Choisir un créneau <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
              ) : step === 2 ? (
                <button type="button" disabled={!date || !time} onClick={continueToConfirmation} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-lunetty-gold dark:text-lunetty-ink">Continuer <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
              ) : (
                <button type="button" disabled={submitting || status === "loading"} onClick={() => void submitBooking()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-lunetty-gold dark:text-lunetty-ink">
                  {submitting ? "Confirmation…" : status === "authenticated" ? "Confirmer la réservation" : "Se connecter"}
                </button>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
