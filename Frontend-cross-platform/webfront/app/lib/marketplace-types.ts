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
