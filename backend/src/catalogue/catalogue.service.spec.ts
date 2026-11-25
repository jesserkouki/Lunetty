import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogueService } from './catalogue.service';

describe('CatalogueService', () => {
  const imageTransaction = {
    catalogueProductImage: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const prismaMock = {
    catalogueProduct: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    catalogueProductVariant: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    catalogueProductImage: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: CatalogueService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => callback(imageTransaction),
    );
    service = new CatalogueService(prismaMock as unknown as PrismaService);
  });

  it('returns catalogue totals and active-image coverage', async () => {
    prismaMock.catalogueProduct.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(4);
    prismaMock.catalogueProductVariant.count.mockResolvedValue(17);
    prismaMock.catalogueProductImage.count.mockResolvedValue(26);

    await expect(service.getSummary()).resolves.toEqual({
      totalProducts: 12,
      totalVariants: 17,
      totalVerifiedImages: 26,
      productsWithoutVerifiedImages: 4,
      activeProducts: 8,
      archivedProducts: 4,
    });
    expect(prismaMock.catalogueProduct.count).toHaveBeenNthCalledWith(2, {
      where: { images: { none: { isVerified: true } } },
    });
  });

  it('creates products with normalized identity fields', async () => {
    prismaMock.catalogueProduct.create.mockResolvedValue({ id: 'product-1' });

    await service.createProduct({
      brand: 'Ray-Bán',
      reference: 'RB 2140/901',
      productType: 'MONTURE',
    });

    expect(prismaMock.catalogueProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          brand: 'Ray-Bán',
          normalizedBrand: 'RAYBAN',
          reference: 'RB 2140/901',
          normalizedReference: 'RB2140901',
        }),
      }),
    );
  });

  it('rejects duplicate normalized brand and reference identities', async () => {
    prismaMock.catalogueProduct.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expect(
      service.createProduct({
        brand: 'Ray-Ban',
        reference: 'RB2140',
        productType: 'MONTURE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recomputes normalized identity when a product is updated', async () => {
    prismaMock.catalogueProduct.findUnique.mockResolvedValue({
      id: 'product-1',
      brand: 'Ray-Ban',
      reference: 'RB2140',
    });
    prismaMock.catalogueProduct.update.mockResolvedValue({ id: 'product-1' });

    await service.updateProduct('product-1', { reference: 'RB 2140-901' });

    expect(prismaMock.catalogueProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reference: 'RB 2140-901',
          normalizedReference: 'RB2140901',
        },
      }),
    );
  });

  it('associates an image to a variant and replaces its primary image', async () => {
    prismaMock.catalogueProduct.findUnique.mockResolvedValue({ id: 'p1' });
    prismaMock.catalogueProductVariant.findFirst.mockResolvedValue({
      id: 'v1',
    });
    imageTransaction.catalogueProductImage.create.mockResolvedValue({
      id: 'image-1',
      variantId: 'v1',
    });

    await service.createImage('p1', {
      variantId: 'v1',
      imageUrl: 'https://cdn.example.test/frame-black.jpg',
      imageSource: 'licensed',
      isPrimary: true,
    });

    expect(
      imageTransaction.catalogueProductImage.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { catalogueProductId: 'p1', variantId: 'v1' },
        data: { isPrimary: false },
      }),
    );
    expect(imageTransaction.catalogueProductImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          catalogueProductId: 'p1',
          variantId: 'v1',
          isPrimary: true,
        }),
      }),
    );
  });

  it('records the verifying administrator when an image is verified', async () => {
    prismaMock.catalogueProductImage.findUnique.mockResolvedValue({
      id: 'image-1',
      catalogueProductId: 'p1',
      variantId: 'v1',
      isPrimary: false,
    });
    prismaMock.catalogueProductVariant.findFirst.mockResolvedValue({
      id: 'v1',
    });
    imageTransaction.catalogueProductImage.update.mockResolvedValue({
      id: 'image-1',
      isVerified: true,
      verifiedById: 'admin-1',
    });

    await service.updateImage('image-1', 'admin-1', { isVerified: true });

    expect(imageTransaction.catalogueProductImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isVerified: true,
          verifiedById: 'admin-1',
        }),
      }),
    );
  });

  it('rejects attaching an image to another product’s variant', async () => {
    prismaMock.catalogueProduct.findUnique.mockResolvedValue({ id: 'p1' });
    prismaMock.catalogueProductVariant.findFirst.mockResolvedValue(null);

    await expect(
      service.createImage('p1', {
        variantId: 'foreign-variant',
        imageUrl: 'https://cdn.example.test/frame.jpg',
        imageSource: 'licensed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives a variant without deleting its images', async () => {
    prismaMock.catalogueProductVariant.updateMany = jest
      .fn()
      .mockResolvedValue({ count: 1 });

    await expect(service.deleteVariant('p1', 'v1')).resolves.toEqual({
      success: true,
    });

    expect(prismaMock.catalogueProductVariant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'v1',
          catalogueProductId: 'p1',
          isActive: true,
          deletedAt: null,
        }),
        data: expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
        }),
      }),
    );
  });
});
