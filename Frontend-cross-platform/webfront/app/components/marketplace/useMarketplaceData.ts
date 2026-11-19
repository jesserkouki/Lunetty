"use client";

import { useEffect, useState } from "react";
import { DEMO_FRAMES, DEMO_STORES, type Frame, type OpticianStore } from "../../data/marketplace-demo";
import { loadMarketplaceData } from "../../lib/marketplace";

type MarketplaceState = {
  frames: Frame[];
  stores: OpticianStore[];
  isDemo: boolean;
  notice?: string;
  error?: string;
  loading: boolean;
};

const INITIAL_STATE: MarketplaceState = {
  frames: DEMO_FRAMES,
  stores: DEMO_STORES,
  isDemo: true,
  loading: true,
};

export function useMarketplaceData() {
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    let active = true;
    loadMarketplaceData()
      .then((data) => {
        if (!active) return;
        setState({ ...data, loading: false });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error("Impossible de charger le catalogue marketplace.", cause);
        setState({
          frames: DEMO_FRAMES,
          stores: DEMO_STORES,
          isDemo: true,
          notice: "Catalogue de démonstration affiché : les données en direct sont indisponibles.",
          error: "Les boutiques n’ont pas pu être chargées. La sélection de démonstration reste disponible.",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
