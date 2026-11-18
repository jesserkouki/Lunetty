import { Prisma, StatutRendezVous, TypeNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentRemindersService } from './appointment-reminders.service';

describe('AppointmentRemindersService', () => {
  it('creates one in-app reminder for each eligible appointment in the next-day window', async () => {
    const now = new Date('2030-01-01T10:00:00.000Z');
    const appointment = {
      id: 'appointment-id',
      utilisateur_id: 'user-id',
      commence_le: new Date('2030-01-02T09:30:00.000Z'),
      magasin: { nom: 'Optique Lunetty' },
    };
    const prisma = {
      rendezVous: { findMany: jest.fn().mockResolvedValue([appointment]) },
      notification: { create: jest.fn().mockResolvedValue({ id: 'notification-id' }) },
    };
    const service = new AppointmentRemindersService(prisma as unknown as PrismaService);

    const count = await service.createDueReminders(now);

    expect(count).toBe(1);
    expect(prisma.rendezVous.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          commence_le: {
            gte: new Date('2030-01-02T09:00:00.000Z'),
            lt: new Date('2030-01-02T10:00:00.000Z'),
          },
          statut: {
            in: [
              StatutRendezVous.DEMANDE,
              StatutRendezVous.CONFIRME,
              StatutRendezVous.REPLANIFIE,
            ],
          },
        },
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          utilisateur_id: 'user-id',
          rendez_vous_id: 'appointment-id',
          type: TypeNotification.RAPPEL_RENDEZ_VOUS,
          contenu: 'Votre rendez-vous chez Optique Lunetty est prévu demain.',
        }),
      }),
    );
  });

  it('treats a duplicate reminder as already processed', async () => {
    const prisma = {
      rendezVous: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'appointment-id',
            utilisateur_id: 'user-id',
            commence_le: new Date('2030-01-02T09:30:00.000Z'),
            magasin: { nom: 'Optique Lunetty' },
          },
        ]),
      },
      notification: {
        create: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Duplicate', {
            code: 'P2002',
            clientVersion: '6.19.3',
          }),
        ),
      },
    };
    const service = new AppointmentRemindersService(prisma as unknown as PrismaService);

    await expect(
      service.createDueReminders(new Date('2030-01-01T10:00:00.000Z')),
    ).resolves.toBe(1);
  });
});
