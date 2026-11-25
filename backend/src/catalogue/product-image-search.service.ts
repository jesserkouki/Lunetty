import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TypeProduit } from '@prisma/client';
import { paginated } from '../common/dto/pagination.dto';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCatalogueValue } from './catalogue-normalization';
import { ProductImageSuggestionsDto } from './dto/product-image-suggestions.dto';

type MatchType =
  | 'EXACT_BRAND_REFERENCE_COLOR'
  | 'EXACT_EAN'
  | 'EXACT_BRAND_REFERENCE'
  | 'NORMALIZED_BRAND_REFERENCE'
  | 'EXACT_REFERENCE'
  | 'APPROXIMATE';

const imageSelect = {
  id: true,
  imageUrl: true,
  storageKey: true,
  imageSource: true,
  sourceUrl: true,
  licenseInformation: true,
  isPrimary: true,
} satisfies Prisma.CatalogueProductImageSelect;

const productSelect = {
  id: true,
  brand: true,
  normalizedBrand: true,
  reference: true,
  normalizedReference: true,
  model: true,
  productType: true,
  variants: {
    where: { isActive: true, deletedAt: null },
    select: { id: true, colorCode: true, colorName: true, ean: true },
  },
} satisfies Prisma.CatalogueProductSelect;

type CatalogueProductResult = Prisma.CatalogueProductGetPayload<{
  select: typeof productSelect;
}>;
type CatalogueVariantResult = CatalogueProductResult['variants'][number];

@Injectable()
export class ProductImageSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async suggestions(userId: string, query: ProductImageSuggestionsDto) {
    if (!query.brand && !query.reference && !query.ean) {
      throw new BadRequestException(
        'Provide at least a brand, reference, or EAN',
      );
    }

    await this.storeAuthorization.requirePermission(
      userId,
      query.storeId,
      'inventory.create',
    );

    const brand = query.brand?.trim() ?? '';
    const reference = query.reference?.trim() ?? '';
    const normalizedBrand = normalizeCatalogueValue(brand);
    const normalizedReference = normalizeCatalogueValue(reference);
    const normalizedColor = normalizeCatalogueValue(query.color ?? '');

    if (brand && reference) {
      const exactProducts = await this.prisma.catalogueProduct.findMany({
        where: {
          isActive: true,
          productType: TypeProduit.MONTURE,
          brand: { equals: brand, mode: 'insensitive' },
          reference: { equals: reference, mode: 'insensitive' },
          ...(query.model
            ? { model: { equals: query.model.trim(), mode: 'insensitive' } }
            : {}),
        },
        select: productSelect,
      });
      if (normalizedColor) {
        const colorMatch = exactProducts
          .map((product) => ({
            product,
            variant: findColorVariant(product.variants, normalizedColor),
          }))
          .find(({ variant }) => variant !== null);
        if (colorMatch) {
          const suggestion = await this.toSuggestion(
            colorMatch.product,
            colorMatch.variant,
            'EXACT_BRAND_REFERENCE_COLOR',
          );
          if (suggestion.images.length) {
            return this.resultPage([suggestion], query);
          }
        }
      }
    }

    if (query.ean) {
      const variant = await this.prisma.catalogueProductVariant.findFirst({
        where: {
          ean: query.ean.trim(),
          isActive: true,
          deletedAt: null,
          product: {
            is: { isActive: true, productType: TypeProduit.MONTURE },
          },
        },
        select: {
          id: true,
          colorCode: true,
          colorName: true,
          ean: true,
          product: { select: productSelect },
        },
      });
      if (variant) {
        const suggestion = await this.toSuggestion(
          variant.product,
          {
            id: variant.id,
            colorCode: variant.colorCode,
            colorName: variant.colorName,
            ean: variant.ean,
          },
          'EXACT_EAN',
        );
        if (suggestion.images.length) {
          return this.resultPage([suggestion], query);
        }
      }
    }

    if (brand && reference) {
      const exact = await this.prisma.catalogueProduct.findFirst({
        where: {
          isActive: true,
          productType: TypeProduit.MONTURE,
          brand: { equals: brand, mode: 'insensitive' },
          reference: { equals: reference, mode: 'insensitive' },
          ...(query.model
            ? { model: { equals: query.model.trim(), mode: 'insensitive' } }
            : {}),
        },
        select: productSelect,
      });
      if (exact) {
        const variant = normalizedColor
          ? findColorVariant(exact.variants, normalizedColor)
          : null;
        const suggestion = await this.toSuggestion(
          exact,
          variant,
          'EXACT_BRAND_REFERENCE',
        );
        if (suggestion.images.length) {
          return this.resultPage([suggestion], query);
        }
      }

      const normalized = await this.prisma.catalogueProduct.findFirst({
        where: {
          isActive: true,
          productType: TypeProduit.MONTURE,
          normalizedBrand,
          normalizedReference,
          ...(query.model
            ? { model: { equals: query.model.trim(), mode: 'insensitive' } }
            : {}),
        },
        select: productSelect,
      });
      if (normalized) {
        const variant = normalizedColor
          ? findColorVariant(normalized.variants, normalizedColor)
          : null;
        const suggestion = await this.toSuggestion(
          normalized,
          variant,
          'NORMALIZED_BRAND_REFERENCE',
        );
        if (suggestion.images.length) {
          return this.resultPage([suggestion], query);
        }
      }
    }

