import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  RoleMembre,
  StatutAdhesion,
  StatutMagasin,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StorePermissionCode,
  resolveStorePermissions,
} from './store-permissions';

export interface ActiveStoreMembership {
  id: string;
  role: RoleMembre;
  permission_preset: string | null;
  permissions: Array<{ code: string; autorise: boolean }>;
  subscription?: { active: boolean; modules: unknown } | null;
}

@Injectable()
export class StoreAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(
    userId: string,
    storeId: string,
    allowedRoles: RoleMembre[],
  ): Promise<{ role: RoleMembre }> {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
        role: { in: allowedRoles },
        magasin: {
          is: { statut: StatutMagasin.ACTIVE, supprime_le: null },
        },
      },
      select: { role: true },
    });
    if (!membership) {
      throw new ForbiddenException('Active store membership is required');
    }
    return membership;
  }

  async requireActiveMembership(
    userId: string,
    storeId: string,
  ): Promise<ActiveStoreMembership> {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
        magasin: {
          is: { statut: StatutMagasin.ACTIVE, supprime_le: null },
        },
      },
      select: {
        id: true,
        role: true,
        permission_preset: true,
        permissions: { select: { code: true, autorise: true } },
        magasin: {
          select: {
            plateforme_abonnement: {
              select: {
                plan: { select: { actif: true, modules: true } },
              },
            },
          },
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Active store membership is required');
    }
    const plan = membership.magasin.plateforme_abonnement?.plan;
    return {
      id: membership.id,
      role: membership.role,
      permission_preset: membership.permission_preset,
      permissions: membership.permissions,
      subscription: plan
        ? { active: plan.actif, modules: plan.modules }
        : null,
    };
  }

  effectivePermissions(membership: ActiveStoreMembership): Set<string> {
    const permissions = resolveStorePermissions(
      membership.role,
      membership.permission_preset,
      membership.permissions.map(({ code, autorise }) => ({
        code,
        allowed: autorise,
      })),
    );
    if (!membership.subscription) return permissions;
    if (!membership.subscription.active) return new Set();
    const modules = Array.isArray(membership.subscription.modules)
      ? membership.subscription.modules.filter(
          (module): module is string => typeof module === 'string',
        )
      : [];
    for (const permission of permissions) {
      if (!modules.includes(permission.split('.')[0])) {
        permissions.delete(permission);
      }
    }
    return permissions;
  }

  async requirePermission(
    userId: string,
    storeId: string,
    required: StorePermissionCode | readonly StorePermissionCode[],
  ): Promise<ActiveStoreMembership> {
    const membership = await this.requireActiveMembership(userId, storeId);
    const permissions = this.effectivePermissions(membership);
    const requiredPermissions = Array.isArray(required) ? required : [required];
    if (
      !requiredPermissions.some((permission) => permissions.has(permission))
    ) {
      throw new ForbiddenException(
        'The permission is unavailable or not included in the store subscription',
      );
    }
    return membership;
  }

  async permissionSet(
    userId: string,
    storeId: string,
  ): Promise<{ membership: ActiveStoreMembership; permissions: Set<string> }> {
    const membership = await this.requireActiveMembership(userId, storeId);
    return { membership, permissions: this.effectivePermissions(membership) };
  }

  async assertStoreLimit(
    storeId: string,
    limitType: 'employees' | 'listings',
  ): Promise<void> {
    const attribution = await this.prisma.attributionPlanPlateforme.findUnique({
      where: { magasin_id: storeId },
      select: {
        plan: {
          select: {
            actif: true,
            max_employes: true,
            max_annonces: true,
          },
        },
      },
    });
    if (!attribution) return;
    if (!attribution.plan.actif) {
      throw new ForbiddenException('The assigned subscription plan is inactive');
    }
    const limit =
      limitType === 'employees'
        ? attribution.plan.max_employes
        : attribution.plan.max_annonces;
    if (limit === null) return;
    const count =
      limitType === 'employees'
        ? await this.prisma.membreMagasin.count({
            where: {
              magasin_id: storeId,
              statut: StatutAdhesion.ACTIVE,
              role: { not: RoleMembre.PROPRIETAIRE },
            },
          })
        : await this.prisma.annonceMagasin.count({
            where: { magasin_id: storeId, supprime_le: null },
          });
    if (count >= limit) {
      throw new ForbiddenException(
        `The store subscription limit for ${limitType} has been reached`,
      );
    }
  }
}
