export type Frame = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  shape: string;
  style: string;
  color: string;
  material: string;
  faceShapes: string[];
  price: number;
  currency: string;
  image: string;
  imageAlt: string;
  colorOptions?: FrameColorOption[];
  modelUrl?: string;
  description: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  city: string;
  publishedAt: string;
  engagement: number;
  salesCount?: number;
  sponsored: boolean;
  rating?: number;
  listingVariantId?: string;
};

export type FrameColorOption = {
  name: string;
  swatch: string;
  image?: string;
  filter?: string;
};

export type OpticianStore = {
  id: string;
  slug: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  logo: string;
  cover: string;
  photo?: string;
  photoAlt?: string;
  listingCount: number;
  independent?: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  inStoreTryOn?: boolean;
  isNew?: boolean;
};

export type Optician = OpticianStore & {
  montures: Frame[];
};

const STORE_COVER = "/images/boutiques.svg";
const DEMO_FRAME_IMAGES = {
  aurore: "/images/frame-aurore.svg",
  meridien: "/images/frame-meridien.svg",
  ecaille: "/images/frame-ecaille.svg",
  ligne: "/images/frame-ligne.svg",
  sillage: "/images/frame-sillage.svg",
  horizon: "/images/frame-horizon.svg",
  atelier: "/images/frame-atelier.svg",
  nuance: "/images/frame-nuance.svg",
};

function demoColorOptions(
  image: string,
  primaryName: string,
  primarySwatch: string,
  secondaryName: string,
  secondarySwatch: string,
  secondaryFilter: string,
): FrameColorOption[] {
  return [
    { name: primaryName, swatch: primarySwatch, image },
    { name: secondaryName, swatch: secondarySwatch, image, filter: secondaryFilter },
  ];
}

export const DEMO_STORES: OpticianStore[] = [
  {
    id: "atelier-vision-tunis",
    slug: "atelier-vision-tunis",
    name: "Atelier Vision",
    city: "Tunis",
    district: "La Marsa",
    address: "12, avenue Habib Bourguiba, La Marsa",
    phone: "+216 71 000 101",
    hours: "Lun–Sam, 09:00–19:00",
    description: "Une sélection de créateurs indépendants, ajustée avec soin à La Marsa.",
    logo: STORE_COVER,
    cover: STORE_COVER,
    listingCount: 34,
    independent: true,
    rating: 4.8,
    reviewCount: 126,
    inStoreTryOn: true,
    latitude: 36.8782,
    longitude: 10.3247,
    distanceKm: 2.4,
  },
  {
    id: "maison-du-regard-sousse",
    slug: "maison-du-regard-sousse",
    name: "Maison du Regard",
    city: "Sousse",
    district: "Centre-ville",
    address: "8, rue de la République, Sousse",
    phone: "+216 73 000 202",
    hours: "Lun–Sam, 09:00–18:30",
    description: "Des montures contemporaines choisies auprès de maisons optiques reconnues.",
    logo: STORE_COVER,
    cover: STORE_COVER,
    listingCount: 48,
    independent: false,
    rating: 4.7,
    reviewCount: 89,
    inStoreTryOn: true,
    isNew: true,
    latitude: 35.8256,
    longitude: 10.6369,
    distanceKm: 6.8,
  },
  {
    id: "optique-carre-sfax",
    slug: "optique-carre-sfax",
    name: "Optique Carré",
    city: "Sfax",
    district: "Sakiet Ezzit",
    address: "21, avenue Majida Boulila, Sfax",
    phone: "+216 74 000 303",
    hours: "Lun–Sam, 08:30–18:00",
    description: "Un accompagnement de proximité et une collection aux lignes affirmées.",
    logo: STORE_COVER,
    cover: STORE_COVER,
    listingCount: 26,
    independent: true,
    rating: 4.9,
    reviewCount: 74,
    latitude: 34.7406,
    longitude: 10.7603,
    distanceKm: 12.1,
  },
  {
    id: "lunetterie-du-cap-nabeul",
    slug: "lunetterie-du-cap-nabeul",
    name: "La Lunetterie du Cap",
    city: "Nabeul",
    district: "Centre",
    address: "5, avenue Farhat Hached, Nabeul",
    phone: "+216 72 000 404",
    hours: "Lun–Sam, 09:00–18:00",
    description: "Une boutique indépendante au service des regards singuliers.",
    logo: STORE_COVER,
    cover: STORE_COVER,
    listingCount: 39,
    independent: true,
    rating: 4.6,
    reviewCount: 53,
    inStoreTryOn: true,
    latitude: 36.4513,
    longitude: 10.7357,
    distanceKm: 18.5,
  },
];

