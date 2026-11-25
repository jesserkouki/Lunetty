import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePlateforme } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogueAdminController } from './catalogue-admin.controller';
import { PlatformRolesGuard } from '../common/guards/platform-roles.guard';

describe('CatalogueAdminController authorization', () => {
  const guard = new PlatformRolesGuard(new Reflector());
  const handler = () => undefined;

  function context(role: RolePlateforme): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => CatalogueAdminController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as ExecutionContext;
  }

  it('allows platform administrators', () => {
    expect(guard.canActivate(context(RolePlateforme.ADMIN))).toBe(true);
    expect(guard.canActivate(context(RolePlateforme.SUPER_ADMIN))).toBe(true);
  });

  it.each([RolePlateforme.OPTICIEN, RolePlateforme.USER])(
    'rejects non-admin role %s',
    (role) => {
      expect(() => guard.canActivate(context(role))).toThrow(
        ForbiddenException,
      );
    },
  );

  it('requires JWT authentication on the controller', () => {
    const guards = Reflect.getMetadata('__guards__', CatalogueAdminController);
    expect(guards).toContain(JwtAuthGuard);
  });
});
