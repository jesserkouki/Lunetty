import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FrameImageReviewStatus,
  FrameImageVisibility,
  Prisma,
  TypeProduit,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCatalogueValue } from './catalogue-normalization';
import { CreateFrameImageUploadDto } from './dto/create-frame-image-upload.dto';

export interface FrameImageFile {
  buffer: Buffer;
  mimetype: string;
}

const IMAGE_MIME_FORMATS: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const frameImageSelect = {
  id: true,
  brand: true,
  reference: true,
  model: true,
  color: true,
  ean: true,
  visibility: true,
  reviewStatus: true,
  imageUrl: true,
  createdAt: true,
} satisfies Prisma.FrameImageUploadSelect;

@Injectable()
export class FrameImageUploadService {
  private readonly uploadsDirectory = resolve(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async upload(
    userId: string,
    storeId: string,
    input: CreateFrameImageUploadDto,
    file: FrameImageFile,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.create',
    );
    if (!file?.buffer?.length) {
      throw new BadRequestException('Select an image to upload.');
    }

    const expectedFormat = IMAGE_MIME_FORMATS[file.mimetype];
    if (!expectedFormat) {
      throw new BadRequestException('Use a JPEG, PNG, or WebP image.');
    }
    if (input.visibility === FrameImageVisibility.PUBLIC && !input.confirmPublicSharing) {
      throw new BadRequestException(
        'Confirm that you have permission to share this image publicly.',
      );
    }
    if (input.ean && !/^\d{8,14}$/.test(input.ean)) {
      throw new BadRequestException('EAN/barcode must contain 8 to 14 digits.');
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      }).metadata();
    } catch {
      throw new BadRequestException('The uploaded file is not a valid image.');
    }
    if (
      metadata.format !== expectedFormat ||
      !metadata.width ||
      !metadata.height
    ) {
      throw new BadRequestException(
        'The image content does not match its declared file type.',
      );
    }

    let optimizedImage: Buffer;
    try {
      optimizedImage = await sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      })
        .rotate()
        .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      throw new BadRequestException('The image could not be processed.');
    }

    const store = await this.prisma.magasin.findUnique({
      where: { id: storeId },
      select: { id: true, nom: true, slug: true },
    });
    if (!store) throw new NotFoundException('Store not found.');

    const id = randomUUID();
    const folder = [
      'montures',
      `${safePathPart(store.slug || store.nom)}-${store.id}`,
      input.visibility.toLowerCase(),
      id,
    ].join('/');
    const fileName = `${safePathPart(input.reference)}-${safePathPart(input.brand)}.webp`;
    const storageKey = `${folder}/${fileName}`;
    const filePath = this.resolveStoragePath(storageKey);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, optimizedImage, { flag: 'wx' });

    const imageUrl = `/api/v1/stores/${storeId}/inventory/frame-images/${id}/image`;
    try {
      return await this.prisma.frameImageUpload.create({
        data: {
          id,
          storeId,
          uploaderId: userId,
          brand: input.brand.trim(),
          normalizedBrand: normalizeCatalogueValue(input.brand),
          reference: input.reference.trim(),
          normalizedReference: normalizeCatalogueValue(input.reference),
          model: input.model?.trim() || null,
          color: input.color?.trim() || null,
          ean: input.ean?.trim() || null,
          visibility: input.visibility,
          reviewStatus:
            input.visibility === FrameImageVisibility.PUBLIC
              ? FrameImageReviewStatus.PENDING
              : FrameImageReviewStatus.NOT_REQUIRED,
          imageUrl,
          storageKey,
          publicConsentAt:
            input.visibility === FrameImageVisibility.PUBLIC
              ? new Date()
              : null,
        },
        select: frameImageSelect,
      });
    } catch (error) {
      await rm(filePath, { force: true });
      throw error;
    }
  }

  async privateSuggestions(
    userId: string,
    storeId: string,
    brand: string,
    reference: string,
    color?: string,
    ean?: string,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.create',
    );
    const normalizedBrand = normalizeCatalogueValue(brand);
    const normalizedReference = normalizeCatalogueValue(reference);
    if (!normalizedBrand || !normalizedReference) return [];

    const baseWhere: Prisma.FrameImageUploadWhereInput = {
      storeId,
      visibility: FrameImageVisibility.PRIVATE,
      reviewStatus: FrameImageReviewStatus.NOT_REQUIRED,
      normalizedBrand,
      normalizedReference,
    };
    const exactEan = ean
      ? await this.prisma.frameImageUpload.findFirst({
          where: {
            ...baseWhere,
            ean: ean.trim(),
            ...(color
              ? { color: { equals: color.trim(), mode: 'insensitive' } }
              : {}),
          },
          select: frameImageSelect,
          orderBy: { createdAt: 'desc' },
        })
      : null;
    const uploads = exactEan
      ? [exactEan]
      : await this.prisma.frameImageUpload.findMany({
      where: {
        ...baseWhere,
        ...(color
          ? {
              color: { equals: color.trim(), mode: 'insensitive' },
            }
          : {}),
      },
      select: frameImageSelect,
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    return uploads.map((upload) => ({
      ...upload,
      matchType: 'EXACT_BRAND_REFERENCE',
      isVerified: false as const,
      isPrivate: true as const,
    }));
  }

  async readStoreImage(userId: string, storeId: string, imageId: string) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.create',
    );
    const upload = await this.prisma.frameImageUpload.findFirst({
      where: { id: imageId, storeId },
      select: { storageKey: true },
    });
    if (!upload) throw new NotFoundException('Frame image not found.');
    return readStoredImage(this.resolveStoragePath(upload.storageKey));
  }

  async readPublicImage(imageId: string) {
    const upload = await this.prisma.frameImageUpload.findFirst({
      where: {
        id: imageId,
        visibility: FrameImageVisibility.PUBLIC,
        reviewStatus: FrameImageReviewStatus.APPROVED,
        catalogueImageId: { not: null },
      },
      select: { storageKey: true },
    });
    if (!upload) throw new NotFoundException('Catalogue image not found.');
    return readStoredImage(this.resolveStoragePath(upload.storageKey));
  }

  async readAdminImage(imageId: string) {
    const upload = await this.prisma.frameImageUpload.findFirst({
      where: {
        id: imageId,
        visibility: FrameImageVisibility.PUBLIC,
      },
      select: { storageKey: true },
    });
    if (!upload) throw new NotFoundException('Public image contribution not found.');
    return readStoredImage(this.resolveStoragePath(upload.storageKey));
  }

  async deleteUnlinkedUpload(userId: string, storeId: string, imageId: string) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.create',
    );
    const upload = await this.prisma.frameImageUpload.findFirst({
      where: {
        id: imageId,
        storeId,
        reviewStatus: { not: FrameImageReviewStatus.APPROVED },
        catalogueImageId: null,
        stocks: { none: {} },
      },
      select: { id: true, storageKey: true },
    });
    if (!upload) {
      throw new NotFoundException(
        'The image is missing, linked to stock, or already approved.',
      );
    }
    await this.prisma.frameImageUpload.delete({ where: { id: upload.id } });
    await rm(this.resolveStoragePath(upload.storageKey), { force: true });
    return { success: true };
  }

  async listPublicContributions(
    pagination: PaginationDto,
    reviewStatus?: FrameImageReviewStatus,
  ) {
    const where: Prisma.FrameImageUploadWhereInput = {
      visibility: FrameImageVisibility.PUBLIC,
      ...(reviewStatus ? { reviewStatus } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.frameImageUpload.findMany({
        where,
        select: {
          ...frameImageSelect,
          store: { select: { nom: true, slug: true } },
          uploader: { select: { prenom: true, nom: true } },
          reviewer: { select: { prenom: true, nom: true } },
          publicConsentAt: true,
          reviewedAt: true,
          rejectionReason: true,
          reviewStatus: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.frameImageUpload.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async approvePublicUpload(imageId: string, reviewerId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const upload = await transaction.frameImageUpload.findUnique({
        where: { id: imageId },
        select: {
          id: true,
          brand: true,
          normalizedBrand: true,
          reference: true,
          normalizedReference: true,
          model: true,
          color: true,
          ean: true,
          storageKey: true,
          visibility: true,
          reviewStatus: true,
          catalogueImageId: true,
          publicConsentAt: true,
          storeId: true,
          store: { select: { nom: true } },
        },
      });
      if (!upload || upload.visibility !== FrameImageVisibility.PUBLIC) {
        throw new NotFoundException('Public image contribution not found.');
      }
      if (
        upload.reviewStatus === FrameImageReviewStatus.APPROVED &&
        upload.catalogueImageId
      ) {
        return { success: true, catalogueImageId: upload.catalogueImageId };
      }
      if (upload.reviewStatus !== FrameImageReviewStatus.PENDING) {
        throw new BadRequestException('This image is not awaiting review.');
      }
      if (!upload.publicConsentAt) {
        throw new BadRequestException(
          'This contribution has no recorded sharing consent.',
        );
      }

      const product = await transaction.catalogueProduct.upsert({
        where: {
          normalizedBrand_normalizedReference: {
            normalizedBrand: upload.normalizedBrand,
            normalizedReference: upload.normalizedReference,
          },
        },
        create: {
          brand: upload.brand,
          normalizedBrand: upload.normalizedBrand,
          reference: upload.reference,
          normalizedReference: upload.normalizedReference,
          model: upload.model,
          productType: TypeProduit.MONTURE,
        },
        update: {},
        select: { id: true },
      });

      let variantId: string | null = null;
      if (upload.color || upload.ean) {
        const existingVariant = await transaction.catalogueProductVariant.findFirst({
          where: {
            catalogueProductId: product.id,
            OR: [
              ...(upload.ean ? [{ ean: upload.ean }] : []),
              ...(upload.color
                ? [
                    {
                      colorName: {
                        equals: upload.color,
                        mode: 'insensitive' as const,
                      },
                    },
                  ]
                : []),
            ],
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (existingVariant) {
          variantId = existingVariant.id;
        } else if (upload.color) {
          const globallyUsedEan = upload.ean
            ? await transaction.catalogueProductVariant.findUnique({
                where: { ean: upload.ean },
                select: { id: true },
              })
            : null;
          const variant = await transaction.catalogueProductVariant.create({
            data: {
              catalogueProductId: product.id,
              colorName: upload.color,
              ean: globallyUsedEan ? null : upload.ean,
            },
            select: { id: true },
          });
          variantId = variant.id;
        }
      }

      const duplicateCandidateWhere = {
        catalogueProductId: product.id,
        variantId,
        imageSource: 'OPTICIAN_UPLOAD',
        storageKey: { not: null },
      };
      const duplicateCandidatePageSize = 100;
      const submittedImageHash = await hashStoredImage(
        this.resolveStoragePath(upload.storageKey),
      );
      if (!submittedImageHash) {
        throw new NotFoundException(
          'The contribution image file is missing from storage.',
        );
      }
      let candidateCursor: string | undefined;
      while (true) {
        const duplicateCandidates =
          await transaction.catalogueProductImage.findMany({
            where: {
              ...duplicateCandidateWhere,
              ...(candidateCursor ? { id: { gt: candidateCursor } } : {}),
            },
            select: { id: true, storageKey: true },
            take: duplicateCandidatePageSize,
            orderBy: { id: 'asc' },
          });
        for (const candidate of duplicateCandidates) {
          if (!candidate.storageKey) continue;
          const candidateHash = await hashStoredImage(
            this.resolveStoragePath(candidate.storageKey),
          );
          if (!candidateHash) continue;
          if (candidateHash === submittedImageHash) {
            throw new ConflictException(
              'An identical image is already associated with this product variant. Review the existing catalogue image before approving this contribution.',
            );
          }
        }
        if (duplicateCandidates.length < duplicateCandidatePageSize) break;
        candidateCursor = duplicateCandidates[duplicateCandidates.length - 1].id;
      }

      const existingImages = await transaction.catalogueProductImage.count({
        where: {
          catalogueProductId: product.id,
          variantId,
          isPrimary: true,
        },
      });
      const catalogueImage = await transaction.catalogueProductImage.create({
        data: {
          catalogueProductId: product.id,
          variantId,
          imageUrl: `/api/v1/products/catalogue-image/${upload.id}`,
          storageKey: upload.storageKey,
          imageSource: 'OPTICIAN_UPLOAD',
          licenseInformation:
            'Optician-contributed image. The contributor confirmed permission to share it within Lunetty; no broader commercial licence is granted.',
          isVerified: true,
          isPrimary: existingImages === 0,
          verifiedById: reviewerId,
        },
        select: { id: true },
      });
      const reviewedAt = new Date();
      const updated = await transaction.frameImageUpload.updateMany({
        where: {
          id: imageId,
          visibility: FrameImageVisibility.PUBLIC,
          reviewStatus: FrameImageReviewStatus.PENDING,
          publicConsentAt: { not: null },
        },
        data: {
          reviewStatus: FrameImageReviewStatus.APPROVED,
          reviewedById: reviewerId,
          reviewedAt,
          rejectionReason: null,
          catalogueImageId: catalogueImage.id,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'This contribution was reviewed by another administrator.',
        );
      }
      await this.audit.record(transaction, {
        storeId: upload.storeId,
        actorId: reviewerId,
        action: 'catalogue.image_contribution_approved',
        entityType: 'frame_image_contribution',
        entityId: imageId,
        description: 'Public frame image contribution approved',
        after: {
          reviewStatus: FrameImageReviewStatus.APPROVED,
          catalogueImageId: catalogueImage.id,
        },
      });
      return { success: true, catalogueImageId: catalogueImage.id };
    });
  }

  async rejectPublicUpload(
    imageId: string,
    reviewerId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const upload = await transaction.frameImageUpload.findFirst({
        where: {
          id: imageId,
          visibility: FrameImageVisibility.PUBLIC,
          reviewStatus: FrameImageReviewStatus.PENDING,
        },
        select: { id: true, storeId: true },
      });
      if (!upload) {
        throw new NotFoundException(
          'Pending public image contribution not found.',
        );
      }
      const reviewedAt = new Date();
      const result = await transaction.frameImageUpload.updateMany({
        where: {
          id: imageId,
          visibility: FrameImageVisibility.PUBLIC,
          reviewStatus: FrameImageReviewStatus.PENDING,
        },
        data: {
          reviewStatus: FrameImageReviewStatus.REJECTED,
          reviewedById: reviewerId,
          reviewedAt,
          rejectionReason: reason.trim(),
        },
      });
      if (!result.count) {
        throw new ConflictException(
          'This contribution was reviewed by another administrator.',
        );
      }
      await this.audit.record(transaction, {
        storeId: upload.storeId,
        actorId: reviewerId,
        action: 'catalogue.image_contribution_rejected',
        entityType: 'frame_image_contribution',
        entityId: imageId,
        description: 'Public frame image contribution rejected',
        reason: reason.trim(),
        after: { reviewStatus: FrameImageReviewStatus.REJECTED },
      });
      return { success: true };
    });
  }

  private resolveStoragePath(storageKey: string) {
    const filePath = resolve(this.uploadsDirectory, ...storageKey.split('/'));
    if (!filePath.startsWith(`${this.uploadsDirectory}${sep}`)) {
      throw new ForbiddenException('Invalid image storage path.');
    }
    return filePath;
  }
}

function hashImage(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function hashStoredImage(path: string): Promise<string | null> {
  try {
    return hashImage(await readFile(path));
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

async function readStoredImage(path: string): Promise<Buffer> {
  try {
    return await readFile(path);
  } catch (error) {
    if (isMissingFile(error)) {
      throw new NotFoundException('The image file is missing from storage.');
    }
    throw error;
  }
}

function isMissingFile(
  error: unknown,
): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function safePathPart(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'image'
  );
}
