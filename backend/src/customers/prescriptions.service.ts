import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoteOeil, Prisma } from '@prisma/client';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, rm, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionEyeDto } from './dto/prescription-eye.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

const prescriptionSelect = {
  id: true,
  profil_client_id: true,
  titre: true,
  prescrit_le: true,
  expire_le: true,
  notes: true,
  cle_document_source: true,
  nom_fichier: true,
  type_fichier: true,
  est_active: true,
  cree_le: true,
  modifie_le: true,
  yeux: {
    select: {
      id: true,
      cote: true,
      sphere: true,
      cylindre: true,
      axe: true,
      addition: true,
      prisme: true,
      base: true,
      ecart_pupillaire: true,
    },
    orderBy: { cote: 'asc' },
  },
} satisfies Prisma.OrdonnanceSelect;

export interface PrescriptionUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const PRESCRIPTION_MAX_BYTES = 10 * 1024 * 1024;
const UUID_FILE_NAME = /^[a-f0-9]{32}\.(?:webp|pdf)$/i;

export function validatePrescriptionUpload(file: PrescriptionUploadFile) {
  if (!file.buffer.length || file.buffer.length > PRESCRIPTION_MAX_BYTES) {
    throw new BadRequestException('Prescription file must be between 1 byte and 10 MB');
  }
  const isJpeg =
    file.mimetype === 'image/jpeg' &&
    file.buffer.length >= 3 &&
    file.buffer[0] === 0xff &&
    file.buffer[1] === 0xd8 &&
    file.buffer[2] === 0xff;
  const isPng =
    file.mimetype === 'image/png' &&
    file.buffer.length >= 8 &&
    file.buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  const isPdf =
    file.mimetype === 'application/pdf' &&
    file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!isJpeg && !isPng && !isPdf) {
    throw new BadRequestException('Only valid JPG, PNG, or PDF files are allowed');
  }
  return isPdf ? 'application/pdf' : file.mimetype;
}

