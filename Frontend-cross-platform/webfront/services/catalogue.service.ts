import { apiRequest, queryString } from "./api";

export interface CatalogueImageSuggestion {
  matchType:
    | "EXACT_BRAND_REFERENCE_COLOR"
    | "EXACT_EAN"
    | "EXACT_BRAND_REFERENCE"
    | "NORMALIZED_BRAND_REFERENCE"
    | "EXACT_REFERENCE"
    | "APPROXIMATE";
  product: {
    id: string;
    brand: string;
    reference: string;
    model: string | null;
    productType: string;
  };
  variant: {
    id: string;
    colorCode: string | null;
    colorName: string | null;
    ean: string | null;
  } | null;
  images: Array<{
    id: string;
    imageUrl: string;
    storageKey: string | null;
    imageSource: string;
    sourceUrl: string | null;
    licenseInformation: string | null;
    isPrimary: boolean;
  }>;
}

export interface CatalogueImageSearch {
  brand?: string;
  reference?: string;
  model?: string;
  color?: string;
  ean?: string;
}

export interface ExternalImageSuggestion {
  id: string;
  provider: string;
  title: string;
  description: string | null;
  imageUrl: string;
  originalImageUrl: string | null;
  sourcePageUrl: string;
  sourceDomain: string;
  creator: string | null;
  creatorUrl: string | null;
  license: string | null;
  licenseVersion: string | null;
  licenseUrl: string | null;
  attribution: string | null;
  source: string;
  matchSignal:
    | "EAN_TEXT_MATCH"
    | "BRAND_REFERENCE_TEXT_MATCH"
    | "BRAND_MODEL_TEXT_MATCH"
    | "REFERENCE_TEXT_MATCH"
    | "SEARCH_CANDIDATE";
  isVerified: false;
  licenseStatus: "LICENSE_METADATA_AVAILABLE" | "NOT_PROVIDED";
}

export interface ExternalImageSearchResponse {
  providers: string[];
  warnings: string[];
  data: ExternalImageSuggestion[];
}

export const catalogueService = {
  imageSuggestions: (
    storeId: string,
    search: CatalogueImageSearch,
  ): Promise<{ data: CatalogueImageSuggestion[] }> =>
    apiRequest(
      `products/image-suggestions${queryString({
        storeId,
        ...search,
        page: 1,
        limit: 1,
      })}`,
    ),
  externalImageSuggestions: (
    storeId: string,
    search: CatalogueImageSearch,
  ): Promise<ExternalImageSearchResponse> =>
    apiRequest(
      `products/image-suggestions/external${queryString({
        storeId,
        ...search,
        page: 1,
        limit: 8,
      })}`,
    ),
  paidExternalImageSuggestions: (
    storeId: string,
    search: CatalogueImageSearch,
  ): Promise<ExternalImageSearchResponse> =>
    apiRequest(
      `products/image-suggestions/paid${queryString({
        storeId,
        ...search,
        page: 1,
        limit: 8,
      })}`,
    ),
};
