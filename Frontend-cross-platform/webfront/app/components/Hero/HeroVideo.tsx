"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Hero vidéo plein écran : sans titre, sans son.
 * Fichiers requis dans /public/videos : hero.mp4, hero.webm, hero-poster.jpg
 * Bouton "Découvrir la collection" -> scroll vers l'élément #collection
 */
export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true; // jamais de son
    video.defaultMuted = true;

    const tryPlay = () => video.play().catch(() => setPlaying(false));
    tryPlay();

    const onTime = () => {
      if (progressRef.current && video.duration) {
        progressRef.current.style.width = `${(video.currentTime / video.duration) * 100}%`;
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Si le navigateur bloque l'autoplay, le 1er toucher/clic lance la vidéo
    const unlock = () => { if (video.paused) tryPlay(); };
    document.addEventListener("pointerdown", unlock, { once: true });

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("pointerdown", unlock);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <section className="relative w-full h-[min(calc(100svh-5rem),760px)] min-h-[420px] overflow-hidden bg-black rounded-b-[36px]">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-[50%_30%] pointer-events-none select-none"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        poster="/videos/hero-poster.jpg"
      >
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dégradé haut/bas pour la lisibilité des boutons */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/35 via-transparent via-50% to-black/70" />

      {/* Bouton d'action */}
      <button
        onClick={() =>
          document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute z-20 right-[clamp(20px,6vw,80px)] bottom-16 bg-white text-stone-900 font-bold text-[15px] px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-transform"
      >
        Découvrir la collection
      </button>

      {/* Pause + barre de progression */}
      <div className="absolute z-20 left-[clamp(20px,6vw,80px)] right-[clamp(20px,6vw,80px)] bottom-5 flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="w-9 h-9 rounded-full border border-white/30 bg-white/10 backdrop-blur text-amber-200 text-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
          <div
            ref={progressRef}
            className="h-full w-0 bg-gradient-to-r from-amber-200 to-amber-500"
          />
        </div>
      </div>
    </section>
  );
}
