import { Suspense } from "react";
import type { Metadata } from "next";
import OpticianShowcasePage from "../../components/marketplace/OpticianShowcasePage";
import { DEMO_STORES } from "../../data/marketplace-demo";
import { findStore } from "../../lib/marketplace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const store = findStore(DEMO_STORES, id);
  const name = store?.name ?? decodeURIComponent(id);
  const description = store?.description ??
    `Découvrez la vitrine de ${name}, ses montures et ses services chez Lunetty.`;
  return {
    title: `${name} | Opticien Lunetty`,
    description,
    openGraph: {
      title: `${name} | Opticien Lunetty`,
      description,
      images: [store?.photo || store?.cover || "/images/boutiques.svg"],
    },
  };
}

export default function OpticianShowcaseRoute() {
  return (
    <Suspense fallback={<main id="contenu" className="min-h-screen bg-lunetty-cream px-5 pt-32 text-lunetty-muted">Chargement de la boutique…</main>}>
      <OpticianShowcasePage />
    </Suspense>
  );
}
