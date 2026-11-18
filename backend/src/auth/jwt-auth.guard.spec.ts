import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePlateforme } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClerkIdentityService } from './clerk-identity.service';

describe('JwtAuthGuard temporary password restriction', () => {
  function makeContext() {
    const request = {
      headers: { authorization: 'Bearer access-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('blocks authenticated operations until the temporary password changes', async () => {
    const { context } = makeContext();
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn().mockReturnValue({ id: 'employee-id' }),
      } as unknown as JwtTokenService,
      {
        utilisateur: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'employee-id',
            role: RolePlateforme.USER,
            doit_changer_mot_de_passe: true,
          }),
        },
      } as unknown as PrismaService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector,
      {
        isConfigured: jest.fn().mockReturnValue(false),
      } as unknown as ClerkIdentityService,
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows the password-change endpoint to complete onboarding', async () => {
    const { context, request } = makeContext();
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn().mockReturnValue({ id: 'employee-id' }),
      } as unknown as JwtTokenService,
      {
        utilisateur: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'employee-id',
            role: RolePlateforme.USER,
            doit_changer_mot_de_passe: true,
          }),
        },
      } as unknown as PrismaService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      } as unknown as Reflector,
      {
        isConfigured: jest.fn().mockReturnValue(false),
      } as unknown as ClerkIdentityService,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toHaveProperty('user.id', 'employee-id');
  });

  it('resolves a verified Clerk subject to the linked application user', async () => {
    const { context, request } = makeContext();
    const prisma = {
      utilisateur: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'application-user-id',
          role: RolePlateforme.USER,
          doit_changer_mot_de_passe: false,
        }),
      },
    };
    const clerkIdentity = {
      isConfigured: jest.fn().mockReturnValue(true),
      verifySessionToken: jest.fn().mockResolvedValue('user_clerk-id'),
    };
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn().mockImplementation(() => {
          throw new UnauthorizedException('not a local token');
        }),
      } as unknown as JwtTokenService,
      prisma as unknown as PrismaService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector,
      clerkIdentity as unknown as ClerkIdentityService,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(clerkIdentity.verifySessionToken).toHaveBeenCalledWith(
      'access-token',
    );
    expect(prisma.utilisateur.findFirst).toHaveBeenCalledWith({
      where: {
        clerk_user_id: 'user_clerk-id',
        statut: 'ACTIVE',
        supprime_le: null,
      },
      select: { id: true, role: true, doit_changer_mot_de_passe: true },
    });
    expect(request).toHaveProperty('user.id', 'application-user-id');
  });
});
