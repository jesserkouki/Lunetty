import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, RolePlateforme, StatutUtilisateur } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordHasher } from './password-hasher.service';
import { ClerkIdentityService } from './clerk-identity.service';

const userSelect = {
  id: true,
  role: true,
  prenom: true,
  nom: true,
  nom_utilisateur: true,
  email: true,
  email_verifie_le: true,
  telephone: true,
  url_image_profil: true,
  statut: true,
  doit_changer_mot_de_passe: true,
  langue_preferee: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.UtilisateurSelect;

const activeUserSelect = {
  ...userSelect,
  clerk_user_id: true,
  supprime_le: true,
} satisfies Prisma.UtilisateurSelect;

@Injectable()
export class ClerkAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher,
    private readonly clerkIdentity: ClerkIdentityService,
  ) {}

  async synchronize(token: string, requestedAccountType?: unknown) {
    const clerkUserId =
      await this.clerkIdentity.verifySessionToken(token);
    const profile = await this.clerkIdentity.getVerifiedProfile(clerkUserId);
    const email = profile.email.trim().toLowerCase();
    if (!email || email.length > 255) {
      throw new ConflictException(
        'The verified Clerk email is not supported by this application',
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const linkedUser = await transaction.utilisateur.findUnique({
          where: { clerk_user_id: clerkUserId },
          select: activeUserSelect,
        });

        if (linkedUser) {
          this.assertActive(linkedUser);
          return transaction.utilisateur.update({
            where: { id: linkedUser.id },
            data: {
              email,
              email_verifie_le:
                linkedUser.email.toLowerCase() === email
                  ? linkedUser.email_verifie_le
                  : new Date(),
              derniere_connexion_le: new Date(),
            },
            select: userSelect,
          });
        }

        const emailUser = await transaction.utilisateur.findUnique({
          where: { email },
          select: activeUserSelect,
        });

        if (emailUser) {
          this.assertActive(emailUser);
          if (emailUser.clerk_user_id) {
            throw new ConflictException(
              'This email is linked to a different Clerk identity',
            );
          }

          const linked = await transaction.utilisateur.updateMany({
            where: { id: emailUser.id, clerk_user_id: null },
            data: {
              clerk_user_id: clerkUserId,
              email_verifie_le:
                emailUser.email_verifie_le ?? new Date(),
              derniere_connexion_le: new Date(),
            },
          });
          if (!linked.count) {
            const concurrentLink = await transaction.utilisateur.findUnique({
              where: { clerk_user_id: clerkUserId },
              select: activeUserSelect,
            });
            if (concurrentLink) {
              this.assertActive(concurrentLink);
              return transaction.utilisateur.findUniqueOrThrow({
                where: { id: concurrentLink.id },
                select: userSelect,
              });
            }
            throw new ConflictException(
              'This email was linked to another identity; sign in again',
            );
          }

          return transaction.utilisateur.findUniqueOrThrow({
            where: { id: emailUser.id },
            select: userSelect,
          });
        }

        return transaction.utilisateur.create({
          data: {
            clerk_user_id: clerkUserId,
            email,
            prenom: profile.firstName?.trim().slice(0, 100) || 'Utilisateur',
            nom: profile.lastName?.trim().slice(0, 100) || '',
            url_image_profil:
              profile.imageUrl && profile.imageUrl.length <= 2048
                ? profile.imageUrl
                : null,
            empreinte_mot_de_passe: await this.passwordHasher.hash(
              randomBytes(48).toString('base64url'),
            ),
            email_verifie_le: new Date(),
            derniere_connexion_le: new Date(),
            statut: StatutUtilisateur.ACTIVE,
            role: this.clerkRegistrationRole(requestedAccountType),
          },
          select: userSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const linkedUser = await this.prisma.utilisateur.findUnique({
          where: { clerk_user_id: clerkUserId },
          select: activeUserSelect,
        });
        if (linkedUser) {
          this.assertActive(linkedUser);
          if (linkedUser.email.toLowerCase() !== email) {
            throw new ConflictException(
              'The Clerk email is already used by another application account',
            );
          }

          return this.prisma.utilisateur.findUniqueOrThrow({
            where: { id: linkedUser.id },
            select: userSelect,
          });
        }
        throw new ConflictException(
          'An account already exists for that email or Clerk identity',
        );
      }
      throw error;
    }
  }

  private clerkRegistrationRole(value: unknown): RolePlateforme {
    if (value === undefined || value === null || value === 'CLIENT') {
      return RolePlateforme.USER;
    }
    if (value === 'OPTICIAN' || value === 'OPTICIEN') {
      return RolePlateforme.OPTICIEN;
    }
    throw new ConflictException('Unsupported account type');
  }

  private assertActive(user: {
    statut: StatutUtilisateur;
    supprime_le: Date | null;
  }): void {
    if (
      user.statut !== StatutUtilisateur.ACTIVE ||
      user.supprime_le !== null
    ) {
      throw new UnauthorizedException('Account is unavailable');
    }
  }
}
