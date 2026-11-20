"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { getGsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Amplitude du déplacement vertical, en % de la hauteur. */
  amount?: number;
};

/** Image qui se déplace plus lentement que le scroll (parallaxe). */
export default function ParallaxImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  priority,
  amount = 12,
}: Props) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced || !box.current || !inner.current) return;
    const { gsap } = getGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner.current,
        { yPercent: -amount, scale: 1.2 },
        {
          yPercent: amount,
          scale: 1.2,
          ease: "none",
          scrollTrigger: {
            trigger: box.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, box);

    return () => ctx.revert();
  }, [reduced, amount]);

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      <div ref={inner} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    </div>
  );
}
