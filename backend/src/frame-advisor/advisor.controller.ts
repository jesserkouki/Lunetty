import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { FrameAdvisorService } from './advisor.service';

// Routes : POST /frame-advisor/chat et GET /frame-advisor/health (préfixées par votre préfixe global éventuel, ex. /api).
@Controller('frame-advisor')
export class FrameAdvisorController {
  private readonly logger = new Logger(FrameAdvisorController.name);

  constructor(private readonly agent: FrameAdvisorService) {}

  @Get('health')
  health() {
    return { ok: true, model: this.agent.textModel, hasKey: this.agent.hasKey };
  }

  @Post('chat')
  async chat(@Body() body: { messages?: unknown }) {
    if (!this.agent.hasKey) {
      throw new InternalServerErrorException('GROQ_API_KEY manquante côté serveur (voir .env.example).');
    }
    try {
      return await this.agent.run(body?.messages);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(err?.message ?? err);
      const status = err?.status === 429 ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_GATEWAY;
      throw new HttpException(
        err?.status === 429
          ? 'Trop de demandes, réessayez dans quelques secondes.'
          : 'Une erreur est survenue, réessayez dans un instant.',
        status,
      );
    }
  }
}