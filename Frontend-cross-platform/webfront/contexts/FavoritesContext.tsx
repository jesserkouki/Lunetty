"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "@/services/api";
import { useAuth } from "@/lib/auth-context";
import {
  isFavoriteProductId,
  LOCAL_FAVORITES_KEY,
} from "@/lib/favorites";
import { FavoriteProduct, featuresService } from "@/services/features.service";
import {
  CatalogProduct,
  productsService,
} from "@/services/products.service";

type FavoriteEntry = {
  id: string;
  cree_le: string;
  produit: CatalogProduct;
};

type FavoritesContextValue = {
  favorites: FavoriteEntry[];
  isLoading: boolean;
  pendingProductIds: ReadonlySet<string>;
  error: string | null;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (
    productId: string,
    product: CatalogProduct,
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

type LocalFavoriteState = {
  ids: string[];
  productsById: Map<string, CatalogProduct>;
};

function isCatalogProduct(value: unknown): value is CatalogProduct {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "string" &&
    typeof product.nom === "string" &&
    typeof product.slug === "string" &&
    typeof product.type === "string"
  );
}

function readLocalFavoriteState(): LocalFavoriteState {
  const stored = window.localStorage.getItem(LOCAL_FAVORITES_KEY);
  if (!stored) return { ids: [], productsById: new Map() };

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    throw new Error("La liste locale des favoris est illisible.");
  }
  if (!Array.isArray(value)) {
    throw new Error("La liste locale des favoris est invalide.");
  }

  const productsById = new Map<string, CatalogProduct>();
  const ids = value.flatMap((entry) => {
    if (isFavoriteProductId(entry)) return [entry];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];

    const favorite = entry as Record<string, unknown>;
    if (!isFavoriteProductId(favorite.id)) return [];
    if (
      isCatalogProduct(favorite.produit) &&
      favorite.produit.id === favorite.id
    ) {
      productsById.set(favorite.id, favorite.produit);
    }
    return [favorite.id];
  });

  return { ids: [...new Set(ids)], productsById };
}

function readLocalFavoriteIds(): string[] {
  return readLocalFavoriteState().ids;
}

async function getLocalProductFavorites(
  ids = readLocalFavoriteIds(),
  productsById = readLocalFavoriteState().productsById,
): Promise<FavoriteEntry[]> {
  const missingIds = ids.filter((id) => !productsById.has(id));
  for (let index = 0; index < missingIds.length; index += 100) {
    const products = await productsService.byIds(
      missingIds.slice(index, index + 100),
    );
    for (const product of products) productsById.set(product.id, product);
  }

  const cree_le = new Date().toISOString();
  return ids.flatMap((id) => {
    const produit = productsById.get(id);
    return produit ? [{ id, cree_le, produit }] : [];
  });
}

async function updateLocalFavorite(
  productId: string,
  wasFavorite: boolean,
  product: CatalogProduct,
): Promise<FavoriteEntry[]> {
  const { ids, productsById } = readLocalFavoriteState();
  const nextIds = wasFavorite
    ? ids.filter((id) => id !== productId)
    : [...new Set([...ids, productId])];

  if (wasFavorite) {
    productsById.delete(productId);
  } else {
    productsById.set(productId, product);
  }

  window.localStorage.setItem(
    LOCAL_FAVORITES_KEY,
    JSON.stringify(
      nextIds.map((id) => {
        const savedProduct = productsById.get(id);
        return savedProduct ? { id, produit: savedProduct } : id;
      }),
    ),
  );
  return getLocalProductFavorites(nextIds, productsById);
}

