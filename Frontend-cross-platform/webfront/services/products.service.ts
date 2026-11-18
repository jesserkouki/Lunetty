import { apiRequest, JsonRecord, queryString } from "./api";
import type { Page } from "./users.service";

export type CatalogProduct = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  fabricant: string | null;
  type: string;
  categorie: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  storeId: string | null;
  storeName: string | null;
  frameShape: string | null;
};

export const productsService = {
  list: (page = 1, q?: string, type?: string, limit = 20) =>
    apiRequest<Page<CatalogProduct>>(
      `products${queryString({ page, limit, q, type })}`,
    ),
  find: (id: string) => apiRequest<JsonRecord>(`products/${id}`),
  variants: (id: string) => apiRequest<JsonRecord[]>(`products/${id}/variants`),
};
