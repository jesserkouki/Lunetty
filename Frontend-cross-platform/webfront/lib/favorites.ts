export const PENDING_FAVORITE_KEY = "lunetty.pending-favorite";
export const PENDING_FAVORITE_RETURN_KEY = "lunetty.pending-favorite-return";
export const FAVORITE_AUTH_REQUIRED_EVENT = "lunetty:favorite-auth-required";

export type FavoriteReturnTab = "landing" | "catalog" | "favorites";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETURN_TABS: FavoriteReturnTab[] = ["landing", "catalog", "favorites"];

export function savePendingFavorite(
  productId: string,
  returnTab: FavoriteReturnTab,
): void {
  if (!UUID_PATTERN.test(productId)) {
    throw new Error("Un identifiant de produit valide est requis.");
  }
  window.sessionStorage.setItem(PENDING_FAVORITE_KEY, productId);
  window.sessionStorage.setItem(PENDING_FAVORITE_RETURN_KEY, returnTab);
}

export function readPendingFavorite(): string | null {
  const productId = window.sessionStorage.getItem(PENDING_FAVORITE_KEY);
  if (!productId) return null;
  if (!UUID_PATTERN.test(productId)) {
    throw new Error("L’article à enregistrer après connexion est invalide.");
  }
  return productId;
}

export function readPendingFavoriteReturnTab(): FavoriteReturnTab | null {
  const tab = window.sessionStorage.getItem(PENDING_FAVORITE_RETURN_KEY);
  if (!tab) return null;
  if (!RETURN_TABS.includes(tab as FavoriteReturnTab)) {
    throw new Error("La destination de retour après connexion est invalide.");
  }
  return tab as FavoriteReturnTab;
}

export function clearPendingFavoriteRecord(): void {
  window.sessionStorage.removeItem(PENDING_FAVORITE_KEY);
}

export function clearPendingFavorite(): void {
  window.sessionStorage.removeItem(PENDING_FAVORITE_KEY);
  window.sessionStorage.removeItem(PENDING_FAVORITE_RETURN_KEY);
}

export function clearPendingFavoriteReturnTab(): void {
  window.sessionStorage.removeItem(PENDING_FAVORITE_RETURN_KEY);
}
