import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCatalogueValue } from './catalogue-normalization';
import { CreateCatalogueImageDto } from './dto/create-catalogue-image.dto';
import { CreateCatalogueProductDto } from './dto/create-catalogue-product.dto';
import { CreateCatalogueVariantDto } from './dto/create-catalogue-variant.dto';
import { QueryCatalogueProductsDto } from './dto/query-catalogue-products.dto';
import { UpdateCatalogueImageDto } from './dto/update-catalogue-image.dto';
import { UpdateCatalogueProductDto } from './dto/update-catalogue-product.dto';
import { UpdateCatalogueVariantDto } from './dto/update-catalogue-variant.dto';

const imageSelect = {
  id: true,
  catalogueProductId: true,
  variantId: true,
  imageUrl: true,
  storageKey: true,
  imageSource: true,
  sourceUrl: true,
  licenseInformation: true,
  isVerified: true,
  isPrimary: true,
  verifiedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CatalogueProductImageSelect;

const variantSelect = {
  id: true,
  catalogueProductId: true,
  colorCode: true,
  colorName: true,
  ean: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: imageSelect,
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.CatalogueProductVariantSelect;

const productSelect = {
  id: true,
  brand: true,
  reference: true,
  model: true,
  productType: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: variantSelect,
    orderBy: { createdAt: 'asc' },
  },
  images: {
    select: imageSelect,
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.CatalogueProductSelect;

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalProducts,
      totalVariants,
      totalVerifiedImages,
      productsWithoutVerifiedImages,
      activeProducts,
      archivedProducts,
    ] = await Promise.all([
      this.prisma.catalogueProduct.count(),
      this.prisma.catalogueProductVariant.count(),
      this.prisma.catalogueProductImage.count({ where: { isVerified: true } }),
      this.prisma.catalogueProduct.count({
        where: { images: { none: { isVerified: true } } },
      }),
      this.prisma.catalogueProduct.count({ where: { isActive: true } }),
      this.prisma.catalogueProduct.count({ where: { isActive: false } }),
    ]);

    return {
      totalProducts,
      totalVariants,
      totalVerifiedImages,
      productsWithoutVerifiedImages,
      activeProducts,
      archivedProducts,
    };
  }

  async createProduct(input: CreateCatalogueProductDto) {
    try {
      return await this.prisma.catalogueProduct.create({
        data: {
          brand: input.brand.trim(),
          reference: input.reference.trim(),
          model: input.model,
          productType: input.productType,
          normalizedBrand: normalizeCatalogueValue(input.brand),
          normalizedReference: normalizeCatalogueValue(input.reference),
        },
        select: productSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A catalogue product with this brand and reference already exists',
        );
      }
      throw error;
    }
  }

  async listProducts(query: QueryCatalogueProductsDto) {
    const where: Prisma.CatalogueProductWhereInput = {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.productType ? { productType: query.productType } : {}),
      ...(query.q
        ? {
            OR: [
              { brand: { contains: query.q, mode: 'insensitive' } },
              { reference: { contains: query.q, mode: 'insensitive' } },
              { model: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.catalogueProduct.findMany({
        where,
        select: productSelect,
        orderBy: [{ brand: 'asc' }, { reference: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.catalogueProduct.count({ where }),
    ]);
    return paginated(data, total, query.page, query.limit);
  }

  async findProduct(id: string) {
    const product = await this.prisma.catalogueProduct.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) throw new NotFoundException('Catalogue product not found');
    return product;
  }

  async updateProduct(id: string, input: UpdateCatalogueProductDto) {
    const current = await this.prisma.catalogueProduct.findUnique({
      where: { id },
      select: { id: true, brand: true, reference: true },
    });
    if (!current) throw new NotFoundException('Catalogue product not found');

    const brand = input.brand ?? current.brand;
    const reference = input.reference ?? current.reference;
    try {
      return await this.prisma.catalogueProduct.update({
        where: { id },
        data: {
          brand: input.brand === undefined ? undefined : input.brand.trim(),
          normalizedBrand:
            input.brand === undefined
              ? undefined
              : normalizeCatalogueValue(brand),
          reference:
            input.reference === undefined ? undefined : input.reference.trim(),
          normalizedReference:
            input.reference === undefined
              ? undefined
              : normalizeCatalogueValue(reference),
          model: input.model,
          productType: input.productType,
          isActive: input.isActive,
        },
        select: productSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A catalogue product with this brand and reference already exists',
        );
      }
      if (isNotFound(error)) {
        throw new NotFoundException('Catalogue product not found');
      }
      throw error;
    }
  }

  async deleteProduct(id: string) {
    try {
      await this.prisma.catalogueProduct.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Catalogue product not found');
      }
      throw error;
    }
  }

  async createVariant(productId: string, input: CreateCatalogueVariantDto) {
    await this.requireProduct(productId);
    try {
      return await this.prisma.catalogueProductVariant.create({
        data: {
          catalogueProductId: productId,
          colorCode: input.colorCode,
          colorName: input.colorName,
          ean: input.ean,
        },
        select: variantSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A variant with this colour code or EAN already exists',
        );
      }
      throw error;
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    input: UpdateCatalogueVariantDto,
  ) {
    const variant = await this.prisma.catalogueProductVariant.findFirst({
      where: { id: variantId, catalogueProductId: productId },
      select: { id: true },
    });
    if (!variant) throw new NotFoundException('Catalogue variant not found');
    try {
      return await this.prisma.catalogueProductVariant.update({
        where: { id: variantId },
        data: input,
        select: variantSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A variant with this colour code or EAN already exists',
        );
      }
      if (isNotFound(error)) {
        throw new NotFoundException('Catalogue variant not found');
      }
      throw error;
    }
  }

  async deleteVariant(productId: string, variantId: string) {
    const result = await this.prisma.catalogueProductVariant.updateMany({
      where: {
        id: variantId,
        catalogueProductId: productId,
        isActive: true,
        deletedAt: null,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Catalogue variant not found');
    }
    return { success: true };
  }

  async createImage(productId: string, input: CreateCatalogueImageDto) {
    await this.requireProduct(productId);
    await this.requireVariant(productId, input.variantId);
    const { variantId, isPrimary = false, ...data } = input;
    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (isPrimary) {
          await transaction.catalogueProductImage.updateMany({
            where: {
              catalogueProductId: productId,
              variantId: variantId ?? null,
            },
            data: { isPrimary: false },
          });
        }
        return transaction.catalogueProductImage.create({
          data: {
            catalogueProductId: productId,
            variantId,
            ...data,
            isPrimary,
          },
          select: imageSelect,
        });
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Catalogue image already exists');
      }
      throw error;
    }
  }

  async updateImage(
    imageId: string,
    verifiedById: string,
    input: UpdateCatalogueImageDto,
  ) {
    const current = await this.prisma.catalogueProductImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        catalogueProductId: true,
        variantId: true,
        isPrimary: true,
      },
    });
    if (!current) throw new NotFoundException('Catalogue image not found');
    const variantId =
      input.variantId === undefined ? current.variantId : input.variantId;
    const shouldBePrimary = input.isPrimary ?? current.isPrimary;
    await this.requireVariant(
      current.catalogueProductId,
      variantId ?? undefined,
    );

    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (shouldBePrimary) {
          await transaction.catalogueProductImage.updateMany({
            where: {
              catalogueProductId: current.catalogueProductId,
              variantId,
              id: { not: imageId },
            },
            data: { isPrimary: false },
          });
        }
        return transaction.catalogueProductImage.update({
          where: { id: imageId },
          data: {
            imageUrl: input.imageUrl,
            storageKey: input.storageKey,
            imageSource: input.imageSource,
            sourceUrl: input.sourceUrl,
            licenseInformation: input.licenseInformation,
            variantId: input.variantId === undefined ? undefined : variantId,
            isVerified: input.isVerified,
            isPrimary: input.isPrimary,
            verifiedById:
              input.isVerified === undefined
                ? undefined
                : input.isVerified
                  ? verifiedById
                  : null,
          },
          select: imageSelect,
        });
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Catalogue image not found');
      }
      throw error;
    }
  }

  async deleteImage(imageId: string) {
    try {
      await this.prisma.catalogueProductImage.delete({
        where: { id: imageId },
      });
      return { success: true };
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Catalogue image not found');
      }
      throw error;
    }
  }

  private async requireProduct(productId: string) {
    const product = await this.prisma.catalogueProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Catalogue product not found');
  }

  private async requireVariant(productId: string, variantId?: string | null) {
    if (!variantId) return;
    const variant = await this.prisma.catalogueProductVariant.findFirst({
      where: { id: variantId, catalogueProductId: productId },
      select: { id: true },
    });
    if (!variant) {
      throw new NotFoundException('Variant does not belong to this product');
    }
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}
