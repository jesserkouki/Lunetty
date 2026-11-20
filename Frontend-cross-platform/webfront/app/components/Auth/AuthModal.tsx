"use client";

import { AnimatePresence, motion } from "motion/react";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Glasses, Store, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type TouchEvent,
} from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AccountType,
  ApiError,
  AuthUser,
  login,
  register,
  resolveAccountType,
  setToken,
  setSpace as persistSpace,
} from "@/lib/auth";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import AuthTabs, { type AuthMode } from "./AuthTabs";
import LoginForm, { type LoginPayload } from "./LoginForm";
import PasswordResetForm from "./PasswordResetForm";
import RegisterForm, { type RegisterPayload } from "./RegisterForm";
import SocialButtons, { type SocialProvider } from "./SocialButtons";
import LogoWordmark from "../ui/LogoWordmark";
import styles from "./AuthModal.module.css";

type Props = {
  open: boolean;
  dark?: boolean;
  initialMode?: AuthMode;
  initialSpace?: AccountType;
  initialError?: string;
  onClose: () => void;
  onSuccess: (user: AuthUser, accountType: AccountType) => void;
};

type Screen = "form" | "reset";
type SocialStrategy = "oauth_google";

const SOCIAL_STRATEGY: Record<SocialProvider, SocialStrategy> = {
  google: "oauth_google",
};

const TAB_STOPPABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type HeroImageStyle = CSSProperties & {
  "--hero-offset-x": string;
  "--hero-offset-y": string;
};

const INITIAL_HERO_IMAGE_STYLE: HeroImageStyle = {
  "--hero-offset-x": "0px",
  "--hero-offset-y": "0px",
};

