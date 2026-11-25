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
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
  };
  const audit = { record: jest.fn().mockResolvedValue({}) };

  beforeEach(() => jest.clearAllMocks());

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
      }),
    ).resolves.toEqual(stock);

    expect(tx.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          catalogueProductId: 'catalogue-p1',
          catalogueVariantId: 'catalogue-v1',
        }),
      }),
    );
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
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
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
      }),
    ).resolves.toEqual(existing);
  });
});
