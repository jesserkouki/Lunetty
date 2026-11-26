"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "../../../lib/motion/useReducedMotion";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCAyMiI+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSIyMiIgZmlsbD0iI2U4ZGVjZiIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+";

export type PageHeroAction = {
  label: string;
  href?: string;
  ariaLabel?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
};

type PageHeroProps = {
  image: string;
  alt: string;
  surtitre: string;
  titre: string;
  sousTitre: string;
  actions?: PageHeroAction[];
  imagePosition?: {
    desktop?: string;
    mobile?: string;
  };
  statistic?: string;
  badge?: string;
  className?: string;
  layout?: "overlap" | "contained";
  imageSizes?: string;
  zoomStart?: number;
  parallax?: boolean;
  showBottomVeil?: boolean;
};

const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function PageHero({
  image,
  alt,
  surtitre,
  titre,
  sousTitre,
  actions = [],
  imagePosition,
  statistic,
  badge,
  className = "",
  layout = "overlap",
  imageSizes = "100vw",
  zoomStart = 1.06,
  parallax = true,
  showBottomVeil = true,
}: PageHeroProps) {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const imageMotionRef = useRef<HTMLDivElement | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const isContained = layout === "contained";

  useEffect(() => {
    if (!parallax || reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const updateParallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = heroRef.current?.getBoundingClientRect();
        if (!bounds) return;
        const distanceFromCenter = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
        const offset = Math.max(-24, Math.min(24, distanceFromCenter * 0.035));
        imageMotionRef.current?.style.setProperty(
          "transform",
          `translate3d(0, ${offset}px, 0)`,
        );
      });
    };

    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
    return () => {
      window.removeEventListener("scroll", updateParallax);
      window.removeEventListener("resize", updateParallax);
      window.cancelAnimationFrame(frame);
    };
  }, [parallax, reducedMotion]);

  const positions = {
    "--page-hero-image-position-mobile": imagePosition?.mobile ?? "center 28%",
    "--page-hero-image-position-desktop": imagePosition?.desktop ?? "center 28%",
  } as CSSProperties;
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.48,
        staggerChildren: reducedMotion ? 0 : 0.09,
      },
    },
  };

  const buttonClass = (variant: PageHeroAction["variant"]) =>
    `inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunetty-gold md:w-auto ${
      variant === "secondary"
        ? "border border-lunetty-gold/60 bg-lunetty-surface/75 text-lunetty-ink hover:bg-lunetty-surface dark:text-lunetty-ink"
        : "bg-lunetty-ink text-white hover:bg-lunetty-gold-strong dark:bg-lunetty-gold dark:text-lunetty-ink"
    }`;

  const card = (
    <motion.div
      variants={cardVariants}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      className={`page-hero-card rounded-[1.5rem] border border-lunetty-gold/45 bg-lunetty-cream/85 text-lunetty-ink shadow-[0_20px_60px_rgba(26,23,19,.12)] backdrop-blur-xl dark:bg-[#211e19]/90 dark:text-[#f4efe6] ${
        isContained
          ? "page-hero-contained-card p-4 md:p-5"
          : "-mt-10 p-5 md:max-w-[900px] md:rounded-[1.75rem] md:p-8"
      }`}
    >
      <motion.p
        variants={contentVariants}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-lunetty-gold-strong"
      >
        {surtitre}
      </motion.p>
      <motion.h1
        id="page-hero-title"
        variants={contentVariants}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className={`page-hero-title tracking-tight ${
          isContained
            ? "text-[clamp(28px,3vw,40px)]"
            : "text-4xl sm:text-5xl lg:text-[56px]"
        }`}
      >
        {titre}
      </motion.h1>
      <motion.p
        variants={contentVariants}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className={`page-hero-copy mt-3 text-sm leading-6 text-lunetty-muted ${
          isContained ? "max-w-none md:text-[15px]" : "max-w-3xl sm:text-base sm:leading-7"
        }`}
      >
        {sousTitre}
      </motion.p>
      {(statistic || actions.length > 0) && (
        <motion.div
          variants={contentVariants}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
          className={`page-hero-details mt-5 flex gap-3 ${
            isContained
              ? "flex-col md:mt-3 md:flex-row md:flex-wrap md:items-center"
              : "flex-col md:flex-row md:flex-wrap md:items-center"
          }`}
        >
          {statistic && (
            <span className="inline-flex min-h-11 items-center self-start rounded-full border border-lunetty-gold/35 bg-lunetty-surface/70 px-4 text-sm font-semibold text-lunetty-ink dark:bg-white/5 dark:text-lunetty-cream">
              {statistic}
            </span>
          )}
          {actions.length > 0 && (
            <div className="page-hero-actions flex flex-col gap-3 md:flex-row">
              {actions.map((action) => {
                const className = buttonClass(action.variant);
                if (action.href) {
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      aria-label={action.ariaLabel}
                      className={className}
                    >
                      {action.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={action.label}
                    type="button"
                    aria-label={action.ariaLabel}
                    onClick={action.onClick}
                    className={className}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  const visual = (
    <div
      className="page-hero-visual relative overflow-hidden rounded-[28px] bg-lunetty-cream"
    >
      {!imageFailed && (
        <div
          ref={imageMotionRef}
          className="absolute inset-0 will-change-transform"
        >
          <motion.div
            initial={reducedMotion ? false : { scale: zoomStart }}
            animate={{ scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt={alt}
              fill
              priority
              sizes={imageSizes}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onError={() => setImageFailed(true)}
              style={positions}
              className="page-hero-image object-cover"
            />
          </motion.div>
        </div>
      )}
      {showBottomVeil && (
        <div
          aria-hidden="true"
          className="page-hero-bottom-veil absolute inset-0"
        />
      )}
      {badge && (
        <span className="absolute right-4 top-4 z-10 rounded-full border border-lunetty-gold/50 bg-lunetty-cream/85 px-3 py-1.5 text-xs font-semibold text-lunetty-ink shadow-sm backdrop-blur-md sm:right-8 sm:top-8">
          {badge}
        </span>
      )}
    </div>
  );

  const containedVisual = (
    <>
      <div className="page-hero-contained-image-area">
        {!imageFailed && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: zoomStart }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt={alt}
              fill
              priority
              sizes={imageSizes}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onError={() => setImageFailed(true)}
              style={positions}
              className="page-hero-image page-hero-contained-main-image object-cover"
            />
          </motion.div>
        )}
        {badge && (
          <span className="absolute right-4 top-4 z-10 rounded-full border border-lunetty-gold/50 bg-lunetty-cream/85 px-3 py-1.5 text-xs font-semibold text-lunetty-ink shadow-sm backdrop-blur-md sm:right-8 sm:top-8">
            {badge}
          </span>
        )}
      </div>
      <div className="page-hero-contained-card-position">{card}</div>
    </>
  );

  return (
    <section
      ref={heroRef}
      aria-labelledby="page-hero-title"
      className={`mb-8 -mx-4 sm:-mx-8 lg:-mx-12 ${className}`}
    >
      {isContained ? (
        <div className="page-hero-contained-inner">
          {containedVisual}
        </div>
      ) : (
        <>
          {visual}
          <div className="page-hero-overlap-content">
            {card}
          </div>
        </>
      )}
    </section>
  );
}