export default function AuthModal({
  open,
  dark,
  initialMode = "login",
  initialSpace = "CLIENT",
  initialError = "",
  onClose,
  onSuccess,
}: Props) {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const clerk = useClerk();
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [space, setSpace] = useState<AccountType>(initialSpace);
  const [screen, setScreen] = useState<Screen>("form");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [desktopHero, setDesktopHero] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [heroImageStyle, setHeroImageStyle] = useState(INITIAL_HERO_IMAGE_STYLE);
  const isDark = dark ?? resolvedTheme === "dark";
  const isPro = space === "OPTICIAN";

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const updateHeroMedia = () => {
      setDesktopHero(desktopQuery.matches);
      setAnimateHero(
        desktopQuery.matches && finePointerQuery.matches && !reducedMotion,
      );
    };

    updateHeroMedia();
    desktopQuery.addEventListener("change", updateHeroMedia);
    finePointerQuery.addEventListener("change", updateHeroMedia);
    return () => {
      desktopQuery.removeEventListener("change", updateHeroMedia);
      finePointerQuery.removeEventListener("change", updateHeroMedia);
    };
  }, [reducedMotion]);

  const closeIfIdle = useCallback(() => {
    if (!busy && !socialLoading) onClose();
  }, [busy, onClose, socialLoading]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      (dialog?.querySelector<HTMLElement>("input:not([disabled])") ??
        dialog?.querySelector<HTMLElement>(TAB_STOPPABLE))?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeIfIdle();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(TAB_STOPPABLE),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeIfIdle, open]);

  const displayError = (reason: unknown, fallback: string) => {
    setError(reason instanceof ApiError || reason instanceof Error ? reason.message : fallback);
  };

  const handleLogin = async ({ email, password, remember }: LoginPayload) => {
    setError("");
    setBusy(true);
    try {
      const { user, accessToken } = await login(email, password);
      setToken(accessToken, remember);
      persistSpace(space);
      const accountType = await resolveAccountType(accessToken);
      onSuccess(user, accountType);
    } catch (reason) {
      displayError(reason, "La connexion a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async ({ prenom, nom, email, password }: RegisterPayload) => {
    setError("");
    setBusy(true);
    try {
      const { user, accessToken } = await register({
        prenom,
        nom,
        email,
        password,
        accountType: space,
      });
      setToken(accessToken);
      persistSpace(space);
      const accountType = await resolveAccountType(accessToken);
      onSuccess(user, accountType);
    } catch (reason) {
      displayError(reason, "La création du compte a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    if (busy || socialLoading) return;
    setError("");
    setSocialLoading(provider);
    persistSpace(space);

    try {
      const client = clerk.client;
      if (!client) throw new Error("Le service de connexion n’est pas encore prêt.");
      const strategy = SOCIAL_STRATEGY[provider];

      if (mode === "signup") {
        await client.signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/auth/complete",
          continueSignUp: false,
        });
      } else {
        await client.signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/auth/complete",
          continueSignIn: false,
        });
      }
    } catch (reason) {
      displayError(reason, `La connexion avec ${provider} a échoué.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setScreen("form");
    setError("");
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    const endY = event.changedTouches[0]?.clientY;
    if (startY !== null && endY !== undefined && endY - startY > 90) {
      closeIfIdle();
    }
  };

  const handleHeroPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!animateHero || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setHeroImageStyle({
      "--hero-offset-x": `${x * 20}px`,
      "--hero-offset-y": `${y * 20}px`,
    });
  };

  const resetHeroPointer = () => setHeroImageStyle(INITIAL_HERO_IMAGE_STYLE);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="auth-modal-backdrop"
          className={`fixed inset-0 z-[100] flex items-end justify-center p-0 md:items-center md:p-5 ${styles.backdrop}`}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeIfIdle();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            tabIndex={-1}
            className={`auth-modal-card relative flex h-[100dvh] w-full flex-col overflow-hidden border border-line bg-background text-foreground shadow-2xl md:h-auto md:max-h-[min(90dvh,820px)] md:max-w-5xl md:grid-cols-[0.88fr_1fr] md:rounded-[2rem] md:border md:grid ${
              isDark ? "dark" : ""
            }`}
            initial={reducedMotion ? false : { y: 22, rotateX: -4, scale: 0.985 }}
            animate={{ y: 0, rotateX: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { y: 14, opacity: 0, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div
              className="absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-center md:hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <span aria-hidden="true" className="h-1 w-10 rounded-full bg-foreground/20" />
            </div>

            <aside
              className="relative isolate hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-l-[2rem] bg-[#1a1713] px-9 py-10 text-[#f5f0e7] md:flex"
              onPointerMove={handleHeroPointerMove}
              onPointerLeave={resetHeroPointer}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_55%_38%,rgba(198,166,116,0.2),transparent_58%),linear-gradient(150deg,#2c261f,#171512)]"
              />
              {desktopHero && !heroImageFailed ? (
                <Image
                  src="/images/auth/login-lunettes.jpg"
                  alt="Monture de lunettes dorée, rendu 3D de studio"
                  fill
                  priority
                  sizes="(min-width: 1280px) 440px, (min-width: 768px) 42vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABcQERQRDhcUEhQaGBcbIjklIh8fIkYyNSk5UkhXVVFIUE5bZoNvW2F8Yk5QcptzfIeLkpSSWG2grJ+OqoOPko3/2wBDARgaGiIeIkMlJUONXlBejY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY3/wAARCAAkABQDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAEEAgb/xAAaEAEAAgMBAAAAAAAAAAAAAAAAAQMREiEC/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQAC/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/APMYTDRXXPtbKJ8wKYzCzHQhopu0d23bQxxxdmYasz0c5CgAgASf/9k="
                  onLoad={() => setHeroImageLoaded(true)}
                  onError={() => setHeroImageFailed(true)}
                  style={heroImageStyle}
                  className={`${styles.heroImage} ${heroImageLoaded ? styles.heroImageLoaded : ""} ${animateHero ? styles.heroImageAnimated : ""}`}
                />
              ) : null}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[25%] bg-[linear-gradient(180deg,rgba(26,23,19,0.7)_0%,rgba(26,23,19,0)_100%)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[45%] bg-[linear-gradient(0deg,rgba(26,23,19,0.9)_0%,rgba(26,23,19,0)_100%)]"
              />
              <div className="relative z-10 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center border border-[#c6a674]/50 bg-[#c6a674]/10">
                  <Glasses size={20} className="text-[#d7bd92]" />
                </span>
                <LogoWordmark variant="gold" size="md" spacing="0.14em" />
              </div>

              <div className="relative z-10">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c6a674]">
                  Le style, sans compromis
                </p>
                <h2 className="max-w-sm font-serif text-4xl leading-[1.05]">
                  Essayez en un clic, adoptez pour toujours.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                  Une sélection choisie, un essayage simple, votre regard.
                </p>
              </div>
              <span aria-hidden="true" className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full border border-[#c6a674]/15" />
            </aside>

            <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-10 sm:px-9 sm:pt-12 md:px-10 md:py-10">
              <button
                type="button"
                onClick={closeIfIdle}
                aria-label="Fermer la fenêtre de connexion"
                className="absolute right-4 top-8 z-20 grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-6 md:top-6"
              >
                <X size={19} />
              </button>

              <header className="mb-6 pr-12 md:mb-7 md:pr-10">
                {screen === "reset" ? (
                  <button
                    type="button"
                    onClick={() => setScreen("form")}
                    className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <ArrowLeft size={15} /> Retour
                  </button>
                ) : null}
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                  Lunetty · L&apos;optique, autrement
                </p>
                <h1 id="auth-title" className="font-serif text-3xl font-medium italic tracking-tight text-foreground sm:text-4xl">
                  {screen === "reset"
                    ? "Retrouver l’accès"
                    : mode === "signup"
                      ? "Créer un compte"
                      : "Bienvenue"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {screen === "reset"
                    ? "Récupérez votre accès à votre espace Lunetty."
                    : mode === "signup"
                      ? "Rejoignez une nouvelle façon de choisir vos lunettes."
                      : "Retrouvez votre sélection et vos opticiens favoris."}
                </p>
              </header>

              {screen === "reset" ? (
                <PasswordResetForm
                  initialEmail={resetEmail}
                  onBack={() => {
                    setMode("login");
                    setScreen("form");
                  }}
                />
              ) : (
                <>
                  <div className="mb-5">
                    <AuthTabs mode={mode} onChange={changeMode} />
                  </div>

                  <div className="mb-5">
                    {isPro ? (
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                        <Store size={14} /> Mode espace opticien activé
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setSpace(isPro ? "CLIENT" : "OPTICIAN");
                        setError("");
                      }}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        isPro
                          ? "border-accent bg-accent text-white shadow-md"
                          : "border-accent/45 bg-accent/10 text-foreground hover:border-accent hover:bg-accent/15"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-full ${
                          isPro ? "bg-white/15" : "bg-accent/15 text-accent"
                        }`}>
                          <Store size={18} />
                        </span>
                        <span>
                          <span className="block text-xs font-bold uppercase tracking-[0.1em]">
                            {isPro ? "Espace opticien sélectionné" : "Vous êtes opticien ?"}
                          </span>
                          <span className={`mt-0.5 block text-xs ${
                            isPro ? "text-white/85" : "text-muted"
                          }`}>
                            {isPro ? "Revenir à l’espace client" : "Accéder à votre espace professionnel"}
                          </span>
                        </span>
                      </span>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </div>

                  <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`} className="space-y-4">
                    <SocialButtons
                      onSelect={handleSocial}
                      loadingProvider={socialLoading}
                      disabled={busy}
                    />
                    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      <span className="h-px flex-1 bg-line" />
                      ou avec votre e-mail
                      <span className="h-px flex-1 bg-line" />
                    </div>

                    {mode === "login" ? (
                      <LoginForm
                        busy={busy || socialLoading !== null}
                        error={error}
                        onSubmit={handleLogin}
                        onForgotPassword={(email) => {
                          setResetEmail(email);
                          setScreen("reset");
                          setError("");
                        }}
                      />
                    ) : (
                      <RegisterForm
                        space={space}
                        busy={busy || socialLoading !== null}
                        error={error}
                        onSubmit={handleRegister}
                      />
                    )}
                  </div>

                  {mode === "login" && (
                    <p className="mt-5 text-center text-sm text-muted">
                      Pas encore de compte ?{" "}
                      <button
                        type="button"
                        onClick={() => changeMode("signup")}
                        className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        S&apos;inscrire
                      </button>
                    </p>
                  )}
                </>
              )}
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
