"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Calendar, Check, ChevronRight, Clock, FileText,
  Glasses, Heart, Mail, MapPin, Phone, Search, Settings, Sparkles, User, X,
} from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import type { CurrentUser } from "@/lib/auth";
import { usersService, type ClientProfile } from "@/services/users.service";
import { clientsService, type ClientPrescription } from "@/services/clients.service";
import {
  featuresService,
  type ClientAppointment,
  type FavoriteProduct,
} from "@/services/features.service";
import type { JsonRecord } from "@/services/api";
import CatalogProductCard from "@/app/components/Catalog/CatalogProductCard";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type Props = {
  user: CurrentUser;
  dark: boolean;
  onNavigate: (tab: "landing" | "tryon" | "catalog" | "favorites") => void;
  onSettings: (section?: string) => void;
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRME: "border-emerald-500/30 bg-emerald-900/20 text-emerald-500",
  DEMANDE: "border-lunetty-gold/40 bg-lunetty-gold/10 text-lunetty-gold-strong",
  REPLANIFIE: "border-sky-500/30 bg-sky-900/20 text-sky-500",
  ANNULE: "border-lunetty-danger/30 bg-lunetty-danger/10 text-lunetty-danger",
  TERMINE: "border-stone-500/30 bg-stone-500/10 text-stone-500",
  ABSENT: "border-lunetty-danger/30 bg-lunetty-danger/10 text-lunetty-danger",
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRME: "Confirmée",
  DEMANDE: "En attente",
  REPLANIFIE: "À confirmer",
  ANNULE: "Annulée",
  TERMINE: "Terminée",
  ABSENT: "Terminée",
};

