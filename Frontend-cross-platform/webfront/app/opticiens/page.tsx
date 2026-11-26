import { Suspense } from "react";
import OpticiansPage from "../components/marketplace/OpticiansPage";

export default function OpticiensRoute() {
  return (
    <Suspense fallback={<main id="contenu" className="min-h-screen bg-lunetty-cream px-5 pt-32 text-lunetty-muted">Chargement des opticiens…</main>}>
      <OpticiansPage />
    </Suspense>
  );
}
