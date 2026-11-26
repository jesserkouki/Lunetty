"use client";

import { useEffect, useState } from "react";
import type { Frame, OpticianStore } from "../../lib/marketplace-types";
import { loadMarketplaceData } from "../../lib/marketplace";

type MarketplaceState = {
  frames: Frame[];
  stores: OpticianStore[];
  notice?: string;
  error?: string;
  loading: boolean;
};

const INITIAL_STATE: MarketplaceState = {
  frames: [],
  stores: [],
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
          frames: [],
          stores: [],
          error: cause instanceof Error
            ? cause.message
            : "Les données du catalogue ne sont pas disponibles.",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
