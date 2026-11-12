'use client';
import React from 'react';
import {
  Calendar, Clock, Glasses, LogOut, Mail, MapPin, Phone, Search, Sparkles, User,
} from 'lucide-react';
import type { CurrentUser } from '@/lib/auth';

type Props = {
  user: CurrentUser;
  dark: boolean;
  onNavigate: (tab: 'landing' | 'tryon' | 'catalog') => void;
  onLogout: () => void;
};

// TODO: replace with real reservations from the backend
const MOCK_RESERVATIONS = [
  {
    id: 'r1',
    produit: 'AeroTitan Ultra Light',
    marque: 'Ray-Ban',
    magasin: 'Optique de Carthage',
    date: 'Demain · 10:30',
    statut: 'CONFIRMEE',
    imageUrl:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'r2',
    produit: 'Elegance Gold CatEye',
    marque: 'Gucci',
    magasin: 'Lac 2 Vision Boutique',
    date: 'Sam. 22 · 15:00',
    statut: 'EN_ATTENTE',
    imageUrl:
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=400',
  },
];

const STATUS_STYLE: Record<string, string> = {
  CONFIRMEE: 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30',
  EN_ATTENTE: 'bg-amber-900/20 text-amber-500 border-amber-500/30',
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRMEE: 'Confirmée',
  EN_ATTENTE: 'En attente',
};

export default function UserDashboard({ user, dark, onNavigate, onLogout }: Props) {
  const card = `border rounded-3xl p-6 shadow-xl ${
    dark ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
  }`;
  const inner = `p-4 rounded-2xl border ${
    dark ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
  }`;
  const title = dark ? 'text-white' : 'text-stone-900';
  const muted = dark ? 'text-stone-400' : 'text-stone-600';

  const actions = [
    { key: 'tryon' as const, icon: Sparkles, label: 'Studio 3D', hint: 'Essayer une monture' },
    { key: 'catalog' as const, icon: Search, label: 'Catalogue', hint: 'Parcourir les modèles' },
    { key: 'landing' as const, icon: MapPin, label: 'Opticiens', hint: 'Trouver un magasin' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-[0.3em]">
            Espace Client
          </span>
          <h1 className={`text-3xl sm:text-4xl font-light font-display tracking-wide mt-1 ${title}`}>
            Bonjour, {user.prenom}
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Retrouvez vos réservations et vos essayages en un coup d'œil.
          </p>
        </div>
        <button
          onClick={onLogout}
          className={`px-4 py-2.5 border rounded-2xl text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto ${
            dark
              ? 'bg-white/5 border-white/10 text-stone-300 hover:text-rose-300 hover:bg-rose-500/10'
              : 'bg-stone-200/80 border-stone-300 text-stone-700 hover:text-rose-600 hover:bg-rose-100'
          }`}
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map(({ key, icon: Icon, label, hint }) => (
          <button
            key={label}
            onClick={() => onNavigate(key)}
            className={`${card} text-left group hover:border-amber-500/40 transition-all`}
          >
            <Icon className="w-5 h-5 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
            <div className={`font-bold text-sm ${title}`}>{label}</div>
            <div className={`text-xs mt-0.5 ${muted}`}>{hint}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reservations */}
        <section className={`${card} lg:col-span-8`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-bold ${title}`}>Mes Réservations</h2>
              <p className={`text-xs ${muted}`}>Montures gardées en magasin pour vous</p>
            </div>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>

          {MOCK_RESERVATIONS.length === 0 ? (
            <div className={`${inner} text-center py-10 text-xs ${muted}`}>
              Aucune réservation pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {MOCK_RESERVATIONS.map((r) => (
                <div key={r.id} className={`${inner} flex items-center gap-4`}>
                  <img
                    src={r.imageUrl}
                    alt={r.produit}
                    className="w-14 h-14 object-cover rounded-xl border border-stone-300 dark:border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${title}`}>{r.produit}</div>
                    <div className={`text-[11px] ${muted}`}>
                      {r.marque} · {r.magasin}
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-200 font-semibold flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {r.date}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 border text-[10px] font-semibold rounded-lg shrink-0 ${
                      STATUS_STYLE[r.statut] ?? ''
                    }`}
                  >
                    {STATUS_LABEL[r.statut] ?? r.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profile */}
        <aside className={`${card} lg:col-span-4 space-y-5`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-200 via-amber-200 to-amber-500 p-[1.5px]">
              <div
                className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  dark ? 'bg-[#121110]' : 'bg-stone-900'
                }`}
              >
                <Glasses className="w-6 h-6 text-amber-200" />
              </div>
            </div>
            <div className="min-w-0">
              <div className={`font-bold truncate ${title}`}>{user.name}</div>
              {user.nom_utilisateur && (
                <div className={`text-xs truncate ${muted}`}>@{user.nom_utilisateur}</div>
              )}
            </div>
          </div>

          <div className={`${inner} space-y-3 text-xs`}>
            <div className={`flex items-center gap-2 ${muted}`}>
              <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className={`flex items-center gap-2 ${muted}`}>
              <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              {user.telephone ?? 'Téléphone non renseigné'}
            </div>
            <div className={`flex items-center gap-2 ${muted}`}>
              <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              Compte client
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}