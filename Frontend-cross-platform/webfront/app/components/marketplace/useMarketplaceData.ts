"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_FRAMES, DEMO_STORES } from "../../data/marketplace-demo";
import type { Frame, OpticianStore } from "../../lib/marketplace-types";
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

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: undefined }));
    try {
      const data = await loadMarketplaceData();
      setState({ ...data, isDemo: false, loading: false });
    } catch (cause: unknown) {
      console.error("Impossible de charger le catalogue marketplace.", cause);
      setState({
        frames: DEMO_FRAMES,
        stores: DEMO_STORES,
        isDemo: true,
        notice: "Catalogue de démonstration affiché : les données en direct sont indisponibles.",
        error: "Les boutiques n’ont pas pu être chargées. La sélection de démonstration reste disponible.",
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void reload());
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [reload]);

  return { ...state, reload };
}
