"use client";

import { useLayoutEffect, useRef } from "react";
import { getGsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  /** Décalage entre les mots, en secondes. */
  stagger?: number;
};

/** Révèle un texte mot par mot quand il entre dans l'écran. */
export default function RevealText({
  text,
  as: Tag = "p",
  className = "",
  stagger = 0.05,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const { gsap } = getGsap();
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-word]"), {
        yPercent: 110,
        duration: 1.1,
        ease: "power4.out",
        stagger,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, stagger]);

  return (
    <Tag ref={ref as never} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span data-word className="inline-block">
            {word}
            {" "}
          </span>
        </span>
      ))}
    </Tag>
  );
}
