"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export type AuthMode = "login" | "signup";

type Props = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

export default function AuthTabs({ mode, onChange }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Type d’authentification"
      className="relative grid grid-cols-2 rounded-full border border-line bg-black/[0.035] p-1 dark:bg-white/[0.06]"
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-foreground shadow-sm"
        animate={{ x: mode === "login" ? 0 : "100%" }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
      />
      {(["login", "signup"] as const).map((value) => (
        <button
          key={value}
          id={`auth-tab-${value}`}
          type="button"
          role="tab"
          aria-selected={mode === value}
          aria-controls="auth-panel"
          onClick={() => onChange(value)}
          className={`relative z-10 rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            mode === value
              ? "text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {value === "login" ? "Connexion" : "Inscription"}
        </button>
      ))}
    </div>
  );
}
