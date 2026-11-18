import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatutMagasin, StatutRendezVous, TypeNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StorePermissionCode } from '../common/guards/store-permissions';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const customerSelect = {
  id: true,
  magasin_id: true,
  statut: true,
  type_service: true,
  commence_le: true,
  termine_le: true,
  note_client: true,
  ordonnance_id: true,
  cree_le: true,
  magasin: {
    select: {
      id: true,
      nom: true,
      slug: true,
      telephone: true,
      adresses: {
        where: { type: 'STORE' },
        take: 1,
        select: { ligne_1: true, ville: true, code_postal: true, code_pays: true },
      },
    },
  },
} as const;

const staffSelect = {
  ...customerSelect,
  note_interne: true,
  utilisateur: { select: { id: true, prenom: true, nom: true, email: true } },
} as const;

function staffSelectFor(includeContact: boolean) {
  return {
    ...staffSelect,
    utilisateur: {
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: includeContact,
      },
    },
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async listMine(userId: string, pagination: PaginationDto) {
    const where = { utilisateur_id: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.rendezVous.findMany({
        where,
        select: customerSelect,
        orderBy: { commence_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.rendezVous.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async create(userId: string, input: CreateAppointmentDto) {
    const start = new Date(input.commence_le);
    const end = new Date(input.termine_le);
    if (start.getTime() <= Date.now() || end.getTime() <= start.getTime()) {
      throw new BadRequestException('Appointment must have a future start and a later end');
    }
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: input.magasin_id,
        statut: StatutMagasin.ACTIVE,
        supprime_le: null,
      },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    return this.prisma.rendezVous.create({
      data: {
        utilisateur_id: userId,
        magasin_id: input.magasin_id,
        type_service: input.type_service,
        commence_le: start,
        termine_le: end,
        note_client: input.note_client,
      },
      select: customerSelect,
    });
  }

  async cancelMine(userId: string, appointmentId: string) {
    const appointment = await this.prisma.rendezVous.findFirst({
      where: { id: appointmentId, utilisateur_id: userId },
      select: { id: true, statut: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (
      appointment.statut === StatutRendezVous.TERMINE ||
      appointment.statut === StatutRendezVous.ANNULE ||
      appointment.statut === StatutRendezVous.ABSENT
    ) {
      throw new ConflictException('Appointment can no longer be cancelled');
    }
    const updated = await this.prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { statut: StatutRendezVous.ANNULE },
      select: customerSelect,
    });
    await this.prisma.notification.deleteMany({
      where: {
        rendez_vous_id: appointmentId,
        type: TypeNotification.RAPPEL_RENDEZ_VOUS,
      },
    });
    return updated;
  }

  async rescheduleMine(
    userId: string,
    appointmentId: string,
    input: RescheduleAppointmentDto,
  ) {
    const start = new Date(input.commence_le);
    const end = new Date(input.termine_le);
    if (start.getTime() <= Date.now() || end.getTime() <= start.getTime()) {
      throw new BadRequestException('Appointment must have a future start and a later end');
    }
    const result = await this.prisma.rendezVous.updateMany({
      where: {
        id: appointmentId,
        utilisateur_id: userId,
        statut: {
          in: [
            StatutRendezVous.DEMANDE,
            StatutRendezVous.CONFIRME,
            StatutRendezVous.REPLANIFIE,
          ],
        },
      },
      data: {
        commence_le: start,
        termine_le: end,
        statut: StatutRendezVous.REPLANIFIE,
      },
    });
    if (!result.count) {
      const exists = await this.prisma.rendezVous.findFirst({
        where: { id: appointmentId, utilisateur_id: userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Appointment not found');
      throw new ConflictException('Appointment can no longer be rescheduled');
    }
    await this.prisma.notification.deleteMany({
      where: {
        rendez_vous_id: appointmentId,
        type: TypeNotification.RAPPEL_RENDEZ_VOUS,
      },
    });
    return this.prisma.rendezVous.findUniqueOrThrow({
      where: { id: appointmentId },
      select: customerSelect,
    });
  }

  async attachPrescription(
    userId: string,
    appointmentId: string,
    prescriptionId: string | null,
  ) {
    const appointment = await this.prisma.rendezVous.findFirst({
      where: {
        id: appointmentId,
        utilisateur_id: userId,
        statut: {
          in: [
            StatutRendezVous.DEMANDE,
            StatutRendezVous.CONFIRME,
            StatutRendezVous.REPLANIFIE,
          ],
        },
      },
      select: { id: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (prescriptionId) {
      const prescription = await this.prisma.ordonnance.findFirst({
        where: {
          id: prescriptionId,
          profil_client: { is: { utilisateur_id: userId } },
        },
        select: { id: true },
      });
      if (!prescription) throw new NotFoundException('Prescription not found');
    }
    return this.prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { ordonnance_id: prescriptionId },
      select: customerSelect,
    });
  }

  async sharedPrescriptionTarget(
    userId: string,
    storeId: string,
    appointmentId: string,
  ) {
    await this.authorizeStore(userId, storeId, 'appointments.view');
    const appointment = await this.prisma.rendezVous.findFirst({
      where: {
        id: appointmentId,
        magasin_id: storeId,
        ordonnance_id: { not: null },
      },
      select: { utilisateur_id: true, ordonnance_id: true },
    });
    if (!appointment?.ordonnance_id) {
      throw new NotFoundException('Shared prescription not found');
    }
    return {
      clientId: appointment.utilisateur_id,
      prescriptionId: appointment.ordonnance_id,
    };
  }

  async listStore(userId: string, storeId: string, pagination: PaginationDto) {
    const membership = await this.authorizeStore(userId, storeId, 'appointments.view');
    const includeContact = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_contact');
    const where = { magasin_id: storeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.rendezVous.findMany({
        where,
        select: staffSelectFor(includeContact),
        orderBy: { commence_le: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.rendezVous.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async updateStatus(
    userId: string,
    storeId: string,
    appointmentId: string,
    next: StatutRendezVous,
  ) {
    const membership = await this.authorizeStore(
      userId,
      storeId,
      next === StatutRendezVous.ANNULE
        ? 'appointments.cancel'
        : 'appointments.update',
    );
    const includeContact = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_contact');
    const current = await this.prisma.rendezVous.findFirst({
      where: { id: appointmentId, magasin_id: storeId },
      select: { id: true, statut: true },
    });
    if (!current) throw new NotFoundException('Appointment not found');
    const allowed: Partial<Record<StatutRendezVous, StatutRendezVous[]>> = {
      [StatutRendezVous.DEMANDE]: [
        StatutRendezVous.CONFIRME,
        StatutRendezVous.REPLANIFIE,
        StatutRendezVous.ANNULE,
      ],
      [StatutRendezVous.CONFIRME]: [
        StatutRendezVous.REPLANIFIE,
        StatutRendezVous.TERMINE,
        StatutRendezVous.ANNULE,
        StatutRendezVous.ABSENT,
      ],
      [StatutRendezVous.REPLANIFIE]: [
        StatutRendezVous.CONFIRME,
        StatutRendezVous.ANNULE,
      ],
    };
    if (!allowed[current.statut]?.includes(next)) {
      throw new ConflictException('Invalid appointment status transition');
    }
    const updated = await this.prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { statut: next },
      select: staffSelectFor(includeContact),
    });
    if (next === StatutRendezVous.ANNULE) {
      await this.prisma.notification.deleteMany({
        where: {
          rendez_vous_id: appointmentId,
          type: TypeNotification.RAPPEL_RENDEZ_VOUS,
        },
      });
    }
    return updated;
  }

  private authorizeStore(
    userId: string,
    storeId: string,
    permission: StorePermissionCode,
  ) {
    return this.storeAuthorization.requirePermission(userId, storeId, permission);
  }
}
