import type { Frame, FrameColorOption, Optician, OpticianStore } from "./marketplace-types";
import { storesService } from "../../services/stores.service";
import type { JsonRecord } from "../../services/api";

type MarketplaceData = {
  frames: Frame[];
  stores: OpticianStore[];
  notice?: string;
  error?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): JsonRecord[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return [];
  return value.data.filter(isRecord);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function colorSwatch(color: string) {
  const normalized = color.toLocaleLowerCase("fr");
  if (normalized.includes("dor") || normalized.includes("champagne")) return "#c6a674";
  if (normalized.includes("argent") || normalized.includes("acier")) return "#b9c1c8";
  if (normalized.includes("havane") || normalized.includes("écaille") || normalized.includes("brun")) return "#8a5939";
  if (normalized.includes("vert")) return "#68745c";
  if (normalized.includes("bordeaux") || normalized.includes("rouge")) return "#7c3543";
  if (normalized.includes("noir")) return "#252322";
  return "#9a8d7a";
}

function mapStore(value: JsonRecord): OpticianStore {
  const id = text(value.id, "boutique");
  const photoCandidate = text(
    value.url_image_couverture,
    text(value.photo, text(value.image_couverture)),
  );
  const photo = photoCandidate !== "/images/boutiques.svg" ? photoCandidate : "";
  return {
    id,
    slug: text(value.slug, id),
    name: text(value.nom, "Opticien partenaire"),
    city: text(value.ville ?? value.adresse_ville, "Ville non renseignée"),
    district: text(value.quartier ?? value.region, ""),
    address: text(value.adresse ?? value.adresse_ligne_1, ""),
    phone: text(value.telephone, ""),
    hours: text(value.horaires, "Horaires à confirmer en boutique"),
    description: text(value.description, "Découvrez la sélection de cet opticien partenaire."),
    logo: text(value.url_logo, "/images/boutiques.svg"),
    cover: photo || "/images/boutiques.svg",
    photo: photo || undefined,
    photoAlt: text(value.image_couverture_alt, `Boutique ${text(value.nom, "d’optique")}`),
    listingCount: number(value.nombre_montures) ?? 0,
    independent: typeof value.independant === "boolean" ? value.independant : undefined,
    latitude: number(value.latitude),
    longitude: number(value.longitude),
    rating: number(value.note),
    reviewCount: number(value.nombre_avis),
    inStoreTryOn: value.essayage_en_magasin === true,
    isNew: value.nouveau === true,
  };
}

function mapListing(
  listing: JsonRecord,
  store: OpticianStore,
  catalog: Map<string, JsonRecord>,
  imageFallback: string,
): Frame | undefined {
  const product = isRecord(listing.produit) ? listing.produit : {};
  const productId = text(listing.produit_id ?? product.id);
  const catalogProduct = catalog.get(productId) ?? product;
  const variants = Array.isArray(listing.variantes)
    ? listing.variantes.filter(isRecord)
    : [];
  const variantListing = variants.find((variant) => variant.est_disponible !== false);
  if (!variantListing) return undefined;
  const variant = isRecord(variantListing.variante) ? variantListing.variante : {};
  const price = number(variantListing.prix);
  if (!price || price <= 0) return undefined;

  const id = text(listing.id);
  const name = text(listing.titre_personnalise, text(catalogProduct.nom, "Monture"));
  const slug = text(catalogProduct.slug, id);
  const attributes = isRecord(variant.attributs) ? variant.attributs : {};
  const image = text(
    variant.image,
    text(variant.url_image, text(catalogProduct.image, text(catalogProduct.url_image, imageFallback))),
  );
  const colorOptions = variants
    .map((item): FrameColorOption | undefined => {
      const optionVariant = isRecord(item.variante) ? item.variante : {};
      const optionColor = text(optionVariant.couleur, text(item.couleur));
      if (!optionColor) return undefined;
      return {
        name: optionColor,
        swatch: colorSwatch(optionColor),
        image: text(
          optionVariant.image,
          text(optionVariant.url_image, text(item.image, text(item.url_image, text(catalogProduct.image, text(catalogProduct.url_image, image))))),
        ),
      };
    })
    .filter((option): option is FrameColorOption => Boolean(option));
  const modelCandidate = text(
    catalogProduct.url_modele_3d,
    text(listing.url_modele_3d, text(variant.url_modele_3d)),
  );
  const modelUrl = /\.glb(?:$|[?#])/i.test(modelCandidate) ? modelCandidate : undefined;

  return {
    id,
    productId,
    slug: id || slug,
    name,
    brand: text(catalogProduct.marque, "Collection partenaire"),
    category: text(catalogProduct.categorie ?? catalogProduct.type, "Optique"),
    shape: text(attributes.forme ?? variant.forme, "Monture"),
    style: text(attributes.style, "Contemporain"),
    color: text(variant.couleur, "Coloris à découvrir"),
    material: text(variant.materiau, "Matière à découvrir"),
    faceShapes: [],
    price,
    currency: text(variantListing.devise, "TND"),
    image,
    imageAlt: `Monture ${name}`,
    colorOptions: [...new Map(colorOptions.map((option) => [option.name, option])).values()],
    modelUrl,
    description: text(listing.description_personnalisee, text(catalogProduct.description, "Une monture sélectionnée par votre opticien.")),
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    city: store.city,
    publishedAt: text(listing.publie_le, text(listing.cree_le, "")),
    engagement: number(listing.engagement) ?? 0,
    salesCount: number(listing.ventes_recentes),
    sponsored: listing.sponsorise === true,
    rating: number(listing.note),
    listingVariantId: text(variantListing.id),
  };
}

function mapPublishedStock(stock: JsonRecord, store: OpticianStore): Frame | undefined {
  if (stock.available !== true) return undefined;
  const id = text(stock.id);
  const brand = text(stock.brand, "Monture");
  const reference = text(stock.reference);
  const name = text(stock.name, [brand, reference].filter(Boolean).join(" "));
  const color = text(stock.color, "Coloris à découvrir");
  const price = number(stock.price);
  if (!id || !name || price === undefined || price <= 0) return undefined;
  const image = text(stock.imageUrl, "/images/frame-placeholder.svg");

  return {
    id,
    productId: id,
    slug: id,
    name,
    brand,
    category: "Optique",
    shape: "Monture",
    style: "Contemporain",
    color,
    material: "Matière à découvrir",
    faceShapes: [],
    price,
    currency: text(stock.currency, "TND"),
    image,
    imageAlt: `Monture ${name}`,
    colorOptions: color === "Coloris à découvrir"
      ? []
      : [{ name: color, swatch: colorSwatch(color), image }],
    modelUrl: undefined,
    description: "Une monture disponible auprès de votre opticien.",
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    city: store.city,
    publishedAt: text(stock.createdAt),
    engagement: 0,
    sponsored: false,
    listingVariantId: id,
  };
}

export async function loadMarketplaceData(): Promise<MarketplaceData> {
  const firstPage = await storesService.list(1, 100);
  const firstPageData = records(firstPage);
  const meta = firstPage.meta;
  const totalPages = isRecord(meta)
    ? Math.max(1, Math.floor(number(meta.totalPages) ?? 1))
    : 1;
  const otherStorePages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      storesService.list(index + 2, 100),
    ),
  );
  const apiStores = [
    ...firstPageData,
    ...otherStorePages.flatMap(records),
  ];
  const stores = apiStores.map(mapStore);
  const catalogueResults = await Promise.allSettled(
    stores.map((store) => storesService.catalogue(store.id, 1, 100)),
  );
  const frames = catalogueResults.flatMap((result, storeIndex) => {
    if (result.status !== "fulfilled") return [];
    const store = stores[storeIndex];
    return records(result.value)
      .map((stock) => mapPublishedStock(stock, store))
      .filter((frame): frame is Frame => Boolean(frame));
  });
  const storesWithCounts = stores.map((store) => ({
    ...store,
    listingCount: frames.filter((frame) => frame.storeId === store.id).length,
  }));
  const failedStores = catalogueResults.filter(
    (result) => result.status === "rejected",
  ).length;

  return {
    frames,
    stores: storesWithCounts,
    notice: failedStores
      ? `Les produits de ${failedStores} boutique${failedStores === 1 ? "" : "s"} n’ont pas pu être chargés.`
      : undefined,
  };
}

export function getStoreHref(store: OpticianStore) {
  return `/opticiens/${encodeURIComponent(store.slug || store.id)}`;
}

export function getFrameHref(frame: Frame) {
  return `/lunettes/${encodeURIComponent(frame.slug || frame.id)}`;
}

export function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(price);
}

export function findFrame(frames: Frame[], id: string) {
  return frames.find((frame) => frame.id === id || frame.slug === id);
}

export function findStore(stores: OpticianStore[], id: string) {
  return stores.find((store) => store.id === id || store.slug === id);
}

export function getOpticians(
  stores: OpticianStore[],
  frames: Frame[],
): Optician[] {
  return stores.map((store) => {
    return {
      ...store,
      montures: frames
        .filter((frame) => frame.storeId === store.id && frame.image !== "/images/frame-placeholder.svg")
        .filter((frame, index, matches) => matches.findIndex((match) => match.image === frame.image) === index)
        .slice(0, 3),
    };
  });
}
