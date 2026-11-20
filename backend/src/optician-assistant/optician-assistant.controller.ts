import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfirmOpticianAssistantProposalDto, OpticianAssistantChatDto } from './assistant.dto';
import { OpticianAssistantService } from './optician-assistant.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Optician Assistant')
@Controller('stores/:storeId/assistant')
export class OpticianAssistantController {
  private readonly logger = new Logger(OpticianAssistantController.name);

  constructor(private readonly assistant: OpticianAssistantService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with Lunetty Pro for the active store' })
  async chat(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: OpticianAssistantChatDto,
  ) {
    if (!this.assistant.hasKey) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY manquante côté serveur.',
      );
    }
    try {
      return await this.assistant.run(user.id, storeId, input.messages);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        'Optician assistant request failed',
        error instanceof Error ? error.stack : undefined,
      );
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 429
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.BAD_GATEWAY;
      throw new HttpException(
        status === HttpStatus.TOO_MANY_REQUESTS
          ? 'Trop de demandes, réessayez dans quelques secondes.'
          : 'L’assistant est momentanément indisponible. Réessayez plus tard.',
        status,
      );
    }
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a prepared assistant proposal' })
  confirm(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: ConfirmOpticianAssistantProposalDto,
  ) {
    return this.assistant.confirmProposal(user.id, storeId, input.token);
  }
}