    const approximate = await this.findApproximate(
      normalizedBrand,
      normalizedReference,
      normalizedColor,
      reference,
      query.model?.trim() ?? '',
    );
    return this.resultPage(approximate, query);
  }

  private async findApproximate(
    normalizedBrand: string,
    normalizedReference: string,
    normalizedColor: string,
    reference: string,
    model: string,
  ) {
    if (!normalizedBrand && !normalizedReference) return [];
    const criteria: Prisma.CatalogueProductWhereInput[] = [];
    if (normalizedBrand) {
      criteria.push({
        normalizedBrand: { contains: normalizedBrand, mode: 'insensitive' },
      });
    }
    if (normalizedReference) {
      criteria.push({
        normalizedReference: {
          contains: normalizedReference,
          mode: 'insensitive',
        },
      });
    }
    if (model) {
      criteria.push({
        model: { contains: model, mode: 'insensitive' },
      });
    }

    if (!normalizedBrand && reference) {
      const exactReferenceMatches = await this.prisma.catalogueProduct.findMany(
        {
          where: {
            isActive: true,
            productType: TypeProduit.MONTURE,
            reference: { equals: reference, mode: 'insensitive' },
            ...(model ? { model: { equals: model, mode: 'insensitive' } } : {}),
          },
          select: productSelect,
          orderBy: [{ brand: 'asc' }, { reference: 'asc' }],
          take: 100,
        },
      );
      if (exactReferenceMatches.length) {
        if (exactReferenceMatches.length !== 1) return [];
        const suggestion = await this.toSuggestion(
          exactReferenceMatches[0],
          null,
          'EXACT_REFERENCE',
        );
        return suggestion.images.length ? [suggestion] : [];
      }
    }

    const candidates = await this.prisma.catalogueProduct.findMany({
      where: {
        isActive: true,
        productType: TypeProduit.MONTURE,
        OR: criteria,
      },
      select: productSelect,
      take: 100,
      orderBy: [{ normalizedBrand: 'asc' }, { normalizedReference: 'asc' }],
    });

    const ranked = candidates
      .map((product) => ({
        product,
        score: similarityScore(
          product.normalizedBrand,
          product.normalizedReference,
          normalizedBrand,
          normalizedReference,
          product.model ?? '',
          model,
        ),
      }))
      .filter(({ score }) => score >= 0.55)
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.product.brand.localeCompare(right.product.brand) ||
          left.product.reference.localeCompare(right.product.reference),
      );

    for (const { product } of ranked) {
      const suggestion = await this.toSuggestion(
        product,
        normalizedColor
          ? findColorVariant(product.variants, normalizedColor)
          : null,
        'APPROXIMATE',
      );
      if (suggestion.images.length) return [suggestion];
    }
    return [];
  }

  private async toSuggestion(
    product: CatalogueProductResult,
    variant: CatalogueVariantResult | null,
    matchType: MatchType,
  ) {
    const imageQuery = {
      catalogueProductId: product.id,
      isVerified: true,
    };
    const imageOrder: Prisma.CatalogueProductImageOrderByWithRelationInput[] = [
      { isPrimary: 'desc' },
      { createdAt: 'asc' },
    ];
    let images = variant
      ? await this.prisma.catalogueProductImage
          .findMany({
            where: { ...imageQuery, variantId: variant.id },
            select: imageSelect,
            orderBy: imageOrder,
            take: 1,
          })
          .then((results) => results.slice(0, 1))
      : [];
    if (!images.length) {
      images = (
        await this.prisma.catalogueProductImage.findMany({
          where: {
            ...imageQuery,
            variantId: null,
          },
          select: imageSelect,
          orderBy: imageOrder,
          take: 1,
        })
      ).slice(0, 1);
    }
    return {
      matchType,
      product: {
        id: product.id,
        brand: product.brand,
        reference: product.reference,
        model: product.model,
        productType: product.productType,
      },
      variant,
      images,
    };
  }

  private resultPage<T>(data: T[], query: ProductImageSuggestionsDto) {
    return paginated(
      data.slice(query.skip, query.skip + query.limit),
      data.length,
      query.page,
      query.limit,
    );
  }
}

function findColorVariant(
  variants: CatalogueVariantResult[],
  normalizedColor: string,
): CatalogueVariantResult | null {
  return (
    variants.find(
      (variant) =>
        (variant.colorCode &&
          normalizeCatalogueValue(variant.colorCode) === normalizedColor) ||
        (variant.colorName &&
          normalizeCatalogueValue(variant.colorName) === normalizedColor),
    ) ?? null
  );
}

function similarityScore(
  candidateBrand: string,
  candidateReference: string,
  queryBrand: string,
  queryReference: string,
  candidateModel: string,
  queryModel: string,
): number {
  if (queryModel) {
    const modelScore = editSimilarity(
      normalizeCatalogueValue(candidateModel),
      normalizeCatalogueValue(queryModel),
    );
    if (queryBrand && queryReference) {
      return (
        editSimilarity(candidateBrand, queryBrand) * 0.3 +
        editSimilarity(candidateReference, queryReference) * 0.4 +
        modelScore * 0.3
      );
    }
    return queryReference
      ? editSimilarity(candidateReference, queryReference) * 0.65 +
          modelScore * 0.35
      : editSimilarity(candidateBrand, queryBrand) * 0.65 + modelScore * 0.35;
  }
  if (!queryBrand) return editSimilarity(candidateReference, queryReference);
  if (!queryReference) return editSimilarity(candidateBrand, queryBrand);
  return (
    editSimilarity(candidateBrand, queryBrand) * 0.4 +
    editSimilarity(candidateReference, queryReference) * 0.6
  );
}

function editSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previousAbove = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previousAbove;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}
