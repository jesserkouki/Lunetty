import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypeAdresse } from '@prisma/client';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

const publicUserSelect = {
  id: true,
  prenom: true,
  nom: true,
  nom_utilisateur: true,
  url_image_profil: true,
  cree_le: true,
} satisfies Prisma.UtilisateurSelect;

const privateUserSelect = {
  ...publicUserSelect,
  email: true,
  telephone: true,
  statut: true,
  langue_preferee: true,
  email_verifie_le: true,
  cree_le: true,
  modifie_le: true,
  adresses: {
    where: { type: TypeAdresse.DOMICILE, est_par_defaut: true },
    take: 1,
    select: {
      ligne_1: true,
      ville: true,
      code_postal: true,
      code_pays: true,
    },
  },
} satisfies Prisma.UtilisateurSelect;

export interface AvatarUploadFile {
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class UsersService {
  private readonly avatarDirectory = resolve(
    process.cwd(),
    'uploads',
    'user-avatars',
  );
  private readonly privatePrescriptionDirectory = resolve(
    process.cwd(),
    'uploads',
    'private-prescriptions',
  );

  constructor(private readonly prisma: PrismaService) {}

  async list(pagination: PaginationDto) {
    const where: Prisma.UtilisateurWhereInput = {
      statut: 'ACTIVE',
      supprime_le: null,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.utilisateur.findMany({
        where,
        select: publicUserSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.utilisateur.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async findPublic(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, statut: 'ACTIVE', supprime_le: null },
      select: publicUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findMe(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: privateUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { adresses, ...profile } = user;
    return { ...profile, adresse: adresses?.[0] ?? null };
  }

  async updateMe(id: string, input: UpdateUserProfileDto) {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one profile field is required');
    }
    const { adresse, ...profileInput } = input;
    const data: Prisma.UtilisateurUpdateManyMutationInput = {
      ...profileInput,
      ...(input.prenom !== undefined
        ? { prenom: cleanName(input.prenom) }
        : {}),
      ...(input.nom !== undefined ? { nom: cleanName(input.nom) } : {}),
      ...(input.telephone !== undefined
        ? { telephone: input.telephone?.trim() || null }
        : {}),
    };
    try {
      if (adresse) {
        await this.prisma.$transaction(async (tx) => {
          const result = await tx.utilisateur.updateMany({
            where: { id, supprime_le: null },
            data,
          });
          if (!result.count) throw new NotFoundException('User not found');
          const currentAddress = await tx.adresse.findFirst({
            where: {
              utilisateur_id: id,
              type: TypeAdresse.DOMICILE,
              est_par_defaut: true,
            },
            select: { id: true },
          });
          const addressData = {
            ligne_1: adresse.ligne_1.trim(),
            ville: adresse.ville.trim(),
            code_postal: adresse.code_postal.trim(),
            code_pays: adresse.code_pays.trim().toUpperCase(),
          };
          if (currentAddress) {
            await tx.adresse.update({
              where: { id: currentAddress.id },
              data: addressData,
            });
          } else {
            await tx.adresse.create({
              data: {
                ...addressData,
                utilisateur_id: id,
                type: TypeAdresse.DOMICILE,
                est_par_defaut: true,
              },
            });
          }
        });
      } else {
        const result = await this.prisma.utilisateur.updateMany({
          where: { id, supprime_le: null },
          data,
        });
        if (!result.count) throw new NotFoundException('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username is already in use');
      }
      throw error;
    }
    return this.findMe(id);
  }

  async uploadAvatar(id: string, file: AvatarUploadFile) {
    if (!isValidAvatar(file)) {
      throw new BadRequestException('Only valid JPG, PNG, or WebP images are allowed');
    }
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: { id: true, url_image_profil: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let image: Buffer;
    try {
      image = await sharp(file.buffer, { failOn: 'error' })
        .rotate()
        .resize(512, 512, { fit: 'cover', position: 'attention' })
        .webp({ quality: 86 })
        .toBuffer();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException('The avatar image could not be decoded');
      }
      throw error;
    }

    const filename = `${randomUUID().replace(/-/g, '')}.webp`;
    const directory = resolve(this.avatarDirectory, id);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), image, { flag: 'wx' });
    const url = `/api/v1/users/${id}/avatar/${filename}`;
    try {
      await this.prisma.utilisateur.update({
        where: { id },
        data: { url_image_profil: url },
      });
    } catch (error) {
      await rm(resolve(directory, filename), { force: true });
      throw error;
    }
    await this.removeLocalAvatar(id, user.url_image_profil);
    return { url_image_profil: url };
  }

  async deleteAvatar(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: { url_image_profil: true },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.utilisateur.update({
      where: { id },
      data: { url_image_profil: null },
    });
    await this.removeLocalAvatar(id, user.url_image_profil);
    return { success: true };
  }

  getAvatar(id: string, filename: string) {
    if (!/^[a-f0-9]{32}\.webp$/i.test(filename)) {
      throw new NotFoundException('Avatar not found');
    }
    const path = resolve(this.avatarDirectory, id, filename);
    if (!existsSync(path)) throw new NotFoundException('Avatar not found');
    return { stream: createReadStream(path), contentType: 'image/webp' };
  }

  async exportMe(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        url_image_profil: true,
        langue_preferee: true,
        cree_le: true,
        adresses: {
          where: { est_par_defaut: true },
          select: {
            ligne_1: true,
            ville: true,
            code_postal: true,
            code_pays: true,
          },
        },
        profil_client: {
          select: {
            date_naissance: true,
            ordonnances: {
              select: {
                id: true,
                titre: true,
                prescrit_le: true,
                expire_le: true,
                notes: true,
                est_active: true,
                nom_fichier: true,
                type_fichier: true,
              },
            },
          },
        },
        rendez_vous: {
          select: {
            id: true,
            statut: true,
            type_service: true,
            commence_le: true,
            termine_le: true,
            note_client: true,
            magasin: { select: { id: true, nom: true } },
          },
        },
        produits_favoris: {
          select: {
            cree_le: true,
            produit: { select: { id: true, nom: true, slug: true } },
          },
        },
        sessions_essayage: {
          select: {
            id: true,
            statut: true,
            variante_produit_id: true,
            commencee_le: true,
            terminee_le: true,
          },
        },
        preferences_notifications: {
          select: { type: true, canal: true, active: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { exporte_le: new Date().toISOString(), donnees: user };
  }

  async deactivate(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const result = await this.prisma.utilisateur.updateMany({
      where: { id, supprime_le: null },
      data: { supprime_le: new Date(), statut: 'DESACTIVE' },
    });
    if (result.count === 0) {
      throw new NotFoundException('User not found');
    }
    await Promise.all([
      rm(resolve(this.avatarDirectory, id), { recursive: true, force: true }),
      rm(resolve(this.privatePrescriptionDirectory, id), {
        recursive: true,
        force: true,
      }),
    ]);
    return { success: true };
  }

  private async removeLocalAvatar(id: string, url: string | null) {
    const match = url?.match(
      new RegExp(`^/api/v1/users/${id}/avatar/([a-f0-9]{32}\\.webp)$`, 'i'),
    );
    if (!match) return;
    try {
      await rm(resolve(this.avatarDirectory, id, match[1]), { force: true });
    } catch {
      throw new InternalServerErrorException(
        'The profile was updated but the previous avatar could not be removed',
      );
    }
  }

  async followers(id: string, pagination: PaginationDto) {
    await this.findPublic(id);
    const where = { suivi_id: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnementUtilisateur.findMany({
        where,
        select: { abonne: { select: publicUserSelect } },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.abonnementUtilisateur.count({ where }),
    ]);
    return paginated(
      items.map((item) => item.abonne),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async following(id: string, pagination: PaginationDto) {
    await this.findPublic(id);
    const where = { abonne_id: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnementUtilisateur.findMany({
        where,
        select: { suivi: { select: publicUserSelect } },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.abonnementUtilisateur.count({ where }),
    ]);
    return paginated(
      items.map((item) => item.suivi),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async follow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new BadRequestException('Users cannot follow themselves');
    }
    await this.findPublic(followedId);
    try {
      return await this.prisma.abonnementUtilisateur.create({
        data: { abonne_id: followerId, suivi_id: followedId },
        select: { id: true, abonne_id: true, suivi_id: true, cree_le: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already following this user');
      }
      throw error;
    }
  }

  async unfollow(followerId: string, followedId: string) {
    const result = await this.prisma.abonnementUtilisateur.deleteMany({
      where: { abonne_id: followerId, suivi_id: followedId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
    return { success: true };
  }
}

function cleanName(value: string) {
  const cleaned = value
    .normalize('NFC')
    .trim()
    .replace(/\s*[.,;:]\s*/g, ' ')
    .replace(/\s+/g, ' ');
  if (!cleaned) throw new BadRequestException('Name cannot be empty');
  return cleaned;
}

function isValidAvatar(file: AvatarUploadFile) {
  if (!file.buffer.length || file.buffer.length > 5 * 1024 * 1024) return false;
  const jpeg =
    file.mimetype === 'image/jpeg' &&
    file.buffer.length >= 3 &&
    file.buffer[0] === 0xff &&
    file.buffer[1] === 0xd8 &&
    file.buffer[2] === 0xff;
  const png =
    file.mimetype === 'image/png' &&
    file.buffer.length >= 8 &&
    file.buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  const webp =
    file.mimetype === 'image/webp' &&
    file.buffer.length >= 12 &&
    file.buffer.toString('ascii', 0, 4) === 'RIFF' &&
    file.buffer.toString('ascii', 8, 12) === 'WEBP';
  return jpeg || png || webp;
}
