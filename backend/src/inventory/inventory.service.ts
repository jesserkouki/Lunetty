import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConceptionVerreStock,
  FrameImageReviewStatus,
  Prisma,
  StatutMagasin,
  TraitementVerreStock,
  TypeMouvementStock,
  TypeArticleStock,
  TypeProduit,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StorePermissionCode } from '../common/guards/store-permissions';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

const stockSelect = {
  id: true,
  storeListingVariantId: true,
  catalogueProductId: true,
  catalogueVariantId: true,
  catalogueImage: {
    select: {
      id: true,
      imageUrl: true,
      imageSource: true,
      sourceUrl: true,
      licenseInformation: true,
      isVerified: true,
      product: { select: { brand: true, reference: true, model: true } },
      variant: { select: { colorCode: true, colorName: true } },
    },
  },
  frameImageUpload: {
    select: {
      id: true,
      imageUrl: true,
      brand: true,
      reference: true,
      model: true,
      color: true,
      visibility: true,
      reviewStatus: true,
    },
  },
  emplacement_id: true,
  age_monture: true,
  type_article: true,
  frameImageUploadId: true,
  catalogueImageId: true,
  catalogueProduct: {
    select: { id: true, brand: true, reference: true, model: true },
  },
  catalogueVariant: {
    select: { id: true, colorCode: true, colorName: true, ean: true },
  },
  conception_verre: true,
  traitement_verre: true,
  puissance_droite: true,
  puissance_gauche: true,
  marque_reference: true,
  public_cible: true,
  taille_monture: true,
  quantite_disponible: true,
  quantite_reservee: true,
  seuil_reapprovisionnement: true,
  prix_vente: true,
  est_publie: true,
  modifie_le: true,
} satisfies Prisma.StockSelect;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async list(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
    locationId?: string,
  ) {
    await this.authorize(userId, storeId, 'inventory.view');
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, supprime_le: null },
      select: { devise: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    const where: Prisma.StockWhereInput = {
      location: { magasin_id: storeId },
      ...(locationId ? { emplacement_id: locationId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stock.findMany({
        where,
        select: {
          ...stockSelect,
          variante_annonce: {
            select: {
              id: true,
              reference_magasin: true,
              prix: true,
              annonce: {
                select: {
                  id: true,
                  titre_personnalise: true,
                  produit: { select: { id: true, nom: true } },
                },
              },
              variante: {
                select: {
                  id: true,
                  variantName: true,
                  code_barres: true,
                  couleur: true,
                  taille: true,
                },
              },
            },
          },
          location: {
            select: {
              id: true,
              nom: true,
              type: true,
              type_personnalise: { select: { id: true, nom: true } },
            },
          },
        },
        orderBy: { modifie_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.stock.count({ where }),
    ]);
    return {
      ...paginated(data, total, pagination.page, pagination.limit),
      currency: store.devise,
    };
  }

  async listPublishedFrames(storeId: string, pagination: PaginationDto) {
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: storeId,
        statut: StatutMagasin.ACTIVE,
        supprime_le: null,
      },
      select: { devise: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const where: Prisma.StockWhereInput = {
      type_article: TypeArticleStock.MONTURE,
      est_publie: true,
      prix_vente: { gt: new Prisma.Decimal(0) },
      quantite_disponible: { gt: 0 },
      location: {
        magasin_id: storeId,
        magasin: { is: { statut: StatutMagasin.ACTIVE, supprime_le: null } },
      },
      AND: [
        {
          OR: [
            { catalogueProductId: null },
            { catalogueProduct: { is: { isActive: true } } },
          ],
        },
        {
          OR: [
            { catalogueVariantId: null },
            {
              catalogueVariant: {
                is: { isActive: true, deletedAt: null },
              },
            },
          ],
        },
      ],
    };
    const stocks = await this.prisma.stock.findMany({
        where,
        select: {
          id: true,
          marque_reference: true,
          prix_vente: true,
          quantite_disponible: true,
          quantite_reservee: true,
          cree_le: true,
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
        },
        orderBy: { cree_le: 'desc' },
      });

    const availableStocks = stocks.filter(
      (stock) =>
        stock.prix_vente !== null &&
        stock.prix_vente.gt(0) &&
        stock.quantite_disponible > stock.quantite_reservee,
    );
    const data = availableStocks
      .slice(pagination.skip, pagination.skip + pagination.limit)
      .map((stock) => {
      const product = stock.catalogueProduct;
      const brand = product?.brand ?? '';
      const reference = product?.reference ?? stock.marque_reference ?? '';
      const fallbackName =
        [brand, reference].filter(Boolean).join(' ') ||
        stock.marque_reference ||
        'Monture';
      const name = product?.model || fallbackName;
      const image =
        stock.catalogueImage?.isVerified &&
        stock.catalogueImage.product.isActive
          ? stock.catalogueImage.imageUrl
          : null;
      return {
        id: stock.id,
        name,
        brand,
        reference,
        color: stock.catalogueVariant?.colorName ?? null,
        price: stock.prix_vente!.toString(),
        currency: store.devise,
        imageUrl: image,
        available: true,
        createdAt: stock.cree_le.toISOString(),
      };
    });

    return paginated(
      data,
      availableStocks.length,
      pagination.page,
      pagination.limit,
    );
  }

  async authorizeReferenceScan(userId: string, storeId: string) {
    await this.authorize(userId, storeId, 'inventory.create');
  }

  async create(userId: string, storeId: string, input: CreateStockDto) {
    await this.authorize(userId, storeId, 'inventory.create');
    validateStockItem(input);
    if (
      input.type_article !== TypeArticleStock.MONTURE &&
      (input.catalogueProductId ||
        input.catalogueVariantId ||
        input.catalogueImageId ||
        input.frameImageUploadId)
    ) {
      throw new BadRequestException(
        'Catalogue image selection is only available for frames.',
      );
    }

    if (input.creationRequestId) {
      const existing = await this.findCreatedRequest(
        storeId,
        input.creationRequestId,
      );
      if (existing) return existing;
    }

    const hasCatalogueSelection = Boolean(
      input.catalogueProductId ||
        input.catalogueVariantId ||
        input.catalogueImageId,
    );
    if (hasCatalogueSelection && input.frameImageUploadId) {
      throw new BadRequestException(
        'Select either a catalogue image or an uploaded frame image.',
      );
    }
    if (
      hasCatalogueSelection &&
      (!input.catalogueProductId || !input.catalogueImageId)
    ) {
      throw new BadRequestException(
        'A catalogue product and verified image are required for image selection.',
      );
    }

    const [listingVariant, location, catalogueProduct, catalogueVariant] =
      await Promise.all([
        input.storeListingVariantId
          ? this.prisma.varianteAnnonceMagasin.findFirst({
              where: {
                id: input.storeListingVariantId,
                annonce: { magasin_id: storeId, supprime_le: null },
              },
              select: { id: true },
            })
          : Promise.resolve(null),
        this.prisma.emplacementMagasin.findFirst({
          where: {
            id: input.emplacement_id,
            magasin_id: storeId,
            est_actif: true,
          },
          select: { id: true },
        }),
        input.catalogueProductId
          ? this.prisma.catalogueProduct.findFirst({
              where: {
                id: input.catalogueProductId,
                isActive: true,
                productType: TypeProduit.MONTURE,
              },
              select: { id: true },
            })
          : Promise.resolve(null),
        input.catalogueVariantId
          ? this.prisma.catalogueProductVariant.findFirst({
              where: {
                id: input.catalogueVariantId,
                isActive: true,
                deletedAt: null,
                product: {
                  is: {
                    isActive: true,
                    productType: TypeProduit.MONTURE,
                  },
                },
              },
              select: { id: true, catalogueProductId: true },
            })
          : Promise.resolve(null),
      ]);
    if ((input.storeListingVariantId && !listingVariant) || !location) {
      throw new BadRequestException(
        'Le produit et l’emplacement actif doivent appartenir à cette boutique.',
      );
    }
    if (input.catalogueProductId && !catalogueProduct) {
      throw new BadRequestException('The catalogue product is unavailable.');
    }
    if (input.catalogueVariantId && !catalogueVariant) {
      throw new BadRequestException('The catalogue variant is unavailable.');
    }
    if (
      catalogueVariant &&
      input.catalogueProductId &&
      catalogueVariant.catalogueProductId !== input.catalogueProductId
    ) {
      throw new BadRequestException(
        'The catalogue variant does not belong to the catalogue product.',
      );
    }
    const resolvedCatalogueProductId =
      input.catalogueProductId ?? catalogueVariant?.catalogueProductId ?? null;
    if (hasCatalogueSelection) {
      const image = await this.prisma.catalogueProductImage.findFirst({
        where: {
          id: input.catalogueImageId,
          catalogueProductId: resolvedCatalogueProductId!,
          isVerified: true,
          OR: input.catalogueVariantId
            ? [
                { variantId: null },
                { variantId: input.catalogueVariantId },
              ]
            : [{ variantId: null }],
          product: {
            is: {
              isActive: true,
              productType: TypeProduit.MONTURE,
            },
          },
        },
        select: { id: true },
      });
      if (!image) {
        throw new BadRequestException(
          'The selected catalogue image is unavailable or does not match the selected variant.',
        );
      }
    }
    if (input.frameImageUploadId) {
      const frameImage = await this.prisma.frameImageUpload.findFirst({
        where: {
          id: input.frameImageUploadId,
          storeId,
          reviewStatus: { not: FrameImageReviewStatus.REJECTED },
        },
        select: { id: true },
      });
      if (!frameImage) {
        throw new BadRequestException(
          'The uploaded frame image is unavailable for this store.',
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const stock = await tx.stock.create({
          data: {
            ...(input.creationRequestId
              ? { creationRequestId: input.creationRequestId }
              : {}),
            ...(input.storeListingVariantId
              ? { storeListingVariantId: input.storeListingVariantId }
              : {}),
            ...(resolvedCatalogueProductId
              ? { catalogueProductId: resolvedCatalogueProductId }
              : {}),
            ...(input.catalogueVariantId
              ? { catalogueVariantId: input.catalogueVariantId }
              : {}),
            ...(input.frameImageUploadId
              ? { frameImageUploadId: input.frameImageUploadId }
              : {}),
            ...(input.catalogueImageId
              ? { catalogueImageId: input.catalogueImageId }
              : {}),
            emplacement_id: input.emplacement_id,
            type_article: input.type_article,
            ...(input.conception_verre
              ? { conception_verre: input.conception_verre }
              : {}),
            ...(input.traitement_verre
              ? { traitement_verre: input.traitement_verre }
              : {}),
            ...(input.puissance_droite !== undefined
              ? { puissance_droite: input.puissance_droite }
              : {}),
            ...(input.puissance_gauche !== undefined
              ? { puissance_gauche: input.puissance_gauche }
              : {}),
            ...(input.marque_reference
              ? { marque_reference: input.marque_reference.trim() }
              : {}),
            ...(input.age_monture ? { age_monture: input.age_monture } : {}),
            ...(input.public_cible ? { public_cible: input.public_cible } : {}),
            ...(input.taille_monture
              ? { taille_monture: input.taille_monture.trim() }
              : {}),
            quantite_disponible: input.quantite_disponible,
            seuil_reapprovisionnement: input.seuil_reapprovisionnement,
            prix_vente: new Prisma.Decimal(input.prix_vente),
          },
          select: stockSelect,
        });
        if (input.quantite_disponible > 0) {
          await tx.mouvementStock.create({
            data: {
              stock_id: stock.id,
              acteur_id: userId,
              type: TypeMouvementStock.RECEPTION,
              quantite: input.quantite_disponible,
              quantite_precedente: 0,
              quantite_suivante: input.quantite_disponible,
              reserve_precedente: 0,
              reserve_suivante: 0,
              note: 'Initial inventory quantity',
            },
          });
        }
        await this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: 'inventory.stock_created',
          entityType: 'stock',
          entityId: stock.id,
          description: 'Inventory record created',
          before: { quantityOnHand: 0, quantityReserved: 0 },
          after: {
            quantityOnHand: stock.quantite_disponible,
            quantityReserved: stock.quantite_reservee,
            reorderThreshold: stock.seuil_reapprovisionnement,
            sellingPrice: stock.prix_vente?.toString(),
            published: stock.est_publie,
          },
        });
        return stock;
      });
    } catch (error) {
      if (input.creationRequestId && isUniqueConflict(error)) {
        const existing = await this.findCreatedRequest(
          storeId,
          input.creationRequestId,
        );
        if (existing) return existing;
        throw new ConflictException(
          'This stock creation request was already used by another shop.',
        );
      }
      if (isUniqueConflict(error) && input.storeListingVariantId) {
        throw new ConflictException(
          'Un stock existe déjà pour ce produit et cet emplacement.',
        );
      }
      throw error;
    }
  }

  async find(userId: string, storeId: string, stockId: string) {
    await this.authorize(userId, storeId, 'inventory.view');
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: {
        ...stockSelect,
        variante_annonce: {
          select: {
            id: true,
            reference_magasin: true,
            prix: true,
            annonce: {
              select: {
                id: true,
                titre_personnalise: true,
                produit: { select: { id: true, nom: true } },
              },
            },
            variante: {
              select: {
                id: true,
                variantName: true,
                code_barres: true,
                couleur: true,
                taille: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            nom: true,
            type: true,
            type_personnalise: { select: { id: true, nom: true } },
          },
        },
      },
    });
    if (!stock) {
      throw new NotFoundException('Inventory record not found');
    }
    return stock;
  }

  async update(
    userId: string,
    storeId: string,
    stockId: string,
    input: UpdateStockDto,
  ) {
    await this.authorize(userId, storeId, 'inventory.update');
    const current = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: {
        id: true,
        type_article: true,
        seuil_reapprovisionnement: true,
        prix_vente: true,
        est_publie: true,
        quantite_disponible: true,
        quantite_reservee: true,
        catalogueProductId: true,
        catalogueVariantId: true,
        catalogueImageId: true,
        frameImageUploadId: true,
      },
    });
    if (!current) throw new NotFoundException('Inventory record not found');
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one stock field is required');
    }
    if (
      input.prix_vente !== undefined &&
      !isValidSellingPrice(input.prix_vente)
    ) {
      throw new BadRequestException(
        'The selling price must be a positive amount with up to three decimal places.',
      );
    }
    if (input.est_publie === true) {
      if (current.type_article !== TypeArticleStock.MONTURE) {
        throw new BadRequestException(
          'Only frame stock items can be published to the public shop.',
        );
      }
      const price = input.prix_vente ?? current.prix_vente?.toNumber();
      if (price === undefined || !isValidSellingPrice(price)) {
        throw new BadRequestException(
          'Set a valid selling price before publishing this frame.',
        );
      }
    }

    if (input.catalogueProductId === null && input.catalogueVariantId === undefined) {
      throw new BadRequestException(
        'Clear the catalogue variant before clearing its product.',
      );
    }
    let resolvedCatalogueProductId =
      input.catalogueProductId === undefined
        ? current.catalogueProductId
        : input.catalogueProductId;
    let resolvedCatalogueVariantId =
      input.catalogueVariantId === undefined
        ? current.catalogueVariantId
        : input.catalogueVariantId;
    if (resolvedCatalogueVariantId) {
      const variant = await this.prisma.catalogueProductVariant.findFirst({
        where: {
          id: resolvedCatalogueVariantId,
          isActive: true,
          deletedAt: null,
          product: {
            is: {
              isActive: true,
              productType: TypeProduit.MONTURE,
            },
          },
        },
        select: { id: true, catalogueProductId: true },
      });
      if (!variant) {
        throw new BadRequestException('The catalogue variant is unavailable.');
      }
      if (
        resolvedCatalogueProductId !== null &&
        resolvedCatalogueProductId !== variant.catalogueProductId
      ) {
        throw new BadRequestException(
          'The catalogue variant does not belong to the catalogue product.',
        );
      }
      resolvedCatalogueProductId =
        resolvedCatalogueProductId ?? variant.catalogueProductId;
    }
    if (resolvedCatalogueProductId) {
      const product = await this.prisma.catalogueProduct.findFirst({
        where: {
          id: resolvedCatalogueProductId,
          isActive: true,
          productType: TypeProduit.MONTURE,
        },
        select: { id: true },
      });
      if (!product) {
        throw new BadRequestException('The catalogue product is unavailable.');
      }
    }

    let resolvedCatalogueImageId =
      input.catalogueImageId === undefined
        ? current.catalogueImageId
        : input.catalogueImageId;
    let resolvedFrameImageUploadId =
      input.frameImageUploadId === undefined
        ? current.frameImageUploadId
        : input.frameImageUploadId;
    if (input.catalogueImageId) resolvedFrameImageUploadId = null;
    if (input.frameImageUploadId) resolvedCatalogueImageId = null;
    if (
      resolvedCatalogueImageId &&
      resolvedFrameImageUploadId
    ) {
      throw new BadRequestException(
        'Select either a catalogue image or an uploaded frame image.',
      );
    }

    const imageChanged =
      input.catalogueImageId !== undefined ||
      input.frameImageUploadId !== undefined;
    if (
      current.type_article !== TypeArticleStock.MONTURE &&
      (resolvedCatalogueImageId || resolvedFrameImageUploadId)
    ) {
      throw new BadRequestException(
        'Catalogue image selection is only available for frames.',
      );
    }
    if (
      resolvedCatalogueImageId &&
      (imageChanged ||
        input.catalogueProductId !== undefined ||
        input.catalogueVariantId !== undefined)
    ) {
      if (!resolvedCatalogueProductId) {
        throw new BadRequestException(
          'A catalogue product is required for a catalogue image.',
        );
      }
      const image = await this.prisma.catalogueProductImage.findFirst({
        where: {
          id: resolvedCatalogueImageId,
          catalogueProductId: resolvedCatalogueProductId,
          isVerified: true,
          OR: resolvedCatalogueVariantId
            ? [{ variantId: null }, { variantId: resolvedCatalogueVariantId }]
            : [{ variantId: null }],
          product: {
            is: {
              isActive: true,
              productType: TypeProduit.MONTURE,
            },
          },
        },
        select: { id: true },
      });
      if (!image) {
        throw new BadRequestException(
          'The selected catalogue image is unavailable or does not match the selected variant.',
        );
      }
    }
    if (resolvedFrameImageUploadId && imageChanged) {
      const image = await this.prisma.frameImageUpload.findFirst({
        where: {
          id: resolvedFrameImageUploadId,
          storeId,
          reviewStatus: { not: FrameImageReviewStatus.REJECTED },
        },
        select: { id: true },
      });
      if (!image) {
        throw new BadRequestException(
          'The uploaded frame image is unavailable for this store.',
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stock.updateMany({
        where: {
          id: stockId,
          location: { magasin_id: storeId },
          type_article: current.type_article,
          seuil_reapprovisionnement: current.seuil_reapprovisionnement,
          prix_vente: current.prix_vente,
          est_publie: current.est_publie,
          catalogueProductId: current.catalogueProductId,
          catalogueVariantId: current.catalogueVariantId,
          catalogueImageId: current.catalogueImageId,
          frameImageUploadId: current.frameImageUploadId,
        },
        data: {
          ...(input.seuil_reapprovisionnement !== undefined
            ? { seuil_reapprovisionnement: input.seuil_reapprovisionnement }
            : {}),
          ...(input.prix_vente !== undefined
            ? { prix_vente: new Prisma.Decimal(input.prix_vente) }
            : {}),
          ...(input.est_publie !== undefined
            ? { est_publie: input.est_publie }
            : {}),
          ...(input.catalogueProductId !== undefined ||
          input.catalogueVariantId !== undefined
            ? {
                catalogueProductId: resolvedCatalogueProductId,
                catalogueVariantId: resolvedCatalogueVariantId,
              }
            : {}),
          ...(imageChanged
            ? {
                catalogueImageId: resolvedCatalogueImageId,
                frameImageUploadId: resolvedFrameImageUploadId,
              }
            : {}),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Inventory changed concurrently; reload and retry',
        );
      }
      await this.audit.record(tx, {
        storeId,
        actorId: userId,
        action: imageChanged
          ? 'inventory.stock_image_updated'
          : input.prix_vente !== undefined
            ? 'inventory.stock_price_updated'
            : input.est_publie !== undefined
              ? 'inventory.stock_publication_updated'
              : 'inventory.reorder_threshold_changed',
        entityType: 'stock',
        entityId: stockId,
        description: imageChanged
          ? 'Inventory frame image updated'
          : input.prix_vente !== undefined
            ? 'Inventory selling price changed'
            : input.est_publie !== undefined
              ? 'Inventory frame publication changed'
              : 'Inventory reorder threshold changed',
        before: {
          reorderThreshold: current.seuil_reapprovisionnement,
          catalogueImageId: current.catalogueImageId,
          frameImageUploadId: current.frameImageUploadId,
          sellingPrice: current.prix_vente?.toString() ?? null,
          published: current.est_publie,
        },
        after: {
          reorderThreshold:
            input.seuil_reapprovisionnement ??
            current.seuil_reapprovisionnement,
          sellingPrice:
            input.prix_vente?.toString() ??
            current.prix_vente?.toString() ??
            null,
          published: input.est_publie ?? current.est_publie,
          catalogueImageId: resolvedCatalogueImageId,
          frameImageUploadId: resolvedFrameImageUploadId,
        },
      });
      return updated;
    });
    if (result.count === 0)
      throw new NotFoundException('Inventory record not found');
    return this.find(userId, storeId, stockId);
  }

  async movements(
    userId: string,
    storeId: string,
    stockId: string,
    pagination: PaginationDto,
  ) {
    await this.authorize(userId, storeId, 'inventory.view_history');
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: { id: true },
    });
    if (!stock) {
      throw new NotFoundException('Inventory record not found');
    }
    const where = { stock_id: stockId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.mouvementStock.findMany({
        where,
        select: {
          id: true,
          type: true,
          quantite: true,
          quantite_precedente: true,
          quantite_suivante: true,
          reserve_precedente: true,
          reserve_suivante: true,
          reference: true,
          note: true,
          acteur_id: true,
          cree_le: true,
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.mouvementStock.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async createMovement(
    userId: string,
    storeId: string,
    stockId: string,
    input: CreateStockMovementDto,
    expectedQuantityOnHand?: number,
  ) {
    await this.authorize(userId, storeId, 'inventory.adjust_stock');
    if (
      input.type === TypeMouvementStock.TRANSFERT_ENTRANT ||
      input.type === TypeMouvementStock.TRANSFERT_SORTANT
    ) {
      if (
        !input.destination_stock_id ||
        input.destination_stock_id === stockId
      ) {
        throw new BadRequestException(
          'Transfers require a different destination stock',
        );
      }
      if (input.type !== TypeMouvementStock.TRANSFERT_SORTANT) {
        throw new BadRequestException(
          'Use TRANSFERT_SORTANT to create a paired transfer',
        );
      }
      if (input.quantite < 1) {
        throw new BadRequestException('Transfer quantity must be positive');
      }
      return this.transfer(
        userId,
        storeId,
        stockId,
        input.destination_stock_id,
        input,
      );
    }
    if (input.type !== TypeMouvementStock.AJUSTEMENT && input.quantite < 1) {
      throw new BadRequestException('Movement quantity must be positive');
    }
    if (input.type === TypeMouvementStock.AJUSTEMENT && !input.note?.trim()) {
      throw new BadRequestException('Inventory adjustments require a reason');
    }
    if (
      ![
        TypeMouvementStock.RECEPTION,
        TypeMouvementStock.VENTE,
        TypeMouvementStock.RETOUR,
        TypeMouvementStock.AJUSTEMENT,
        TypeMouvementStock.ENDOMMAGE,
        TypeMouvementStock.RESERVE,
        TypeMouvementStock.LIBERE,
      ].includes(input.type)
    ) {
      throw new BadRequestException('Unsupported stock movement type');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.stock.findFirst({
        where: { id: stockId, location: { magasin_id: storeId } },
        select: {
          id: true,
          quantite_disponible: true,
          quantite_reservee: true,
        },
      });
      if (!current) {
        throw new NotFoundException('Inventory record not found');
      }
      if (
        expectedQuantityOnHand !== undefined &&
        current.quantite_disponible !== expectedQuantityOnHand
      ) {
        throw new ConflictException(
          'Inventory changed since the proposal was prepared; reload and retry',
        );
      }

      const available = current.quantite_disponible - current.quantite_reservee;
      const delta = movementDelta(input.type, input.quantite);
      if (delta < 0 && available < Math.abs(delta)) {
        throw new ConflictException('Insufficient unreserved inventory');
      }
      if (
        input.type === TypeMouvementStock.RESERVE &&
        available < input.quantite
      ) {
        throw new ConflictException(
          'Insufficient available inventory to reserve',
        );
      }
      if (
        input.type === TypeMouvementStock.LIBERE &&
        current.quantite_reservee < input.quantite
      ) {
        throw new ConflictException(
          'Cannot release more than the reserved quantity',
        );
      }

      const updateCount = await tx.stock.updateMany({
        where: {
          id: stockId,
          location: { magasin_id: storeId },
          quantite_disponible: current.quantite_disponible,
          quantite_reservee: current.quantite_reservee,
        },
        data: {
          ...(delta !== 0 ? { quantite_disponible: { increment: delta } } : {}),
          ...(input.type === TypeMouvementStock.RESERVE
            ? { quantite_reservee: { increment: input.quantite } }
            : {}),
          ...(input.type === TypeMouvementStock.LIBERE
            ? { quantite_reservee: { decrement: input.quantite } }
            : {}),
        },
      });
      if (updateCount.count !== 1) {
        throw new ConflictException(
          'Inventory changed concurrently; retry the operation',
        );
      }

      const movement = await tx.mouvementStock.create({
        data: {
          stock_id: stockId,
          acteur_id: userId,
          type: input.type,
          quantite: input.quantite,
          quantite_precedente: current.quantite_disponible,
          quantite_suivante: current.quantite_disponible + delta,
          reserve_precedente: current.quantite_reservee,
          reserve_suivante:
            current.quantite_reservee +
            (input.type === TypeMouvementStock.RESERVE ? input.quantite : 0) -
            (input.type === TypeMouvementStock.LIBERE ? input.quantite : 0),
          reference: input.reference,
          note: input.note,
        },
        select: {
          id: true,
          type: true,
          quantite: true,
          reference: true,
          note: true,
          cree_le: true,
        },
      });
      await this.audit.record(tx, {
        storeId,
        actorId: userId,
        action: `inventory.${input.type.toLowerCase()}`,
        entityType: 'stock',
        entityId: stockId,
        description: `Stock ${input.type.toLowerCase()} movement recorded`,
        before: {
          quantityOnHand: current.quantite_disponible,
          quantityReserved: current.quantite_reservee,
        },
        after: {
          quantityOnHand: current.quantite_disponible + delta,
          quantityReserved:
            current.quantite_reservee +
            (input.type === TypeMouvementStock.RESERVE ? input.quantite : 0) -
            (input.type === TypeMouvementStock.LIBERE ? input.quantite : 0),
        },
        reason: input.note,
        metadata: { quantity: input.quantite, reference: input.reference },
      });
      return movement;
    });
  }

  private async transfer(
    userId: string,
    storeId: string,
    sourceStockId: string,
    destinationStockId: string,
    input: CreateStockMovementDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [source, destination] = await Promise.all([
        tx.stock.findFirst({
          where: {
            id: sourceStockId,
            location: { magasin_id: storeId },
          },
          select: {
            id: true,
            quantite_disponible: true,
            quantite_reservee: true,
          },
        }),
        tx.stock.findFirst({
          where: {
            id: destinationStockId,
            location: { magasin_id: storeId },
          },
          select: {
            id: true,
            quantite_disponible: true,
            quantite_reservee: true,
          },
        }),
      ]);
      if (!source || !destination) {
        throw new NotFoundException(
          'Source or destination inventory was not found',
        );
      }
      if (
        source.quantite_disponible - source.quantite_reservee <
        input.quantite
      ) {
        throw new ConflictException(
          'Insufficient unreserved inventory to transfer',
        );
      }
      const sourceUpdate = await tx.stock.updateMany({
        where: {
          id: sourceStockId,
          quantite_disponible: source.quantite_disponible,
          quantite_reservee: source.quantite_reservee,
          location: { magasin_id: storeId },
        },
        data: { quantite_disponible: { decrement: input.quantite } },
      });
      if (sourceUpdate.count !== 1) {
        throw new ConflictException(
          'Insufficient unreserved inventory to transfer',
        );
      }
      const destinationUpdate = await tx.stock.updateMany({
        where: {
          id: destinationStockId,
          quantite_disponible: destination.quantite_disponible,
          quantite_reservee: destination.quantite_reservee,
          location: { magasin_id: storeId },
        },
        data: { quantite_disponible: { increment: input.quantite } },
      });
      if (destinationUpdate.count !== 1) {
        throw new ConflictException(
          'Destination inventory changed; retry the transfer',
        );
      }

      const [outbound, inbound] = await Promise.all([
        tx.mouvementStock.create({
          data: {
            stock_id: sourceStockId,
            acteur_id: userId,
            type: TypeMouvementStock.TRANSFERT_SORTANT,
            quantite: input.quantite,
            quantite_precedente: source.quantite_disponible,
            quantite_suivante: source.quantite_disponible - input.quantite,
            reserve_precedente: source.quantite_reservee,
            reserve_suivante: source.quantite_reservee,
            reference: input.reference,
            note: input.note,
          },
          select: {
            id: true,
            stock_id: true,
            type: true,
            quantite: true,
            cree_le: true,
          },
        }),
        tx.mouvementStock.create({
          data: {
            stock_id: destinationStockId,
            acteur_id: userId,
            type: TypeMouvementStock.TRANSFERT_ENTRANT,
            quantite: input.quantite,
            quantite_precedente: destination.quantite_disponible,
            quantite_suivante: destination.quantite_disponible + input.quantite,
            reserve_precedente: destination.quantite_reservee,
            reserve_suivante: destination.quantite_reservee,
            reference: input.reference,
            note: input.note,
          },
          select: {
            id: true,
            stock_id: true,
            type: true,
            quantite: true,
            cree_le: true,
          },
        }),
      ]);
      await Promise.all([
        this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: 'inventory.transfer_out',
          entityType: 'stock',
          entityId: sourceStockId,
          description: 'Stock transferred to another store location',
          before: {
            quantityOnHand: source.quantite_disponible,
            quantityReserved: source.quantite_reservee,
          },
          after: {
            quantityOnHand: source.quantite_disponible - input.quantite,
            quantityReserved: source.quantite_reservee,
          },
          reason: input.note,
          metadata: { destinationStockId, quantity: input.quantite },
        }),
        this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: 'inventory.transfer_in',
          entityType: 'stock',
          entityId: destinationStockId,
          description: 'Stock received from another store location',
          before: {
            quantityOnHand: destination.quantite_disponible,
            quantityReserved: destination.quantite_reservee,
          },
          after: {
            quantityOnHand: destination.quantite_disponible + input.quantite,
            quantityReserved: destination.quantite_reservee,
          },
          reason: input.note,
          metadata: { sourceStockId, quantity: input.quantite },
        }),
      ]);
      return { outbound, inbound };
    });
  }

  private authorize(
    userId: string,
    storeId: string,
    permission: StorePermissionCode,
  ) {
    return this.storeAuthorization.requirePermission(
      userId,
      storeId,
      permission,
    );
  }

  private findCreatedRequest(storeId: string, creationRequestId: string) {
    return this.prisma.stock.findFirst({
      where: {
        creationRequestId,
        location: { magasin_id: storeId },
      },
      select: stockSelect,
    });
  }
}

