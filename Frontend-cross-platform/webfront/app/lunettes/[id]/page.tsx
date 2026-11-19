import { Suspense } from "react";
import FrameDetailPage from "../../components/marketplace/FrameDetailPage";

export default function FrameDetailRoute() {
  return (
    <Suspense fallback={<main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pt-32 text-stone-700">Chargement de la monture…</main>}>
      <FrameDetailPage />
    </Suspense>
  );
}
