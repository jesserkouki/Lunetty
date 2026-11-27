import { PrismaService } from '../prisma/prisma.service';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  it('creates a favorite idempotently for the authenticated user', async () => {
    const favorite = { id: 'favorite-id', produit_id: 'product-id', cree_le: new Date() };
    const prisma = {
      produit: { findFirst: jest.fn().mockResolvedValue({ id: 'product-id' }) },
      produitFavori: { upsert: jest.fn().mockResolvedValue(favorite) },
      stockFavori: { upsert: jest.fn() },
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await expect(service.addProduct('owner-id', 'product-id')).resolves.toBe(favorite);
    expect(prisma.produitFavori.upsert).toHaveBeenCalledWith({
      where: {
        utilisateur_id_produit_id: {
          utilisateur_id: 'owner-id',
          produit_id: 'product-id',
        },
      },
      create: { utilisateur_id: 'owner-id', produit_id: 'product-id' },
      update: {},
      select: { id: true, produit_id: true, cree_le: true },
    });
  });

  it('checks favorites only for the authenticated user and active products', async () => {
    const prisma = {
      produitFavori: { findFirst: jest.fn().mockResolvedValue({ id: 'favorite-id' }) },
      stockFavori: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await expect(service.isProductFavorite('owner-id', 'product-id')).resolves.toEqual({
      isFavorite: true,
    });
    expect(prisma.produitFavori.findFirst).toHaveBeenCalledWith({
      where: {
        utilisateur_id: 'owner-id',
        produit_id: 'product-id',
        produit: { statut: 'ACTIVE', supprime_le: null },
      },
      select: { id: true },
    });
  });

  it('scopes favorite removal to the authenticated user', async () => {
    const prisma = {
      produitFavori: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      stockFavori: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await service.removeProduct('owner-id', 'product-id');

    expect(prisma.produitFavori.deleteMany).toHaveBeenCalledWith({
      where: { utilisateur_id: 'owner-id', produit_id: 'product-id' },
    });
  });

  it('creates a favorite for a published stock item when it is not a product record', async () => {
    const favorite = {
      id: 'stock-favorite-id',
      stock_id: 'stock-id',
      cree_le: new Date(),
    };
    const prisma = {
      produit: { findFirst: jest.fn().mockResolvedValue(null) },
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 3,
          quantite_reservee: 1,
        }),
      },
      stockFavori: { upsert: jest.fn().mockResolvedValue(favorite) },
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await expect(service.addProduct('owner-id', 'stock-id')).resolves.toBe(
      favorite,
    );
    expect(prisma.stockFavori.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          utilisateur_id_stock_id: {
            utilisateur_id: 'owner-id',
            stock_id: 'stock-id',
          },
        },
        create: { utilisateur_id: 'owner-id', stock_id: 'stock-id' },
        update: {},
      }),
    );
  });

  it('returns stock favorites as product cards for the favorites page', async () => {
    const createdAt = new Date();
    const stockFavorite = {
      id: 'stock-favorite-id',
      cree_le: createdAt,
      stock: {
        id: 'stock-id',
        marque_reference: 'Brand reference',
        prix_vente: { toString: () => '800' },
        catalogueProduct: {
          brand: 'Brand',
          reference: 'Reference',
          model: 'Frame model',
        },
        catalogueVariant: { colorName: 'Black' },
        catalogueImage: null,
        location: { magasin: { id: 'store-id', nom: 'Optician', devise: 'TND' } },
      },
    };
    const prisma = {
      produitFavori: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      stockFavori: {
        findMany: jest.fn().mockResolvedValue([stockFavorite]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await expect(
      service.products('owner-id', {
        page: 1,
        limit: 20,
        skip: 0,
      }),
    ).resolves.toMatchObject({
      data: [
        {
          id: 'stock-favorite-id',
          produit: {
            id: 'stock-id',
            nom: 'Frame model',
            storeId: 'store-id',
            storeName: 'Optician',
            price: '800',
            currency: 'TND',
          },
        },
      ],
      meta: { total: 1 },
    });
  });
});
