"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { getGsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Défilement fluide Lenis, synchronisé avec GSAP ScrollTrigger.
 * Désactivé si l'utilisateur préfère réduire les animations.
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const { gsap, ScrollTrigger } = getGsap();
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
