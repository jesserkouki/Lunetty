"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Camera, Check, Download, FileText, LockKeyhole, Moon,
  Sun, Trash2, Upload, UserRound, X,
} from "lucide-react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { syncClerkUser } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { clientsService, type ClientPrescription } from "@/services/clients.service";
import { featuresService } from "@/services/features.service";
import { usersService, type ClientProfile } from "@/services/users.service";
import type { JsonRecord } from "@/services/api";

type ProfileForm = {
  prenom: string;
  nom: string;
  telephone: string;
  adresse: {
    ligne_1: string;
    ville: string;
    code_postal: string;
    code_pays: string;
  };
};
type NotificationPreferences = Record<string, boolean>;

const PRESCRIPTION_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_PRESCRIPTION_BYTES = 10 * 1024 * 1024;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,24}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMINDER_TYPE = "RAPPEL_RENDEZ_VOUS";
const CONFIRMATION_TYPE = "MISE_A_JOUR_RENDEZ_VOUS";
const PENDING_EMAIL_KEY = "lunetty:pending-email-change";

const blankAddress = {
  ligne_1: "",
  ville: "",
  code_postal: "",
  code_pays: "TN",
};

function profileFormFrom(profile: ClientProfile): ProfileForm {
  return {
    prenom: profile.prenom,
    nom: profile.nom,
    telephone: profile.telephone ?? "",
    adresse: profile.adresse ? { ...profile.adresse } : { ...blankAddress },
  };
}

