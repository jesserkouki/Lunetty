"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AccountType } from "@/lib/auth";
import FloatingInput from "./FloatingInput";
import PasswordStrength from "./PasswordStrength";

export type RegisterPayload = {
  prenom: string;
  nom: string;
  email: string;
  password: string;
};

type Props = {
  space: AccountType;
  busy: boolean;
  error: string;
  onSubmit: (payload: RegisterPayload) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 12;

export default function RegisterForm({ space, busy, error, onSubmit }: Props) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isPro = space === "OPTICIAN";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (
      !prenom.trim() ||
      !nom.trim() ||
      !EMAIL_PATTERN.test(email) ||
      password.length < MIN_PASSWORD ||
      password !== confirm
    ) {
      return;
    }
    onSubmit({ prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), password });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3.5">
      {isPro && (
        <p className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-xs leading-relaxed text-foreground">
          La création du compte ne rattache pas automatiquement une boutique. Vous pourrez poursuivre depuis l’espace pro.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <FloatingInput
          id="auth-first-name"
          label="Prénom"
          value={prenom}
          onChange={setPrenom}
          autoComplete="given-name"
          required
          maxLength={100}
          error={submitted && !prenom.trim() ? "Le prénom est requis." : undefined}
        />
        <FloatingInput
          id="auth-last-name"
          label="Nom"
          value={nom}
          onChange={setNom}
          autoComplete="family-name"
          required
          maxLength={100}
          error={submitted && !nom.trim() ? "Le nom est requis." : undefined}
        />
      </div>
      <FloatingInput
        id="auth-register-email"
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
        maxLength={255}
        error={
          submitted && !EMAIL_PATTERN.test(email)
            ? "Saisissez une adresse e-mail valide."
            : undefined
        }
      />
      <div>
        <FloatingInput
          id="auth-register-password"
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />
        <PasswordStrength password={password} />
        {submitted && password.length < MIN_PASSWORD && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-800 dark:text-red-300">
            Le mot de passe doit contenir au moins {MIN_PASSWORD} caractères.
          </p>
        )}
      </div>
      <FloatingInput
        id="auth-confirm-password"
        label="Confirmer le mot de passe"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        required
        error={
          submitted && password !== confirm
            ? "Les mots de passe ne correspondent pas."
            : undefined
        }
      />
      {error && (
        <p role="alert" aria-live="polite" className="rounded-lg border border-red-800/20 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-900 dark:border-red-300/20 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.14em] text-background transition duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-lg active:translate-y-0 disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {busy ? (
          <>
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-background/35 border-t-background" />
            Création en cours…
          </>
        ) : (
          isPro ? "Créer mon compte opticien" : "Créer mon compte"
        )}
      </button>
    </form>
  );
}
