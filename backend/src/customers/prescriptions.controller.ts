import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import {
  PrescriptionUploadFile,
  PrescriptionsService,
} from './prescriptions.service';

@Controller('clients/me/prescriptions')
@UseGuards(JwtAuthGuard)
@ApiTags('Prescriptions')
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated client's prescriptions" })
  list(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.prescriptions.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a prescription for the authenticated client" })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreatePrescriptionDto,
  ) {
    return this.prescriptions.create(user.id, input);
  }

  @Post('upload')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'application/pdf'].includes(
            file.mimetype,
          )
        ) {
          callback(
            new BadRequestException('Only JPG, PNG, or PDF files are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        titre: { type: 'string' },
        prescrit_le: { type: 'string', format: 'date' },
        expire_le: { type: 'string', format: 'date' },
        notes: { type: 'string' },
        est_active: { type: 'boolean' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a private prescription document' })
  upload(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreatePrescriptionDto,
    @UploadedFile() file: PrescriptionUploadFile | undefined,
  ) {
    if (!file) throw new BadRequestException('A prescription file is required');
    return this.prescriptions.upload(user.id, input, file);
  }

  @Post(':prescriptionId/file')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'application/pdf'].includes(
            file.mimetype,
          )
        ) {
          callback(
            new BadRequestException('Only JPG, PNG, or PDF files are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace an owned private prescription document' })
  replaceFile(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
    @UploadedFile() file: PrescriptionUploadFile | undefined,
  ) {
    if (!file) throw new BadRequestException('A prescription file is required');
    return this.prescriptions.replaceFile(user.id, prescriptionId, file);
  }

  @Get(':prescriptionId')
  @ApiOperation({ summary: "Get a prescription owned by the authenticated client" })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  find(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
  ) {
    return this.prescriptions.find(user.id, prescriptionId);
  }

  @Get(':prescriptionId/file')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Stream an owned private prescription document' })
  file(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
  ) {
    return this.prescriptions.file(user.id, prescriptionId).then(
      ({ stream, contentType, fileName }) =>
        new StreamableFile(stream, {
          type: contentType,
          disposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        }),
    );
  }

  @Patch(':prescriptionId')
  @ApiOperation({ summary: 'Update prescription metadata or replace eye details' })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
    @Body() input: UpdatePrescriptionDto,
  ) {
    return this.prescriptions.update(user.id, prescriptionId, input);
  }

  @Delete(':prescriptionId')
  @ApiOperation({ summary: 'Delete an owned prescription and its eye details' })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
  ) {
    return this.prescriptions.remove(user.id, prescriptionId);
  }
}
