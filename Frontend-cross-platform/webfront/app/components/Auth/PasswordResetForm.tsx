"use client";

import { useState } from "react";
import FloatingInput from "./FloatingInput";

type Props = {
  initialEmail?: string;
  onBack: () => void;
};

export default function PasswordResetForm({ initialEmail = "", onBack }: Props) {
  const [email, setEmail] = useState(initialEmail);

  return (
    <section aria-labelledby="auth-reset-title" className="space-y-4">
      <div>
        <h3 id="auth-reset-title" className="font-serif text-2xl italic text-foreground">
          Réinitialiser le mot de passe
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          La réinitialisation n’est pas disponible pour les comptes Lunetty via l’API actuelle.
          Aucun e-mail ne sera envoyé pour le moment.
        </p>
      </div>
      <FloatingInput
        id="auth-reset-email"
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <button
        type="button"
        disabled
        className="min-h-12 w-full rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-[0.14em] text-background opacity-55"
      >
        Envoyer le lien — indisponible
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Retour à la connexion
      </button>
    </section>
  );
}