export const DEMO_FRAMES: Frame[] = [
  {
    id: "aurore-01",
    productId: "aurore-01",
    slug: "aurore-01",
    name: "Aurore",
    brand: "Lunetty Atelier",
    category: "Optique",
    shape: "Ronde",
    style: "Minimaliste",
    color: "Doré",
    material: "Métal",
    faceShapes: ["Ovale", "Carré"],
    price: 329,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.aurore,
    imageAlt: "Monture ronde Aurore, finition dorée",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.aurore, "Doré", "#c6a674", "Argent", "#c3cbd1", "grayscale(.7) brightness(1.2)"),
    description: "Une silhouette ronde et légère, dessinée pour accompagner le quotidien.",
    storeId: DEMO_STORES[0].id,
    storeSlug: DEMO_STORES[0].slug,
    storeName: DEMO_STORES[0].name,
    city: DEMO_STORES[0].city,
    publishedAt: "2026-10-25",
    engagement: 94,
    salesCount: 42,
    sponsored: false,
    rating: 4.8,
  },
  {
    id: "meridien-02",
    productId: "meridien-02",
    slug: "meridien-02",
    name: "Méridien",
    brand: "Lunetty Atelier",
    category: "Optique",
    shape: "Rectangulaire",
    style: "Contemporain",
    color: "Écaille",
    material: "Acétate",
    faceShapes: ["Rond", "Ovale"],
    price: 389,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.meridien,
    imageAlt: "Monture rectangulaire Méridien en acétate écaille",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.meridien, "Écaille", "#80583d", "Noir", "#272522", "grayscale(.9) brightness(.78)"),
    description: "Des lignes nettes et une matière chaleureuse pour une allure intemporelle.",
    storeId: DEMO_STORES[1].id,
    storeSlug: DEMO_STORES[1].slug,
    storeName: DEMO_STORES[1].name,
    city: DEMO_STORES[1].city,
    publishedAt: "2026-11-04",
    engagement: 78,
    salesCount: 37,
    sponsored: true,
    rating: 4.7,
  },
  {
    id: "ecaille-03",
    productId: "ecaille-03",
    slug: "ecaille-03",
    name: "Écaille",
    brand: "Maison Selma",
    category: "Optique",
    shape: "Papillon",
    style: "Classique",
    color: "Havane",
    material: "Acétate",
    faceShapes: ["Carré", "Cœur"],
    price: 279,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.ecaille,
    imageAlt: "Monture papillon Écaille en acétate havane",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.ecaille, "Havane", "#8a5939", "Miel", "#c38b4c", "sepia(.55) brightness(1.2)"),
    description: "Une monture expressive aux nuances profondes et au porté confortable.",
    storeId: DEMO_STORES[2].id,
    storeSlug: DEMO_STORES[2].slug,
    storeName: DEMO_STORES[2].name,
    city: DEMO_STORES[2].city,
    publishedAt: "2026-09-16",
    engagement: 62,
    salesCount: 51,
    sponsored: false,
    rating: 4.9,
  },
  {
    id: "ligne-04",
    productId: "ligne-04",
    slug: "ligne-04",
    name: "Ligne",
    brand: "Atelier K",
    category: "Optique",
    shape: "Carrée",
    style: "Minimaliste",
    color: "Noir",
    material: "Acétate",
    faceShapes: ["Rond", "Ovale"],
    price: 349,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.ligne,
    imageAlt: "Monture carrée Ligne en acétate noir",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.ligne, "Noir", "#272522", "Argent", "#c3cbd1", "grayscale(.45) brightness(1.35)"),
    description: "Un essentiel graphique avec une présence discrète et équilibrée.",
    storeId: DEMO_STORES[3].id,
    storeSlug: DEMO_STORES[3].slug,
    storeName: DEMO_STORES[3].name,
    city: DEMO_STORES[3].city,
    publishedAt: "2026-11-12",
    engagement: 88,
    salesCount: 29,
    sponsored: false,
    rating: 4.6,
  },
  {
    id: "sillage-05",
    productId: "sillage-05",
    slug: "sillage-05",
    name: "Sillage",
    brand: "Maison Selma",
    category: "Optique",
    shape: "Ovale",
    style: "Vintage",
    color: "Champagne",
    material: "Métal",
    faceShapes: ["Carré", "Cœur"],
    price: 419,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.sillage,
    imageAlt: "Monture ovale Sillage finition champagne",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.sillage, "Champagne", "#d7c08f", "Bronze", "#9d7043", "sepia(.65) brightness(.85)"),
    description: "Une monture fine aux accents rétro, délicate sans être fragile.",
    storeId: DEMO_STORES[0].id,
    storeSlug: DEMO_STORES[0].slug,
    storeName: DEMO_STORES[0].name,
    city: DEMO_STORES[0].city,
    publishedAt: "2026-11-15",
    engagement: 73,
    salesCount: 23,
    sponsored: true,
    rating: 4.5,
  },
  {
    id: "horizon-06",
    productId: "horizon-06",
    slug: "horizon-06",
    name: "Horizon",
    brand: "Lunetty Atelier",
    category: "Optique",
    shape: "Pilote",
    style: "Contemporain",
    color: "Brun",
    material: "Titane",
    faceShapes: ["Carré", "Ovale"],
    price: 499,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.horizon,
    imageAlt: "Monture pilote Horizon en titane brun",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.horizon, "Brun", "#75543c", "Argent", "#c3cbd1", "grayscale(.6) brightness(1.2)"),
    description: "Une construction en titane pensée pour la légèreté et la précision.",
    storeId: DEMO_STORES[1].id,
    storeSlug: DEMO_STORES[1].slug,
    storeName: DEMO_STORES[1].name,
    city: DEMO_STORES[1].city,
    publishedAt: "2026-11-08",
    engagement: 99,
    salesCount: 64,
    sponsored: false,
    rating: 4.9,
  },
  {
    id: "atelier-07",
    productId: "atelier-07",
    slug: "atelier-07",
    name: "Atelier",
    brand: "Atelier K",
    category: "Optique",
    shape: "Rectangulaire",
    style: "Classique",
    color: "Vert olive",
    material: "Acétate",
    faceShapes: ["Rond", "Cœur"],
    price: 369,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.atelier,
    imageAlt: "Monture rectangulaire Atelier en acétate vert olive",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.atelier, "Vert olive", "#68745c", "Noir", "#272522", "grayscale(.8) brightness(.7)"),
    description: "Une teinte subtile et une forme équilibrée pour un style affirmé.",
    storeId: DEMO_STORES[2].id,
    storeSlug: DEMO_STORES[2].slug,
    storeName: DEMO_STORES[2].name,
    city: DEMO_STORES[2].city,
    publishedAt: "2026-10-04",
    engagement: 56,
    salesCount: 31,
    sponsored: false,
    rating: 4.4,
  },
  {
    id: "nuance-08",
    productId: "nuance-08",
    slug: "nuance-08",
    name: "Nuance",
    brand: "Maison Selma",
    category: "Optique",
    shape: "Ronde",
    style: "Vintage",
    color: "Bordeaux",
    material: "Acétate",
    faceShapes: ["Carré", "Ovale"],
    price: 309,
    currency: "TND",
    image: DEMO_FRAME_IMAGES.nuance,
    imageAlt: "Monture ronde Nuance en acétate bordeaux",
    colorOptions: demoColorOptions(DEMO_FRAME_IMAGES.nuance, "Bordeaux", "#7c3543", "Rose poudré", "#c88b91", "hue-rotate(25deg) brightness(1.22)"),
    description: "Une monture douce et colorée, réalisée en acétate poli.",
    storeId: DEMO_STORES[3].id,
    storeSlug: DEMO_STORES[3].slug,
    storeName: DEMO_STORES[3].name,
    city: DEMO_STORES[3].city,
    publishedAt: "2026-11-10",
    engagement: 67,
    salesCount: 45,
    sponsored: false,
    rating: 4.7,
  },
];

export const DEMO_OPTICIANS: Optician[] = DEMO_STORES.map((store) => ({
  ...store,
  montures: DEMO_FRAMES.filter((frame) => frame.storeId === store.id).slice(0, 3),
}));
