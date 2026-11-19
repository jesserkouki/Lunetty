'use client';
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Glasses, Loader2, Store, User, X } from 'lucide-react';
import {
  AccountType, ApiError, AuthUser,
  getSpace, login, register, resolveAccountType, setToken,
  setSpace as persistSpace,
} from '@/lib/auth';

type Mode = 'login' | 'signup';

type Props = {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess: (user: AuthUser, accountType: AccountType) => void;
};

const MIN_PASSWORD = 12;
const EMPTY = { prenom: '', nom: '', email: '', password: '', confirm: '' };

export default function AuthModal({ open, initialMode = 'login', onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [space, setSpace] = useState<AccountType>(getSpace);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const isSignup = mode === 'signup';
  const isPro = space === 'OPTICIAN';
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (isSignup) {
      if (form.password.length < MIN_PASSWORD)
        return setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`);
      if (form.password !== form.confirm)
        return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      const { user, accessToken } = isSignup
        ? await register({
            prenom: form.prenom.trim(),
            nom: form.nom.trim(),
            email: form.email.trim(),
            password: form.password,
          })
        : await login(form.email.trim(), form.password);

      setToken(accessToken);
      persistSpace(space);
      const accountType = await resolveAccountType(accessToken);


      onSuccess(user, accountType);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-line bg-white/70 px-4 py-3 text-base font-medium text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15';
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted';
  const pwLen = Math.min(form.password.length, MIN_PASSWORD);

  const segment = (active: boolean) =>
    `flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
      active
        ? 'bg-foreground text-background shadow-sm'
        : 'text-muted hover:text-accent'
    }`;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="auth-modal-card relative my-8 w-full max-w-md overflow-hidden border border-line bg-background p-8 shadow-[0_24px_80px_-28px_rgba(36,31,25,0.42)]"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-5 top-5 z-10 p-2 text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          {/* Brand mark */}
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center border border-accent/35 bg-accent/10">
              <Glasses className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-wide text-foreground">
              {isSignup ? 'Créer un compte' : 'Connexion'}
            </h2>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Lunetty · L&apos;optique, autrement
            </span>
          </div>

          {/* Space Segmented Switcher: Client / Pro */}
          <div className="mb-3 grid grid-cols-2 gap-1 border border-line bg-white/50 p-1">
            <button type="button" className={segment(!isPro)} onClick={() => { setSpace('CLIENT'); setError(''); }}>
              <User className="w-3.5 h-3.5" /> Espace Client
            </button>
            <button type="button" className={segment(isPro)} onClick={() => { setSpace('OPTICIAN'); setError(''); }}>
              <Store className="w-3.5 h-3.5" /> Espace Pro
            </button>
          </div>

          {/* Mode Segmented Switcher: login / signup */}
          <div className="mb-6 grid grid-cols-2 gap-1 border border-line bg-white/50 p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={segment(mode === m)}
                onClick={() => { setMode(m); setError(''); }}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {isSignup && isPro && (
            <p className="mb-4 border border-accent/25 bg-accent/10 px-4 py-3 text-[11px] leading-relaxed text-foreground">
              Créez d&apos;abord votre compte. Le rattachement de votre magasin se fera ensuite depuis l&apos;espace pro.
            </p>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="auth-prenom">Prénom</label>
                  <input id="auth-prenom" required maxLength={100} autoFocus value={form.prenom}
                    onChange={set('prenom')} autoComplete="given-name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="auth-nom">Nom</label>
                  <input id="auth-nom" required maxLength={100} value={form.nom}
                    onChange={set('nom')} autoComplete="family-name" className={inputCls} />
                </div>
              </div>
            )}

            <div>
              <label className={labelCls} htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" required maxLength={255} autoFocus={!isSignup}
                value={form.email} onChange={set('email')} placeholder="nom@domaine.tn"
                autoComplete="email" className={inputCls} />
            </div>

            <div>
              <label className={labelCls} htmlFor="auth-password">Mot de passe</label>
              <div className="relative">
                <input id="auth-password" type={showPassword ? 'text' : 'password'} required
                  value={form.password} onChange={set('password')}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? `${MIN_PASSWORD} caractères minimum` : '••••••••'}
                  className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isSignup && (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden bg-foreground/10">
                    <div
                      className={`h-full transition-all duration-300 ${pwLen >= MIN_PASSWORD ? 'bg-emerald-700' : 'bg-accent'}`}
                      style={{ width: `${(pwLen / MIN_PASSWORD) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted">{pwLen}/{MIN_PASSWORD}</span>
                </div>
              )}
            </div>

            {isSignup && (
              <div>
                <label className={labelCls} htmlFor="auth-confirm">Confirmer le mot de passe</label>
                <input id="auth-confirm" type={showPassword ? 'text' : 'password'} required
                  value={form.confirm} onChange={set('confirm')} autoComplete="new-password"
                  className={inputCls} />
              </div>
            )}

            {error && (
              <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-foreground py-4 text-sm font-bold uppercase tracking-wider text-background shadow-sm transition-colors hover:bg-accent disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? 'Créer mon compte' : isPro ? "Accéder à l'espace pro" : 'Se connecter'}
            </button>

            <p className="pt-1 text-center text-sm text-muted">
              {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <button type="button"
                onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
                className="font-bold text-accent hover:underline">
                {isSignup ? 'Se connecter' : "S'inscrire"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}