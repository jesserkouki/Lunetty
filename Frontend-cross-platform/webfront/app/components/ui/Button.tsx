"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
};

/** Bouton avec effet magnétique et remplissage au survol. */
export default function Button({
  href,
  children,
  variant = "outline",
  className = "",
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    variant === "solid"
      ? "bg-foreground text-background"
      : "border border-foreground/40 text-foreground";
  const fill = variant === "solid" ? "bg-accent" : "bg-foreground";
  const hoverText =
    variant === "solid" ? "" : "group-hover:text-background";

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-block"
    >
      <Link
        href={href}
        className={`group relative inline-flex items-center overflow-hidden px-9 py-4 text-sm tracking-[0.16em] uppercase ${base} ${className}`}
      >
        <span
          aria-hidden
          className={`absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-lux group-hover:scale-y-100 ${fill}`}
        />
        <span className={`relative transition-colors duration-500 ${hoverText}`}>
          {children}
        </span>
      </Link>
    </motion.span>
  );
}
