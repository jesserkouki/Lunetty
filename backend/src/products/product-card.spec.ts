import { Prisma, PublicCible, StatutProduit, TypeProduit } from '@prisma/client';
import { ProductCardRecord, toProductCard } from './product-card';

describe('toProductCard', () => {
  it('uses the lowest available active listing price and its store/image', () => {
    const product: ProductCardRecord = {
      id: 'product-id',
      nom: 'Optical frame',
      slug: 'optical-frame',
      description: null,
      marque: 'Lunetty',
      fabricant: null,
      type: TypeProduit.MONTURE,
      statut: StatutProduit.ACTIVE,
      public_cible: PublicCible.MIXTE,
      categorie: 'Frames',
      etiquettes: [],
      attributs: null,
      cree_le: new Date(),
      modifie_le: new Date(),
      variantes: [
        {
          url_image: 'fallback.jpg',
          caracteristiques_monture: { forme_monture: 'Aviator' },
        },
      ],
      annonces: [
        {
          magasin: { id: 'store-1', nom: 'First store' },
          variantes: [
            {
              prix: new Prisma.Decimal('560.000'),
              devise: 'TND',
              variante: {
                url_image: 'expensive.jpg',
                caracteristiques_monture: { forme_monture: 'Round' },
              },
            },
          ],
        },
        {
          magasin: { id: 'store-2', nom: 'Second store' },
          variantes: [
            {
              prix: new Prisma.Decimal('390.000'),
              devise: 'TND',
              variante: {
                url_image: 'lowest.jpg',
                caracteristiques_monture: { forme_monture: 'Rectangular' },
              },
            },
          ],
        },
      ],
    };

    expect(toProductCard(product)).toMatchObject({
      imageUrl: 'lowest.jpg',
      price: '390',
      currency: 'TND',
      storeId: 'store-2',
      storeName: 'Second store',
      frameShape: 'Rectangular',
    });
  });
});
