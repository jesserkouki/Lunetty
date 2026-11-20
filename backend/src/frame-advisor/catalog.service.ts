import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';



import {
  Audience,
  CatalogItem,
  ScoredItem,
  SearchParams,
  canonicalMaterial,
  canonicalShape,
  searchItems,
  stripAccents,
  widthClass,
} from './catalog.logic';

/** Nombre max d'annonces chargées avant classement en mémoire (suffisant pour un catalogue de quelques milliers de montures). */
const MAX_LISTINGS = 500;

const listingArgs = {
  include: {
    magasin: { select: { nom: true, slug: true, devise: true } },
    produit: true,
    variantes: {
      where: { est_disponible: true, variante: { est_actif: true } },
      include: {
        variante: { include: { caracteristiques_monture: true } },
        stocks: { select: { quantite_disponible: true, quantite_reservee: true } },
      },
    },
  },
} satisfies Prisma.AnnonceMagasinDefaultArgs;

type Listing = Prisma.AnnonceMagasinGetPayload<typeof listingArgs>;

const AUDIENCES: Record<string, Audience> = {
  FEMME: 'femme',
  HOMME: 'homme',
  MIXTE: 'mixte',
  ENFANT: 'enfant',
};

@Injectable()
export class FrameCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Annonces de montures actives, chez des magasins actifs, avec au moins une variante en stock. */
  private baseWhere(extra: Prisma.AnnonceMagasinWhereInput = {}, maxPrice?: number): Prisma.AnnonceMagasinWhereInput {
    return {
      statut: 'ACTIVE',
      supprime_le: null,
      magasin: { statut: 'ACTIVE', supprime_le: null },
      produit: { type: 'MONTURE', statut: 'ACTIVE', supprime_le: null },
      variantes: {
        some: {
          est_disponible: true,
          variante: { est_actif: true },
          ...(maxPrice != null ? { prix: { lte: maxPrice } } : {}),
        },
      },
      ...extra,
    };
  }

  private toItem(l: Listing): CatalogItem | null {
    // Variantes réellement en stock (quantité disponible - réservée, tous emplacements confondus).
    const inStock = l.variantes
      .map((v) => ({
        v,
        qty: v.stocks.reduce((sum, s) => sum + Math.max(0, s.quantite_disponible - s.quantite_reservee), 0),
      }))
      .filter((x) => x.qty > 0)
      .sort((a, b) => Number(a.v.prix) - Number(b.v.prix));
    if (!inStock.length) return null;

    const cheapest = inStock[0].v;
    const specs = inStock.map((x) => x.v.variante.caracteristiques_monture).filter(Boolean);
    const firstWith = <T>(pick: (v: (typeof inStock)[number]['v']) => T | null | undefined) =>
      inStock.map((x) => pick(x.v)).find((x) => x != null) ?? null;

    const tags = stripAccents(
      [
        ...l.produit.etiquettes,
        l.produit.categorie ?? '',
        JSON.stringify(l.produit.attributs ?? {}),
        ...inStock.map((x) => JSON.stringify(x.v.variante.attributs ?? {})),
      ].join(' '),
    );

    return {
      id: l.id,
      name: l.titre_personnalise ?? l.produit.nom,
      brand: l.produit.marque,
      price: Number(cheapest.prix),
      currency: cheapest.devise,
      shape: firstWith((v) => canonicalShape(v.variante.caracteristiques_monture?.forme_monture)),
      material: firstWith((v) => canonicalMaterial(v.variante.materiau)),
      colors: [...new Set(inStock.map((x) => x.v.variante.couleur).filter((c): c is string => !!c))],
      width: widthClass(specs.map((s) => (s?.largeur_monture_mm != null ? Number(s.largeur_monture_mm) : null)).find((x) => x != null)),
      audience: AUDIENCES[l.produit.public_cible] ?? 'mixte',
      stock: inStock.reduce((n, x) => n + x.qty, 0),
      image: cheapest.variante.url_image ?? firstWith((v) => v.variante.url_image),
      store_name: l.magasin.nom,
      store_slug: l.magasin.slug,
      product_slug: l.produit.slug,
      tags,
    };
  }

  private async load(where: Prisma.AnnonceMagasinWhereInput): Promise<CatalogItem[]> {
    const rows = await this.prisma.annonceMagasin.findMany({
      where,
      ...listingArgs,
      orderBy: { modifie_le: 'desc' },
      take: MAX_LISTINGS,
    });
    return rows.map((r) => this.toItem(r)).filter((x): x is CatalogItem => x !== null);
  }

  async search(params: SearchParams = {}): Promise<ScoredItem[]> {
    const items = await this.load(this.baseWhere({}, params.max_price));
    return searchItems(items, params);
  }

  /** Récupère les annonces par id, dans l'ordre demandé (pour les cartes produits). */
  async getByIds(ids: string[] = []): Promise<CatalogItem[]> {
    const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)); // évite une erreur Prisma sur un id inventé par le modèle
    if (!valid.length) return [];
    const items = await this.load(this.baseWhere({ id: { in: valid } }));
    return valid.map((id) => items.find((i) => i.id === id)).filter((x): x is CatalogItem => !!x);
  }
}