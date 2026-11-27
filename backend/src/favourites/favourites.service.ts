import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutMagasin,
  StatutProduit,
  TypeArticleStock,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { productCardSelect, toProductCard } from '../products/product-card';

@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  async products(userId: string, pagination: PaginationDto) {
    const productWhere = {
      utilisateur_id: userId,
      produit: { statut: StatutProduit.ACTIVE, supprime_le: null },
    };
    const stockWhere = {
      utilisateur_id: userId,
      stock: {
        est_publie: true,
        type_article: TypeArticleStock.MONTURE,
        prix_vente: { gt: 0 },
        location: {
          magasin: { is: { statut: StatutMagasin.ACTIVE, supprime_le: null } },
        },
      },
    };
    const take = pagination.skip + pagination.limit;
    const [productItems, productTotal, stockItems, stockTotal] =
      await this.prisma.$transaction([
        this.prisma.produitFavori.findMany({
          where: productWhere,
          select: {
            id: true,
            cree_le: true,
            produit: { select: productCardSelect },
          },
          orderBy: { cree_le: 'desc' },
          take,
        }),
        this.prisma.produitFavori.count({ where: productWhere }),
        this.prisma.stockFavori.findMany({
          where: stockWhere,
          select: {
            id: true,
            cree_le: true,
            stock: {
              select: {
                id: true,
                marque_reference: true,
                prix_vente: true,
                catalogueProduct: {
                  select: { brand: true, reference: true, model: true },
                },
                catalogueVariant: { select: { colorName: true } },
                catalogueImage: {
                  select: {
                    imageUrl: true,
                    isVerified: true,
                    product: { select: { isActive: true } },
                  },
                },
                location: {
                  select: {
                    magasin: { select: { id: true, nom: true, devise: true } },
                  },
                },
              },
            },
          },
          orderBy: { cree_le: 'desc' },
          take,
        }),
        this.prisma.stockFavori.count({ where: stockWhere }),
      ]);
    const items = [
      ...productItems.map((item) => ({
        id: item.id,
        cree_le: item.cree_le,
        produit: toProductCard(item.produit),
      })),
      ...stockItems.map((item) => {
        const stock = item.stock;
        const catalogueProduct = stock.catalogueProduct;
        const brand = catalogueProduct?.brand ?? '';
        const reference =
          catalogueProduct?.reference ?? stock.marque_reference ?? '';
        const name =
          catalogueProduct?.model ||
          [brand, reference].filter(Boolean).join(' ') ||
          stock.marque_reference ||
          'Monture';
        const image =
          stock.catalogueImage?.isVerified &&
          stock.catalogueImage.product.isActive
            ? stock.catalogueImage.imageUrl
            : null;
        const store = stock.location.magasin;

        return {
          id: item.id,
          cree_le: item.cree_le,
          produit: {
            id: stock.id,
            nom: name,
            slug: stock.id,
            marque: brand || null,
            fabricant: null,
            type: 'MONTURE',
            categorie: 'Monture',
            imageUrl: image,
            price: stock.prix_vente?.toString() ?? null,
            currency: store.devise,
            storeId: store.id,
            storeName: store.nom,
            frameShape: null,
          },
        };
      }),
    ].sort((a, b) => b.cree_le.getTime() - a.cree_le.getTime());

    return paginated(
      items.slice(pagination.skip, pagination.skip + pagination.limit),
      productTotal + stockTotal,
      pagination.page,
      pagination.limit,
    );
  }

  async addProduct(userId: string, productId: string) {
    const product = await this.prisma.produit.findFirst({
      where: { id: productId, statut: StatutProduit.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (product) {
      return this.prisma.produitFavori.upsert({
        where: {
          utilisateur_id_produit_id: {
            utilisateur_id: userId,
            produit_id: productId,
          },
        },
        create: { utilisateur_id: userId, produit_id: productId },
        update: {},
        select: { id: true, produit_id: true, cree_le: true },
      });
    }

    const stock = await this.prisma.stock.findFirst({
      where: {
        id: productId,
        est_publie: true,
        type_article: TypeArticleStock.MONTURE,
        prix_vente: { gt: 0 },
        location: {
          magasin: { is: { statut: StatutMagasin.ACTIVE, supprime_le: null } },
        },
      },
      select: {
        id: true,
        quantite_disponible: true,
        quantite_reservee: true,
      },
    });
    if (!stock || stock.quantite_disponible <= stock.quantite_reservee) {
      throw new NotFoundException('Active product not found');
    }
    return this.prisma.stockFavori.upsert({
      where: {
        utilisateur_id_stock_id: {
          utilisateur_id: userId,
          stock_id: productId,
        },
      },
      create: { utilisateur_id: userId, stock_id: productId },
      update: {},
      select: { id: true, stock_id: true, cree_le: true },
    });
  }

  async isProductFavorite(userId: string, productId: string) {
    const [favoriteProduct, favoriteStock] = await Promise.all([
      this.prisma.produitFavori.findFirst({
        where: {
          utilisateur_id: userId,
          produit_id: productId,
          produit: { statut: StatutProduit.ACTIVE, supprime_le: null },
        },
        select: { id: true },
      }),
      this.prisma.stockFavori.findFirst({
        where: {
          utilisateur_id: userId,
          stock_id: productId,
          stock: {
            est_publie: true,
            type_article: TypeArticleStock.MONTURE,
            prix_vente: { gt: 0 },
            location: {
              magasin: {
                is: { statut: StatutMagasin.ACTIVE, supprime_le: null },
              },
            },
          },
        },
        select: { id: true },
      }),
    ]);
    return { isFavorite: Boolean(favoriteProduct || favoriteStock) };
  }

  async removeProduct(userId: string, productId: string) {
    const [productResult, stockResult] = await Promise.all([
      this.prisma.produitFavori.deleteMany({
        where: { utilisateur_id: userId, produit_id: productId },
      }),
      this.prisma.stockFavori.deleteMany({
        where: { utilisateur_id: userId, stock_id: productId },
      }),
    ]);
    if (!productResult.count && !stockResult.count) {
      throw new NotFoundException('Favorite product not found');
    }
    return { success: true };
  }

  async stores(userId: string, pagination: PaginationDto) {
    const where = {
      utilisateur_id: userId,
      magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.magasinFavori.findMany({
        where,
        select: {
          id: true,
          cree_le: true,
          magasin: {
            select: { id: true, nom: true, slug: true, url_logo: true, telephone: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.magasinFavori.count({ where }),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async addStore(userId: string, storeId: string) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    try {
      return await this.prisma.magasinFavori.create({
        data: { utilisateur_id: userId, magasin_id: storeId },
        select: { id: true, magasin_id: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Store is already in favorites');
      }
      throw error;
    }
  }

  async removeStore(userId: string, storeId: string) {
    const result = await this.prisma.magasinFavori.deleteMany({
      where: { utilisateur_id: userId, magasin_id: storeId },
    });
    if (!result.count) throw new NotFoundException('Favorite store not found');
    return { success: true };
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
