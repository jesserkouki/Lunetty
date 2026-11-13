'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiError, changePassword, getToken } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

const MIN_PASSWORD_LENGTH = 12;

export function ChangePasswordForm() {
  const { status } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      return;
    }

    setSaving(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Votre mot de passe a été modifié.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  if (status !== 'authenticated') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171514] p-8 text-center">
          <h1 className="text-2xl font-semibold">Changer le mot de passe</h1>
          <p className="mt-3 text-sm text-stone-400">
            Connectez-vous pour modifier votre mot de passe.
          </p>
          <Link className="mt-6 inline-block text-sm font-semibold text-amber-200" href="/">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-[#171514] p-8"
      >
        <div>
          <h1 className="text-2xl font-semibold">Changer le mot de passe</h1>
          <p className="mt-2 text-sm text-stone-400">
            Choisissez un nouveau mot de passe d’au moins {MIN_PASSWORD_LENGTH} caractères.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <span>Mot de passe actuel</span>
          <input
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/10 bg-[#121110] px-4 py-3 outline-none focus:border-amber-500"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span>Nouveau mot de passe</span>
          <input
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-[#121110] px-4 py-3 outline-none focus:border-amber-500"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span>Confirmer le nouveau mot de passe</span>
          <input
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-[#121110] px-4 py-3 outline-none focus:border-amber-500"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        <div aria-live="polite" className="min-h-5 text-sm">
          {error && <p className="text-rose-400">{error}</p>}
          {success && <p className="text-emerald-400">{success}</p>}
        </div>

        <button
          className="w-full rounded-xl bg-amber-200 px-4 py-3 font-semibold text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? 'Modification…' : 'Modifier le mot de passe'}
        </button>
      </form>
    </main>
  );
}
