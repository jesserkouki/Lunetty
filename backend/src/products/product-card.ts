import {
  Prisma,
  StatutAnnonce,
  StatutMagasin,
} from '@prisma/client';

export const productSelect = {
  id: true,
  nom: true,
  slug: true,
  description: true,
  marque: true,
  fabricant: true,
  type: true,
  statut: true,
  public_cible: true,
  categorie: true,
  etiquettes: true,
  attributs: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.ProduitSelect;

export const productCardSelect = {
  ...productSelect,
  variantes: {
    where: { est_actif: true },
    select: {
      url_image: true,
      caracteristiques_monture: {
        select: { forme_monture: true },
      },
    },
  },
  annonces: {
    where: {
      statut: StatutAnnonce.ACTIVE,
      supprime_le: null,
      magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null },
    },
    select: {
      magasin: { select: { id: true, nom: true } },
      variantes: {
        where: {
          est_disponible: true,
          variante: { is: { est_actif: true } },
        },
        select: {
          prix: true,
          devise: true,
          variante: {
            select: {
              url_image: true,
              caracteristiques_monture: {
                select: { forme_monture: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProduitSelect;

export const productListSelect = {
  ...productCardSelect,
  variantes: {
    where: { est_actif: true },
    select: {
      id: true,
      produit_id: true,
      variantName: true,
      reference_globale: true,
      code_barres: true,
      couleur: true,
      taille: true,
      materiau: true,
      url_image: true,
      attributs: true,
      est_actif: true,
      caracteristiques_monture: {
        select: { forme_monture: true },
      },
    },
  },
} satisfies Prisma.ProduitSelect;

export type ProductCardRecord = Prisma.ProduitGetPayload<{
  select: typeof productCardSelect;
}>;

export type PublicProductCard = {
  id: string;
  nom: string;
  slug: string;
  marque: string | null;
  fabricant: string | null;
  type: ProductCardRecord['type'];
  categorie: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  storeId: string | null;
  storeName: string | null;
  frameShape: string | null;
};

export function toProductCard(product: ProductCardRecord): PublicProductCard {
  const listings = product.annonces.flatMap((annonce) =>
    annonce.variantes.map((variante) => ({
      ...variante,
      magasin: annonce.magasin,
    })),
  );
  const lowestPricedListing = listings.reduce<
    (typeof listings)[number] | null
  >((lowest, listing) => {
    return !lowest || listing.prix.lt(lowest.prix) ? listing : lowest;
  }, null);
  const imageVariant =
    product.variantes.find((variante) => variante.url_image) ??
    product.variantes[0];
  const listedVariant = lowestPricedListing?.variante;

  return {
    id: product.id,
    nom: product.nom,
    slug: product.slug,
    marque: product.marque,
    fabricant: product.fabricant,
    type: product.type,
    categorie: product.categorie,
    imageUrl:
      listedVariant?.url_image ?? imageVariant?.url_image ?? null,
    price: lowestPricedListing?.prix.toString() ?? null,
    currency: lowestPricedListing?.devise.trim() ?? null,
    storeId: lowestPricedListing?.magasin.id ?? null,
    storeName: lowestPricedListing?.magasin.nom ?? null,
    frameShape:
      listedVariant?.caracteristiques_monture?.forme_monture ??
      imageVariant?.caracteristiques_monture?.forme_monture ??
      null,
  };
}
