import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';
import { OpticianAssistantController } from './optician-assistant.controller';
import { OpticianAssistantService } from './optician-assistant.service';

@Module({
  imports: [AuthModule, InventoryModule, OrdersModule],
  controllers: [OpticianAssistantController],
  providers: [OpticianAssistantService],
})
export class OpticianAssistantModule {}
