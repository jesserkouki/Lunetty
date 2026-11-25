import { apiRequest, queryString } from "./api";

export type CatalogueProductType =
  | "MONTURE"
  | "VERRE"
  | "LENTILLE_CONTACT"
  | "ACCESSOIRE";

export type CatalogueImage = {
  id: string;
  catalogueProductId: string;
  variantId: string | null;
  imageUrl: string;
  storageKey: string | null;
  imageSource: string;
  sourceUrl: string | null;
  licenseInformation: string | null;
  isVerified: boolean;
  isPrimary: boolean;
  verifiedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogueVariant = {
  id: string;
  catalogueProductId: string;
  colorCode: string | null;
  colorName: string | null;
  ean: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: CatalogueImage[];
};

export type CatalogueProduct = {
  id: string;
  brand: string;
  reference: string;
  model: string | null;
  productType: CatalogueProductType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: CatalogueVariant[];
  images: CatalogueImage[];
};

export type CatalogueProductPage = {
  data: CatalogueProduct[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CatalogueSummary = {
  totalProducts: number;
  totalVariants: number;
  totalVerifiedImages: number;
  productsWithoutVerifiedImages: number;
  activeProducts: number;
  archivedProducts: number;
};

export type CatalogueProductDraft = {
  brand: string;
  reference: string;
  model?: string | null;
  productType: CatalogueProductType;
};

export type CatalogueVariantDraft = {
  colorCode?: string | null;
  colorName?: string | null;
  ean?: string | null;
};

export type CatalogueImageDraft = {
  imageUrl: string;
  storageKey?: string | null;
  imageSource: string;
  sourceUrl?: string | null;
  licenseInformation?: string | null;
  variantId?: string | null;
  isPrimary?: boolean;
};

const root = "admin/catalogue";

export const catalogueAdminService = {
  summary: () => apiRequest<CatalogueSummary>(`${root}/summary`),
  products: (filters: {
    q?: string;
    page?: number;
    limit?: number;
    productType?: CatalogueProductType;
    isActive?: boolean;
  }) =>
    apiRequest<CatalogueProductPage>(
      `${root}/products${queryString({
        ...filters,
        isActive:
          filters.isActive === undefined ? undefined : String(filters.isActive),
      })}`,
    ),
  product: (id: string) =>
    apiRequest<CatalogueProduct>(`${root}/products/${encodeURIComponent(id)}`),
  createProduct: (payload: CatalogueProductDraft) =>
    apiRequest<CatalogueProduct>(`${root}/products`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: string, payload: Partial<CatalogueProductDraft> & { isActive?: boolean }) =>
    apiRequest<CatalogueProduct>(`${root}/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createVariant: (productId: string, payload: CatalogueVariantDraft) =>
    apiRequest<CatalogueVariant>(
      `${root}/products/${encodeURIComponent(productId)}/variants`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updateVariant: (
    productId: string,
    variantId: string,
    payload: CatalogueVariantDraft,
  ) =>
    apiRequest<CatalogueVariant>(
      `${root}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),
  archiveVariant: (productId: string, variantId: string) =>
    apiRequest<{ success: boolean }>(
      `${root}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      { method: "DELETE" },
    ),
  createImage: (productId: string, payload: CatalogueImageDraft) =>
    apiRequest<CatalogueImage>(
      `${root}/products/${encodeURIComponent(productId)}/images`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updateImage: (imageId: string, payload: Partial<CatalogueImageDraft> & { isVerified?: boolean }) =>
    apiRequest<CatalogueImage>(`${root}/images/${encodeURIComponent(imageId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteImage: (imageId: string) =>
    apiRequest<{ success: boolean }>(`${root}/images/${encodeURIComponent(imageId)}`, {
      method: "DELETE",
    }),
};
