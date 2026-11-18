import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolePlateforme } from '@prisma/client';
import { SuperAdminGuard } from './super-admin.guard';

describe('SuperAdminGuard', () => {
  const guard = new SuperAdminGuard();

  function contextWithRole(role: RolePlateforme) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as ExecutionContext;
  }

  it('allows only SUPER_ADMIN accounts', () => {
    expect(guard.canActivate(contextWithRole(RolePlateforme.SUPER_ADMIN))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(contextWithRole(RolePlateforme.ADMIN)),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(contextWithRole(RolePlateforme.USER)),
    ).toThrow(ForbiddenException);
  });
});
