import { PrismaService } from '../prisma/prisma.service';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  it('creates a favorite idempotently for the authenticated user', async () => {
    const favorite = { id: 'favorite-id', produit_id: 'product-id', cree_le: new Date() };
    const prisma = {
      produit: { findFirst: jest.fn().mockResolvedValue({ id: 'product-id' }) },
      produitFavori: { upsert: jest.fn().mockResolvedValue(favorite) },
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
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await service.removeProduct('owner-id', 'product-id');

    expect(prisma.produitFavori.deleteMany).toHaveBeenCalledWith({
      where: { utilisateur_id: 'owner-id', produit_id: 'product-id' },
    });
  });
});
