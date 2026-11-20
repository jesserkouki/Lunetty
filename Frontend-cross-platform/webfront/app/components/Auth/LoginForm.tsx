"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import FloatingInput from "./FloatingInput";

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

type Props = {
  busy: boolean;
  error: string;
  initialEmail?: string;
  onSubmit: (payload: LoginPayload) => void;
  onForgotPassword: (email: string) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({
  busy,
  error,
  initialEmail = "",
  onSubmit,
  onForgotPassword,
}: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const emailError =
    emailTouched && !EMAIL_PATTERN.test(email)
      ? email
        ? "Saisissez une adresse e-mail valide."
        : "L’adresse e-mail est requise."
      : undefined;
  const passwordError =
    passwordTouched && !password ? "Saisissez votre mot de passe." : undefined;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!EMAIL_PATTERN.test(email) || !password) return;
    onSubmit({ email: email.trim(), password, remember });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FloatingInput
        id="auth-email"
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        onBlur={() => setEmailTouched(true)}
        error={emailError}
        required
        maxLength={255}
      />

      <div>
        <FloatingInput
          id="auth-password"
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          onBlur={() => setPasswordTouched(true)}
          error={passwordError}
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
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            Se souvenir de moi
          </label>
          <button
            type="button"
            onClick={() => onForgotPassword(email)}
            className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Mot de passe oublié ?
          </button>
        </div>
      </div>

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
            Connexion en cours…
          </>
        ) : (
          "Se connecter"
        )}
      </button>

    </form>
  );
}