function normalizeName(value: string) {
  return value.trim().replace(/^[\s.,;:]+|[\s.,;:]+$/g, "").replace(/\s+/g, " ");
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function prescriptionWarning(item: ClientPrescription) {
  if (!item.expire_le) return null;
  const days = Math.ceil((new Date(item.expire_le).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Expirée";
  if (days <= 30) return "Expire bientôt";
  return null;
}

async function cropAvatar(file: File, zoom: number) {
  const image = await createImageBitmap(file);
  const side = Math.min(image.width, image.height) / zoom;
  const sourceX = (image.width - side) / 2;
  const sourceY = (image.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer le recadrage de la photo.");
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 512, 512);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Impossible de créer l’image recadrée."));
    }, "image/webp", 0.88);
  });
  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, status, signOut, updateUserProfile } = useAuth();
  const { user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const { themeMode, setThemeMode } = useTheme();
  const dark = themeMode === "dark";
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const prescriptionsInput = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [initialForm, setInitialForm] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<NotificationPreferences>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    title: "",
    examDate: "",
    expiryDate: "",
    note: "",
    active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  const panel = `rounded-3xl border p-6 sm:p-8 shadow-xl ${
    dark ? "border-white/10 bg-[#171514]/90" : "border-stone-200 bg-white"
  }`;
  const heading = dark ? "text-white" : "text-stone-900";
  const muted = dark ? "text-stone-400" : "text-stone-600";
  const inputStyle = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-colors focus:border-amber-500 ${
    dark ? "border-white/10 bg-[#100f0e] text-stone-100" : "border-stone-300 bg-white text-stone-900"
  }`;
  const dirty = Boolean(form && initialForm && JSON.stringify(form) !== JSON.stringify(initialForm));

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextProfile, nextPrescriptions, nextPreferences] = await Promise.all([
        usersService.me(),
        clientsService.prescriptions(),
        featuresService.notificationPreferences(),
      ]);
      const nextForm = profileFormFrom(nextProfile);
      setProfile(nextProfile);
      setForm(nextForm);
      setInitialForm(nextForm);
      setPrescriptions(nextPrescriptions);
      const nextNotifications: NotificationPreferences = {};
      for (const value of nextPreferences) {
        const preference = asRecord(value);
        if (
          preference &&
          typeof preference.type === "string" &&
          typeof preference.canal === "string" &&
          typeof preference.active === "boolean"
        ) {
          nextNotifications[`${preference.type}:${preference.canal}`] = preference.active;
        }
      }
      setNotifications(nextNotifications);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les paramètres.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "guest") router.replace("/");
    if (status === "authenticated") void loadSettings();
  }, [status, router, loadSettings]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!prescriptions.length) {
      setFileUrls({});
      return;
    }
    let active = true;
    const objectUrls: string[] = [];
    Promise.all(
      prescriptions
        .filter((prescription) => prescription.document_present)
        .map(async (prescription) => {
          const blob = await clientsService.prescriptionFile(prescription.id);
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          return [prescription.id, url] as const;
        }),
    )
      .then((entries) => {
        if (active) setFileUrls(Object.fromEntries(entries));
      })
      .catch((fileError: unknown) => {
        if (active) setError(fileError instanceof Error ? fileError.message : "Impossible d’afficher un document.");
      });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [prescriptions]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const pending = window.sessionStorage.getItem(PENDING_EMAIL_KEY);
    const verifiedAddress = clerkUser?.emailAddresses.find(
      (address) =>
        address.emailAddress.toLowerCase() === pending?.toLowerCase() &&
        address.verification?.status === "verified",
    );
    if (!pending || !verifiedAddress || !clerkUser) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (clerkUser.primaryEmailAddressId !== verifiedAddress.id) {
        await clerkUser.update({ primaryEmailAddressId: verifiedAddress.id });
        await clerkUser.reload();
      }
      const token = await getToken();
      if (!token || !active) return;
      const synced = await syncClerkUser(token);
      updateUserProfile({ email: synced.email });
      window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
      setEmailLinkSent(false);
      setToast("Votre adresse e-mail a été vérifiée et mise à jour.");
    }).catch((syncError: unknown) => {
      if (active) setError(syncError instanceof Error ? syncError.message : "Impossible de synchroniser l’adresse e-mail.");
    });
    return () => { active = false; };
  }, [clerkUser, getToken, updateUserProfile]);

  const profileErrors = useMemo(() => {
    if (!form) return {};
    const nameError = (value: string) =>
      normalizeName(value).length < 1 ? "Ce champ est obligatoire." : null;
    const phoneError = form.telephone && !PHONE_PATTERN.test(form.telephone.trim())
      ? "Saisissez un numéro de téléphone valide."
      : null;
    const addressHasValue = Object.values(form.adresse).some((value) => value.trim());
    const addressError = addressHasValue && Object.values(form.adresse).some((value) => !value.trim())
      ? "Complétez la rue, la ville, le code postal et le pays."
      : null;
    return {
      prenom: nameError(form.prenom),
      nom: nameError(form.nom),
      telephone: phoneError,
      adresse: addressError,
    };
  }, [form]);
  const profileValid = Object.values(profileErrors).every((value) => !value);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !dirty || !profileValid) return;
    setSaving(true);
    setError(null);
    try {
      const addressFilled = Object.values(form.adresse).some((value) => value.trim());
      const updated = await usersService.updateMe({
        prenom: normalizeName(form.prenom),
        nom: normalizeName(form.nom),
        telephone: form.telephone.trim() || null,
        ...(addressFilled
          ? {
              adresse: {
                ...form.adresse,
                ligne_1: form.adresse.ligne_1.trim(),
                ville: form.adresse.ville.trim(),
                code_postal: form.adresse.code_postal.trim(),
                code_pays: form.adresse.code_pays.trim().toUpperCase(),
              },
            }
          : {}),
      });
      const nextForm = profileFormFrom(updated);
      setProfile(updated);
      setForm(nextForm);
      setInitialForm(nextForm);
      updateUserProfile({
        prenom: updated.prenom,
        nom: updated.nom,
        telephone: updated.telephone ?? null,
        url_image_profil: updated.url_image_profil ?? null,
      });
      setToast("Votre profil a été enregistré.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return preview;
    });
    setAvatarFile(file);
    setAvatarZoom(1);
    setError(null);
  };

  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSaving(true);
    setError(null);
    try {
      const cropped = await cropAvatar(avatarFile, avatarZoom);
      const result = await usersService.uploadAvatar(cropped);
      setProfile((current) => current ? { ...current, url_image_profil: result.url_image_profil } : current);
      updateUserProfile({ url_image_profil: result.url_image_profil });
      setAvatarFile(null);
      setAvatarPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      setToast("Votre photo de profil a été mise à jour.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Impossible d’envoyer la photo.");
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    setSaving(true);
    setError(null);
    try {
      await usersService.deleteAvatar();
      setProfile((current) => current ? { ...current, url_image_profil: null } : current);
      updateUserProfile({ url_image_profil: null });
      setAvatarFile(null);
      setAvatarPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      setToast("Votre photo a été supprimée.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Impossible de supprimer la photo.");
    } finally {
      setSaving(false);
    }
  };

  const uploadPrescriptions = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const invalid = selected.find((file) => !PRESCRIPTION_TYPES.includes(file.type) || file.size > MAX_PRESCRIPTION_BYTES);
    if (invalid) {
      setError("Chaque ordonnance doit être un fichier JPG, PNG ou PDF de 10 Mo maximum.");
      return;
    }
    setPrescriptionSaving(true);
    setError(null);
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        await clientsService.uploadPrescription(file, {
          titre: prescriptionForm.title.trim() || file.name,
          prescrit_le: prescriptionForm.examDate || undefined,
          expire_le: prescriptionForm.expiryDate || undefined,
          notes: prescriptionForm.note.trim() || undefined,
          est_active: prescriptionForm.active && index === 0,
        });
      }
      setPrescriptions(await clientsService.prescriptions());
      setPrescriptionForm({ title: "", examDate: "", expiryDate: "", note: "", active: false });
      if (prescriptionsInput.current) prescriptionsInput.current.value = "";
      setToast(selected.length > 1 ? "Vos ordonnances ont été ajoutées." : "Votre ordonnance a été ajoutée.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Impossible d’ajouter l’ordonnance.");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const replacePrescription = async (id: string, file?: File) => {
    if (!file) return;
    if (!PRESCRIPTION_TYPES.includes(file.type) || file.size > MAX_PRESCRIPTION_BYTES) {
      setError("Choisissez un JPG, PNG ou PDF de 10 Mo maximum.");
      return;
    }
    setPrescriptionSaving(true);
    setError(null);
    try {
      await clientsService.replacePrescriptionFile(id, file);
      setPrescriptions(await clientsService.prescriptions());
      setToast("Le document a été remplacé.");
    } catch (replaceError) {
      setError(replaceError instanceof Error ? replaceError.message : "Impossible de remplacer le document.");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const removePrescription = async (prescription: ClientPrescription) => {
    if (!window.confirm("Supprimer définitivement cette ordonnance et son fichier ?")) return;
    setPrescriptionSaving(true);
    setError(null);
    try {
      await clientsService.removePrescription(prescription.id);
      setPrescriptions(await clientsService.prescriptions());
      setToast("L’ordonnance a été supprimée.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Impossible de supprimer l’ordonnance.");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const setPrescriptionActive = async (prescription: ClientPrescription) => {
    setPrescriptionSaving(true);
    setError(null);
    try {
      await clientsService.updatePrescription(prescription.id, { est_active: true });
      setPrescriptions(await clientsService.prescriptions());
      setToast("L’ordonnance active a été mise à jour.");
    } catch (activeError) {
      setError(activeError instanceof Error ? activeError.message : "Impossible de modifier l’ordonnance active.");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const changePreference = async (type: string, channel: "EMAIL" | "SMS", active: boolean) => {
    const key = `${type}:${channel}`;
    setNotifications((current) => ({ ...current, [key]: active }));
    try {
      await featuresService.updateNotificationPreference({ type, canal: channel, active });
      setToast("Préférence de notification enregistrée.");
    } catch (preferenceError) {
      setNotifications((current) => ({ ...current, [key]: !active }));
      setError(preferenceError instanceof Error ? preferenceError.message : "Impossible d’enregistrer la préférence.");
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      const updated = await usersService.updateMe({ langue_preferee: language });
      setProfile(updated);
      updateUserProfile({ langue_preferee: language });
      setToast("Langue préférée enregistrée.");
    } catch (languageError) {
      setError(languageError instanceof Error ? languageError.message : "Impossible d’enregistrer la langue.");
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.next.length < 12 || passwordForm.next !== passwordForm.confirm) return;
    setSaving(true);
    setError(null);
    try {
      if (clerkUser) {
        await clerkUser.updatePassword({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        });
      } else {
        await usersService.changePassword(passwordForm.current, passwordForm.next);
      }
      setPasswordForm({ current: "", next: "", confirm: "" });
      setToast("Votre mot de passe a été modifié.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  const requestEmailLink = async () => {
    const email = newEmail.trim();
    if (!clerkUser) {
      setError("La vérification de changement d’e-mail n’est pas disponible pour ce type de compte.");
      return;
    }
    if (!EMAIL_PATTERN.test(email) || email.toLowerCase() === profile?.email.toLowerCase()) {
      setError("Saisissez une nouvelle adresse e-mail valide.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const address = await clerkUser.createEmailAddress({ email });
      await address.prepareVerification({
        strategy: "email_link",
        redirectUrl: `${window.location.origin}/account/settings`,
      });
      window.sessionStorage.setItem(PENDING_EMAIL_KEY, email);
      setEmailLinkSent(true);
      setToast("Un lien de vérification a été envoyé à la nouvelle adresse.");
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "Impossible d’envoyer le lien de vérification.");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setError(null);
    try {
      const data = await usersService.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lunetty-mes-donnees.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setToast("Votre export de données est prêt.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Impossible d’exporter vos données.");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") return;
    setSaving(true);
    setError(null);
    try {
      await usersService.deactivateMe();
      if (clerkUser) await clerkUser.delete();
      signOut();
      router.replace("/");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de supprimer le compte.");
      setSaving(false);
    }
  };

  const passwordStrength = useMemo(() => {
    const value = passwordForm.next;
    if (!value) return { score: 0, label: "Saisissez un nouveau mot de passe" };
    const score = [
      value.length >= 12,
      /[a-z]/.test(value) && /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
    return {
      score,
      label: score <= 1 ? "Faible" : score <= 2 ? "Moyen" : score === 3 ? "Bon" : "Fort",
    };
  }, [passwordForm.next]);

  const goBack = () => {
    if (dirty && !window.confirm("Vous avez des modifications non enregistrées. Quitter cette page ?")) return;
    router.push("/");
  };

  if (status === "loading" || loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[#FBFAF7] text-stone-600">Chargement des paramètres…</main>;
  }
  if (!user || !profile || !form) return null;

  return (
    <main className={`min-h-screen px-4 py-10 sm:px-8 ${dark ? "bg-[#100f0e] text-stone-100" : "bg-[#FBFAF7] text-stone-900"}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        <button type="button" onClick={goBack} className={`inline-flex items-center gap-2 text-sm font-semibold ${muted} hover:text-amber-600`}>
          <ArrowLeft className="h-4 w-4" /> Retour à l’espace client
        </button>
        <header>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-200">Espace Client</span>
          <h1 className={`mt-1 text-3xl font-light font-display ${heading}`}>Paramètres</h1>
          <p className={`mt-2 text-sm ${muted}`}>Gérez vos informations personnelles et vos préférences.</p>
        </header>

        {error && <div role="alert" className={`rounded-2xl border px-4 py-3 text-sm ${dark ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{error}</div>}

        <section id="profil" className={panel}>
          <div className="flex items-start gap-3 mb-6">
            <UserRound className="mt-1 h-5 w-5 text-amber-500" />
            <div><h2 className={`text-lg font-bold ${heading}`}>Profil</h2><p className={`mt-1 text-xs ${muted}`}>Vos informations sont utilisées pour vos réservations.</p></div>
          </div>

          <div id="avatar" className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className={`relative h-24 w-24 overflow-hidden rounded-full border-2 border-amber-400 bg-stone-200 ${dark ? "bg-stone-800" : ""}`}>
              {(avatarPreview || profile.url_image_profil) ? (
                <img
                  src={avatarPreview ?? profile.url_image_profil ?? ""}
                  alt="Aperçu de la photo de profil"
                  className="h-full w-full object-cover transition-transform"
                  style={{ transform: `scale(${avatarPreview ? avatarZoom : 1})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-amber-600">
                  {normalizeName(form.prenom).charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-amber-500 p-1.5 text-white"><Camera className="h-3.5 w-3.5" /></span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => avatarInput.current?.click()} className="rounded-xl border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                  Choisir une photo
                </button>
                {(profile.url_image_profil || avatarPreview) && <button type="button" disabled={saving} onClick={() => void removeAvatar()} className="rounded-xl border border-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-600">Supprimer la photo</button>}
                {avatarFile && <button type="button" disabled={saving} onClick={() => void saveAvatar()} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? "Envoi…" : "Enregistrer la photo"}</button>}
              </div>
              {avatarPreview && (
                <label className={`block max-w-sm text-xs ${muted}`}>
                  Recadrer la photo
                  <input aria-label="Zoom de recadrage" type="range" min="1" max="2.5" step="0.05" value={avatarZoom} onChange={(event) => setAvatarZoom(Number(event.target.value))} className="mt-2 block w-full accent-amber-500" />
                </label>
              )}
              <p className={`text-xs ${muted}`}>JPG, PNG ou WebP · 5 Mo maximum. La photo est recadrée au carré et optimisée avant l’envoi.</p>
              <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void chooseAvatar(event.target.files?.[0])} />
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" value={form.prenom} error={profileErrors.prenom} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, prenom: value } : current)} />
              <Field label="Nom" value={form.nom} error={profileErrors.nom} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, nom: value } : current)} />
              <label className={`block text-xs font-semibold ${muted}`}>Adresse e-mail
                <input readOnly value={profile.email} className={`${inputStyle} mt-1.5 opacity-70`} />
              </label>
              <Field label="Téléphone" value={form.telephone} error={profileErrors.telephone} inputStyle={inputStyle} placeholder="+216 12 345 678" onChange={(value) => setForm((current) => current ? { ...current, telephone: value } : current)} />
            </div>
            <div id="adresse" className="space-y-4">
              <h3 className={`text-sm font-bold ${heading}`}>Adresse</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rue et numéro" value={form.adresse.ligne_1} error={profileErrors.adresse} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, adresse: { ...current.adresse, ligne_1: value } } : current)} />
                <Field label="Ville" value={form.adresse.ville} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, adresse: { ...current.adresse, ville: value } } : current)} />
                <Field label="Code postal" value={form.adresse.code_postal} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, adresse: { ...current.adresse, code_postal: value } } : current)} />
                <Field label="Pays (code ISO)" value={form.adresse.code_pays} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, adresse: { ...current.adresse, code_pays: value } } : current)} />
              </div>
            </div>
            <div className="flex justify-end border-t border-stone-200/60 pt-4 dark:border-white/10">
              <button disabled={!dirty || !profileValid || saving} className="rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-amber-100">
                {saving ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </section>

        <section id="ordonnance" className={panel}>
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-5 w-5 text-amber-500" />
            <div>
              <h2 className={`text-lg font-bold ${heading}`}>Mon ordonnance</h2>
              <p className={`mt-1 text-xs ${muted}`}>Visible uniquement par vous et l’opticien que vous choisissez.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {prescriptions.map((prescription) => {
              const warning = prescriptionWarning(prescription);
              const fileUrl = fileUrls[prescription.id];
              return (
                <article key={prescription.id} className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-[#100f0e]" : "border-stone-200 bg-stone-50"}`}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border flex items-center justify-center ${dark ? "border-white/10 bg-black/20" : "border-stone-200 bg-white"}`}>
                      {fileUrl && prescription.type_fichier?.startsWith("image/") ? <img src={fileUrl} alt="Aperçu de l’ordonnance" className="h-full w-full object-cover" /> : <FileText className="h-8 w-8 text-amber-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold ${heading}`}>{prescription.titre || prescription.nom_fichier || "Ordonnance"}</h3>
                        {prescription.est_active && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">Active</span>}
                        {warning && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${warning === "Expirée" ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-200"}`}>{warning}</span>}
                      </div>
                      <p className={`mt-1 text-xs ${muted}`}>Examen : {prescription.prescrit_le ? new Date(prescription.prescrit_le).toLocaleDateString("fr-FR") : "Date non renseignée"}{prescription.expire_le ? ` · Expire le ${new Date(prescription.expire_le).toLocaleDateString("fr-FR")}` : ""}</p>
                      {prescription.notes && <p className={`mt-2 text-xs ${muted}`}>{prescription.notes}</p>}
                      <p className={`mt-1 text-[11px] ${muted}`}>{prescription.nom_fichier ?? "Document sans fichier"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fileUrl && <button type="button" onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")} className="rounded-lg border border-amber-500/30 px-3 py-2 text-[11px] font-bold text-amber-700 dark:text-amber-200">Voir</button>}
                        <label className="cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-[11px] font-semibold text-stone-700 dark:border-white/10 dark:text-stone-300">
                          Remplacer
                          <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(event) => void replacePrescription(prescription.id, event.target.files?.[0])} />
                        </label>
                        {!prescription.est_active && <button type="button" disabled={prescriptionSaving} onClick={() => void setPrescriptionActive(prescription)} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Définir comme active</button>}
                        <button type="button" disabled={prescriptionSaving} onClick={() => void removePrescription(prescription)} className="rounded-lg border border-rose-500/25 px-3 py-2 text-[11px] font-semibold text-rose-600">Supprimer</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {!prescriptions.length && <p className={`rounded-2xl border border-dashed p-6 text-center text-sm ${muted}`}>Aucune ordonnance enregistrée.</p>}
          </div>
          <div className={`mt-5 rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/[0.03]" : "border-stone-200 bg-stone-50"}`}>
            <h3 className={`text-sm font-bold ${heading}`}>Ajouter une ordonnance</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nom (facultatif)" value={prescriptionForm.title} inputStyle={inputStyle} onChange={(value) => setPrescriptionForm((current) => ({ ...current, title: value }))} />
              <label className={`block text-xs font-semibold ${muted}`}>Date de l’examen
                <input type="date" value={prescriptionForm.examDate} onChange={(event) => setPrescriptionForm((current) => ({ ...current, examDate: event.target.value }))} className={`${inputStyle} mt-1.5`} />
              </label>
              <label className={`block text-xs font-semibold ${muted}`}>Date d’expiration (facultative)
                <input type="date" min={prescriptionForm.examDate || undefined} value={prescriptionForm.expiryDate} onChange={(event) => setPrescriptionForm((current) => ({ ...current, expiryDate: event.target.value }))} className={`${inputStyle} mt-1.5`} />
              </label>
              <label className={`block text-xs font-semibold ${muted}`}>Note (facultative)
                <input value={prescriptionForm.note} onChange={(event) => setPrescriptionForm((current) => ({ ...current, note: event.target.value }))} className={`${inputStyle} mt-1.5`} maxLength={1000} />
              </label>
            </div>
            <label className={`mt-4 flex items-center gap-2 text-xs ${muted}`}>
              <input type="checkbox" checked={prescriptionForm.active || prescriptions.length === 0} onChange={(event) => setPrescriptionForm((current) => ({ ...current, active: event.target.checked }))} className="accent-amber-500" />
              Marquer comme ordonnance active
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input ref={prescriptionsInput} type="file" multiple accept="image/jpeg,image/png,application/pdf" onChange={(event) => void uploadPrescriptions(event.target.files)} className="sr-only" id="prescription-files" />
              <button type="button" disabled={prescriptionSaving} onClick={() => prescriptionsInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
                <Upload className="h-4 w-4" /> {prescriptionSaving ? "Envoi…" : "Choisir un fichier"}
              </button>
              <span className={`text-xs ${muted}`}>JPG, PNG ou PDF · 10 Mo maximum · plusieurs fichiers autorisés</span>
            </div>
          </div>
        </section>

        <section id="security" className={panel}>
          <div className="flex items-start gap-3 mb-6"><LockKeyhole className="mt-1 h-5 w-5 text-amber-500" /><div><h2 className={`text-lg font-bold ${heading}`}>Sécurité</h2><p className={`mt-1 text-xs ${muted}`}>Protégez l’accès à votre compte.</p></div></div>
          <form onSubmit={changePassword} className="space-y-4">
            <h3 className={`text-sm font-bold ${heading}`}>Changer le mot de passe</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <PasswordField label="Mot de passe actuel" value={passwordForm.current} disabled={Boolean(clerkUser)} inputStyle={inputStyle} onChange={(value) => setPasswordForm((current) => ({ ...current, current: value }))} />
              <PasswordField label="Nouveau mot de passe" value={passwordForm.next} inputStyle={inputStyle} onChange={(value) => setPasswordForm((current) => ({ ...current, next: value }))} />
              <PasswordField label="Confirmer le mot de passe" value={passwordForm.confirm} inputStyle={inputStyle} onChange={(value) => setPasswordForm((current) => ({ ...current, confirm: value }))} />
            </div>
            <div aria-live="polite">
              <div className="flex gap-1">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${passwordStrength.score >= step ? "bg-amber-500" : dark ? "bg-white/10" : "bg-stone-200"}`} />)}</div>
              <p className={`mt-1 text-[11px] ${muted}`}>{passwordStrength.label} · 12 caractères minimum</p>
            </div>
            {passwordForm.next && passwordForm.next !== passwordForm.confirm && <p className="text-xs text-rose-500">Les mots de passe ne correspondent pas.</p>}
            <button disabled={saving || passwordForm.next.length < 12 || passwordForm.next !== passwordForm.confirm || (!clerkUser && !passwordForm.current)} className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-bold disabled:opacity-40 dark:border-white/10">Modifier le mot de passe</button>
          </form>
          <div className={`my-7 border-t ${dark ? "border-white/10" : "border-stone-200"}`} />
          <div className="space-y-3">
            <h3 className={`text-sm font-bold ${heading}`}>Changer l’adresse e-mail</h3>
            <p className={`text-xs ${muted}`}>Un lien de vérification sera envoyé à votre nouvelle adresse.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="nouvelle-adresse@exemple.com" className={`${inputStyle} flex-1`} />
              <button type="button" disabled={saving || !clerkUser} onClick={() => void requestEmailLink()} className="shrink-0 rounded-xl bg-stone-900 px-4 py-3 text-xs font-bold text-white disabled:opacity-40 dark:bg-stone-100 dark:text-stone-950">Envoyer un lien</button>
            </div>
            {emailLinkSent && <p role="status" className="text-xs text-emerald-600 dark:text-emerald-300">Lien envoyé. Confirmez la nouvelle adresse depuis votre boîte e-mail.</p>}
            {!clerkUser && <p className={`text-[11px] ${muted}`}>La modification vérifiée de l’adresse est gérée par le fournisseur d’identité du compte.</p>}
          </div>
        </section>

        <section id="preferences" className={panel}>
          <h2 className={`text-lg font-bold ${heading}`}>Préférences</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <label className={`text-xs font-semibold ${muted}`}>Langue préférée
              <select value={profile.langue_preferee ?? "fr"} onChange={(event) => void changeLanguage(event.target.value)} className={`${inputStyle} mt-1.5`}>
                <option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option>
              </select>
            </label>
            <div>
              <span className={`block text-xs font-semibold ${muted}`}>Apparence</span>
              <button type="button" onClick={() => setThemeMode(dark ? "light" : "dark")} className={`mt-1.5 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${dark ? "border-white/10 bg-[#100f0e]" : "border-stone-300 bg-white"}`}>
                <span className="flex items-center gap-2">{dark ? <Moon className="h-4 w-4 text-amber-400" /> : <Sun className="h-4 w-4 text-amber-500" />}{dark ? "Mode sombre" : "Mode clair"}</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-200">Changer</span>
              </button>
            </div>
          </div>
          <div className="mt-7 space-y-4">
            <h3 className={`text-sm font-bold ${heading}`}>Notifications de réservation</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead><tr className={`${muted}`}><th className="py-2 font-semibold">Type</th><th className="py-2 font-semibold">E-mail</th><th className="py-2 font-semibold">SMS</th></tr></thead>
                <tbody>
                  {([
                    [CONFIRMATION_TYPE, "Confirmations de réservation"],
                    [REMINDER_TYPE, "Rappels la veille"],
                  ] as const).map(([type, label]) => (
                    <tr key={type} className={`border-t ${dark ? "border-white/10" : "border-stone-200"}`}>
                      <td className={`py-3 font-medium ${heading}`}>{label}</td>
                      {(["EMAIL", "SMS"] as const).map((channel) => (
                        <td key={channel} className="py-3">
                          <input
                            type="checkbox"
                            aria-label={`${label} par ${channel === "EMAIL" ? "e-mail" : "SMS"}`}
                            checked={notifications[`${type}:${channel}`] ?? false}
                            onChange={(event) => void changePreference(type, channel, event.target.checked)}
                            className="h-4 w-4 accent-amber-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`text-[11px] ${muted}`}>Les notifications par e-mail et SMS sont envoyées uniquement si un canal de livraison est configuré pour votre compte.</p>
          </div>
        </section>

        <section id="danger-zone" className={`rounded-3xl border p-6 sm:p-8 ${dark ? "border-rose-400/20 bg-rose-500/[0.03]" : "border-rose-200 bg-rose-50/60"}`}>
          <h2 className="text-lg font-bold text-rose-700 dark:text-rose-300">Zone de danger</h2>
          <p className={`mt-1 text-xs ${muted}`}>Téléchargez une copie de vos données ou supprimez votre compte.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void exportData()} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${dark ? "border-white/10 text-stone-200" : "border-stone-300 text-stone-800"}`}><Download className="h-4 w-4" /> Exporter mes données (JSON)</button>
            <button type="button" onClick={() => { setShowDeleteModal(true); setDeleteConfirmation(""); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold text-white hover:bg-rose-700"><Trash2 className="h-4 w-4" /> Supprimer mon compte</button>
          </div>
        </section>

        <footer className="flex items-center justify-between pb-8">
          <button type="button" onClick={goBack} className={`text-xs font-semibold ${muted}`}>← Retour</button>
          {dirty && <span className="text-xs font-semibold text-amber-700 dark:text-amber-200">Modifications non enregistrées</span>}
        </footer>
      </div>

      {toast && <div role="status" className="fixed bottom-5 right-5 z-[90] rounded-2xl bg-stone-900 px-5 py-3 text-sm text-white shadow-2xl">{toast}</div>}
      {showDeleteModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${dark ? "border-rose-400/20 bg-[#171514]" : "border-rose-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-4"><div><h2 id="delete-title" className="text-lg font-bold text-rose-600">Supprimer le compte ?</h2><p className={`mt-2 text-sm ${muted}`}>Cette action est irréversible. Vos documents de santé privés seront également supprimés.</p></div><button type="button" aria-label="Fermer" onClick={() => setShowDeleteModal(false)}><X className={muted} /></button></div>
            <label className={`mt-5 block text-xs font-semibold ${muted}`}>Tapez SUPPRIMER pour confirmer
              <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className={`${inputStyle} mt-1.5`} />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${muted}`}>Annuler</button>
              <button type="button" disabled={deleteConfirmation !== "SUPPRIMER" || saving} onClick={() => void deleteAccount()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">{saving ? "Suppression…" : "Supprimer définitivement"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label, value, error, inputStyle, placeholder, onChange,
}: {
  label: string;
  value: string;
  error?: string | null;
  inputStyle: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">{label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputStyle} mt-1.5`} />
      {error && <span className="mt-1 block text-[11px] font-medium text-rose-500">{error}</span>}
    </label>
  );
}

function PasswordField({
  label, value, inputStyle, onChange, disabled,
}: {
  label: string;
  value: string;
  inputStyle: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">{label}
      <input type="password" autoComplete="new-password" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`${inputStyle} mt-1.5 disabled:opacity-50`} />
    </label>
  );
}
