"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar, Clock, Glasses, Mail, MapPin, Phone, Search, Settings,
  Sparkles, User, Heart, FileText, Check, X, ArrowUpRight,
} from "lucide-react";
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

type Props = {
  user: CurrentUser;
  dark: boolean;
  onNavigate: (tab: "landing" | "tryon" | "catalog" | "favorites") => void;
  onSettings: (section?: string) => void;
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRME: "border-emerald-500/30 bg-emerald-900/20 text-emerald-500",
  DEMANDE: "border-amber-500/30 bg-amber-900/20 text-amber-500",
  REPLANIFIE: "border-sky-500/30 bg-sky-900/20 text-sky-500",
  ANNULE: "border-rose-500/30 bg-rose-900/20 text-rose-500",
  TERMINE: "border-stone-500/30 bg-stone-500/10 text-stone-500",
  ABSENT: "border-rose-500/30 bg-rose-900/20 text-rose-500",
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

  const card = `border rounded-3xl p-6 shadow-xl ${
    dark ? "bg-[#171514]/90 border-white/10" : "bg-white border-stone-200"
  }`;
  const inner = `p-4 rounded-2xl border ${
    dark ? "bg-[#100f0e] border-white/10" : "bg-stone-100 border-stone-200"
  }`;
  const title = dark ? "text-white" : "text-stone-900";
  const muted = dark ? "text-stone-400" : "text-stone-600";
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
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const now = Date.now();
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
    { key: "tryon" as const, icon: Sparkles, label: "Studio 3D", hint: "Essayer une monture" },
    { key: "catalog" as const, icon: Search, label: "Catalogue", hint: "Parcourir les modèles" },
    { key: "landing" as const, icon: MapPin, label: "Opticiens", hint: "Trouver un magasin" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-[0.3em]">
            Espace Client
          </span>
          <h1 className={`text-3xl sm:text-4xl font-light font-display tracking-wide mt-1 ${title}`}>
            Bonjour, {profile?.prenom ?? user.prenom}
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>Retrouvez vos réservations et vos essayages en un coup d’œil.</p>
        </div>
        <button
          type="button"
          onClick={() => onSettings("profil")}
          className="self-start md:self-auto inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-200 hover:bg-amber-500/15"
        >
          <Settings className="h-4 w-4" /> Paramètres
        </button>
      </header>

      {loadError && (
        <div role="alert" className={`rounded-2xl border p-4 text-sm ${dark ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          <div className="flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadDashboard()} className="font-bold underline">Réessayer</button>
          </div>
        </div>
      )}
      {reminder && reminderAppointment && (
        <div role="status" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-100">
          <strong>Rappel de réservation</strong> — demain à {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(new Date(reminderAppointment.commence_le))} chez {reminderAppointment.magasin.nom}.
        </div>
      )}

      <section aria-label="Accès rapides" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map(({ key, icon: Icon, label, hint }) => (
          <button key={key} type="button" onClick={() => onNavigate(key)} className={`${card} text-left group hover:border-amber-500/40 transition-all`}>
            <Icon className="w-5 h-5 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
            <div className={`font-bold text-sm ${title}`}>{label}</div>
            <div className={`text-xs mt-0.5 ${muted}`}>{hint}</div>
          </button>
        ))}
        <button type="button" onClick={() => onSettings("ordonnance")} className={`${card} text-left group hover:border-amber-500/40 transition-all`}>
          <FileText className="w-5 h-5 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
          <div className={`font-bold text-sm ${title}`}>Mon ordonnance</div>
          {activePrescription ? (
            <div className={`text-xs mt-0.5 ${muted}`}>
              {activePrescription.prescrit_le ? formatDate(activePrescription.prescrit_le) : "Date non renseignée"} · {expiryState(activePrescription)}
            </div>
          ) : (
            <div className="text-xs mt-0.5 font-semibold text-amber-600 dark:text-amber-200">Ajouter</div>
          )}
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className={`${card} lg:col-span-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-lg font-bold ${title}`}>Mes Réservations</h2>
              <p className={`text-xs ${muted}`}>Montures gardées en magasin pour vous</p>
            </div>
            <Calendar className="w-5 h-5 text-amber-500 hidden sm:block" />
          </div>
          <div className={`flex gap-2 border-b pb-3 mb-4 ${dark ? "border-white/10" : "border-stone-200"}`}>
            {([
              ["upcoming", "À venir"],
              ["history", "Historique"],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setActiveReservationTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-bold ${activeReservationTab === key ? "bg-amber-500 text-white" : muted}`}>
                {label}
              </button>
            ))}
          </div>
          {loading ? (
            <p role="status" className={`py-8 text-center text-sm ${muted}`}>Chargement de vos réservations…</p>
          ) : visibleAppointments.length === 0 ? (
            <div className={`${inner} text-center py-10 text-xs ${muted}`}>
              {activeReservationTab === "upcoming" ? "Aucune réservation à venir." : "Aucune réservation dans l’historique."}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAppointments.map((appointment) => {
                const storeAddress = appointment.magasin.adresses[0];
                const destination = [storeAddress?.ligne_1, storeAddress?.ville].filter(Boolean).join(", ");
                const canManage = !isTerminal(appointment) && new Date(appointment.commence_le).getTime() >= Date.now();
                return (
                  <article key={appointment.id} className={`${inner} space-y-3`}>
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <div className={`font-bold text-sm ${title}`}>{appointment.type_service}</div>
                        <div className={`text-[11px] ${muted}`}>{appointment.magasin.nom}{destination ? ` · ${destination}` : ""}</div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-200 font-semibold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {formatDate(appointment.commence_le)}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 border text-[10px] font-semibold rounded-lg shrink-0 ${STATUS_STYLE[appointment.statut] ?? STATUS_STYLE.DEMANDE}`}>
                        {STATUS_LABEL[appointment.statut] ?? appointment.statut}
                      </span>
                    </div>
                    {canManage && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setCancelTarget(appointment)} className="rounded-lg border border-rose-500/25 px-3 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10">Annuler</button>
                          <button type="button" onClick={() => {
                            setRescheduleTarget(appointment);
                            setRescheduleDate(new Date(appointment.commence_le).toISOString().slice(0, 10));
                            setRescheduleTime(new Date(appointment.commence_le).toTimeString().slice(0, 5));
                            setActionError(null);
                          }} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${dark ? "border-white/10 text-stone-300 hover:bg-white/5" : "border-stone-300 text-stone-700 hover:bg-stone-200"}`}>Reprogrammer</button>
                          <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination || appointment.magasin.nom)}`} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${dark ? "border-white/10 text-stone-300 hover:bg-white/5" : "border-stone-300 text-stone-700 hover:bg-stone-200"}`}>Itinéraire</a>
                          {appointment.magasin.telephone && <a href={`tel:${appointment.magasin.telephone}`} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${dark ? "border-white/10 text-stone-300 hover:bg-white/5" : "border-stone-300 text-stone-700 hover:bg-stone-200"}`}>Appeler</a>}
                        </div>
                        {prescriptions.length > 0 && (
                          <label className={`flex flex-col sm:flex-row sm:items-center gap-2 text-xs ${muted}`}>
                            <span className="font-semibold">Joindre mon ordonnance</span>
                            <select
                              value={appointment.ordonnance_id ?? ""}
                              onChange={(event) => void attachPrescription(appointment, event.target.value)}
                              className={`rounded-xl border px-3 py-2 outline-none ${dark ? "border-white/10 bg-[#121110] text-white" : "border-stone-300 bg-white text-stone-800"}`}
                            >
                              <option value="">Aucune ordonnance</option>
                              {prescriptions.map((prescription) => (
                                <option key={prescription.id} value={prescription.id}>
                                  {prescription.titre || prescription.nom_fichier || "Ordonnance"}{prescription.est_active ? " · Active" : ""}
                                </option>
                              ))}
                            </select>
                            {appointment.ordonnance_id && <span className="text-emerald-600 dark:text-emerald-300">Visible par cet opticien</span>}
                          </label>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className={`${card} lg:col-span-4 space-y-5`}>
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-stone-200 via-amber-200 to-amber-500 p-[1.5px] shrink-0">
              <div className={`w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center ${dark ? "bg-[#121110]" : "bg-stone-900"}`}>
                {profile?.url_image_profil ? (
                  <img src={profile.url_image_profil} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-amber-200">{profileName.trim().charAt(0).toUpperCase() || "?"}</span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-bold truncate ${title}`}>{profileName}</div>
              <div className={`text-xs truncate ${muted}`}>{profile?.email ?? user.email}</div>
            </div>
          </div>
          <div className={`${inner} space-y-3 text-xs`}>
            <div className={`flex items-start gap-2 ${muted}`}><Mail className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" /><span className="break-all">{profile?.email ?? user.email}</span></div>
            <div className={`flex items-start gap-2 ${muted}`}><Phone className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" /><span>{profile?.telephone ?? "Téléphone non renseigné"}</span></div>
            <div className={`flex items-start gap-2 ${muted}`}><MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" /><span>{address ?? "Adresse non renseignée"}</span></div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className={`font-semibold ${title}`}>Profil complet</span>
              <span className="font-bold text-amber-600 dark:text-amber-200">{profileComplete} %</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-stone-200"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${profileComplete}%` }} />
            </div>
            <ul className="mt-3 space-y-2">
              {([
                ["Photo de profil", Boolean(profile?.url_image_profil), "profil"],
                ["Téléphone", Boolean(profile?.telephone), "profil"],
                ["Adresse", Boolean(profile?.adresse), "adresse"],
                ["Ordonnance", prescriptions.length > 0, "ordonnance"],
              ] as const).map(([label, complete, section]) => (
                <li key={label}>
                  <button type="button" onClick={() => onSettings(section)} className={`flex items-center gap-2 text-xs ${complete ? muted : "text-amber-700 dark:text-amber-200 hover:underline"}`}>
                    {complete ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current" />}
                    {label}{!complete && <ArrowUpRight className="w-3 h-3" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => onSettings("profil")} className={`w-full rounded-xl border px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 ${dark ? "border-white/10 text-stone-200 hover:bg-white/5" : "border-stone-300 text-stone-800 hover:bg-stone-100"}`}>
            <User className="w-4 h-4" /> Modifier le profil
          </button>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${title}`}>Mes favoris</h2>
            <p className={`text-xs mt-1 ${muted}`}>Vos montures préférées, toujours à portée de main.</p>
          </div>
          <button type="button" onClick={() => onNavigate("favorites")} className="text-xs font-bold text-amber-600 dark:text-amber-200 hover:underline">Tout voir</button>
        </div>
        {favorites.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favorites.slice(0, 4).map(({ produit }) => (
              <CatalogProductCard key={produit.id} product={produit} dark={dark} returnTab="landing" />
            ))}
          </div>
        ) : (
          <div className={`${card} text-sm ${muted}`}>
            <Heart className="inline w-4 h-4 mr-2 text-amber-500" />
            Aucun favori pour le moment. <button type="button" onClick={() => onNavigate("catalog")} className="font-bold text-amber-600 dark:text-amber-200 underline">Découvrir le catalogue</button>
          </div>
        )}
      </section>

      <section className={`${card}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-lg font-bold ${title}`}>Derniers essais 3D</h2>
            <p className={`text-xs mt-1 ${muted}`}>Retrouvez vos dernières sessions d’essayage.</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        {tryOns.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tryOns.slice(0, 3).map((value) => {
              const session = asRecord(value);
              if (!session) return null;
              const date = typeof session.commencee_le === "string" ? session.commencee_le : "";
              return (
                <div key={String(session.id)} className={`${inner} flex items-center gap-3`}>
                  <Glasses className="w-5 h-5 text-amber-500" />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${title}`}>Essai 3D</div>
                    <div className={`text-xs ${muted}`}>{date ? formatDate(date) : "Date non disponible"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${inner} flex flex-wrap items-center justify-between gap-3`}>
            <p className={`text-xs ${muted}`}>Aucun essai 3D récent.</p>
            <button type="button" onClick={() => onNavigate("tryon")} className="text-xs font-bold text-amber-600 dark:text-amber-200 hover:underline">Essayer une monture</button>
          </div>
        )}
      </section>

      {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] rounded-2xl bg-stone-900 text-white px-5 py-3 text-sm shadow-2xl">{toast}</div>}

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
          <form onSubmit={rescheduleAppointment} className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${dark ? "border-white/10 bg-[#171514]" : "border-stone-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 id="reschedule-title" className={`text-lg font-bold ${title}`}>Reprogrammer</h2>
              <button type="button" aria-label="Fermer" onClick={() => { setRescheduleTarget(null); setActionError(null); }}><X className={muted} /></button>
            </div>
            <p className={`mt-2 text-sm ${muted}`}>Choisissez une nouvelle date et une heure. L’opticien devra confirmer le changement.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <label className={`text-xs font-semibold ${muted}`}>Date
                <input required type="date" min={new Date().toISOString().slice(0, 10)} value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2.5 ${dark ? "border-white/10 bg-[#100f0e] text-white" : "border-stone-300 bg-white text-stone-900"}`} />
              </label>
              <label className={`text-xs font-semibold ${muted}`}>Heure
                <input required type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2.5 ${dark ? "border-white/10 bg-[#100f0e] text-white" : "border-stone-300 bg-white text-stone-900"}`} />
              </label>
            </div>
            {actionError && <p role="alert" className="mt-3 text-xs text-rose-500">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setRescheduleTarget(null); setActionError(null); }} className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${muted}`}>Retour</button>
              <button disabled={saving} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Envoi…" : "Envoyer la demande"}</button>
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
      <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${dark ? "border-white/10 bg-[#171514]" : "border-stone-200 bg-white"}`}>
        <h2 id="cancel-title" className={`text-lg font-bold ${dark ? "text-white" : "text-stone-900"}`}>{title}</h2>
        <p className={`mt-2 text-sm ${dark ? "text-stone-400" : "text-stone-600"}`}>{message}</p>
        {error && <p role="alert" className="mt-3 text-xs text-rose-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${dark ? "text-stone-300" : "text-stone-600"}`}>Garder</button>
          <button type="button" disabled={saving} onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Annulation…" : "Confirmer l’annulation"}</button>
        </div>
      </div>
    </div>
  );
}
