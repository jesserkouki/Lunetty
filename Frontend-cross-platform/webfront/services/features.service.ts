import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";
import type { CatalogProduct } from "./products.service";

export type FavoriteProduct = {
  id: string;
  cree_le: string;
  produit: CatalogProduct;
};

export type ClientAppointment = {
  id: string;
  magasin_id: string;
  statut: string;
  type_service: string;
  commence_le: string;
  termine_le: string;
  note_client: string | null;
  ordonnance_id: string | null;
  magasin: {
    id: string;
    nom: string;
    slug: string;
    telephone: string | null;
    adresses: Array<{
      ligne_1: string;
      ville: string;
      code_postal: string | null;
      code_pays: string;
    }>;
  };
};

export const featuresService = {
  appointments: (page = 1) =>
    apiRequest<Page<ClientAppointment>>(`appointments/me${queryString({ page, limit: 50 })}`),
  createAppointment: (input: JsonRecord) =>
    apiRequest<JsonRecord>("appointments", { method: "POST", body: JSON.stringify(input) }),
  cancelAppointment: (id: string) =>
    apiRequest<JsonRecord>(`appointments/${id}/cancel`, { method: "POST" }),
  rescheduleAppointment: (id: string, input: {
    commence_le: string;
    termine_le: string;
  }) =>
    apiRequest<JsonRecord>(`appointments/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  attachPrescription: (appointmentId: string, ordonnanceId: string | null) =>
    apiRequest<JsonRecord>(`appointments/${appointmentId}/prescription`, {
      method: "PATCH",
      body: JSON.stringify({ ordonnance_id: ordonnanceId }),
    }),
  notifications: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`notifications${queryString({ page, limit: 20 })}`),
  unreadCount: () => apiRequest<{ count: number }>("notifications/unread-count"),
  markNotificationRead: (id: string) =>
    apiRequest<JsonRecord>(`notifications/${id}/read`, { method: "POST" }),
  notificationPreferences: () => apiRequest<JsonRecord[]>("notifications/preferences"),
  updateNotificationPreference: (input: JsonRecord) =>
    apiRequest<JsonRecord>("notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  tryOnPolicy: () => apiRequest<JsonRecord>("virtual-try-on/consent"),
  tryOnSessions: (page = 1) =>
    apiRequest<Page<JsonRecord>>(`virtual-try-on/sessions${queryString({ page, limit: 20 })}`),
  createTryOn: (input: JsonRecord) =>
    apiRequest<JsonRecord>("virtual-try-on/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  reviewsForProduct: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `products/${id}/reviews${queryString({ page, limit: 20 })}`,
    ),
  reviewsForStore: (id: string, page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `stores/${id}/reviews${queryString({ page, limit: 20 })}`,
    ),
  createProductReview: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`products/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createStoreReview: (id: string, input: JsonRecord) =>
    apiRequest<JsonRecord>(`stores/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  favorites: (kind: "products" | "stores", page = 1) =>
    apiRequest<Page<JsonRecord>>(
      `users/me/favorites/${kind}${queryString({ page, limit: 20 })}`,
    ),
  favoriteProducts: (page = 1, limit = 20) =>
    apiRequest<Page<FavoriteProduct>>(
      `users/me/favorites/products${queryString({ page, limit })}`,
    ),
  isFavoriteProduct: (id: string) =>
    apiRequest<{ isFavorite: boolean }>(`users/me/favorites/products/${id}`),
  favoriteProduct: (id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/products/${id}`, { method: "POST" }),
  unfavoriteProduct: (id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/products/${id}`, { method: "DELETE" }),
  favorite: (kind: "products" | "stores", id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/${kind}/${id}`, { method: "POST" }),
  unfavorite: (kind: "products" | "stores", id: string) =>
    apiRequest<JsonRecord>(`users/me/favorites/${kind}/${id}`, { method: "DELETE" }),
  markAllNotificationsRead: () =>
    apiRequest<JsonRecord>("notifications/read-all", { method: "POST" }),
};
