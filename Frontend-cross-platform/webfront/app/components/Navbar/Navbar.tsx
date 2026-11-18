"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Glasses, Sparkles, Sun, Moon, Menu, X, User, LogOut, ArrowUpRight, Settings, Store } from "lucide-react";

type Props = {
  themeMode: string;
  onToggleTheme: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  userRole: string; // 'GUEST' | 'CLIENT' | 'OPTICIAN'
  userName?: string;
  userImageUrl?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
};

type NavLink = { id: string; label: string; spark?: boolean };

const LINKS: NavLink[] = [
  { id: "landing", label: "Accueil" },
  { id: "catalog", label: "Catalogue" },
];

/**
 * Navbar 2026 : pilule flottante "liquid glass", indicateur actif qui glisse,
 * se compacte au scroll, se cache en descendant et réapparaît en remontant,
 * menu mobile en panneau verre.
 */
export default function Navbar({
  themeMode, onToggleTheme, activeTab, onNavigate, userRole, userName,
  userImageUrl, onLogin, onLogout, onSettings,
}: Props) {
  const dark = themeMode === "dark";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const lastY = useRef(0);

  // Indicateur glissant
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const place = () => {
      const el = itemRefs.current[activeTab];
      if (!el) return setPill((p) => ({ ...p, ready: false }));
      setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [activeTab, scrolled]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (!open) setHidden(y > lastY.current && y > 240);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  const go = (id: string) => {
    onNavigate(id);
    setOpen(false);
    setUserMenuOpen(false);
  };

  // Styles dépendants du thème
  const glass = dark
    ? "bg-[#161412]/55 border-white/15 text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_50px_-12px_rgba(0,0,0,0.7)]"
    : "bg-white/60 border-white/70 text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_50px_-14px_rgba(60,50,30,0.35)]";
  const activeText = dark ? "text-amber-200" : "text-stone-950";
  const idleText = dark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950";
  const indicator = dark
    ? "bg-white/12 ring-1 ring-white/15 shadow-[0_0_24px_rgba(212,175,55,0.18)]"
    : "bg-white ring-1 ring-black/5 shadow-[0_4px_14px_rgba(0,0,0,0.10)]";
  const iconBtn = dark
    ? "bg-white/8 hover:bg-white/15 border-white/12 text-amber-200"
    : "bg-white/70 hover:bg-white border-black/5 text-stone-800";
  const cta = dark
    ? "bg-stone-100 text-stone-950 hover:bg-amber-100"
    : "bg-stone-900 text-white hover:bg-stone-800";
  const links: NavLink[] = userRole === "CLIENT" || userRole === "OPTICIAN"
    ? [...LINKS, { id: "favorites", label: "Mes favoris" }]
    : LINKS;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
          hidden ? "-translate-y-[130%]" : "translate-y-0"
        } ${scrolled ? "pt-2" : "pt-4"}`}
      >
        <div className="w-full max-w-[1760px] px-4 sm:px-8 lg:px-12 2xl:px-16 pointer-events-auto relative">
          <div
            className={`flex items-center justify-between gap-3 rounded-full border backdrop-blur-2xl backdrop-saturate-[1.6] transition-all duration-500 pl-2.5 pr-2.5 ${glass} ${
              scrolled ? "h-14" : "h-[68px]"
            }`}
          >
            {/* Logo */}
            <button
              onClick={() => go("landing")}
              className="flex items-center gap-2.5 pl-1 pr-3 group"
              aria-label="Lunetty — accueil"
            >
              <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shrink-0">
                <span className={`w-full h-full rounded-full flex items-center justify-center ${dark ? "bg-[#121110]" : "bg-stone-900"}`}>
                  <Glasses className="w-[18px] h-[18px] text-amber-200 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                </span>
              </span>
              <span className="text-left leading-none">
                <span className={`block text-[17px] font-black tracking-[0.18em] uppercase ${dark ? "text-white" : "text-stone-950"}`}>
                  Lunetty
                </span>
                <span
                  className={`block text-[9px] font-bold text-amber-600 dark:text-amber-200/80 tracking-[0.22em] uppercase overflow-hidden transition-all duration-500 ${
                    scrolled ? "max-h-0 opacity-0 mt-0" : "max-h-4 opacity-100 mt-1"
                  }`}
                >
                  Optical 3D Studio
                </span>
              </span>
            </button>

            {/* Liens centraux avec indicateur glissant */}
            <nav className="hidden md:block">
              <div ref={listRef} className="relative flex items-center p-1 rounded-full">
                <span
                  aria-hidden
                  className={`absolute top-1 bottom-1 rounded-full transition-all duration-500 ease-[cubic-bezier(.3,1.3,.5,1)] ${indicator} ${
                    pill.ready ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ left: pill.left, width: pill.width }}
                />
                {links.map((l) => {
                  const active = activeTab === l.id;
                  return (
                    <button
                      key={l.id}
                      ref={(el) => { itemRefs.current[l.id] = el; }}
                      onClick={() => go(l.id)}
                      className={`relative z-10 px-5 py-2 rounded-full text-[13px] font-semibold tracking-wide flex items-center gap-1.5 transition-colors duration-300 ${
                        active ? activeText : idleText
                      }`}
                    >
                      {l.spark && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleTheme}
                aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
                title={dark ? "Mode clair" : "Mode sombre"}
                className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-105 ${iconBtn}`}
              >
                <Sun className={`absolute w-[18px] h-[18px] transition-all duration-500 ${dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`} />
                <Moon className={`absolute w-[18px] h-[18px] transition-all duration-500 ${dark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
              </button>

              {userRole === "GUEST" ? (
                <button
                  onClick={onLogin}
                  className={`group hidden sm:flex items-center gap-1.5 h-10 pl-5 pr-4 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.03] ${cta}`}
                >
                  Espace Pro &amp; Client
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ) : (
                <div className="hidden sm:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((value) => !value)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className={`h-10 pl-1.5 pr-4 rounded-full border flex items-center gap-2 text-[12px] font-semibold transition-colors ${iconBtn}`}
                  >
                    {userImageUrl ? (
                      <img src={userImageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-black">
                        {(userName || "?").trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[120px] truncate">{userName || "Mon compte"}</span>
                    <span aria-hidden className="text-[10px] opacity-60">⌄</span>
                  </button>
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
                        dark ? "border-white/10 bg-[#171514]/95" : "border-stone-200 bg-white/95"
                      }`}
                    >
                      <button role="menuitem" onClick={() => go("user-dashboard")}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm flex items-center gap-2 ${idleText}`}>
                        <User className="w-4 h-4" /> Espace client
                      </button>
                      {userRole === "OPTICIAN" && (
                        <button role="menuitem" onClick={() => go("optician-dashboard")}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm flex items-center gap-2 ${idleText}`}>
                          <Store className="w-4 h-4" /> Espace professionnel
                        </button>
                      )}
                      {userRole !== "GUEST" && (
                        <button role="menuitem" onClick={() => { setUserMenuOpen(false); onSettings(); }}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm flex items-center gap-2 ${idleText}`}>
                          <Settings className="w-4 h-4" /> Paramètres
                        </button>
                      )}
                      <button role="menuitem" onClick={() => { setUserMenuOpen(false); onLogout(); }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm flex items-center gap-2 text-rose-500 hover:bg-rose-500/10">
                        <LogOut className="w-4 h-4" /> Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Burger mobile */}
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={open}
                className={`md:hidden w-10 h-10 rounded-full border flex items-center justify-center ${iconBtn}`}
              >
                {open ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Panneau mobile */}
          <div
            className={`md:hidden absolute left-0 right-0 top-full mt-2 origin-top rounded-[28px] border backdrop-blur-2xl backdrop-saturate-[1.6] p-3 transition-all duration-400 ${glass} ${
              open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
          >
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-colors ${
                  activeTab === l.id ? (dark ? "bg-white/10 text-amber-200" : "bg-white text-stone-950 shadow-sm") : idleText
                }`}
              >
                <span className="flex items-center gap-2">
                  {l.spark && <Sparkles className="w-4 h-4 text-amber-500" />}
                  {l.label}
                </span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-current/10">
              {userRole === "GUEST" ? (
                <button
                  onClick={() => { setOpen(false); onLogin(); }}
                  className={`w-full h-12 rounded-2xl text-sm font-bold tracking-wider uppercase ${cta}`}
                >
                  Espace Pro &amp; Client
                </button>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => go("user-dashboard")}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 ${iconBtn}`}
                  >
                    <User className="w-4 h-4" /> Espace client · {userName || "Mon compte"}
                  </button>
                  {userRole === "OPTICIAN" && (
                    <button
                      onClick={() => go("optician-dashboard")}
                      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 ${iconBtn}`}
                    >
                      <Store className="w-4 h-4" /> Espace professionnel
                    </button>
                  )}
                  {userRole !== "GUEST" && (
                    <button
                      onClick={() => { setOpen(false); onSettings(); }}
                      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 ${iconBtn}`}
                    >
                      <Settings className="w-4 h-4" /> Paramètres
                    </button>
                  )}
                  <button
                    onClick={() => { setOpen(false); onLogout(); }}
                    className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 text-rose-500"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
