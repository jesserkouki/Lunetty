'use client';
import React, { useState } from 'react';
import { Edit3, Layers, Package, Plus, Star, Trash2, TrendingUp, X } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth';

export type InventoryItem = {
  id: string;
  nom: string;
  marque: string;
  type: string;
  prix: number;
  devise: string;
  statut: string;
  imageUrl: string;
};

type Props = {
  user: CurrentUser;
  dark: boolean;
  initialInventory: InventoryItem[];
  /** TODO: comes from the user's MembreMagasin once the backend exposes it */
  storeName?: string;
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800';

const EMPTY_FORM = { nom: '', marque: '', prix: '', type: 'MONTURE', imageUrl: '' };

export default function OpticDashboard({
  user,
  dark,
  initialInventory,
  storeName = 'Optique de Carthage',
}: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const title = dark ? 'text-white' : 'text-stone-900';
  const muted = dark ? 'text-stone-400' : 'text-stone-600';
  const card = `border rounded-3xl shadow-xl ${
    dark ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
  }`;
  const inputCls = `w-full border rounded-2xl px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors ${
    dark ? 'bg-[#121110] border-white/10 text-stone-200' : 'bg-stone-50 border-stone-300 text-stone-900'
  }`;
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5';
  const primaryBtn = dark
    ? 'bg-stone-100 hover:bg-amber-100 text-stone-950'
    : 'bg-stone-900 hover:bg-stone-800 text-white';

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const closeModal = () => {
    setIsAddOpen(false);
    setForm(EMPTY_FORM);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prix = Number(form.prix);
    if (!form.nom.trim() || !Number.isFinite(prix) || prix < 0) return;
    setInventory((prev) => [
      {
        id: `p${Date.now()}`,
        nom: form.nom.trim(),
        marque: form.marque.trim() || '—',
        type: form.type,
        prix,
        devise: 'TND',
        statut: 'ACTIVE',
        imageUrl: form.imageUrl.trim() || DEFAULT_IMAGE,
      },
      ...prev,
    ]);
    closeModal();
  };

  const stats = [
    {
      label: "Chiffre d'affaires Est.",
      icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
      value: (
        <>
          12,480 <span className="text-xs text-amber-500 font-bold">TND</span>
        </>
      ),
      hint: <span className="text-xs text-emerald-500 font-semibold mt-1 block">+18% ce mois-ci</span>,
    },
    {
      label: 'Réservations à Honorer',
      icon: <Package className="w-5 h-5 text-amber-500" />,
      value: '5',
      hint: (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
          2 rendez-vous aujourd'hui
        </span>
      ),
    },
    {
      label: 'Références Active Stock',
      icon: <Layers className="w-5 h-5 text-stone-400" />,
      value: inventory.length,
      hint: <span className={`text-xs mt-1 block ${muted}`}>Variantes modélisées 3D</span>,
    },
    {
      label: 'Note Établissement',
      icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
      value: '4.9 / 5.0',
      hint: <span className={`text-xs mt-1 block ${muted}`}>28 avis vérifiés Lunetty</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-[0.3em]">
            Espace Pro · {user.name}
          </span>
          <h1 className={`text-3xl font-light font-display mt-1 ${title}`}>
            Tableau de Bord Opticien • {storeName}
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Gestion de stock modélisé 3D et rendez-vous d'essayage.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className={`px-5 py-3 font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 transition-all uppercase tracking-wider ${primaryBtn}`}
        >
          <Plus className="w-4 h-4" /> Ajouter une Monture en Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-6`}>
            <div className={`flex items-center justify-between mb-3 ${muted}`}>
              <span className="text-xs font-semibold">{s.label}</span>
              {s.icon}
            </div>
            <div className={`text-3xl font-bold ${title}`}>{s.value}</div>
            {s.hint}
          </div>
        ))}
      </div>

      {/* Inventory */}
      <div className={`${card} p-6`}>
        <div className="mb-6">
          <h2 className={`text-lg font-bold ${title}`}>Inventaire Stock & Modèles 3D Store</h2>
          <p className={`text-xs ${muted}`}>Gérez la disponibilité immédiate pour les essayages virtuels</p>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${dark ? 'text-stone-300' : 'text-stone-700'}`}>
            <thead
              className={`uppercase font-semibold border-b ${
                dark ? 'bg-[#100f0e] text-stone-400 border-white/10' : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              <tr>
                <th className="p-3.5">Produit / Marque</th>
                <th className="p-3.5">SKU Ref</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Prix (TND)</th>
                <th className="p-3.5">Statut Produit</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-white/10' : 'divide-stone-200'}`}>
              {inventory.map((item) => (
                <tr key={item.id} className={dark ? 'hover:bg-[#100f0e]' : 'hover:bg-stone-50'}>
                  <td className="p-3.5 flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.nom}
                      className="w-10 h-10 object-cover rounded-xl border border-stone-300 dark:border-white/10"
                    />
                    <div>
                      <div className={`font-bold ${title}`}>{item.nom}</div>
                      <div className="text-[10px] text-stone-500">{item.marque}</div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-stone-500">LNT-{item.id.toUpperCase()}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-stone-200 dark:bg-white/5 border border-stone-300 dark:border-white/10 rounded-lg text-[10px] font-bold">
                      {item.type}
                    </span>
                  </td>
                  <td className={`p-3.5 font-bold ${title}`}>{item.prix.toFixed(3)} TND</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-900/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-semibold rounded-lg">
                      {item.statut}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      aria-label="Modifier"
                      className="p-2 border rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      aria-label="Supprimer"
                      onClick={() => setInventory((prev) => prev.filter((p) => p.id !== item.id))}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className={`p-8 text-center ${muted}`}>
                    Aucune monture en stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add product modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`border w-full max-w-md rounded-3xl p-8 shadow-2xl relative my-8 ${
              dark ? 'bg-[#171514] border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            <button
              onClick={closeModal}
              aria-label="Fermer"
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-wider">
              Nouveau produit
            </span>
            <h2 className={`text-2xl font-bold mt-1 mb-6 ${title}`}>Ajouter une monture</h2>

            <form onSubmit={addItem} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="p-nom">Nom</label>
                <input id="p-nom" required maxLength={120} autoFocus value={form.nom}
                  onChange={set('nom')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="p-marque">Marque</label>
                  <input id="p-marque" maxLength={80} value={form.marque}
                    onChange={set('marque')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="p-prix">Prix (TND)</label>
                  <input id="p-prix" type="number" min="0" step="0.001" required value={form.prix}
                    onChange={set('prix')} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="p-type">Type</label>
                <select id="p-type" value={form.type} onChange={set('type')} className={inputCls}>
                  <option value="MONTURE">Monture</option>
                  <option value="VERRE">Verre</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="p-img">Image (URL, optionnel)</label>
                <input id="p-img" type="url" value={form.imageUrl}
                  onChange={set('imageUrl')} placeholder="https://..." className={inputCls} />
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl ${primaryBtn}`}
              >
                Ajouter au stock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}