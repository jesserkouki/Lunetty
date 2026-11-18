import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, StatutNotification, StatutRendezVous, TypeNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentRemindersService.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.createDueReminders().catch((error: unknown) => this.logFailure(error));
    this.timer = setInterval(() => {
      void this.createDueReminders().catch((error: unknown) => this.logFailure(error));
    }, 15 * 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async createDueReminders(now = new Date()) {
    const from = new Date(now.getTime() + 23 * 60 * 60_000);
    const until = new Date(now.getTime() + 24 * 60 * 60_000);
    const appointments = await this.prisma.rendezVous.findMany({
      where: {
        commence_le: { gte: from, lt: until },
        statut: {
          in: [
            StatutRendezVous.DEMANDE,
            StatutRendezVous.CONFIRME,
            StatutRendezVous.REPLANIFIE,
          ],
        },
      },
      select: {
        id: true,
        utilisateur_id: true,
        commence_le: true,
        magasin: { select: { nom: true } },
      },
    });

    for (const appointment of appointments) {
      try {
        await this.prisma.notification.create({
          data: {
            utilisateur_id: appointment.utilisateur_id,
            rendez_vous_id: appointment.id,
            type: TypeNotification.RAPPEL_RENDEZ_VOUS,
            titre: 'Rappel de réservation',
            contenu: `Votre rendez-vous chez ${appointment.magasin.nom} est prévu demain.`,
            donnees: {
              appointmentId: appointment.id,
              startsAt: appointment.commence_le.toISOString(),
            } satisfies Prisma.InputJsonValue,
            statut: StatutNotification.PENDING,
          },
          select: { id: true },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }
    return appointments.length;
  }

  private logFailure(error: unknown) {
    this.logger.error(
      'Unable to create appointment reminder notifications',
      error instanceof Error ? error.stack : undefined,
    );
  }
}
