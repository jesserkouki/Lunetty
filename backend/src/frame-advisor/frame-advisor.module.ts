import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FrameAdvisorController } from './advisor.controller';
import { FrameAdvisorService } from './advisor.service';
import { FrameCatalogService } from './catalog.service';

@Module({
  imports: [PrismaModule],
  controllers: [FrameAdvisorController],
  providers: [FrameAdvisorService, FrameCatalogService],
})
export class FrameAdvisorModule {}