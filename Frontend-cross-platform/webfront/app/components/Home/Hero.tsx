"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import ParallaxImage from "../../motion/ParallaxImage";
import Button from "../ui/Button";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";
/**
 * Vidéo de présentation : /videos/hero.mp4 (sans piste audio).
 * Son image d'affiche est /videos/hero-poster.png.
 */
const VIDEO_SRC = "/videos/hero.mp4";
const POSTER = "/videos/hero-poster.png";

type NetworkInformation = { saveData?: boolean };

const noopSubscribe = () => () => {};
// Vrai si l'utilisateur est en mode économie de données (côté serveur : vrai,
// donc pas de vidéo dans le HTML initial).
const getSaveData = () =>
  Boolean(
    (navigator as Navigator & { connection?: NetworkInformation }).connection
      ?.saveData,
  );

export default function Hero() {
  const reduced = useReducedMotion();
  const saveData = useSyncExternalStore(noopSubscribe, getSaveData, () => true);

  const showVideo = !reduced && !saveData;

  return (
    <section
      aria-label="Présentation"
      className="relative flex h-[100svh] min-h-[620px] items-end overflow-hidden bg-stone-950"
    >
      <div aria-hidden className="absolute inset-0">
        <ParallaxImage
          src={POSTER}
          alt=""
          priority
          amount={4}
          className="h-full w-full"
        />
      </div>

      {showVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          aria-hidden
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background/65 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/75 via-black/30 to-transparent"
      />

      <h1 className="sr-only">Lunetty, lunettes et opticiens</h1>

      <div className="relative mx-auto w-full max-w-[1600px] px-6 pb-24 md:px-12 md:pb-28">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-3xl flex-col items-start"
        >
          <div className="flex flex-wrap gap-3">
            <Button href="/lunettes" variant="solid">
              Explorer la collection
            </Button>
            <Button href="/conseiller" className="border-white/70 text-white">
              Conseil personnalisé
            </Button>
          </div>
        </motion.div>
      </div>

      <a
        href="#selection"
        className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Défiler
        <ArrowDown aria-hidden="true" className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
}
