import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import {
  InventoryController,
  PublicStoreCatalogueController,
} from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReferenceScanService } from './reference-scan.service';

@Module({
  imports: [AuthModule, CatalogueModule],
  controllers: [InventoryController, PublicStoreCatalogueController],
  providers: [InventoryService, ReferenceScanService],
  exports: [InventoryService],
})
export class InventoryModule {}
