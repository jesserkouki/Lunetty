"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, Download, Eye,
  EyeOff, FileText, LockKeyhole, Monitor, Moon, Sun, Trash2, Upload, UserRound, X,
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

const SETTINGS_SECTIONS = [
  { id: "profil", label: "Profil", icon: UserRound },
  { id: "ordonnance", label: "Ordonnance", icon: FileText },
  { id: "security", label: "Sécurité", icon: LockKeyhole },
  { id: "preferences", label: "Préférences", icon: Sun },
  { id: "danger-zone", label: "Zone de danger", icon: Trash2 },
] as const;

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
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const dark = resolvedTheme === "dark";
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
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profil");
  const [addressTouched, setAddressTouched] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
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

  const panel = "settings-card w-full rounded-[1.5rem] border border-lunetty-line bg-lunetty-surface p-5 shadow-[0_16px_44px_rgba(26,23,19,0.06)] sm:p-8";
  const heading = "text-lunetty-ink";
  const muted = "text-lunetty-muted";
  const inputStyle = "min-h-12 w-full rounded-xl border border-lunetty-line bg-lunetty-surface px-4 py-3 text-sm text-lunetty-ink outline-none transition focus:border-lunetty-gold focus:ring-2 focus:ring-lunetty-gold/20";
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
    if (status !== "authenticated") return;
    const frame = window.requestAnimationFrame(() => void loadSettings());
    return () => window.cancelAnimationFrame(frame);
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
    if (loading) return;
    const sections = SETTINGS_SECTIONS.map(({ id }) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    const targetId = window.location.hash.slice(1);
    if (targetId) {
      window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView());
    }
    return () => observer.disconnect();
  }, [loading]);

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
    setProfileAttempted(true);
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
      setAddressTouched(false);
      setProfileAttempted(false);
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

  const passwordRules = [
    { label: "12 caractères minimum", valid: passwordForm.next.length >= 12 },
    { label: "Une majuscule et une minuscule", valid: /[a-z]/.test(passwordForm.next) && /[A-Z]/.test(passwordForm.next) },
    { label: "Un chiffre", valid: /\d/.test(passwordForm.next) },
    { label: "Un caractère spécial", valid: /[^A-Za-z0-9]/.test(passwordForm.next) },
  ];

  const goBack = () => {
    if (dirty && !window.confirm("Vous avez des modifications non enregistrées. Quitter cette page ?")) return;
    router.push("/client/dashboard");
  };

  if (status === "loading" || loading) {
    return (
      <main className={`account-settings ${dark ? "dark" : ""} min-h-screen bg-lunetty-cream px-4 py-10 sm:px-8`}>
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-8 w-64 rounded-xl bg-lunetty-line" />
          <div className="h-20 rounded-2xl bg-lunetty-surface" />
          <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <div className="h-64 rounded-2xl bg-lunetty-surface" />
            <div className="h-[32rem] rounded-2xl bg-lunetty-surface" />
          </div>
        </div>
      </main>
    );
  }
  if (!user || !profile || !form) return null;

  return (
    <main className={`account-settings ${dark ? "dark" : ""} min-h-screen bg-lunetty-cream px-4 pb-28 pt-28 sm:px-8`}>
      <div className="mx-auto max-w-[1440px] space-y-7">
        <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-lunetty-muted transition hover:text-lunetty-gold-strong">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Retour à l’espace client
        </button>
        <header className="border-b border-lunetty-line pb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-lunetty-gold-strong">Espace client</span>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-lunetty-ink sm:text-5xl">Paramètres</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-lunetty-muted">Gérez vos informations personnelles et vos préférences en toute simplicité.</p>
        </header>

        {error && <div role="alert" className="rounded-2xl border border-lunetty-danger/25 bg-lunetty-danger/5 px-4 py-3 text-sm text-lunetty-danger">{error}</div>}

        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <nav aria-label="Sections des paramètres" className="sticky top-24 hidden self-start rounded-[1.5rem] border border-lunetty-line bg-lunetty-surface p-3 shadow-sm lg:block">
            <p className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-lunetty-muted">Mon compte</p>
            <ul className="space-y-1">
              {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "location" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                      activeSection === id
                        ? "bg-lunetty-gold/15 text-lunetty-gold-strong"
                        : "text-lunetty-muted hover:bg-lunetty-cream hover:text-lunetty-ink"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-6">
            <nav aria-label="Navigation des paramètres" className="sticky top-20 z-30 -mx-4 flex gap-2 overflow-x-auto border-y border-lunetty-line bg-lunetty-cream/95 px-4 py-3 backdrop-blur lg:hidden">
              {SETTINGS_SECTIONS.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={activeSection === id ? "location" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
                    activeSection === id
                      ? "border-lunetty-ink bg-lunetty-ink text-lunetty-cream"
                      : "border-lunetty-line bg-lunetty-surface text-lunetty-muted"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>

        <section id="profil" className={`${panel} scroll-mt-28`}>
          <div className="flex items-start gap-3 mb-6">
            <UserRound aria-hidden="true" className="mt-1 h-5 w-5 text-lunetty-gold-strong" />
            <div><h2 className={`font-serif text-2xl ${heading}`}>Profil</h2><p className={`mt-1 text-sm ${muted}`}>Vos informations sont utilisées pour vos réservations.</p></div>
          </div>

          <div id="avatar" className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-lunetty-gold bg-lunetty-cream">
              {(avatarPreview || profile.url_image_profil) ? (
                <img
                  src={avatarPreview ?? profile.url_image_profil ?? ""}
                  alt="Aperçu de la photo de profil"
                  className="h-full w-full object-cover transition-transform"
                  style={{ transform: `scale(${avatarPreview ? avatarZoom : 1})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-lunetty-gold-strong">
                  {normalizeName(form.prenom).charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span aria-hidden="true" className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-lunetty-gold text-lunetty-ink shadow"><Camera className="h-4 w-4" /></span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => avatarInput.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-gold/50 px-4 text-sm font-semibold text-lunetty-gold-strong transition hover:bg-lunetty-gold/10">
                  <Camera aria-hidden="true" className="h-4 w-4" />
                  Choisir une photo
                </button>
                {(profile.url_image_profil || avatarPreview) && <button type="button" disabled={saving} onClick={() => void removeAvatar()} className="inline-flex min-h-11 items-center rounded-full border border-lunetty-danger/30 px-4 text-sm font-semibold text-lunetty-danger">Supprimer la photo</button>}
                {avatarFile && <button type="button" disabled={saving} onClick={() => void saveAvatar()} className="inline-flex min-h-11 items-center rounded-full bg-lunetty-ink px-4 text-sm font-semibold text-lunetty-cream disabled:opacity-50">{saving ? "Envoi…" : "Enregistrer la photo"}</button>}
              </div>
              {avatarPreview && (
                <label className={`block max-w-sm text-sm ${muted}`}>
                  Recadrer la photo
                  <input aria-label="Zoom de recadrage" type="range" min="1" max="2.5" step="0.05" value={avatarZoom} onChange={(event) => setAvatarZoom(Number(event.target.value))} className="mt-2 block w-full accent-[var(--lunetty-gold)]" />
                </label>
              )}
              <p className={`text-sm ${muted}`}>JPG, PNG ou WebP · 5 Mo maximum. La photo est recadrée au carré et optimisée avant l’envoi.</p>
              <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void chooseAvatar(event.target.files?.[0])} />
            </div>
          </div>

          <form id="profile-form" onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" value={form.prenom} error={profileErrors.prenom} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, prenom: value } : current)} />
              <Field label="Nom" value={form.nom} error={profileErrors.nom} inputStyle={inputStyle} onChange={(value) => setForm((current) => current ? { ...current, nom: value } : current)} />
              <label className={`block text-xs font-semibold ${muted}`}>Adresse e-mail
                <input readOnly value={profile.email} className={`${inputStyle} mt-1.5 opacity-70`} />
              </label>
              <Field label="Téléphone" value={form.telephone} error={profileErrors.telephone} inputStyle={inputStyle} placeholder="+216 12 345 678" onChange={(value) => setForm((current) => current ? { ...current, telephone: value } : current)} />
            </div>
            <div id="adresse" className="space-y-4">
              <h3 className={`text-base font-semibold ${heading}`}>Adresse</h3>
              {profileErrors.adresse && (addressTouched || profileAttempted) && (
                <p role="alert" className="text-sm text-lunetty-danger">{profileErrors.adresse}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rue et numéro" value={form.adresse.ligne_1} inputStyle={inputStyle} onChange={(value) => { setAddressTouched(true); setForm((current) => current ? { ...current, adresse: { ...current.adresse, ligne_1: value } } : current); }} />
                <Field label="Ville" value={form.adresse.ville} inputStyle={inputStyle} onChange={(value) => { setAddressTouched(true); setForm((current) => current ? { ...current, adresse: { ...current.adresse, ville: value } } : current); }} />
                <Field label="Code postal" value={form.adresse.code_postal} inputStyle={inputStyle} onChange={(value) => { setAddressTouched(true); setForm((current) => current ? { ...current, adresse: { ...current.adresse, code_postal: value } } : current); }} />
                <Field label="Pays (code ISO)" value={form.adresse.code_pays} inputStyle={inputStyle} onChange={(value) => { setAddressTouched(true); setForm((current) => current ? { ...current, adresse: { ...current.adresse, code_pays: value } } : current); }} />
              </div>
            </div>
            <div className="flex justify-end border-t border-lunetty-line pt-4">
              <button disabled={!dirty || saving} className="inline-flex min-h-11 items-center rounded-full bg-lunetty-ink px-6 text-sm font-semibold text-lunetty-cream transition hover:bg-lunetty-gold-strong disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </section>

        <section id="ordonnance" className={`${panel} scroll-mt-28`}>
          <div className="flex items-start gap-3">
            <FileText aria-hidden="true" className="mt-1 h-5 w-5 text-lunetty-gold-strong" />
            <div>
              <h2 className={`font-serif text-2xl ${heading}`}>Mon ordonnance</h2>
              <p className={`mt-1 text-sm ${muted}`}>Visible uniquement par vous et l’opticien que vous choisissez.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {prescriptions.map((prescription) => {
              const warning = prescriptionWarning(prescription);
              const fileUrl = fileUrls[prescription.id];
              return (
                <article key={prescription.id} className="rounded-2xl border border-lunetty-line bg-lunetty-cream p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-lunetty-line bg-lunetty-surface">
                      {fileUrl && prescription.type_fichier?.startsWith("image/") ? <img src={fileUrl} alt="Aperçu de l’ordonnance" className="h-full w-full object-cover" /> : <FileText aria-hidden="true" className="h-8 w-8 text-lunetty-gold-strong" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold ${heading}`}>{prescription.titre || prescription.nom_fichier || "Ordonnance"}</h3>
                        {prescription.est_active && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">Active</span>}
                        {warning && <span className={`rounded-full px-3 py-1 text-sm font-semibold ${warning === "Expirée" ? "bg-lunetty-danger/10 text-lunetty-danger" : "bg-lunetty-gold/15 text-lunetty-gold-strong"}`}>{warning}</span>}
                      </div>
                      <p className={`mt-1 text-xs ${muted}`}>Examen : {prescription.prescrit_le ? new Date(prescription.prescrit_le).toLocaleDateString("fr-FR") : "Date non renseignée"}{prescription.expire_le ? ` · Expire le ${new Date(prescription.expire_le).toLocaleDateString("fr-FR")}` : ""}</p>
                      {prescription.notes && <p className={`mt-2 text-xs ${muted}`}>{prescription.notes}</p>}
                      <p className={`mt-1 text-[11px] ${muted}`}>{prescription.nom_fichier ?? "Document sans fichier"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fileUrl && <button type="button" onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")} className="inline-flex min-h-11 items-center rounded-full border border-lunetty-gold/50 px-4 text-sm font-semibold text-lunetty-gold-strong">Voir</button>}
                        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-ink">
                          Remplacer
                          <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(event) => void replacePrescription(prescription.id, event.target.files?.[0])} />
                        </label>
                        {!prescription.est_active && <button type="button" disabled={prescriptionSaving} onClick={() => void setPrescriptionActive(prescription)} className="inline-flex min-h-11 items-center rounded-full border border-emerald-600/30 px-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Définir comme active</button>}
                        <button type="button" disabled={prescriptionSaving} onClick={() => void removePrescription(prescription)} className="inline-flex min-h-11 items-center rounded-full border border-lunetty-danger/30 px-4 text-sm font-semibold text-lunetty-danger">Supprimer</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {!prescriptions.length && <p className={`rounded-2xl border border-dashed border-lunetty-line bg-lunetty-cream p-6 text-center text-sm ${muted}`}>Aucune ordonnance enregistrée.</p>}
          </div>
          <div className="mt-5 rounded-2xl border border-lunetty-line bg-lunetty-cream p-4 sm:p-5">
            <h3 className={`text-lg font-semibold ${heading}`}>Ajouter une ordonnance</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nom (facultatif)" value={prescriptionForm.title} inputStyle={inputStyle} onChange={(value) => setPrescriptionForm((current) => ({ ...current, title: value }))} />
              <DatePicker
                label="Date de l’examen"
                value={prescriptionForm.examDate}
                onChange={(examDate) => setPrescriptionForm((current) => ({
                  ...current,
                  examDate,
                  expiryDate: current.expiryDate && current.expiryDate < examDate ? "" : current.expiryDate,
                }))}
              />
              <DatePicker
                label="Date d’expiration (facultative)"
                value={prescriptionForm.expiryDate}
                min={prescriptionForm.examDate || undefined}
                onChange={(expiryDate) => setPrescriptionForm((current) => ({ ...current, expiryDate }))}
              />
              <label className={`block text-xs font-semibold ${muted}`}>Note (facultative)
                <input value={prescriptionForm.note} onChange={(event) => setPrescriptionForm((current) => ({ ...current, note: event.target.value }))} className={`${inputStyle} mt-1.5`} maxLength={1000} />
              </label>
            </div>
            <button
              type="button"
              onClick={() => prescriptionsInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadPrescriptions(event.dataTransfer.files);
              }}
              className="mt-5 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-lunetty-gold/60 bg-lunetty-surface px-5 py-5 text-center transition hover:bg-lunetty-gold/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunetty-gold-strong"
            >
              <Upload aria-hidden="true" className="h-6 w-6 text-lunetty-gold-strong" />
              <p className={`mt-2 text-sm font-semibold ${heading}`}>Déposez votre ordonnance ici</p>
              <p className={`mt-1 text-sm ${muted}`}>JPG, PNG ou PDF · 10 Mo maximum</p>
            </button>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-lunetty-line bg-lunetty-surface px-4 py-3">
              <span className={`text-sm font-medium ${heading}`}>Marquer comme ordonnance active</span>
              <button
                type="button"
                role="switch"
                aria-checked={prescriptionForm.active}
                aria-label="Marquer comme ordonnance active"
                onClick={() => setPrescriptionForm((current) => ({ ...current, active: !current.active }))}
                className="relative h-11 w-14 shrink-0 rounded-full"
              >
                <span aria-hidden="true" className={`absolute inset-x-1 top-2 h-7 rounded-full transition-colors ${prescriptionForm.active ? "bg-lunetty-gold" : "bg-stone-300 dark:bg-stone-600"}`} />
                <span aria-hidden="true" className={`absolute left-1 top-3 h-5 w-5 rounded-full bg-white shadow transition-transform ${prescriptionForm.active ? "translate-x-7" : ""}`} />
              </button>
            </div>
            <p className={`mt-3 flex items-center gap-2 text-sm ${muted}`}>
              <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0 text-lunetty-gold-strong" />
              Votre document reste privé et n’est partagé qu’avec l’opticien choisi.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input ref={prescriptionsInput} type="file" multiple accept="image/jpeg,image/png,application/pdf" onChange={(event) => void uploadPrescriptions(event.target.files)} className="sr-only" id="prescription-files" />
              <button type="button" disabled={prescriptionSaving} onClick={() => prescriptionsInput.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream disabled:opacity-50">
                <Upload aria-hidden="true" className="h-4 w-4" /> {prescriptionSaving ? "Envoi…" : "Choisir un fichier"}
              </button>
              <span className={`text-sm ${muted}`}>Plusieurs fichiers autorisés</span>
            </div>
          </div>
        </section>

        <section id="security" className={`${panel} scroll-mt-28`}>
          <div className="mb-6 flex items-start gap-3"><LockKeyhole aria-hidden="true" className="mt-1 h-5 w-5 text-lunetty-gold-strong" /><div><h2 className={`font-serif text-2xl ${heading}`}>Sécurité</h2><p className={`mt-1 text-sm ${muted}`}>Protégez l’accès à votre compte.</p></div></div>
          <form onSubmit={changePassword} className="space-y-4">
            <h3 className={`text-base font-semibold ${heading}`}>Changer le mot de passe</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <PasswordField label="Mot de passe actuel" value={passwordForm.current} visible={passwordVisibility.current} autoComplete="current-password" disabled={Boolean(clerkUser)} inputStyle={inputStyle} onToggle={() => setPasswordVisibility((current) => ({ ...current, current: !current.current }))} onChange={(value) => setPasswordForm((current) => ({ ...current, current: value }))} />
              <PasswordField label="Nouveau mot de passe" value={passwordForm.next} visible={passwordVisibility.next} autoComplete="new-password" inputStyle={inputStyle} onToggle={() => setPasswordVisibility((current) => ({ ...current, next: !current.next }))} onChange={(value) => setPasswordForm((current) => ({ ...current, next: value }))} />
              <PasswordField label="Confirmer le mot de passe" value={passwordForm.confirm} visible={passwordVisibility.confirm} autoComplete="new-password" inputStyle={inputStyle} onToggle={() => setPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))} onChange={(value) => setPasswordForm((current) => ({ ...current, confirm: value }))} />
            </div>
            <div aria-live="polite">
              <div className="flex gap-2">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-2 flex-1 rounded-full transition-colors ${passwordStrength.score >= step ? "bg-lunetty-gold" : "bg-lunetty-line"}`} />)}</div>
              <p className={`mt-2 text-sm font-semibold ${passwordStrength.score >= 3 ? "text-lunetty-gold-strong" : muted}`}>{passwordStrength.label}</p>
            </div>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={`flex items-center gap-2 ${rule.valid ? "text-emerald-800 dark:text-emerald-300" : muted}`}>
                  <Check aria-hidden="true" className={`h-4 w-4 ${rule.valid ? "" : "opacity-30"}`} /> {rule.label}
                </li>
              ))}
            </ul>
            {passwordForm.next && passwordForm.next !== passwordForm.confirm && <p className="text-sm text-lunetty-danger">Les mots de passe ne correspondent pas.</p>}
            <button disabled={saving || passwordForm.next.length < 12 || passwordForm.next !== passwordForm.confirm || (!clerkUser && !passwordForm.current)} className="inline-flex min-h-11 items-center rounded-full border border-lunetty-line px-5 text-sm font-semibold text-lunetty-ink transition hover:border-lunetty-gold disabled:cursor-not-allowed disabled:opacity-40">Modifier le mot de passe</button>
          </form>
          <div className="my-7 border-t border-lunetty-line" />
          <div className="space-y-3">
            <h3 className={`text-base font-semibold ${heading}`}>Changer l’adresse e-mail</h3>
            <p className={`text-sm ${muted}`}>Un lien de vérification sera envoyé à votre nouvelle adresse.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="nouvelle-adresse@exemple.com" className={`${inputStyle} flex-1`} />
              <button type="button" disabled={saving || !clerkUser} onClick={() => void requestEmailLink()} className="min-h-11 shrink-0 rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream disabled:opacity-40">Envoyer un lien</button>
            </div>
            {emailLinkSent && <p role="status" className="text-sm text-emerald-800 dark:text-emerald-300">Lien envoyé. Confirmez la nouvelle adresse depuis votre boîte e-mail.</p>}
            {!clerkUser && <p className={`text-sm ${muted}`}>La modification vérifiée de l’adresse est gérée par le fournisseur d’identité du compte.</p>}
          </div>
        </section>

        <section id="preferences" className={`${panel} scroll-mt-28`}>
          <h2 className={`font-serif text-2xl ${heading}`}>Préférences</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <label className={`text-sm font-semibold ${muted}`}>Langue préférée
              <select value={profile.langue_preferee ?? "fr"} onChange={(event) => void changeLanguage(event.target.value)} className={`${inputStyle} mt-1.5`}>
                <option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option>
              </select>
            </label>
            <div>
              <span className={`block text-sm font-semibold ${muted}`}>Apparence</span>
              <div role="group" aria-label="Apparence" className="mt-1.5 grid min-h-12 grid-cols-3 rounded-full border border-lunetty-line bg-lunetty-cream p-1">
                <button type="button" aria-pressed={themeMode === "light"} onClick={() => setThemeMode("light")} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition ${themeMode === "light" ? "bg-lunetty-ink text-lunetty-cream shadow" : "text-lunetty-muted"}`}>
                  <Sun aria-hidden="true" className="h-4 w-4" /> Clair
                </button>
                <button type="button" aria-pressed={themeMode === "dark"} onClick={() => setThemeMode("dark")} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition ${themeMode === "dark" ? "bg-lunetty-ink text-lunetty-cream shadow" : "text-lunetty-muted"}`}>
                  <Moon aria-hidden="true" className="h-4 w-4" /> Sombre
                </button>
                <button type="button" aria-pressed={themeMode === "system"} onClick={() => setThemeMode("system")} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition ${themeMode === "system" ? "bg-lunetty-ink text-lunetty-cream shadow" : "text-lunetty-muted"}`}>
                  <Monitor aria-hidden="true" className="hidden h-4 w-4 sm:block" /> Système
                </button>
              </div>
            </div>
          </div>
          <div className="mt-7 space-y-4">
            <h3 className={`text-base font-semibold ${heading}`}>Notifications de réservation</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className={`${muted}`}><th className="py-3 font-semibold">Type</th><th className="py-3 font-semibold">E-mail</th><th className="py-3 font-semibold">SMS</th></tr></thead>
                <tbody>
                  {([
                    [CONFIRMATION_TYPE, "Confirmations de réservation"],
                    [REMINDER_TYPE, "Rappels la veille"],
                  ] as const).map(([type, label]) => (
                    <tr key={type} className="border-t border-lunetty-line">
                      <td className={`py-3 font-medium ${heading}`}>{label}</td>
                      {(["EMAIL", "SMS"] as const).map((channel) => (
                        <td key={channel} className="py-3">
                          <button
                            type="button"
                            role="switch"
                            aria-label={`${label} par ${channel === "EMAIL" ? "e-mail" : "SMS"}`}
                            aria-checked={notifications[`${type}:${channel}`] ?? false}
                            onClick={() => void changePreference(type, channel, !(notifications[`${type}:${channel}`] ?? false))}
                            className="relative h-11 w-14 rounded-full"
                          >
                            <span aria-hidden="true" className={`absolute inset-x-1 top-2 h-7 rounded-full transition-colors ${notifications[`${type}:${channel}`] ? "bg-lunetty-gold" : "bg-stone-300 dark:bg-stone-600"}`} />
                            <span aria-hidden="true" className={`absolute left-1 top-3 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications[`${type}:${channel}`] ? "translate-x-7" : ""}`} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`text-sm ${muted}`}>Les notifications par e-mail et SMS sont envoyées uniquement si un canal de livraison est configuré pour votre compte.</p>
          </div>
        </section>

        <section id="danger-zone" className="scroll-mt-28 rounded-[1.5rem] border border-lunetty-danger/25 bg-lunetty-danger/[0.035] p-5 sm:p-8">
          <h2 className="font-serif text-2xl font-medium text-lunetty-danger">Zone de danger</h2>
          <p className={`mt-1 text-sm ${muted}`}>Téléchargez une copie de vos données ou supprimez votre compte.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void exportData()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-line px-5 text-sm font-semibold text-lunetty-ink"><Download aria-hidden="true" className="h-4 w-4" /> Exporter mes données (JSON)</button>
            <button type="button" onClick={() => { setShowDeleteModal(true); setDeleteConfirmation(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lunetty-danger/30 px-5 text-sm font-semibold text-lunetty-danger transition hover:bg-lunetty-danger/10"><Trash2 aria-hidden="true" className="h-4 w-4" /> Supprimer mon compte</button>
          </div>
        </section>

        <footer className="flex items-center justify-between pb-8">
          <button type="button" onClick={goBack} className={`inline-flex min-h-11 items-center text-sm font-semibold ${muted}`}>← Retour</button>
        </footer>
      </div>

      </div>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-lunetty-line bg-lunetty-surface/95 px-4 py-3 shadow-[0_-12px_40px_rgba(26,23,19,0.12)] backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-lunetty-ink">Modifications non enregistrées</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setAddressTouched(false);
                  setProfileAttempted(false);
                }}
                className="inline-flex min-h-11 items-center rounded-full border border-lunetty-line px-4 text-sm font-semibold text-lunetty-ink"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-full bg-lunetty-ink px-5 text-sm font-semibold text-lunetty-cream disabled:opacity-40"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[90] rounded-2xl bg-lunetty-ink px-5 py-3 text-sm text-lunetty-cream shadow-2xl">{toast}</div>}
      {showDeleteModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-lunetty-danger/25 bg-lunetty-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 id="delete-title" className="font-serif text-2xl font-medium text-lunetty-danger">Supprimer le compte ?</h2><p className={`mt-2 text-sm ${muted}`}>Cette action est irréversible. Vos documents de santé privés seront également supprimés.</p></div><button type="button" aria-label="Fermer" onClick={() => setShowDeleteModal(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-lunetty-cream"><X className={muted} /></button></div>
            <label className={`mt-5 block text-sm font-semibold ${muted}`}>Tapez SUPPRIMER pour confirmer
              <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className={`${inputStyle} mt-1.5`} />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${muted}`}>Annuler</button>
              <button type="button" disabled={deleteConfirmation !== "SUPPRIMER" || saving} onClick={() => void deleteAccount()} className="inline-flex min-h-11 items-center rounded-full bg-lunetty-danger px-5 text-sm font-semibold text-white disabled:opacity-40">{saving ? "Suppression…" : "Supprimer définitivement"}</button>
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
    <label className="relative block pt-2 text-sm font-semibold text-lunetty-muted">
      <span className="absolute left-3 top-0 z-10 rounded bg-lunetty-surface px-1 text-xs">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputStyle} pt-4`} />
      {error && <span className="mt-1 block text-sm font-medium text-lunetty-danger">{error}</span>}
    </label>
  );
}

function dateFromInput(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DatePicker({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = dateFromInput(value);
    const current = selected ?? new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const selectedDate = dateFromInput(value);
  const minDate = min ? dateFromInput(min) : null;
  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const firstWeekday = (new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const minMonth = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    : null;
  const previousMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1,
  );
  const previousDisabled = Boolean(
    minMonth && previousMonth.getTime() < minMonth.getTime(),
  );
  const displayValue = selectedDate
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(selectedDate)
    : "Sélectionner une date";

  return (
    <div className="relative min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-lunetty-muted">{label}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label} : ${displayValue}`}
        onClick={() => {
          if (!open) {
            const selected = dateFromInput(value);
            const current = selected ?? new Date();
            setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
          }
          setOpen((current) => !current);
        }}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-lunetty-line bg-lunetty-surface px-4 text-left text-sm text-lunetty-ink outline-none transition hover:border-lunetty-gold focus-visible:ring-2 focus-visible:ring-lunetty-gold/20"
      >
        <span className={selectedDate ? "" : "text-lunetty-muted"}>{displayValue}</span>
        <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-lunetty-gold-strong" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={`Calendrier : ${label}`}
          className="absolute left-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-2.5rem))] rounded-2xl border border-lunetty-line bg-lunetty-surface p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Mois précédent"
              disabled={previousDisabled}
              onClick={() => setVisibleMonth(previousMonth)}
              className="grid h-11 w-11 place-items-center rounded-full text-lunetty-ink hover:bg-lunetty-cream disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-lunetty-ink">{monthLabel}</span>
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className="grid h-11 w-11 place-items-center rounded-full text-lunetty-ink hover:bg-lunetty-cream"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-lunetty-muted" aria-hidden="true">
            {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day, index) => (
              <span key={`${day}-${index}`} className="grid h-9 place-items-center">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
              if (index < firstWeekday) return <span key={`empty-${index}`} aria-hidden="true" />;
              const day = index - firstWeekday + 1;
              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const dateValue = dateToInput(date);
              const isSelected = value === dateValue;
              const disabled = Boolean(min && dateValue < min);
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={disabled}
                  aria-label={new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(date)}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                  className={`min-h-11 w-full rounded-full text-sm font-medium transition hover:bg-lunetty-gold/20 disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected ? "bg-lunetty-ink text-lunetty-cream hover:bg-lunetty-ink" : "text-lunetty-ink"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-2 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-lunetty-gold-strong hover:underline"
            >
              Effacer la date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PasswordField({
  label, value, inputStyle, onChange, disabled, visible, autoComplete, onToggle,
}: {
  label: string;
  value: string;
  inputStyle: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  visible: boolean;
  autoComplete: "current-password" | "new-password";
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-lunetty-muted">{label}</label>
      <span className="relative mt-1.5 block">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputStyle} pr-12 disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`}
          className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full text-lunetty-muted hover:bg-lunetty-cream"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </div>
  );
}
