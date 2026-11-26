import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  FrameImageReviewStatus,
  FrameImageVisibility,
  TypeProduit,
} from '@prisma/client';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { FrameImageUploadService } from './frame-image-upload.service';

describe('FrameImageUploadService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({}),
  };
  const audit = { record: jest.fn().mockResolvedValue({}) };
  const prisma = {
    magasin: {
      findUnique: jest.fn(),
    },
    frameImageUpload: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    catalogueProduct: {
      upsert: jest.fn(),
    },
    catalogueProductVariant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    catalogueProductImage: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: FrameImageUploadService;
  let uploadsDirectory: string;
  let png: Buffer;

  beforeEach(async () => {
    jest.clearAllMocks();
    uploadsDirectory = await mkdtemp(join(tmpdir(), 'lunetty-frame-image-'));
    png = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 12, g: 34, b: 56 },
      },
    })
      .png()
      .toBuffer();
    authorization.requirePermission.mockResolvedValue({});
    prisma.magasin.findUnique.mockResolvedValue({
      id: 'store-id',
      nom: 'Optique Test',
      slug: 'optique-test',
    });
    service = new FrameImageUploadService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );
    Object.defineProperty(service, 'uploadsDirectory', {
      value: uploadsDirectory,
    });
  });

  afterEach(async () => {
    await rm(uploadsDirectory, { recursive: true, force: true });
  });

  it('stores a normalized, compressed public contribution as pending review', async () => {
    prisma.frameImageUpload.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          createdAt: new Date(),
        }),
    );

    const result = await service.upload(
      'uploader-id',
      'store-id',
      {
        brand: 'Ray-Ban',
        reference: 'RB-5228',
        visibility: FrameImageVisibility.PUBLIC,
        confirmPublicSharing: true,
      },
      { buffer: png, mimetype: 'image/png' },
    );

    expect(result).toMatchObject({
      brand: 'Ray-Ban',
      reference: 'RB-5228',
      visibility: FrameImageVisibility.PUBLIC,
      reviewStatus: FrameImageReviewStatus.PENDING,
    });
    const createInput = prisma.frameImageUpload.create.mock.calls[0][0];
    expect(createInput.data).toMatchObject({
      normalizedBrand: 'RAYBAN',
      normalizedReference: 'RB5228',
      publicConsentAt: expect.any(Date),
    });
    expect(createInput.data.storageKey).toMatch(
      /^montures\/optique-test-store-id\/public\/.+\/rb-5228-ray-ban\.webp$/,
    );
    const savedImage = await readFile(
      join(uploadsDirectory, ...String(createInput.data.storageKey).split('/')),
    );
    expect((await sharp(savedImage).metadata()).format).toBe('webp');
  });

  it('requires explicit sharing authorization for public uploads', async () => {
    await expect(
      service.upload(
        'uploader-id',
        'store-id',
        {
          brand: 'Ray-Ban',
          reference: 'RB5228',
          visibility: FrameImageVisibility.PUBLIC,
          confirmPublicSharing: false,
        },
        { buffer: png, mimetype: 'image/png' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.magasin.findUnique).not.toHaveBeenCalled();
    expect(prisma.frameImageUpload.create).not.toHaveBeenCalled();
  });

  it('rejects file content that does not match the declared image type', async () => {
    await expect(
      service.upload(
        'uploader-id',
        'store-id',
        {
          brand: 'Ray-Ban',
          reference: 'RB5228',
          visibility: FrameImageVisibility.PRIVATE,
        },
        { buffer: Buffer.from('not an image'), mimetype: 'image/png' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.frameImageUpload.create).not.toHaveBeenCalled();
  });

  it('limits private suggestions to an exact match in the active shop', async () => {
    prisma.frameImageUpload.findMany.mockResolvedValue([
      {
        id: 'private-image',
        brand: 'Ray-Ban',
        reference: 'RB5228',
        visibility: FrameImageVisibility.PRIVATE,
        reviewStatus: FrameImageReviewStatus.NOT_REQUIRED,
      },
    ]);

    const result = await service.privateSuggestions(
      'staff-id',
      'shop-one',
      'Ray-Ban',
      'RB-5228',
    );

    expect(prisma.frameImageUpload.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: 'shop-one',
          visibility: FrameImageVisibility.PRIVATE,
          reviewStatus: FrameImageReviewStatus.NOT_REQUIRED,
          normalizedBrand: 'RAYBAN',
          normalizedReference: 'RB5228',
        }),
      }),
    );
    expect(result[0]).toMatchObject({
      id: 'private-image',
      isVerified: false,
      isPrivate: true,
    });
  });

  it('adds public contributions to shared verified search only after admin approval', async () => {
    const contributionFile = join(
      uploadsDirectory,
      'montures',
      'store',
      'public',
      'upload-id',
      'rb5228-ray-ban.webp',
    );
    await mkdir(dirname(contributionFile), { recursive: true });
    await writeFile(contributionFile, png);
    const transaction = {
      frameImageUpload: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'upload-id',
          brand: 'Ray-Ban',
          normalizedBrand: 'RAYBAN',
          reference: 'RB5228',
          normalizedReference: 'RB5228',
          model: 'Clubmaster',
          color: null,
          ean: null,
          storageKey: 'montures/store/public/upload-id/rb5228-ray-ban.webp',
          visibility: FrameImageVisibility.PUBLIC,
          reviewStatus: FrameImageReviewStatus.PENDING,
          catalogueImageId: null,
          publicConsentAt: new Date(),
          storeId: 'store-id',
          store: { nom: 'Optique Test' },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      catalogueProduct: {
        upsert: jest.fn().mockResolvedValue({ id: 'catalogue-product-id' }),
      },
      catalogueProductVariant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      catalogueProductImage: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'catalogue-image-id' }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );

    await service.approvePublicUpload('upload-id', 'admin-id');

    expect(transaction.catalogueProduct.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          productType: TypeProduit.MONTURE,
          normalizedBrand: 'RAYBAN',
          normalizedReference: 'RB5228',
        }),
      }),
    );
    expect(transaction.catalogueProductImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageSource: 'OPTICIAN_UPLOAD',
          isVerified: true,
          verifiedById: 'admin-id',
        }),
      }),
    );
    expect(transaction.frameImageUpload.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewStatus: FrameImageReviewStatus.PENDING,
        }),
        data: expect.objectContaining({
          reviewStatus: FrameImageReviewStatus.APPROVED,
          reviewedById: 'admin-id',
          catalogueImageId: 'catalogue-image-id',
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        action: 'catalogue.image_contribution_approved',
        storeId: 'store-id',
      }),
    );
  });

  it('checks duplicate images beyond the first candidate page', async () => {
    const storageKey =
      'montures/store/public/upload-id/rb5228-ray-ban.webp';
    const contributionFile = join(uploadsDirectory, ...storageKey.split('/'));
    await mkdir(dirname(contributionFile), { recursive: true });
    await writeFile(contributionFile, png);
    const differentImageKey = 'montures/store/public/other/different.webp';
    const differentImageFile = join(
      uploadsDirectory,
      ...differentImageKey.split('/'),
    );
    await mkdir(dirname(differentImageFile), { recursive: true });
    await writeFile(
      differentImageFile,
      await sharp({
        create: {
          width: 4,
          height: 4,
          channels: 3,
          background: { r: 90, g: 80, b: 70 },
        },
      })
        .png()
        .toBuffer(),
    );
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: `candidate-${String(index).padStart(3, '0')}`,
      storageKey:
        index % 2 === 0
          ? `montures/store/public/missing/image-${index}.webp`
          : differentImageKey,
    }));
    const transaction = {
      frameImageUpload: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'upload-id',
          brand: 'Ray-Ban',
          normalizedBrand: 'RAYBAN',
          reference: 'RB5228',
          normalizedReference: 'RB5228',
          model: null,
          color: null,
          ean: null,
          storageKey,
          visibility: FrameImageVisibility.PUBLIC,
          reviewStatus: FrameImageReviewStatus.PENDING,
          catalogueImageId: null,
          publicConsentAt: new Date(),
          storeId: 'store-id',
          store: { nom: 'Optique Test' },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      catalogueProduct: {
        upsert: jest.fn().mockResolvedValue({ id: 'catalogue-product-id' }),
      },
      catalogueProductVariant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      catalogueProductImage: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest
          .fn()
          .mockResolvedValueOnce(firstPage)
          .mockResolvedValueOnce([{ id: 'candidate-100', storageKey }]),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );

    await expect(
      service.approvePublicUpload('upload-id', 'admin-id'),
    ).rejects.toThrow(ConflictException);

    expect(transaction.catalogueProductImage.findMany).toHaveBeenCalledTimes(2);
    expect(transaction.catalogueProductImage.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { gt: 'candidate-099' } }),
      }),
    );
    expect(transaction.catalogueProductImage.create).not.toHaveBeenCalled();
    expect(transaction.frameImageUpload.updateMany).not.toHaveBeenCalled();
  });

  it('records a rejection reason without deleting the source upload', async () => {
    const transaction = {
      frameImageUpload: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'upload-id',
          storeId: 'store-id',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );

    await expect(
      service.rejectPublicUpload('upload-id', 'admin-id', 'Incorrect model'),
    ).resolves.toEqual({ success: true });

    expect(transaction.frameImageUpload.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewStatus: FrameImageReviewStatus.REJECTED,
          rejectionReason: 'Incorrect model',
          reviewedById: 'admin-id',
        }),
      }),
    );
    expect(transaction.frameImageUpload.delete).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        action: 'catalogue.image_contribution_rejected',
        reason: 'Incorrect model',
      }),
    );
  });
});
