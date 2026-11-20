import { Suspense } from "react";
import OpticianShowcasePage from "../../components/marketplace/OpticianShowcasePage";

export default function OpticianShowcaseRoute() {
  return (
    <Suspense fallback={<main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pt-32 text-stone-700">Chargement de la boutique…</main>}>
      <OpticianShowcasePage />
    </Suspense>
  );
}
