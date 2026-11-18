import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatutRendezVous } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  it('rejects invalid status transitions for authorized store staff', async () => {
    const authorization = {
      requirePermission: jest.fn().mockResolvedValue({ role: undefined }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const prisma = {
      rendezVous: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'appointment-id',
          statut: StatutRendezVous.TERMINE,
        }),
        update: jest.fn(),
      },
    };
    const service = new AppointmentsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.updateStatus(
        'staff-id',
        'store-id',
        'appointment-id',
        StatutRendezVous.CONFIRME,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.rendezVous.update).not.toHaveBeenCalled();
  });

  it('does not allow a user to reschedule another user’s appointment', async () => {
    const authorization = {
      requirePermission: jest.fn(),
      effectivePermissions: jest.fn(),
    };
    const prisma = {
      rendezVous: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      notification: { deleteMany: jest.fn() },
    };
    const service = new AppointmentsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.rescheduleMine('user-id', 'other-appointment', {
        commence_le: '2030-01-01T10:00:00.000Z',
        termine_le: '2030-01-01T11:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.deleteMany).not.toHaveBeenCalled();
  });
});
