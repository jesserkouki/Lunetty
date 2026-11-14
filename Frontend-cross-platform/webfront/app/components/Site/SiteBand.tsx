import React from "react";

/**
 * Bande de section : donne le même rythme vertical à toute la page
 * et alterne fond neutre / fond teinté pour bien séparer les blocs.
 */
export default function Band({
  dark, tone = "plain", id, children, className = "",
}: {
  dark: boolean; tone?: "plain" | "soft"; id?: string; children: React.ReactNode; className?: string;
}) {
  const soft = tone === "soft";
  const bg = soft
    ? dark
      ? "bg-white/[0.035] border-y border-white/5"
      : "bg-gradient-to-b from-[#F5F0E5] to-[#F9F6EE] border-y border-stone-200/70"
    : "";
  return (
    <section id={id} className={`relative scroll-mt-24 py-16 sm:py-20 ${bg} ${className}`}>
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">{children}</div>
    </section>
  );
}
