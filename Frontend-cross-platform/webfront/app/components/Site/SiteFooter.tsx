"use client";
import React, { useEffect, useState } from "react";
import { Glasses } from "lucide-react";

export default function Footer({
  dark, onNavigate,
}: { dark: boolean; onNavigate: (tab: string) => void }) {
  // Année calculée côté navigateur (évite l'erreur new Date() au prérendu Next.js)
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  const muted = dark ? "text-stone-400" : "text-stone-500";
  const head = dark ? "text-white" : "text-stone-900";
  const link = `text-sm ${muted} hover:text-amber-600 transition-colors text-left`;
  return (
    <footer className={`relative z-10 border-t ${dark ? "border-white/10 bg-[#0e0d0c]" : "border-stone-200 bg-[#F3EFE6]"}`}>
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center">
              <Glasses className="w-4 h-4 text-stone-900" />
            </span>
            <span className={`font-black tracking-[0.18em] uppercase ${head}`}>Lunetty</span>
          </div>
          <p className={`text-sm mt-4 max-w-xs leading-relaxed ${muted}`}>
            Essayez vos lunettes en 3D et réservez chez un opticien près de chez vous.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-bold uppercase tracking-widest ${head}`}>Découvrir</span>
          <button className={link} onClick={() => onNavigate("landing")}>Accueil</button>
          <button className={link} onClick={() => onNavigate("tryon")}>Studio 3D</button>
          <button className={link} onClick={() => onNavigate("catalog")}>Catalogue</button>
        </div>
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-bold uppercase tracking-widest ${head}`}>Opticiens</span>
          <button className={link} onClick={() => onNavigate("landing")}>Trouver un opticien</button>
          <button className={link} onClick={() => onNavigate("optician-dashboard")}>Espace professionnel</button>
        </div>
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-bold uppercase tracking-widest ${head}`}>Aide</span>
          <span className={`text-sm ${muted}`}>Contact</span>
          <span className={`text-sm ${muted}`}>Mentions légales</span>
          <span className={`text-sm ${muted}`}>Confidentialité</span>
        </div>
      </div>
      <div className={`border-t ${dark ? "border-white/10" : "border-stone-200"}`}>
        <div className={`max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-5 text-xs ${muted} flex flex-col sm:flex-row justify-between gap-2`}>
          <span>© {year} Lunetty — Optical 3D Studio</span>
          <span>Fait en Tunisie</span>
        </div>
      </div>
    </footer>
  );
}
