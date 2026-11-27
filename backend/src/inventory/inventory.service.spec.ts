import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  AgeMontureStock,
  ConceptionVerreStock,
  PublicCible,
  RoleMembre,
  TraitementVerreStock,
  TypeArticleStock,
  TypeMouvementStock,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
  };
  const audit = { record: jest.fn().mockResolvedValue({}) };

  beforeEach(() => jest.clearAllMocks());

  it('filters inventory rows by an authorized store location', async () => {
    const stock = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) };
    const prisma = {
      magasin: { findFirst: jest.fn().mockResolvedValue({ devise: 'TND' }) },
      stock,
      $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );
    const pagination = Object.assign(new PaginationDto(), { page: 1, limit: 20 });

    await service.list('user-id', 'store-id', pagination, 'location-id');

    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'user-id',
      'store-id',
      'inventory.view',
    );
    expect(stock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          location: { magasin_id: 'store-id' },
          emplacement_id: 'location-id',
        },
      }),
    );
    expect(stock.count).toHaveBeenCalledWith({
      where: {
        location: { magasin_id: 'store-id' },
        emplacement_id: 'location-id',
      },
    });
  });

  it('reserves stock and records the movement in one transaction', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 10,
          quantite_reservee: 2,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      mouvementStock: {
        create: jest.fn().mockResolvedValue({ id: 'movement-id' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await service.createMovement('user-id', 'store-id', 'stock-id', {
      type: TypeMouvementStock.RESERVE,
      quantite: 3,
    });

    expect(tx.stock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quantite_disponible: 10,
          quantite_reservee: 2,
        }),
        data: { quantite_reservee: { increment: 3 } },
      }),
    );
    expect(tx.mouvementStock.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'inventory.reserve',
        before: { quantityOnHand: 10, quantityReserved: 2 },
        after: { quantityOnHand: 10, quantityReserved: 5 },
      }),
    );
  });

  it('rejects a sale that would consume reserved stock', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 10,
          quantite_reservee: 8,
        }),
        updateMany: jest.fn(),
      },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.createMovement('user-id', 'store-id', 'stock-id', {
        type: TypeMouvementStock.VENTE,
        quantite: 3,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.stock.updateMany).not.toHaveBeenCalled();
    expect(tx.mouvementStock.create).not.toHaveBeenCalled();
  });

  it('rejects a confirmed adjustment if stock changed after proposal', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 11,
          quantite_reservee: 2,
        }),
        updateMany: jest.fn(),
      },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.createMovement(
        'user-id',
        'store-id',
        'stock-id',
        {
          type: TypeMouvementStock.AJUSTEMENT,
          quantite: 3,
          note: 'Correction après inventaire',
        },
        10,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.stock.updateMany).not.toHaveBeenCalled();
    expect(tx.mouvementStock.create).not.toHaveBeenCalled();
  });

  it('creates a standalone prescription-glasses stock item', async () => {
    const stock = { id: 'stock-id', quantite_disponible: 0 };
    const tx = {
      stock: { create: jest.fn().mockResolvedValue(stock) },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.VERRE_VUE,
        conception_verre: ConceptionVerreStock.SIMPLE,
        traitement_verre: TraitementVerreStock.BLEU,
        puissance_droite: -2,
        puissance_gauche: -1.5,
        prix_vente: 120,
      }),
    ).resolves.toEqual(stock);

    expect(prisma.varianteAnnonceMagasin.findFirst).not.toHaveBeenCalled();
    expect(tx.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type_article: TypeArticleStock.VERRE_VUE,
          conception_verre: ConceptionVerreStock.SIMPLE,
          traitement_verre: TraitementVerreStock.BLEU,
          puissance_droite: -2,
          puissance_gauche: -1.5,
          emplacement_id: 'location-id',
        }),
      }),
    );
  });

  it('requires both eye powers for optical glass stock', async () => {
    const prisma = {
      emplacementMagasin: { findFirst: jest.fn() },
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.VERRE_SOLEIL,
        conception_verre: ConceptionVerreStock.PROGRESSIF,
        traitement_verre: TraitementVerreStock.PHOTO,
        puissance_droite: 1,
        prix_vente: 150,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.findFirst).not.toHaveBeenCalled();
  });

  it('requires frame reference, audience, and size', async () => {
    const prisma = {
      emplacementMagasin: { findFirst: jest.fn() },
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Monture test',
        public_cible: PublicCible.ENFANT,
        prix_vente: 200,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.findFirst).not.toHaveBeenCalled();
  });

  it('creates stock with matching catalogue product and variant links', async () => {
    const stock = {
      id: 'stock-id',
      catalogueProductId: 'catalogue-p1',
      catalogueVariantId: 'catalogue-v1',
    };
    const tx = {
      stock: { create: jest.fn().mockResolvedValue(stock) },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      catalogueProduct: {
        findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-p1' }),
      },
      catalogueProductImage: {
        findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-image-1' }),
      },
      catalogueProductVariant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'catalogue-v1',
          catalogueProductId: 'catalogue-p1',
        }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-1', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Frame reference',
        public_cible: PublicCible.MIXTE,
        age_monture: AgeMontureStock.ADULTE,
        taille_monture: '52-18',
        catalogueProductId: 'catalogue-p1',
        catalogueVariantId: 'catalogue-v1',
        catalogueImageId: 'catalogue-image-1',
        quantite_disponible: 0,
        seuil_reapprovisionnement: 0,
        prix_vente: 220,
      }),
    ).resolves.toEqual(stock);

    expect(tx.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          catalogueProductId: 'catalogue-p1',
          catalogueVariantId: 'catalogue-v1',
          catalogueImageId: 'catalogue-image-1',
        }),
      }),
    );
  });

  it('replaces a frame image only with an upload owned by the same shop', async () => {
    const current = {
      id: 'stock-id',
      type_article: TypeArticleStock.MONTURE,
      seuil_reapprovisionnement: 3,
      catalogueProductId: null,
      catalogueVariantId: null,
      catalogueImageId: null,
      frameImageUploadId: 'old-image',
    };
    const tx = {
      stock: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const prisma = {
      stock: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(current)
          .mockResolvedValueOnce({
            ...current,
            frameImageUploadId: 'new-image',
          }),
      },
      frameImageUpload: {
        findFirst: jest.fn().mockResolvedValue({ id: 'new-image' }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await service.update('owner-id', 'shop-a', 'stock-id', {
      seuil_reapprovisionnement: 3,
      frameImageUploadId: 'new-image',
      catalogueImageId: null,
    });

    expect(prisma.frameImageUpload.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'new-image',
          storeId: 'shop-a',
        }),
      }),
    );
    expect(tx.stock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          frameImageUploadId: 'new-image',
          catalogueImageId: null,
        }),
      }),
    );

    prisma.stock.findFirst.mockResolvedValueOnce(current);
    prisma.frameImageUpload.findFirst.mockResolvedValue(null);
    await expect(
      service.update('owner-id', 'shop-b', 'stock-id', {
        seuil_reapprovisionnement: 3,
        frameImageUploadId: 'new-image',
        catalogueImageId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.stock.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects a catalogue variant belonging to another product', async () => {
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      catalogueProduct: {
        findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-p1' }),
      },
      catalogueProductImage: { findFirst: jest.fn() },
      catalogueProductVariant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'catalogue-v1',
          catalogueProductId: 'catalogue-p2',
        }),
      },
      $transaction: jest.fn(),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-1', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Frame reference',
        public_cible: PublicCible.MIXTE,
        age_monture: AgeMontureStock.ADULTE,
        taille_monture: '52-18',
        catalogueProductId: 'catalogue-p1',
        catalogueVariantId: 'catalogue-v1',
        catalogueImageId: 'catalogue-image-1',
        quantite_disponible: 0,
        seuil_reapprovisionnement: 0,
        prix_vente: 220,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('persists only an uploaded image owned by the stock shop', async () => {
    const tx = {
      stock: {
        create: jest.fn().mockResolvedValue({
          id: 'stock-id',
          frameImageUploadId: 'frame-image-id',
        }),
      },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      frameImageUpload: {
        findFirst: jest.fn().mockResolvedValue({ id: 'frame-image-id' }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );
    const input = {
      emplacement_id: 'location-id',
      type_article: TypeArticleStock.MONTURE,
      marque_reference: 'Ray-Ban RB5228',
      public_cible: PublicCible.MIXTE,
      age_monture: AgeMontureStock.ADULTE,
      taille_monture: '52-18',
      frameImageUploadId: 'frame-image-id',
      prix_vente: 180,
    };

    await service.create('owner-id', 'store-1', input);

    expect(prisma.frameImageUpload.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'frame-image-id',
          storeId: 'store-1',
        }),
      }),
    );
    expect(tx.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          frameImageUploadId: 'frame-image-id',
        }),
      }),
    );

    prisma.frameImageUpload.findFirst.mockResolvedValue(null);
    await expect(
      service.create('owner-id', 'store-2', input),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('allows two shops to reference the same catalogue variant independently', async () => {
    const createForShop = (storeId: string) => {
      const tx = {
        stock: {
          create: jest.fn().mockResolvedValue({
            id: `${storeId}-stock`,
            catalogueVariantId: 'catalogue-v1',
          }),
        },
        mouvementStock: { create: jest.fn() },
      };
      const prisma = {
        emplacementMagasin: {
          findFirst: jest.fn().mockResolvedValue({ id: `${storeId}-location` }),
        },
        varianteAnnonceMagasin: { findFirst: jest.fn() },
        catalogueProduct: {
          findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-p1' }),
        },
        catalogueProductImage: {
          findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-image-1' }),
        },
        catalogueProductVariant: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'catalogue-v1',
            catalogueProductId: 'catalogue-p1',
          }),
        },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      return new InventoryService(
        prisma as unknown as PrismaService,
        authorization as unknown as StoreAuthorizationService,
        audit as never,
      );
    };

    const first = await createForShop('store-1').create('owner-1', 'store-1', {
      emplacement_id: 'store-1-location',
      type_article: TypeArticleStock.MONTURE,
      marque_reference: 'Shared frame',
      public_cible: PublicCible.MIXTE,
      age_monture: AgeMontureStock.ADULTE,
      taille_monture: '52-18',
      catalogueProductId: 'catalogue-p1',
      catalogueVariantId: 'catalogue-v1',
      catalogueImageId: 'catalogue-image-1',
      prix_vente: 220,
    });
    const second = await createForShop('store-2').create('owner-2', 'store-2', {
      emplacement_id: 'store-2-location',
      type_article: TypeArticleStock.MONTURE,
      marque_reference: 'Shared frame',
      public_cible: PublicCible.MIXTE,
      age_monture: AgeMontureStock.ADULTE,
      taille_monture: '52-18',
      catalogueProductId: 'catalogue-p1',
      catalogueVariantId: 'catalogue-v1',
      catalogueImageId: 'catalogue-image-1',
      prix_vente: 220,
    });

    expect(first.catalogueVariantId).toBe('catalogue-v1');
    expect(second.catalogueVariantId).toBe('catalogue-v1');
  });

  it('rejects an unverified or mismatched catalogue image', async () => {
    const tx = {
      stock: { create: jest.fn() },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      catalogueProduct: {
        findFirst: jest.fn().mockResolvedValue({ id: 'catalogue-p1' }),
      },
      catalogueProductVariant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'catalogue-v1',
          catalogueProductId: 'catalogue-p1',
        }),
      },
      catalogueProductImage: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-1', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Frame reference',
        public_cible: PublicCible.MIXTE,
        age_monture: AgeMontureStock.ADULTE,
        taille_monture: '52-18',
        catalogueProductId: 'catalogue-p1',
        catalogueVariantId: 'catalogue-v1',
        catalogueImageId: 'unverified-image',
        prix_vente: 220,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.catalogueProductImage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isVerified: true,
          catalogueProductId: 'catalogue-p1',
          OR: [{ variantId: null }, { variantId: 'catalogue-v1' }],
        }),
      }),
    );
    expect(tx.stock.create).not.toHaveBeenCalled();
  });

  it('returns an existing stock record for an idempotent retry in the same shop', async () => {
    const existing = { id: 'created-stock', creationRequestId: 'request-1' };
    const prisma = {
      stock: {
        findFirst: jest.fn().mockResolvedValue(existing),
      },
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-1', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Frame reference',
        public_cible: PublicCible.MIXTE,
        age_monture: AgeMontureStock.ADULTE,
        taille_monture: '52-18',
        creationRequestId: '00000000-0000-4000-8000-000000000001',
        prix_vente: 220,
      }),
    ).resolves.toEqual(existing);
  });
});
