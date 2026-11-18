import {
  CanActivate,
  ExecutionContext,

  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StatutUtilisateur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOW_INITIAL_PASSWORD_CHANGE } from './allow-initial-password-change.decorator';

import { AuthenticatedRequest } from './auth.types';
import { JwtTokenService } from './jwt-token.service';
import { ClerkIdentityService } from './clerk-identity.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: JwtTokenService,
    private readonly prisma: PrismaService,

    private readonly reflector: Reflector,
    private readonly clerkIdentity: ClerkIdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    const token = authorization.slice(7);
    let user;
    try {
      const principal = this.tokens.verify(token);
      user = await this.prisma.utilisateur.findFirst({
        where: {
          id: principal.id,
          statut: StatutUtilisateur.ACTIVE,
          supprime_le: null,
        },
        select: { id: true, role: true, doit_changer_mot_de_passe: true },
      });
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
      if (!this.clerkIdentity.isConfigured()) {
        throw error;
      }

      const clerkUserId =
        await this.clerkIdentity.verifySessionToken(token);
      user = await this.prisma.utilisateur.findFirst({
        where: {
          clerk_user_id: clerkUserId,
          statut: StatutUtilisateur.ACTIVE,
          supprime_le: null,
        },
        select: { id: true, role: true, doit_changer_mot_de_passe: true },
      });
    }
    if (!user) {
      throw new UnauthorizedException('Account is unavailable');
    }


    const canChangeInitialPassword = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INITIAL_PASSWORD_CHANGE,
      [context.getHandler(), context.getClass()],
    );
    if (user.doit_changer_mot_de_passe && !canChangeInitialPassword) {
      throw new ForbiddenException(
        'You must change your temporary password first',
      );
    }

    request.user = user;
    return true;
  }
}
