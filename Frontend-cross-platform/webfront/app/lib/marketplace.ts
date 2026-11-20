import { DEMO_FRAMES, DEMO_OPTICIANS, DEMO_STORES, type Frame, type FrameColorOption, type Optician, type OpticianStore } from "../data/marketplace-demo";
import { productsService } from "../../services/products.service";
import { storesService } from "../../services/stores.service";
import type { JsonRecord } from "../../services/api";

type MarketplaceData = {
  frames: Frame[];
  stores: OpticianStore[];
  isDemo: boolean;
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

export async function loadMarketplaceData(): Promise<MarketplaceData> {
  const [catalogResult, storesResult] = await Promise.allSettled([
    productsService.list(1),
    storesService.list(1),
  ]);
  const catalogProducts =
    catalogResult.status === "fulfilled" ? records(catalogResult.value) : [];
  const apiStores =
    storesResult.status === "fulfilled" ? records(storesResult.value) : [];
  const stores = apiStores.map(mapStore);

  if (!stores.length) {
    return {
      frames: DEMO_FRAMES,
      stores: DEMO_STORES,
      isDemo: true,
      notice: "Catalogue de démonstration : les boutiques ne sont pas disponibles depuis l’API pour le moment.",
      error: storesResult.status === "rejected"
        ? "Les boutiques n’ont pas pu être chargées. La sélection de démonstration reste disponible."
        : undefined,
    };
  }

  const catalog = new Map(
    catalogProducts.map((product) => [text(product.id), product]),
  );
  const listingResults = await Promise.allSettled(
    apiStores.slice(0, 12).map((store) =>
      storesService.listings(text(store.id), 1),
    ),
  );
  const frames = listingResults.flatMap((result, storeIndex) => {
    if (result.status !== "fulfilled") return [];
    const store = stores[storeIndex];
    return records(result.value)
      .map((listing) =>
        mapListing(
          listing,
          store,
          catalog,
          "/images/frame-placeholder.svg",
        ),
      )
      .filter((frame): frame is Frame => Boolean(frame));
  });

  if (frames.length) {
    const failedListings = listingResults.some((result) => result.status === "rejected");
    return {
      frames,
      stores,
      isDemo: false,
      notice: failedListings
        ? "Certaines boutiques ne sont pas encore disponibles dans le catalogue."
        : undefined,
    };
  }

  return {
    frames: DEMO_FRAMES,
    stores,
    isDemo: true,
    notice: "Montures de démonstration affichées : aucune annonce publique tarifée n’est disponible pour le moment.",
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
  useDemoDetails = false,
): Optician[] {
  return stores.map((store) => {
    const demo = useDemoDetails
      ? DEMO_OPTICIANS.find((optician) => optician.id === store.id)
      : undefined;
    return {
      ...demo,
      ...store,
      rating: store.rating ?? demo?.rating,
      reviewCount: store.reviewCount ?? demo?.reviewCount,
      inStoreTryOn: store.inStoreTryOn ?? demo?.inStoreTryOn,
      isNew: store.isNew ?? demo?.isNew,
      montures: frames
        .filter((frame) => frame.storeId === store.id && frame.image !== "/images/frame-placeholder.svg")
        .filter((frame, index, matches) => matches.findIndex((match) => match.image === frame.image) === index)
        .slice(0, 3),
    };
  });
}