function movementDelta(type: TypeMouvementStock, quantity: number): number {
  switch (type) {
    case TypeMouvementStock.RECEPTION:
    case TypeMouvementStock.RETOUR:
      return quantity;
    case TypeMouvementStock.VENTE:
    case TypeMouvementStock.ENDOMMAGE:
      return -quantity;
    case TypeMouvementStock.AJUSTEMENT:
      return quantity;
    case TypeMouvementStock.RESERVE:
    case TypeMouvementStock.LIBERE:
      return 0;
    default:
      return 0;
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function validateStockItem(input: CreateStockDto): void {
  if (!isValidSellingPrice(input.prix_vente)) {
    throw new BadRequestException(
      'The selling price must be a positive amount with up to three decimal places.',
    );
  }

  if (
    input.type_article === TypeArticleStock.VERRE_VUE ||
    input.type_article === TypeArticleStock.VERRE_SOLEIL
  ) {
    if (
      !input.conception_verre ||
      !input.traitement_verre ||
      input.puissance_droite === undefined ||
      input.puissance_gauche === undefined
    ) {
      throw new BadRequestException(
        'Pour enregistrer des verres, indiquez leur type, leur conception et les puissances droite et gauche.',
      );
    }
    if (
      !Object.values(ConceptionVerreStock).includes(input.conception_verre) ||
      !Object.values(TraitementVerreStock).includes(input.traitement_verre)
    ) {
      throw new BadRequestException(
        'Le type de verre sélectionné est invalide.',
      );
    }
    return;
  }

  if (input.type_article === TypeArticleStock.MONTURE) {
    if (
      !input.marque_reference?.trim() ||
      !input.age_monture ||
      !input.public_cible ||
      !input.taille_monture?.trim()
    ) {
      throw new BadRequestException(
        'Pour enregistrer une monture, indiquez sa marque ou référence, son âge, son sexe et sa taille.',
      );
    }
    return;
  }

  if (
    input.type_article === TypeArticleStock.LENTILLE &&
    !input.marque_reference?.trim()
  ) {
    throw new BadRequestException(
      'Pour enregistrer une lentille, indiquez sa marque ou sa référence.',
    );
  }
}

function isValidSellingPrice(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0 || value > 999999999.999) {
    return false;
  }
  return new Prisma.Decimal(value).decimalPlaces() <= 3;
}