function isTerminal(appointment: ClientAppointment) {
  return ["ANNULE", "TERMINE", "ABSENT"].includes(appointment.statut);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function expiryState(prescription: ClientPrescription) {
  if (!prescription.expire_le) return "À jour";
  const days = Math.ceil(
    (new Date(prescription.expire_le).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) return "Expirée";
  if (days <= 30) return "Expire bientôt";
  return "À jour";
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

export default function UserDashboard({ user, dark, onNavigate, onSettings }: Props) {
  const reducedMotion = useReducedMotion();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [tryOns, setTryOns] = useState<JsonRecord[]>([]);
  const [notifications, setNotifications] = useState<JsonRecord[]>([]);
  const [activeReservationTab, setActiveReservationTab] = useState<"upcoming" | "history">("upcoming");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ClientAppointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<ClientAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(0);

  const card = "rounded-[1.5rem] border border-lunetty-line bg-lunetty-surface p-5 shadow-[0_16px_44px_rgba(26,23,19,0.06)] sm:p-6";
  const inner = "rounded-2xl border border-lunetty-line bg-lunetty-cream p-4";
  const title = "text-lunetty-ink";
  const muted = "text-lunetty-muted";
  const activePrescription = prescriptions.find((item) => item.est_active) ?? null;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const results = await Promise.allSettled([
      usersService.me(),
      featuresService.appointments(),
      clientsService.prescriptions(),
      featuresService.favoriteProducts(1, 4),
      featuresService.tryOnSessions(),
      featuresService.notifications(1),
    ]);
    let failed = false;
    if (results[0].status === "fulfilled") setProfile(results[0].value);
    else failed = true;
    if (results[1].status === "fulfilled") setAppointments(results[1].value.data);
    else failed = true;
    if (results[2].status === "fulfilled") setPrescriptions(results[2].value);
    else failed = true;
    if (results[3].status === "fulfilled") setFavorites(results[3].value.data);
    else failed = true;
    if (results[4].status === "fulfilled") setTryOns(results[4].value.data);
    else failed = true;
    if (results[5].status === "fulfilled") {
      setNotifications(results[5].value.data);
    } else failed = true;
    if (failed) setLoadError("Certaines informations n’ont pas pu être chargées. Réessayez.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadDashboard());
    return () => window.cancelAnimationFrame(frame);
  }, [loadDashboard]);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const frame = window.requestAnimationFrame(update);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const upcomingAppointments = useMemo(
    () => appointments
      .filter((appointment) => !isTerminal(appointment) && new Date(appointment.commence_le).getTime() >= now)
      .sort((a, b) => +new Date(a.commence_le) - +new Date(b.commence_le)),
    [appointments, now],
  );
  const historyAppointments = useMemo(
    () => appointments
      .filter((appointment) => isTerminal(appointment) || new Date(appointment.commence_le).getTime() < now)
      .sort((a, b) => +new Date(b.commence_le) - +new Date(a.commence_le)),
    [appointments, now],
  );
  const visibleAppointments = activeReservationTab === "upcoming"
    ? upcomingAppointments
    : historyAppointments;
  const reminder = notifications.find((notification) => {
    const data = asRecord(notification.donnees);
    return (
      notification.type === "RAPPEL_RENDEZ_VOUS" &&
      notification.statut !== "LU" &&
      typeof data?.appointmentId === "string" &&
      upcomingAppointments.some((appointment) => appointment.id === data.appointmentId)
    );
  });
  const reminderData = reminder ? asRecord(reminder.donnees) : null;
  const reminderAppointment = reminderData && typeof reminderData.appointmentId === "string"
    ? upcomingAppointments.find((appointment) => appointment.id === reminderData.appointmentId)
    : null;

  const profileComplete = [
    Boolean(profile?.url_image_profil),
    Boolean(profile?.telephone),
    Boolean(profile?.adresse?.ligne_1 && profile.adresse.ville && profile.adresse.code_postal),
    prescriptions.length > 0,
  ].filter(Boolean).length * 25;
  const completedProfileSteps = profileComplete / 25;

  const showError = (error: unknown) =>
    setActionError(error instanceof Error ? error.message : "Une erreur est survenue.");

  const cancelAppointment = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    setActionError(null);
    try {
      await featuresService.cancelAppointment(cancelTarget.id);
      setCancelTarget(null);
      setToast("Votre réservation a été annulée.");
      await loadDashboard();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const rescheduleAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    setSaving(true);
    setActionError(null);
    try {
      const start = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const end = new Date(start.getTime() + 30 * 60_000);
      await featuresService.rescheduleAppointment(rescheduleTarget.id, {
        commence_le: start.toISOString(),
        termine_le: end.toISOString(),
      });
      setRescheduleTarget(null);
      setToast("Votre demande de reprogrammation a été envoyée.");
      await loadDashboard();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const attachPrescription = async (appointment: ClientAppointment, id: string) => {
    try {
      await featuresService.attachPrescription(appointment.id, id || null);
      setToast(id ? "Ordonnance jointe à la réservation." : "Ordonnance retirée de la réservation.");
      await loadDashboard();
    } catch (error) {
      showError(error);
    }
  };

  const profileName = profile
    ? `${profile.prenom} ${profile.nom}`
        .split(" ")
        .map((part) => part.replace(/^[.,;:]+|[.,;:]+$/g, ""))
        .join(" ")
        .trim()
    : user.name;
  const address = profile?.adresse
    ? `${profile.adresse.ligne_1}, ${profile.adresse.code_postal} ${profile.adresse.ville}`
    : null;

  const actions = [
    { key: "catalog" as const, icon: Search, label: "Catalogue", hint: "Parcourir les modèles" },
    { key: "landing" as const, icon: MapPin, label: "Opticiens", hint: "Trouver une boutique près de vous" },
  ];

  return (
    <div className={`client-dashboard min-h-screen ${dark ? "dark" : ""}`}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-lunetty-gold-strong">
              Espace client
            </span>
            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-lunetty-ink sm:text-5xl">
              Bonjour, {profile?.prenom ?? user.prenom}
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-lunetty-muted">
              Votre sélection, vos rendez-vous et vos essentiels optiques réunis au même endroit.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSettings("profil")}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-lunetty-line bg-lunetty-surface px-5 text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold hover:bg-lunetty-cream sm:self-auto"
          >
            <Settings aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />
            Paramètres
          </button>
        </header>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lunetty-danger/25 bg-lunetty-danger/5 p-4 text-sm text-lunetty-danger">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadDashboard()} className="min-h-11 rounded-full border border-current/30 px-4 font-semibold hover:bg-current/5">
              Réessayer
            </button>
          </div>
        )}
        {reminder && reminderAppointment && (
          <div role="status" className="rounded-2xl border border-lunetty-gold/40 bg-lunetty-gold/10 px-5 py-4 text-sm text-lunetty-ink">
            <strong>Rappel de réservation</strong> — demain à {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(new Date(reminderAppointment.commence_le))} chez {reminderAppointment.magasin.nom}.
          </div>
        )}

        <nav aria-label="Actions rapides" className="sticky top-20 z-30 -mx-4 flex gap-2 overflow-x-auto border-y border-lunetty-line bg-lunetty-cream/95 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => onNavigate("tryon")} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lunetty-ink px-4 text-sm font-semibold text-lunetty-cream">
            <Sparkles className="h-4 w-4 text-lunetty-gold" /> Studio 3D
          </button>
          {actions.map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => onNavigate(key)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-surface px-4 text-sm font-medium text-lunetty-ink">
              <Icon aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" /> {label}
            </button>
          ))}
          <button type="button" onClick={() => onSettings("ordonnance")} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-lunetty-line bg-lunetty-surface px-4 text-sm font-medium text-lunetty-ink">
            <FileText aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" /> Ordonnance
          </button>
        </nav>

        <section aria-label="Accès rapides" className="hidden grid-cols-5 gap-4 lg:grid">

          {actions.map(({ key, icon: Icon, label, hint }, index) => (
            <motion.button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.06 * (index + 1) }}
              className={`${card} group flex min-h-[260px] flex-col items-start justify-between text-left transition duration-300 hover:-translate-y-1 hover:border-lunetty-gold/60 hover:shadow-[0_20px_50px_rgba(26,23,19,0.1)]`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lunetty-gold/12 text-lunetty-gold-strong transition group-hover:bg-lunetty-gold/20">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <span>
                <span className={`block text-lg font-semibold ${title}`}>{label}</span>
                <span className={`mt-1 block text-sm leading-6 ${muted}`}>{hint}</span>
              </span>
              <ArrowRight aria-hidden="true" className="h-5 w-5 text-lunetty-gold-strong transition-transform group-hover:translate-x-1" />
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={() => onSettings("ordonnance")}
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.18 }}
            className={`${card} group flex min-h-[260px] flex-col items-start justify-between text-left transition duration-300 hover:-translate-y-1 hover:border-lunetty-gold/60`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lunetty-gold/12 text-lunetty-gold-strong">
              <FileText aria-hidden="true" className="h-6 w-6" />
            </span>
            <span>
              <span className={`block text-lg font-semibold ${title}`}>Mon ordonnance</span>
              <span className={`mt-1 block text-sm leading-6 ${muted}`}>
                {activePrescription
                  ? `${activePrescription.prescrit_le ? formatDate(activePrescription.prescrit_le) : "Date non renseignée"} · ${expiryState(activePrescription)}`
                  : "Ajoutez votre document en toute confidentialité."}
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="h-5 w-5 text-lunetty-gold-strong transition-transform group-hover:translate-x-1" />
          </motion.button>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
          <section className={card}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-lunetty-gold-strong">Votre agenda</span>
                <h2 className={`mt-2 font-serif text-3xl ${title}`}>Mes réservations</h2>
                <p className={`mt-1 text-sm ${muted}`}>Vos rendez-vous et montures gardées en boutique.</p>
              </div>
              <Calendar aria-hidden="true" className="mt-2 hidden h-6 w-6 text-lunetty-gold-strong sm:block" />
            </div>

            <div role="tablist" aria-label="Réservations" className="relative mb-5 grid max-w-sm grid-cols-2 rounded-full border border-lunetty-line bg-lunetty-cream p-1">
              <span aria-hidden="true" className={`absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-lunetty-ink shadow-sm transition-transform duration-300 ${activeReservationTab === "history" ? "translate-x-full" : ""}`} />
              {([
                ["upcoming", "À venir"],
                ["history", "Historique"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeReservationTab === key}
                  onClick={() => setActiveReservationTab(key)}
                  className={`relative z-10 min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${activeReservationTab === key ? "text-[#f3eee6]" : muted}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3" role="status" aria-label="Chargement des réservations">
                {[0, 1].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-lunetty-cream" />)}
              </div>
            ) : visibleAppointments.length === 0 ? (
              <div className={`${inner} flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center`}>
                <span className="grid h-16 w-16 place-items-center rounded-full bg-lunetty-gold/15 text-lunetty-gold-strong">
                  <Glasses aria-hidden="true" className="h-9 w-9" />
                </span>
                <h3 className={`mt-4 font-serif text-2xl ${title}`}>
                  {activeReservationTab === "upcoming" ? "Votre prochaine découverte commence ici." : "Votre historique est encore vide."}
                </h3>
                <p className={`mt-2 max-w-md text-sm leading-6 ${muted}`}>
                  {activeReservationTab === "upcoming" ? "Choisissez une monture et retrouvez un opticien pour l’essayer en boutique." : "Vos rendez-vous terminés apparaîtront ici."}
                </p>
                <button type="button" onClick={() => onNavigate("catalog")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream transition hover:bg-lunetty-gold-strong">
                  Réserver une monture <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAppointments.map((appointment) => {
                  const storeAddress = appointment.magasin.adresses[0];
                  const destination = [storeAddress?.ligne_1, storeAddress?.ville].filter(Boolean).join(", ");
                  const canManage = !isTerminal(appointment) && new Date(appointment.commence_le).getTime() >= now;
                  return (
                    <article key={appointment.id} className="rounded-2xl border border-lunetty-line bg-lunetty-surface p-4 sm:p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="relative grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-lunetty-cream sm:h-24 sm:w-28">
                          <Image src="/images/frame-sillage.svg" alt="" fill sizes="112px" className="object-contain p-2" />
                        </div>
                        <div className="min-w-[180px] flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`font-semibold ${title}`}>{appointment.type_service}</h3>
                            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_STYLE[appointment.statut] ?? STATUS_STYLE.DEMANDE}`}>
                              {STATUS_LABEL[appointment.statut] ?? appointment.statut}
                            </span>
                          </div>
                          <p className={`mt-2 flex items-center gap-2 text-sm ${muted}`}>
                            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-lunetty-gold-strong" />
                            {appointment.magasin.nom}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-lunetty-gold-strong">
                            <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
                            {formatDate(appointment.commence_le)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-lunetty-line pt-4">
                        <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination || appointment.magasin.nom)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold">
                          <MapPin aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" /> Itinéraire
                        </a>
                        {canManage && (
                          <>
                            <button type="button" onClick={() => {
                              setRescheduleTarget(appointment);
                              setRescheduleDate(new Date(appointment.commence_le).toISOString().slice(0, 10));
                              setRescheduleTime(new Date(appointment.commence_le).toTimeString().slice(0, 5));
                              setActionError(null);
                            }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold">
                              Reprogrammer
                            </button>
                            <button type="button" onClick={() => setCancelTarget(appointment)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-danger/30 px-4 text-sm font-semibold text-lunetty-danger transition hover:bg-lunetty-danger/5">
                              Annuler
                            </button>
                          </>
                        )}
                        {appointment.magasin.telephone && <a href={`tel:${appointment.magasin.telephone}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold"><Phone aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" /> Appeler</a>}
                      </div>
                      {canManage && prescriptions.length > 0 && (
                        <label className={`mt-4 flex flex-col gap-2 border-t border-lunetty-line pt-4 text-sm ${muted} sm:flex-row sm:items-center`}>
                          <span className="font-semibold">Joindre mon ordonnance</span>
                          <select
                            value={appointment.ordonnance_id ?? ""}
                            onChange={(event) => void attachPrescription(appointment, event.target.value)}
                            className="min-h-11 rounded-xl border border-lunetty-line bg-lunetty-surface px-3 text-lunetty-ink"
                          >
                            <option value="">Aucune ordonnance</option>
                            {prescriptions.map((prescription) => (
                              <option key={prescription.id} value={prescription.id}>
                                {prescription.titre || prescription.nom_fichier || "Ordonnance"}{prescription.est_active ? " · Active" : ""}
                              </option>
                            ))}
                          </select>
                          {appointment.ordonnance_id && <span className="text-emerald-700 dark:text-emerald-300">Visible par cet opticien</span>}
                        </label>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className={`${card} space-y-5`}>
            {loading ? (
              <div className="space-y-4" role="status" aria-label="Chargement du profil">
                <div className="h-16 animate-pulse rounded-xl bg-lunetty-cream" />
                <div className="h-40 animate-pulse rounded-xl bg-lunetty-cream" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-lunetty-gold/50 bg-lunetty-cream">
                    {profile?.url_image_profil ? (
                      <img src={profile.url_image_profil} alt={`Photo de profil de ${profileName}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-serif text-2xl text-lunetty-gold-strong">{profileName.trim().charAt(0).toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className={`truncate text-lg font-semibold ${title}`}>{profileName}</h2>
                    <p className={`truncate text-sm ${muted}`}>{profile?.email ?? user.email}</p>
                  </div>
                </div>

                <div className={`${inner} space-y-3`}>
                  <div className={`flex items-start gap-3 text-sm ${muted}`}><Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lunetty-gold-strong" /><span className="break-all">{profile?.email ?? user.email}</span></div>
                  <div className={`flex items-start gap-3 text-sm ${muted}`}><Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lunetty-gold-strong" /><span>{profile?.telephone ?? "Téléphone non renseigné"}</span></div>
                  <div className={`flex items-start gap-3 text-sm ${muted}`}><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lunetty-gold-strong" /><span>{address ?? "Adresse non renseignée"}</span></div>
                </div>

                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h3 className={`font-semibold ${title}`}>Complétez votre profil</h3>
                      <p className="mt-1 text-sm text-lunetty-muted">
                        {completedProfileSteps === 0
                          ? "Commencez par votre photo"
                          : `${completedProfileSteps} étape${completedProfileSteps > 1 ? "s" : ""} sur 4`}
                      </p>
                    </div>
                    {completedProfileSteps > 0 && <span className="text-sm font-bold text-lunetty-gold-strong">{profileComplete} %</span>}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-lunetty-cream">
                    <div className="h-full rounded-full bg-lunetty-gold transition-[width] duration-500" style={{ width: `${profileComplete}%` }} />
                  </div>
                  <ul className="mt-3 divide-y divide-lunetty-line">
                    {([
                      ["Photo de profil", Boolean(profile?.url_image_profil), "profil"],
                      ["Téléphone", Boolean(profile?.telephone), "profil"],
                      ["Adresse", Boolean(profile?.adresse?.ligne_1 && profile.adresse.ville && profile.adresse.code_postal), "adresse"],
                      ["Ordonnance", prescriptions.length > 0, "ordonnance"],
                    ] as const).map(([label, complete, section]) => (
                      <li key={label}>
                        <button type="button" onClick={() => onSettings(section)} className={`flex min-h-11 w-full items-center gap-3 py-2 text-left text-sm ${complete ? muted : title}`}>
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${complete ? "border-lunetty-gold bg-lunetty-gold text-lunetty-ink" : "border-lunetty-line"}`}>
                            {complete && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                          </span>
                          <span className="flex-1">{label}</span>
                          <ChevronRight aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button type="button" onClick={() => onSettings("profil")} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-lunetty-line text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold">
                  <User aria-hidden="true" className="h-4 w-4 text-lunetty-gold-strong" /> Modifier le profil
                </button>
              </>
            )}
          </aside>
        </div>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-lunetty-gold-strong">Votre sélection</span>
              <h2 className={`mt-1 font-serif text-3xl ${title}`}>Mes favoris</h2>
              <p className={`mt-1 text-sm ${muted}`}>Vos montures préférées, toujours à portée de main.</p>
            </div>
            <button type="button" onClick={() => onNavigate("favorites")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-lunetty-gold-strong hover:underline">
              Tout voir <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Chargement des favoris">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-lunetty-surface" />)}
            </div>
          ) : favorites.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {favorites.slice(0, 4).map(({ produit }) => (
                <CatalogProductCard key={produit.id} product={produit} dark={dark} />
              ))}
            </div>
          ) : (
            <div className={`${card} flex flex-col items-center px-6 py-10 text-center`}>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-lunetty-gold/15 text-lunetty-gold-strong"><Heart aria-hidden="true" className="h-7 w-7" /></span>
              <h3 className={`mt-4 font-serif text-2xl ${title}`}>Une monture vous plaît ? Gardez-la ici.</h3>
              <p className={`mt-2 text-sm ${muted}`}>Touchez le cœur d’un modèle pour le retrouver dans votre sélection.</p>
              <button type="button" onClick={() => onNavigate("catalog")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream">
                Découvrir la collection <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <section className={card}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-lunetty-gold-strong">Votre historique</span>
              <h2 className={`mt-1 font-serif text-3xl ${title}`}>Derniers essais 3D</h2>
              <p className={`mt-1 text-sm ${muted}`}>Retrouvez vos dernières sessions d’essayage.</p>
            </div>
            <Sparkles aria-hidden="true" className="hidden h-6 w-6 text-lunetty-gold-strong sm:block" />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="status" aria-label="Chargement des essais">
              {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-lunetty-cream" />)}
            </div>
          ) : tryOns.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tryOns.slice(0, 3).map((value) => {
                const session = asRecord(value);
                if (!session) return null;
                const date = typeof session.commencee_le === "string" ? session.commencee_le : "";
                return (
                  <article key={String(session.id)} className={`${inner} flex items-center gap-4`}>
                    <div className="relative grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-lunetty-surface">
                      <Image src="/images/frame-sillage.svg" alt="" fill sizes="80px" className="object-contain p-2" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-semibold ${title}`}>Essai virtuel</h3>
                      <p className={`mt-1 text-sm ${muted}`}>{date ? formatDate(date) : "Date non disponible"}</p>
                      <button type="button" onClick={() => onNavigate("tryon")} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-lunetty-gold-strong hover:underline">
                        Reprendre <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={`${inner} flex flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:text-left`}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-lunetty-surface text-lunetty-gold-strong"><Glasses aria-hidden="true" className="h-8 w-8" /></span>
              <div className="flex-1">
                <h3 className={`font-semibold ${title}`}>Votre première session vous attend.</h3>
                <p className={`mt-1 text-sm ${muted}`}>Découvrez les montures et choisissez celle que vous souhaitez essayer.</p>
              </div>
              <button type="button" onClick={() => onNavigate("tryon")} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream">
                Essayer une monture <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>

      {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] rounded-2xl bg-lunetty-ink px-5 py-3 text-sm text-lunetty-cream shadow-2xl">{toast}</div>}

      {cancelTarget && (
        <ConfirmationDialog
          dark={dark}
          title="Annuler cette réservation ?"
          message="Cette action annulera votre rendez-vous auprès de l’opticien."
          error={actionError}
          saving={saving}
          onCancel={() => { setCancelTarget(null); setActionError(null); }}
          onConfirm={() => void cancelAppointment()}
        />
      )}
      {rescheduleTarget && (
        <div role="dialog" aria-modal="true" aria-labelledby="reschedule-title" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={rescheduleAppointment} className="w-full max-w-md rounded-[1.5rem] border border-lunetty-line bg-lunetty-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="reschedule-title" className={`text-lg font-bold ${title}`}>Reprogrammer</h2>
              <button type="button" aria-label="Fermer" onClick={() => { setRescheduleTarget(null); setActionError(null); }} className="grid h-11 w-11 place-items-center rounded-full hover:bg-lunetty-cream"><X className={muted} /></button>
            </div>
            <p className={`mt-2 text-sm ${muted}`}>Choisissez une nouvelle date et une heure. L’opticien devra confirmer le changement.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <label className={`text-xs font-semibold ${muted}`}>Date
                <input required type="date" min={new Date().toISOString().slice(0, 10)} value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-lunetty-line bg-lunetty-surface px-3 text-lunetty-ink" />
              </label>
              <label className={`text-xs font-semibold ${muted}`}>Heure
                <input required type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-lunetty-line bg-lunetty-surface px-3 text-lunetty-ink" />
              </label>
            </div>
            {actionError && <p role="alert" className="mt-3 text-sm text-lunetty-danger">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setRescheduleTarget(null); setActionError(null); }} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${muted}`}>Retour</button>
              <button disabled={saving} className="inline-flex min-h-11 items-center rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream disabled:opacity-50">{saving ? "Envoi…" : "Envoyer la demande"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ConfirmationDialog({
  dark, title, message, error, saving, onCancel, onConfirm,
}: {
  dark: boolean;
  title: string;
  message: string;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-md rounded-[1.5rem] border border-lunetty-line bg-lunetty-surface p-6 shadow-2xl ${dark ? "dark" : ""}`}>
        <h2 id="cancel-title" className="font-serif text-2xl font-medium text-lunetty-ink">{title}</h2>
        <p className="mt-2 text-sm text-lunetty-muted">{message}</p>
        {error && <p role="alert" className="mt-3 text-sm text-lunetty-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-lunetty-muted">Garder</button>
          <button type="button" disabled={saving} onClick={onConfirm} className="inline-flex min-h-11 items-center rounded-full bg-lunetty-danger px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Annulation…" : "Confirmer l’annulation"}</button>
        </div>
      </div>
    </div>
  );
}