async function getAccountProductFavorites(): Promise<FavoriteProduct[]> {
  const favorites = await getAllProductFavorites();
  const localIds = readLocalFavoriteIds();
  const alreadySaved = new Set(
    favorites.map((favorite) => favorite.produit.id),
  );
  const newIds = localIds.filter((id) => !alreadySaved.has(id));

  await Promise.all(newIds.map((id) => featuresService.favoriteProduct(id)));
  if (window.localStorage.getItem(LOCAL_FAVORITES_KEY) !== null) {
    window.localStorage.removeItem(LOCAL_FAVORITES_KEY);
  }

  return newIds.length ? getAllProductFavorites() : favorites;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur est survenue lors de la mise à jour des favoris.";
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const currentUserId = user?.id;
  const isAuthenticatedUser =
    status === "authenticated" && Boolean(currentUserId);
  const [accountFavorites, setAccountFavorites] = useState<{
    userId: string;
    items: FavoriteEntry[];
  } | null>(null);
  const [localFavorites, setLocalFavorites] = useState<FavoriteEntry[]>([]);
  const [localFavoritesLoaded, setLocalFavoritesLoaded] = useState(false);
  const [localFallback, setLocalFallback] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  const favorites = useMemo(() => {
    if (!isAuthenticatedUser || localFallback) return localFavorites;
    return accountFavorites && accountFavorites.userId === currentUserId
      ? accountFavorites.items
      : [];
  }, [
    accountFavorites,
    currentUserId,
    isAuthenticatedUser,
    localFallback,
    localFavorites,
  ]);
  const isLoading =
    status === "loading" ||
    (status === "guest" && !localFavoritesLoaded) ||
    (isAuthenticatedUser && loadedUserId !== currentUserId);

  const loadFavorites = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      if (isAuthenticatedUser && currentUserId) {
        try {
          const result = await getAccountProductFavorites();
          if (!isCurrent()) return;
          setAccountFavorites({ userId: currentUserId, items: result });
          setLocalFallback(false);
          setError(null);
        } catch (loadError) {
          try {
            const result = await getLocalProductFavorites();
            if (!isCurrent()) return;
            setLocalFavorites(result);
            setLocalFavoritesLoaded(true);
            setLocalFallback(true);
            setError(isUnauthorized(loadError) ? null : errorMessage(loadError));
          } catch (localError) {
            if (!isCurrent()) return;
            setLocalFavorites([]);
            setLocalFavoritesLoaded(true);
            setLocalFallback(true);
            setError(errorMessage(localError));
          }
        } finally {
          if (isCurrent()) setLoadedUserId(currentUserId);
        }
        return;
      }

      try {
        const result = await getLocalProductFavorites();
        if (!isCurrent()) return;
        setLocalFavorites(result);
        setLocalFallback(true);
        setError(null);
      } catch (loadError) {
        if (!isCurrent()) return;
        setLocalFavorites([]);
        setLocalFallback(true);
        setError(errorMessage(loadError));
      } finally {
        if (isCurrent()) {
          setLocalFavoritesLoaded(true);
          setLoadedUserId(null);
        }
      }
    },
    [currentUserId, isAuthenticatedUser],
  );

  const refresh = useCallback(() => loadFavorites(), [loadFavorites]);

  useEffect(() => {
    if (status === "loading") return;
    let active = true;
    void Promise.resolve().then(() => loadFavorites(() => active));
    return () => {
      active = false;
    };
  }, [loadFavorites, status]);

  const isFavorite = useCallback(
    (productId: string) =>
      favorites.some((favorite) => favorite.produit.id === productId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (productId: string, product: CatalogProduct) => {
      if (!isFavoriteProductId(productId)) {
        setError("Un identifiant de produit valide est requis.");
        return;
      }

      const wasFavorite = isFavorite(productId);
      setPendingProductIds((current) => new Set(current).add(productId));
      setError(null);

      try {
        if (!isAuthenticatedUser || localFallback) {
          const localProducts = await updateLocalFavorite(
            productId,
            wasFavorite,
            product,
          );
          setLocalFavorites(localProducts);
          setLocalFavoritesLoaded(true);
          setLocalFallback(true);
          return;
        }

        if (wasFavorite) {
          await featuresService.unfavoriteProduct(productId);
        } else {
          await featuresService.favoriteProduct(productId);
        }
        await refresh();
      } catch (toggleError) {
        if (isUnauthorized(toggleError)) {
          setLocalFallback(true);
          try {
            setLocalFavorites(
              await updateLocalFavorite(productId, wasFavorite, product),
            );
            setLocalFavoritesLoaded(true);
            setError(null);
          } catch (localError) {
            setLocalFavorites([]);
            setError(errorMessage(localError));
          }
        } else {
          setError(errorMessage(toggleError));
        }
      } finally {
        setPendingProductIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [isAuthenticatedUser, isFavorite, localFallback, refresh],
  );

  const clearError = useCallback(() => setError(null), []);
  const value = useMemo(
    () => ({
      favorites,
      isLoading,
      pendingProductIds,
      error,
      isFavorite,
      toggleFavorite,
      refresh,
      clearError,
    }),
    [
      clearError,
      error,
      favorites,
      isFavorite,
      isLoading,
      pendingProductIds,
      refresh,
      toggleFavorite,
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
