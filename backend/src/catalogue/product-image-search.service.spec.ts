import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { ProductImageSearchService } from './product-image-search.service';

describe('ProductImageSearchService', () => {
  const product = {
    id: 'product-1',
    brand: 'Ray-Ban',
    normalizedBrand: 'RAYBAN',
    reference: 'RB2140',
    normalizedReference: 'RB2140',
    model: 'Wayfarer',
    productType: 'MONTURE',
    variants: [
      { id: 'black', colorCode: '001', colorName: 'Black', ean: '12345678' },
      { id: 'red', colorCode: '002', colorName: 'Red', ean: '87654321' },
    ],
  };
  const prismaMock = {
    catalogueProduct: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    catalogueProductVariant: {
      findFirst: jest.fn(),
    },
    catalogueProductImage: {
      findMany: jest.fn(),
    },
  };
  const storeAuthorization = {
    requirePermission: jest.fn(),
  };
  let service: ProductImageSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    storeAuthorization.requirePermission.mockResolvedValue({});
    prismaMock.catalogueProductImage.findMany.mockResolvedValue([
      { id: 'verified-image', imageUrl: 'https://cdn.example.test/black.jpg' },
    ]);
    service = new ProductImageSearchService(
      prismaMock as unknown as PrismaService,
      storeAuthorization as unknown as StoreAuthorizationService,
    );
  });

  it('matches the exact brand, reference, and colour without mixing variants', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([product]);
    prismaMock.catalogueProductImage.findMany.mockResolvedValue([
      { id: 'verified-image', imageUrl: 'https://cdn.example.test/black.jpg' },
      { id: 'second-image', imageUrl: 'https://cdn.example.test/another.jpg' },
    ]);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray-Ban',
      reference: 'RB2140',
      color: 'Black',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({
      matchType: 'EXACT_BRAND_REFERENCE_COLOR',
      variant: { id: 'black' },
    });
    expect(prismaMock.catalogueProductImage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ variantId: 'black' }),
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].images).toHaveLength(1);
  });

  it('matches EANs to their specific variant', async () => {
    prismaMock.catalogueProductVariant.findFirst.mockResolvedValue({
      id: 'red',
      colorCode: '002',
      colorName: 'Red',
      ean: '87654321',
      product,
    });

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      ean: '87654321',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({
      matchType: 'EXACT_EAN',
      variant: { id: 'red' },
    });
  });

  it('finds an exact reference using the reference already in the stock form', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValueOnce([product]);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      reference: 'RB2140',
      model: 'Wayfarer',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({
      matchType: 'EXACT_REFERENCE',
      product: { id: 'product-1' },
    });
  });

  it('matches exact brand and reference before normalized matching', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([]);
    prismaMock.catalogueProduct.findFirst.mockResolvedValue(product);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray-Ban',
      reference: 'RB2140',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({
      matchType: 'EXACT_BRAND_REFERENCE',
      variant: null,
    });
  });

  it('matches normalized brand and reference when punctuation differs', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([]);
    prismaMock.catalogueProduct.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(product);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray Ban',
      reference: 'RB-2140',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({
      matchType: 'NORMALIZED_BRAND_REFERENCE',
    });
  });

  it('labels approximate results separately from exact matches', async () => {
    prismaMock.catalogueProduct.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([product]);
    prismaMock.catalogueProduct.findFirst.mockResolvedValue(null);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray-Ban',
      reference: 'RB2141',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data[0]).toMatchObject({ matchType: 'APPROXIMATE' });
  });

  it('returns an empty page when there are no matches', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([]);
    prismaMock.catalogueProduct.findFirst.mockResolvedValue(null);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Unknown',
      reference: 'UNKNOWN',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result).toMatchObject({
      data: [],
      meta: { total: 0, totalPages: 0 },
    });
  });

  it('enforces shop inventory-create permission before searching', async () => {
    storeAuthorization.requirePermission.mockRejectedValue(
      new ForbiddenException('Store permission is required'),
    );

    await expect(
      service.suggestions('employee-1', {
        storeId: 'another-store',
        ean: '87654321',
        page: 1,
        limit: 20,
        skip: 0,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.catalogueProductVariant.findFirst).not.toHaveBeenCalled();
    expect(storeAuthorization.requirePermission).toHaveBeenCalledWith(
      'employee-1',
      'another-store',
      'inventory.create',
    );
  });

  it('returns only verified images for active variants', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([product]);

    await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray-Ban',
      reference: 'RB2140',
      color: 'Black',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(prismaMock.catalogueProductImage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isVerified: true }),
      }),
    );
    expect(prismaMock.catalogueProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          variants: expect.objectContaining({
            where: { isActive: true, deletedAt: null },
          }),
        }),
      }),
    );
  });

  it('does not return an internal match that has no verified image', async () => {
    prismaMock.catalogueProduct.findMany.mockResolvedValue([product]);
    prismaMock.catalogueProductImage.findMany.mockResolvedValue([]);

    const result = await service.suggestions('staff-1', {
      storeId: 'store-1',
      brand: 'Ray-Ban',
      reference: 'RB2140',
      color: 'Black',
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(result.data).toEqual([]);
  });
});