@Injectable()
export class PrescriptionsService {
  private readonly storageDirectory = resolve(
    process.cwd(),
    'uploads',
    'private-prescriptions',
  );

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const profile = await this.getClientProfileId(userId);
    return this.prisma.ordonnance.findMany({
      where: { profil_client_id: profile },
      select: prescriptionSelect,
      orderBy: [{ prescrit_le: 'desc' }, { cree_le: 'desc' }],
    }).then((items) => items.map(toPrescriptionView));
  }

  async find(userId: string, prescriptionId: string) {
    const profile = await this.getClientProfileId(userId);
    const result = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: prescriptionSelect,
    });
    if (!result) throw new NotFoundException('Prescription not found');
    return toPrescriptionView(result);
  }

  async create(userId: string, input: CreatePrescriptionDto) {
    return this.createRecord(userId, input, null);
  }

  async upload(
    userId: string,
    input: CreatePrescriptionDto,
    file: PrescriptionUploadFile,
  ) {
    return this.createRecord(userId, input, file);
  }

  private async createRecord(
    userId: string,
    input: CreatePrescriptionDto,
    file: PrescriptionUploadFile | null,
  ) {
    const profile = await this.getClientProfileId(userId);
    this.validateEyes(input.yeux ?? []);
    this.validateDates(input.prescrit_le, input.expire_le);
    const storedFile = file ? await this.storeFile(userId, file) : null;
    try {
      const currentActive = input.est_active
        ? null
        : await this.prisma.ordonnance.findFirst({
            where: { profil_client_id: profile, est_active: true },
            select: { id: true },
          });
      const estActive = input.est_active ?? !currentActive;
      const created = await this.prisma.$transaction(async (tx) => {
        if (estActive) {
          await tx.ordonnance.updateMany({
            where: { profil_client_id: profile, est_active: true },
            data: { est_active: false },
          });
        }
        return tx.ordonnance.create({
          data: {
            profil_client_id: profile,
            titre: input.titre,
            prescrit_le: input.prescrit_le ? new Date(input.prescrit_le) : undefined,
            expire_le: input.expire_le ? new Date(input.expire_le) : undefined,
            notes: input.notes,
            est_active: estActive,
            ...(storedFile
              ? {
                  cle_document_source: storedFile.key,
                  nom_fichier: storedFile.name,
                  type_fichier: storedFile.type,
                }
              : {}),
            yeux: {
              create: (input.yeux ?? []).map((eye) => this.toEyeCreateInput(eye)),
            },
          },
          select: prescriptionSelect,
        });
      });
      return toPrescriptionView(created);
    } catch (error) {
      if (storedFile) await this.removeStoredFile(userId, storedFile.key);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Only one prescription can be active');
      }
      throw error;
    }
  }

  async update(
    userId: string,
    prescriptionId: string,
    input: UpdatePrescriptionDto,
  ) {
    const profile = await this.getClientProfileId(userId);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one prescription field is required');
    }
    if (input.yeux) this.validateEyes(input.yeux);
    this.validateDates(input.prescrit_le, input.expire_le);
    const owned = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: { id: true },
    });
    if (!owned) throw new NotFoundException('Prescription not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.est_active) {
        await tx.ordonnance.updateMany({
          where: { profil_client_id: profile, est_active: true },
          data: { est_active: false },
        });
      }
      if (input.yeux) {
        await tx.oeilOrdonnance.deleteMany({
          where: { ordonnance_id: prescriptionId },
        });
      }
      return tx.ordonnance.update({
        where: { id: prescriptionId },
        data: {
          ...(input.titre !== undefined ? { titre: input.titre } : {}),
          ...(input.prescrit_le !== undefined
            ? { prescrit_le: new Date(input.prescrit_le) }
            : {}),
          ...(input.expire_le !== undefined
            ? { expire_le: new Date(input.expire_le) }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.est_active !== undefined
            ? { est_active: input.est_active }
            : {}),
          ...(input.yeux
            ? {
                yeux: {
                  create: input.yeux.map((eye) => this.toEyeCreateInput(eye)),
                },
              }
            : {}),
        },
        select: prescriptionSelect,
      });
    });
    return toPrescriptionView(updated);
  }

  async replaceFile(
    userId: string,
    prescriptionId: string,
    file: PrescriptionUploadFile,
  ) {
    const profile = await this.getClientProfileId(userId);
    const owned = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: { cle_document_source: true },
    });
    if (!owned) throw new NotFoundException('Prescription not found');

    const storedFile = await this.storeFile(userId, file);
    const updated = await this.prisma.ordonnance
      .update({
        where: { id: prescriptionId },
        data: {
          cle_document_source: storedFile.key,
          nom_fichier: storedFile.name,
          type_fichier: storedFile.type,
        },
        select: prescriptionSelect,
      })
      .catch(async (error: unknown) => {
        await this.removeStoredFile(userId, storedFile.key);
        throw error;
      });
    if (owned.cle_document_source) {
      await this.removeStoredFile(userId, owned.cle_document_source);
    }
    return toPrescriptionView(updated);
  }

  async file(userId: string, prescriptionId: string) {
    const profile = await this.getClientProfileId(userId);
    const prescription = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: {
        cle_document_source: true,
        nom_fichier: true,
        type_fichier: true,
      },
    });
    if (!prescription?.cle_document_source || !prescription.type_fichier) {
      throw new NotFoundException('Prescription document not found');
    }
    const filePath = this.filePath(userId, prescription.cle_document_source);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Prescription document not found');
    }
    return {
      stream: createReadStream(filePath),
      contentType: prescription.type_fichier,
      fileName: prescription.nom_fichier ?? 'ordonnance',
    };
  }

  async remove(userId: string, prescriptionId: string) {
    const profile = await this.getClientProfileId(userId);
    const owned = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: { cle_document_source: true },
    });
    if (!owned) throw new NotFoundException('Prescription not found');
    await this.prisma.ordonnance.delete({
      where: { id: prescriptionId },
    });
    if (owned.cle_document_source) {
      await this.removeStoredFile(userId, owned.cle_document_source);
    }
    return { success: true };
  }

  async removeFilesForUser(userId: string) {
    await rm(resolve(this.storageDirectory, userId), {
      recursive: true,
      force: true,
    });
  }

  private async storeFile(userId: string, file: PrescriptionUploadFile) {
    const contentType = validatePrescriptionUpload(file);
    const isPdf = contentType === 'application/pdf';
    const extension = isPdf ? '.pdf' : '.webp';
    const key = `${randomUUID().replace(/-/g, '')}${extension}`;
    const directory = resolve(this.storageDirectory, userId);
    await mkdir(directory, { recursive: true });

    const contents = isPdf
      ? file.buffer
      : await sharp(file.buffer, { failOn: 'error' })
          .rotate()
          .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer();
    await writeFile(this.filePath(userId, key), contents, { flag: 'wx' });
    const safeName = basename(file.originalname)
      .replace(/[^\p{L}\p{N}._ -]/gu, '')
      .slice(0, 255);
    return {
      key,
      name: safeName || `ordonnance${extension}`,
      type: isPdf ? 'application/pdf' : 'image/webp',
    };
  }

  private filePath(userId: string, key: string) {
    if (!UUID_FILE_NAME.test(key)) {
      throw new NotFoundException('Prescription document not found');
    }
    return resolve(this.storageDirectory, userId, key);
  }

  private async removeStoredFile(userId: string, key: string) {
    const filePath = this.filePath(userId, key);
    try {
      await unlink(filePath);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      throw new InternalServerErrorException(
        'The prescription record was updated but its old file could not be removed',
      );
    }
  }

  private async getClientProfileId(userId: string) {
    const profile = await this.prisma.profilClient.upsert({
      where: { utilisateur_id: userId },
      create: { utilisateur: { connect: { id: userId } } },
      update: {},
      select: { id: true },
    });
    return profile.id;
  }

  private validateEyes(eyes: PrescriptionEyeDto[]) {
    const sides = eyes.map((eye) => eye.cote);
    if (new Set(sides).size !== sides.length) {
      throw new BadRequestException('Prescription can have at most one entry per eye');
    }
    for (const eye of eyes) {
      if (eye.axe !== undefined && eye.cylindre === undefined) {
        throw new BadRequestException('Axis requires a cylinder value');
      }
    }
  }

  private validateDates(prescribed?: string, expires?: string) {
    if (
      prescribed &&
      expires &&
      new Date(expires).getTime() < new Date(prescribed).getTime()
    ) {
      throw new BadRequestException('Prescription expiration cannot precede prescription date');
    }
  }

  private toEyeCreateInput(eye: PrescriptionEyeDto): Prisma.OeilOrdonnanceCreateWithoutPrescriptionInput {
    return {
      cote: eye.cote as CoteOeil,
      ...(eye.sphere !== undefined ? { sphere: new Prisma.Decimal(eye.sphere) } : {}),
      ...(eye.cylindre !== undefined ? { cylindre: new Prisma.Decimal(eye.cylindre) } : {}),
      ...(eye.axe !== undefined ? { axe: eye.axe } : {}),
      ...(eye.addition !== undefined ? { addition: new Prisma.Decimal(eye.addition) } : {}),
      ...(eye.prisme !== undefined ? { prisme: new Prisma.Decimal(eye.prisme) } : {}),
      ...(eye.base !== undefined ? { base: eye.base } : {}),
      ...(eye.ecart_pupillaire !== undefined
        ? { ecart_pupillaire: new Prisma.Decimal(eye.ecart_pupillaire) }
        : {}),
    };
  }
}

function toPrescriptionView<T extends {
  cle_document_source: string | null;
  nom_fichier: string | null;
  type_fichier: string | null;
}>(prescription: T) {
  const { cle_document_source, nom_fichier, type_fichier, ...metadata } =
    prescription;
  return {
    ...metadata,
    nom_fichier,
    type_fichier,
    document_present: Boolean(cle_document_source),
  };
}
