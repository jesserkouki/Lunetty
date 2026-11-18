import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AppointmentRemindersService } from './appointment-reminders.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, AppointmentRemindersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
