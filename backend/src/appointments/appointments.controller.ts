import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AttachPrescriptionDto } from './dto/attach-prescription.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { PrescriptionsService } from '../customers/prescriptions.service';

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags('Appointments')
@ApiBearerAuth()
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly prescriptions: PrescriptionsService,
  ) {}

  @Get('appointments/me')
  @ApiOperation({ summary: "List the authenticated user's appointments" })
  listMine(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.appointments.listMine(user.id, pagination);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Request an appointment at an active store' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateAppointmentDto,
  ) {
    return this.appointments.create(user.id, input);
  }

  @Post('appointments/:appointmentId/cancel')
  @ApiOperation({ summary: 'Cancel an appointment owned by the authenticated user' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  cancel(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.appointments.cancelMine(user.id, appointmentId);
  }

  @Post('appointments/:appointmentId/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment owned by the authenticated user' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  reschedule(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: RescheduleAppointmentDto,
  ) {
    return this.appointments.rescheduleMine(user.id, appointmentId, input);
  }

  @Patch('appointments/:appointmentId/prescription')
  @ApiOperation({ summary: 'Attach or remove a prescription for an owned appointment' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  attachPrescription(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: AttachPrescriptionDto,
  ) {
    return this.appointments.attachPrescription(
      user.id,
      appointmentId,
      input.ordonnance_id ?? null,
    );
  }

  @Get('stores/:storeId/appointments/:appointmentId/prescription')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Stream a prescription explicitly attached to a store appointment' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  async sharedPrescription(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    const target = await this.appointments.sharedPrescriptionTarget(
      user.id,
      storeId,
      appointmentId,
    );
    const file = await this.prescriptions.file(
      target.clientId,
      target.prescriptionId,
    );
    return new StreamableFile(file.stream, {
      type: file.contentType,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    });
  }

  @Get('stores/:storeId/appointments')
  @ApiOperation({ summary: 'List appointments for a store you can manage' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  listStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.appointments.listStore(user.id, storeId, pagination);
  }

  @Patch('stores/:storeId/appointments/:appointmentId')
  @ApiOperation({ summary: 'Transition an appointment status as store staff' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  updateStatus(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(
      user.id,
      storeId,
      appointmentId,
      input.statut,
    );
  }
}
