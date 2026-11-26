import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TypeEmplacementStock } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StoreLocationsService } from './store-locations.service';

describe('StoreLocationsService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a custom location type for the selected store', async () => {
    const type = {
      id: 'type-id',
      magasin_id: 'store-id',
      nom: 'Vitrine',
      est_actif: true,
    };
    const prisma = {
      typeEmplacementMagasin: {
        create: jest.fn().mockResolvedValue(type),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.createType('owner-id', 'store-id', { nom: ' Vitrine ' }),
    ).resolves.toEqual(type);
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'inventory.manage_locations',
    );
    expect(prisma.typeEmplacementMagasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { magasin_id: 'store-id', nom: 'Vitrine' },
      }),
    );
  });

  it('lists only active locations for the selected store', async () => {
    const prisma = {
      emplacementMagasin: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(service.list('owner-id', 'store-id')).resolves.toEqual([]);
    expect(prisma.emplacementMagasin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { magasin_id: 'store-id', est_actif: true },
      }),
    );
  });

  it('renames a custom location type only within its store', async () => {
    const renamed = {
      id: 'type-id',
      magasin_id: 'store-id',
      nom: 'Réserve',
      est_actif: true,
    };
    const prisma = {
      typeEmplacementMagasin: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(renamed),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.updateType('owner-id', 'store-id', 'type-id', { nom: 'Réserve' }),
    ).resolves.toEqual(renamed);
    expect(prisma.typeEmplacementMagasin.updateMany).toHaveBeenCalledWith({
      where: { id: 'type-id', magasin_id: 'store-id' },
      data: { nom: 'Réserve' },
    });
  });

  it('attaches a valid custom type when creating a location', async () => {
    const location = { id: 'location-id', type_personnalise_id: 'type-id' };
    const prisma = {
      typeEmplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'type-id' }),
      },
      emplacementMagasin: {
        create: jest.fn().mockResolvedValue(location),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        nom: 'Étagère',
        type_personnalise_id: 'type-id',
      }),
    ).resolves.toEqual(location);
    expect(prisma.emplacementMagasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          magasin_id: 'store-id',
          type_personnalise_id: 'type-id',
        }),
      }),
    );
  });

  it('creates a batch of locations of the same type in one transaction', async () => {
    const created = [{ id: 'location-1' }, { id: 'location-2' }];
    const tx = {
      emplacementMagasin: {
        create: jest
          .fn()
          .mockResolvedValueOnce(created[0])
          .mockResolvedValueOnce(created[1]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      emplacementMagasin: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.createMany('owner-id', 'store-id', [
        { nom: 'Rayon 1', type: TypeEmplacementStock.STORE },
        { nom: 'Rayon 2', type: TypeEmplacementStock.STORE },
      ]),
    ).resolves.toEqual(created);
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'inventory.manage_locations',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.emplacementMagasin.create).toHaveBeenCalledTimes(2);
    expect(prisma.emplacementMagasin.create).not.toHaveBeenCalled();
  });

  it('rejects batches that mix location types before creating records', async () => {
    const prisma = {
      emplacementMagasin: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.createMany('owner-id', 'store-id', [
        { nom: 'Rayon', type: TypeEmplacementStock.STORE },
        { nom: 'Réserve', type: TypeEmplacementStock.ENTREPOT },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.emplacementMagasin.create).not.toHaveBeenCalled();
  });

  it('rejects a custom type that is inactive or belongs to another store', async () => {
    const prisma = {
      typeEmplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      emplacementMagasin: {
        create: jest.fn(),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        nom: 'Étagère',
        type_personnalise_id: 'type-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.create).not.toHaveBeenCalled();
  });

  it('clears a custom type when changing a location back to a standard type', async () => {
    const location = {
      id: 'location-id',
      type: 'STORE',
      type_personnalise_id: null,
    };
    const prisma = {
      emplacementMagasin: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(location),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.update('owner-id', 'store-id', 'location-id', {
        type: TypeEmplacementStock.STORE,
        type_personnalise_id: null,
      }),
    ).resolves.toEqual(location);
    expect(prisma.emplacementMagasin.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { type: 'STORE', type_personnalise_id: null },
      }),
    );
  });

  it('deletes an empty location only within the authorized store', async () => {
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'location-id',
          _count: { stocks: 0 },
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.remove('owner-id', 'store-id', 'location-id'),
    ).resolves.toEqual({ success: true });
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'inventory.manage_locations',
    );
    expect(prisma.emplacementMagasin.findFirst).toHaveBeenCalledWith({
      where: { id: 'location-id', magasin_id: 'store-id' },
      select: { id: true, _count: { select: { stocks: true } } },
    });
    expect(prisma.emplacementMagasin.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'location-id',
        magasin_id: 'store-id',
        stocks: { none: {} },
      },
    });
  });

  it('rejects deleting a location that still contains stock', async () => {
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'location-id',
          _count: { stocks: 1 },
        }),
        deleteMany: jest.fn(),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.remove('owner-id', 'store-id', 'location-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.emplacementMagasin.deleteMany).not.toHaveBeenCalled();
  });

  it('does not delete a location from another store', async () => {
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn(),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.remove('owner-id', 'store-id', 'other-location-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.emplacementMagasin.deleteMany).not.toHaveBeenCalled();
  });
});
