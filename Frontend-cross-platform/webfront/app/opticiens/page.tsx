import { Suspense } from "react";
import OpticiansPage from "../components/marketplace/OpticiansPage";

export default function OpticiensRoute() {
  return (
    <Suspense fallback={<main id="contenu" className="min-h-screen bg-[#f5f0e7] px-5 pt-32 text-stone-700">Chargement des opticiens…</main>}>
      <OpticiansPage />
    </Suspense>
  );
}
