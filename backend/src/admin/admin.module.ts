import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController, PublicClickController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, PublicClickController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
