"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-context";
import {
  clearPendingFavorite,
  clearPendingFavoriteRecord,
  FAVORITE_AUTH_REQUIRED_EVENT,
  PENDING_FAVORITE_KEY,
  readPendingFavorite,
  savePendingFavorite,
  type FavoriteReturnTab,
} from "@/lib/favorites";
import {
  FavoriteProduct,
  featuresService,
} from "@/services/features.service";

type FavoritesContextValue = {
  favorites: FavoriteProduct[];
  isLoading: boolean;
  pendingProductIds: ReadonlySet<string>;
  error: string | null;
  loadError: string | null;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (
    productId: string,
    returnTab: FavoriteReturnTab,
  ) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

async function getAllProductFavorites(): Promise<FavoriteProduct[]> {
  const favorites: FavoriteProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await featuresService.favoriteProducts(page, 100);
    favorites.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  }

  return favorites;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur est survenue lors de la mise à jour des favoris.";
}

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const currentUserId = user?.id;
  const currentUserAccountType = user?.accountType;
  const [favoriteData, setFavoriteData] = useState<{
    userId: string;
    items: FavoriteProduct[];
  } | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isClient =
    status === "authenticated" && currentUserAccountType === "CLIENT";
  const favorites = useMemo(
    () =>
      isClient && favoriteData && favoriteData.userId === currentUserId
        ? favoriteData.items
        : [],
    [currentUserId, favoriteData, isClient],
  );
  const isLoading =
    status === "loading" || (isClient && loadedUserId !== currentUserId);

  const refresh = useCallback(async () => {
    try {
      const result = await getAllProductFavorites();
      if (currentUserId) {
        setFavoriteData({ userId: currentUserId, items: result });
      }
      setError(null);
      setLoadError(null);
    } catch (refreshError) {
      const message = errorMessage(refreshError);
      setError(message);
      setLoadError(message);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (status === "loading") return;
    if (
      status !== "authenticated" ||
      currentUserAccountType !== "CLIENT" ||
      !currentUserId
    ) {
      if (currentUserAccountType !== "CLIENT") clearPendingFavorite();
      return;
    }

    let active = true;
    const load = async () => {
      setError(null);
      setLoadError(null);
      try {
        let pendingProductId: string | null = null;
        try {
          pendingProductId = readPendingFavorite();
        } catch (readError) {
          clearPendingFavorite();
          setError(errorMessage(readError));
        }

        if (pendingProductId) {
          try {
            await featuresService.favoriteProduct(pendingProductId);
            clearPendingFavoriteRecord();
          } catch (favoriteError) {
            setError(errorMessage(favoriteError));
          }
        }

        const result = await getAllProductFavorites();
        if (active) setFavoriteData({ userId: currentUserId, items: result });
      } catch (loadError) {
        if (active) {
          const message = errorMessage(loadError);
          setError(message);
          setLoadError(message);
        }
      } finally {
        if (active) setLoadedUserId(currentUserId);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [currentUserAccountType, currentUserId, status]);

  const isFavorite = useCallback(
    (productId: string) =>
      favorites.some((favorite) => favorite.produit.id === productId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (productId: string, returnTab: FavoriteReturnTab) => {
      if (status === "guest") {
        try {
          savePendingFavorite(productId, returnTab);
          window.dispatchEvent(new Event(FAVORITE_AUTH_REQUIRED_EVENT));
        } catch (saveError) {
          setError(errorMessage(saveError));
        }
        return;
      }
      if (
        status !== "authenticated" ||
        !user ||
        user.accountType !== "CLIENT"
      ) {
        setError("Les favoris sont réservés aux clients connectés.");
        return;
      }

      setPendingProductIds((current) => new Set(current).add(productId));
      setError(null);
      try {
        if (isFavorite(productId)) {
          await featuresService.unfavoriteProduct(productId);
        } else {
          await featuresService.favoriteProduct(productId);
        }
        if (window.sessionStorage.getItem(PENDING_FAVORITE_KEY) === productId) {
          clearPendingFavoriteRecord();
        }
        await refresh();
      } catch (toggleError) {
        setError(errorMessage(toggleError));
      } finally {
        setPendingProductIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [isFavorite, refresh, status, user],
  );

  const clearError = useCallback(() => {
    setError(null);
    setLoadError(null);
  }, []);
  const value = useMemo(
    () => ({
      favorites,
      isLoading,
      pendingProductIds,
      error,
      loadError,
      isFavorite,
      toggleFavorite,
      refresh,
      clearError,
    }),
    [
      favorites,
      isLoading,
      pendingProductIds,
      error,
      loadError,
      isFavorite,
      toggleFavorite,
      refresh,
      clearError,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside <FavoritesProvider>");
  }
  return context;
}
