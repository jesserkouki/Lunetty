"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { getGsap } from "@/lib/motion/gsap";

const STEPS = [
  {
    n: "01",
    title: "Le dessin",
    text: "Chaque monture naît d'une silhouette. Nous retenons celles qui flattent le visage sans l'écraser.",
    image: "/images/craft-1.svg",
    alt: "Atelier, façonnage de la monture",
  },
  {
    n: "02",
    title: "Les verres",
    text: "Mesures, centrage, traitements : l'opticien ajuste chaque verre à votre vision.",
    image: "/images/craft-2.svg",
    alt: "Contrôle de précision des verres",
  },
  {
    n: "03",
    title: "La finition",
    text: "Polissage manuel, réglage des branches, ajustement final. Une paire prête à vous suivre chaque jour.",
    image: "/images/craft-3.svg",
    alt: "Finitions et polissage",
  },
];

/**
 * Défilement horizontal épinglé sur desktop (GSAP ScrollTrigger).
 * Sur mobile ou avec prefers-reduced-motion, les étapes s'empilent normalement.
 */
export default function Craft() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!section.current || !track.current) return;
    const { gsap } = getGsap();
    const mm = gsap.matchMedia();

    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const distance = () =>
          Math.max(0, track.current!.scrollWidth - window.innerWidth);

        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="savoir-faire"
      ref={section}
      aria-labelledby="titre-craft"
      className="overflow-hidden py-24 md:flex md:min-h-screen md:items-center md:py-0"
    >
      <div
        ref={track}
        className="flex flex-col gap-20 px-6 md:w-max md:flex-row md:items-center md:gap-24 md:px-12"
      >
        <div className="md:w-[38vw] md:shrink-0">
          <p className="mb-6 text-xs tracking-[0.3em] uppercase text-accent">
            Savoir-faire
          </p>
          <h2
            id="titre-craft"
            className="font-serif text-5xl font-light leading-[1.05] md:text-7xl"
          >
            Du dessin à la paire finale
          </h2>
        </div>

        {STEPS.map((s) => (
          <article
            key={s.n}
            className="md:w-[36vw] md:shrink-0"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd5c6]">
              <Image
                src={s.image}
                alt={s.alt}
                fill
                sizes="(min-width: 768px) 36vw, 100vw"
                className="object-cover"
              />
            </div>
            <p className="mt-6 text-xs tracking-[0.3em] text-accent">{s.n}</p>
            <h3 className="mt-2 font-serif text-4xl font-light">{s.title}</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
              {s.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
