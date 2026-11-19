import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RoleMembre } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StoreOrdersService } from '../orders/store-orders.service';
import { OpticianAssistantService } from './optician-assistant.service';

describe('OpticianAssistantService', () => {
  const originalSecret = process.env.AUTH_JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_JWT_SECRET;
    } else {
      process.env.AUTH_JWT_SECRET = originalSecret;
    }
  });

  it('does not run revenue queries for a non-manager, even if the model requests them', async () => {
    const userId = 'c0a80101-0000-4000-8000-000000000001';
    const storeId = 'c0a80101-0000-4000-8000-000000000002';
    const member = {
      id: 'c0a80101-0000-4000-8000-000000000003',
      role: RoleMembre.OPTICIEN,
      permission_preset: 'custom',
      permissions: [],
    };
    const requireMembership = jest
      .fn()
      .mockRejectedValue(
        new ForbiddenException('Active store membership is required'),
      );
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue(member),
      effectivePermissions: jest
        .fn()
        .mockReturnValue(new Set(['dashboard.view_financials'])),
      requireMembership,
      requirePermission: jest.fn(),
    };
    const prisma = {
      magasin: { findFirst: jest.fn().mockResolvedValue({ nom: 'Lunetty' }) },
      utilisateur: {
        findFirst: jest.fn().mockResolvedValue({ prenom: 'Amel', nom: 'Ali' }),
      },
      paiement: { groupBy: jest.fn() },
      remboursement: { groupBy: jest.fn() },
      commande: { groupBy: jest.fn() },
      $queryRaw: jest.fn(),
    };
    const service = new OpticianAssistantService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      {} as InventoryService,
      {} as StoreOrdersService,
    );
    const groqClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      id: 'call-revenue',
                      function: { name: 'revenue', arguments: '{}' },
                    },
                  ],
                },
              },
            ],
          }),
        },
      },
    };
    Reflect.set(service, 'client', groqClient);

    await expect(
      service.run(userId, storeId, [
        { role: 'user', content: 'Quel est le chiffre d’affaires ?' },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(requireMembership).toHaveBeenCalledWith(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
    expect(prisma.paiement.groupBy).not.toHaveBeenCalled();
    expect(prisma.commande.groupBy).not.toHaveBeenCalled();
  });

  it('rejects unsigned proposals before invoking any write service', async () => {
    process.env.AUTH_JWT_SECRET = 'test-secret-with-at-least-32-characters';
    const inventory = { createMovement: jest.fn() };
    const storeOrders = { updateStatus: jest.fn() };
    const service = new OpticianAssistantService(
      {} as PrismaService,
      {} as StoreAuthorizationService,
      inventory as unknown as InventoryService,
      storeOrders as unknown as StoreOrdersService,
    );

    await expect(
      service.confirmProposal(
        'c0a80101-0000-4000-8000-000000000001',
        'c0a80101-0000-4000-8000-000000000002',
        'forged.proposal',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(inventory.createMovement).not.toHaveBeenCalled();
    expect(storeOrders.updateStatus).not.toHaveBeenCalled();
  });
});
