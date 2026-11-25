import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutProduit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsCacheService } from './products-cache.service';
import {
  productListSelect,
  productSelect,
  toProductCard,
} from './product-card';

const variantSelect = {
  id: true,
  produit_id: true,
  variantName: true,
  reference_globale: true,
  code_barres: true,
  couleur: true,
  taille: true,
  materiau: true,
  url_image: true,
  attributs: true,
  est_actif: true,
} satisfies Prisma.VarianteProduitSelect;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ProductsCacheService,
  ) {}

  async list(query: QueryProductsDto) {
    return this.cache.getList(
      {
        page: query.page,
        limit: query.limit,
        q: query.q ?? '',
        type: query.type ?? '',
      },
      async () => {
        const where: Prisma.ProduitWhereInput = {
          statut: StatutProduit.ACTIVE,
          supprime_le: null,
          ...(query.type ? { type: query.type } : {}),
          ...(query.q
            ? {
                OR: [
                  { nom: { contains: query.q, mode: 'insensitive' } },
                  { marque: { contains: query.q, mode: 'insensitive' } },
                  { categorie: { contains: query.q, mode: 'insensitive' } },
                ],
              }
            : {}),
        };
        const [data, total] = await this.prisma.$transaction([
          this.prisma.produit.findMany({
            where,
            select: productListSelect,
            orderBy: { cree_le: 'desc' },
            skip: query.skip,
            take: query.limit,
          }),
          this.prisma.produit.count({ where }),
        ]);
        return paginated(
          data.map((product) => ({ ...product, ...toProductCard(product) })),
          total,
          query.page,
          query.limit,
        );
      },
    );
  }

  async findPublicByIds(ids: string[]) {
    const products = await this.prisma.produit.findMany({
      where: {
        id: { in: [...new Set(ids)] },
        statut: StatutProduit.ACTIVE,
        supprime_le: null,
      },
      select: productListSelect,
    });
    const productsById = new Map(
      products.map((product) => [
        product.id,
        { ...product, ...toProductCard(product) },
      ]),
    );
    return [...new Set(ids)].flatMap((id) => {
      const product = productsById.get(id);
      return product ? [product] : [];
    });
  }

  async findPublic(id: string) {
    return this.cache.getItem(id, async () => {
      const product = await this.prisma.produit.findFirst({
        where: { id, statut: StatutProduit.ACTIVE, supprime_le: null },
        select: {
          ...productSelect,
          variantes: {
            where: { est_actif: true },
            select: {
              ...variantSelect,
              caracteristiques_monture: true,
              caracteristiques_verre: true,
              caracteristiques_lentille: true,
            },
          },
        },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    });
  }

  async create(input: CreateProductDto) {
    try {
      const product = await this.prisma.produit.create({
        data: input,
        select: productSelect,
      });
      await this.cache.invalidateProduct(product.id);
      return product;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Product slug is already in use');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateProductDto) {
    try {
      const product = await this.prisma.produit.update({
        where: { id, supprime_le: null },
        data: input,
        select: productSelect,
      });
      await this.cache.invalidateProduct(id);
      return product;
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Product not found');
      }
      if (isUniqueConflict(error)) {
        throw new ConflictException('Product slug is already in use');
      }
      throw error;
    }
  }

  async archive(id: string) {
    try {
      await this.prisma.produit.update({
        where: { id, supprime_le: null },
        data: { statut: StatutProduit.ARCHIVE, supprime_le: new Date() },
      });
      await this.cache.invalidateProduct(id);
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Product not found');
      }
      throw error;
    }
    return { success: true };
  }

  async listVariants(productId: string) {
    await this.findPublic(productId);
    return this.prisma.varianteProduit.findMany({
      where: { produit_id: productId, est_actif: true },
      select: {
        ...variantSelect,
        caracteristiques_monture: true,
        caracteristiques_verre: true,
        caracteristiques_lentille: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async createVariant(productId: string, input: CreateProductVariantDto) {
    const product = await this.prisma.produit.findFirst({
      where: { id: productId, supprime_le: null },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    try {
      const variant = await this.prisma.varianteProduit.create({
        data: {
          produit_id: productId,
          variantName: input.variantName,
          reference_globale: input.reference_globale,
          code_barres: input.code_barres,
          couleur: input.couleur,
          taille: input.taille,
          materiau: input.materiau,
          url_image: input.url_image,
          attributs: input.attributs,
        },
        select: variantSelect,
      });
      await this.cache.invalidateProduct(productId);
      return variant;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'Variant reference or barcode is already in use',
        );
      }
      throw error;
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
