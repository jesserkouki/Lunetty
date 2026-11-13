'use client';
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Glasses, Loader2, Store, User, X } from 'lucide-react';
import {
  AccountType, ApiError, AuthUser,
  login, register, resolveAccountType, setToken,
  setSpace as persistSpace,
} from '@/lib/auth';

type Mode = 'login' | 'signup';

type Props = {
  open: boolean;
  dark: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess: (user: AuthUser, accountType: AccountType) => void;
};

const MIN_PASSWORD = 12;
const EMPTY = { prenom: '', nom: '', email: '', password: '', confirm: '' };

export default function AuthModal({ open, dark, initialMode = 'login', onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [space, setSpace] = useState<AccountType>('CLIENT');
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

  const inputCls = `w-full border rounded-2xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors ${
    dark ? 'bg-[#121110] border-white/10 text-stone-200' : 'bg-stone-50 border-stone-300 text-stone-900'
  }`;
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5';
  const pwLen = Math.min(form.password.length, MIN_PASSWORD);

  const segment = (active: boolean) =>
    `flex items-center justify-center gap-2 py-3 text-[11px] font-bold rounded-2xl uppercase tracking-wider transition-all ${
      active
        ? dark ? 'bg-stone-100 text-stone-950 shadow-xl' : 'bg-stone-900 text-white shadow-xl'
        : 'text-stone-500 hover:text-amber-600 dark:hover:text-amber-200'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`border w-full max-w-md rounded-3xl p-8 shadow-2xl relative my-8 overflow-hidden backdrop-blur-2xl ${
          dark ? 'bg-[#171514]/95 border-white/10' : 'bg-white/95 border-stone-200'
        }`}
      >
        {/* Ambient Warm Glow, matching page.tsx hero cards */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] bg-amber-400 opacity-20 pointer-events-none" />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white z-10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-200 via-amber-200 to-amber-500 p-[1.5px]">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${dark ? 'bg-[#121110]' : 'bg-stone-900'}`}>
                <Glasses className="w-6 h-6 text-amber-200" />
              </div>
            </div>
            <h2 className={`mt-4 text-2xl font-light tracking-wider font-display ${dark ? 'text-white' : 'text-stone-900'}`}>
              {isSignup ? 'Créer un compte' : 'Connexion'}
            </h2>
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-200/80 tracking-[0.3em] uppercase mt-1">
              Lunetty · Optical 3D Studio
            </span>
          </div>

          {/* Space Segmented Switcher: Client / Pro */}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl mb-3 border ${
            dark ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
          }`}>
            <button type="button" className={segment(!isPro)} onClick={() => { setSpace('CLIENT'); setError(''); }}>
              <User className="w-3.5 h-3.5" /> Espace Client
            </button>
            <button type="button" className={segment(isPro)} onClick={() => { setSpace('OPTICIAN'); setError(''); }}>
              <Store className="w-3.5 h-3.5" /> Espace Pro
            </button>
          </div>

          {/* Mode Segmented Switcher: login / signup */}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl mb-6 border ${
            dark ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
          }`}>
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
            <p className={`text-[11px] leading-relaxed rounded-2xl px-4 py-3 mb-4 border ${
              dark ? 'bg-amber-200/5 border-amber-200/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
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
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-stone-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwLen >= MIN_PASSWORD ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(pwLen / MIN_PASSWORD) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500">{pwLen}/{MIN_PASSWORD}</span>
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
              <div role="alert" className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl disabled:opacity-60 flex items-center justify-center gap-2 transition-all ${
                dark ? 'bg-stone-100 hover:bg-amber-100 text-stone-950' : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? 'Créer mon compte' : isPro ? "Accéder à l'espace pro" : 'Se connecter'}
            </button>

            <p className="text-center text-xs text-stone-500 pt-1">
              {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <button type="button"
                onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
                className="font-bold text-amber-600 dark:text-amber-200 hover:underline">
                {isSignup ? 'Se connecter' : "S'inscrire"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}