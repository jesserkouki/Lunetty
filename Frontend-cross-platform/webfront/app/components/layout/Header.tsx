"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Search, ShoppingBag } from "lucide-react";
import AuthModal from "../Auth/AuthModal";
import LogoWordmark from "../ui/LogoWordmark";
import { useAuth as useAppAuth } from "@/lib/auth-context";
import { useAuth as usePortalAuth } from "@/contexts/AuthContext";
import type { AccountType, AuthUser } from "@/lib/auth";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const LINKS = [
  { href: "/lunettes", label: "Collection" },
  { href: "/opticiens", label: "Boutiques" },
  { href: "/conseiller", label: "Conseil IA" },
];

const SHOP_LINKS = [
  { href: "/lunettes", label: "Rechercher des montures", Icon: Search },
  { href: "/client/favorites", label: "Mes favoris", Icon: Heart },
  { href: "/client/cart", label: "Mon panier", Icon: ShoppingBag },
];

const noopSubscribe = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export default function Header() {
  const reduced = useReducedMotion();
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, signIn } = useAppAuth();
  const { logout } = usePortalAuth();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Le header se masque en descendant, réapparaît en remontant.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 160);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu mobile : verrouille le scroll et se ferme avec Échap.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const duration = reduced ? 0 : 0.6;
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setOpen(false);
  };
  const handleAuthSuccess = (authenticatedUser: AuthUser, accountType: AccountType) => {
    signIn(authenticatedUser, accountType);
    setAuthOpen(false);
    router.push(
      accountType === "OPTICIAN"
        ? "/optician/dashboard"
        : "/client/dashboard",
    );
  };
  const handleLogout = () => {
    logout();
    setOpen(false);
  };
  const renderAccountActions = () => (
    <div className="flex flex-col items-stretch gap-3 border-t border-line pt-5 lg:flex-row lg:items-center lg:gap-3 lg:border-0 lg:pt-0">
      {!isHydrated ? (
        <span aria-hidden="true" className="h-9 w-40" />
      ) : status === "authenticated" && user ? (
        <>
          <span className="text-base font-semibold tracking-normal normal-case">
            Bonjour, {user.prenom}
          </span>
          {user.accountType === "CLIENT" ? (
            <Link
              href="/client/dashboard"
              onClick={() => setOpen(false)}
              className="border border-foreground/35 px-4 py-2 text-base font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-foreground hover:text-background"
            >
              Espace client
            </Link>
          ) : (
            <Link
              href="/optician/dashboard"
              onClick={() => setOpen(false)}
              className="border border-foreground/35 px-4 py-2 text-base font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-foreground hover:text-background"
            >
              Espace pro
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="border border-foreground/35 px-4 py-2 text-base font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-foreground hover:text-background"
          >
            Déconnexion
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="px-4 py-2 text-left text-base font-bold tracking-[0.08em] uppercase transition-colors hover:text-accent lg:text-center"
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            className="border border-foreground/35 px-4 py-2 text-base font-bold tracking-[0.08em] uppercase transition-colors hover:bg-foreground hover:text-background lg:text-center"
          >
            Inscription
          </button>
        </>
      )}
    </div>
  );

  if (pathname.startsWith("/optician") || pathname.startsWith("/employee")) {
    return null;
  }

  return (
    <>
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>

      <motion.header
        animate={{ y: hidden && !open ? "-100%" : "0%" }}
        transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="site-header fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white text-[#241f19] shadow-sm transition-colors duration-500"
      >
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-5 px-6 md:px-12">
          <Link
            href="/"
            aria-label="Lunetty, accueil"
            className="site-header-logo text-[40px] font-semibold tracking-[0.16em] uppercase"
            onClick={() => setOpen(false)}
          >
            <LogoWordmark variant="dark" size="sm" />
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-4 text-base font-semibold tracking-[-0.2px] normal-case xl:gap-6 xl:text-lg">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group relative py-2 font-semibold">
                    {l.label}
                    <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-lux group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 lg:flex xl:gap-5">
            <nav aria-label="Actions boutique" className="flex items-center gap-3">
              {SHOP_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="grid h-10 w-10 place-items-center text-foreground transition-opacity hover:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                </Link>
              ))}
            </nav>
            <div>{renderAccountActions()}</div>
          </div>

          <button
            type="button"
            className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-[7px] lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`h-px w-7 bg-foreground transition-transform duration-500 ease-lux ${
                open ? "translate-y-[4px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-7 bg-foreground transition-transform duration-500 ease-lux ${
                open ? "-translate-y-[4px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            key="menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration, ease: [0.76, 0, 0.24, 1] }}
            className="site-header-menu fixed inset-0 z-40 flex flex-col justify-center overflow-y-auto bg-background px-8 py-24 lg:hidden"
          >
            <div className="flex flex-col gap-8">
              <ul className="flex flex-col gap-6">
                {LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0 : 0.25 + i * 0.08,
                      duration: reduced ? 0 : 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="font-serif text-5xl font-light"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <nav aria-label="Actions boutique" className="flex flex-col gap-5">
                {SHOP_LINKS.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-3 text-sm font-semibold text-foreground"
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                    {label}
                  </Link>
                ))}
              </nav>
              {renderAccountActions()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        key={authOpen ? `open-${authMode}` : "closed"}
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
