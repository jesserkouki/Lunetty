import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsCacheModule } from '../products/products-cache.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { StoreLocationsController } from './store-locations.controller';
import { StoreLocationsService } from './store-locations.service';
import {
  ManagedStoreListingsController,
  StoreListingsController,
} from './store-listings.controller';
import { StoreListingsService } from './store-listings.service';
import { RneVerificationService } from './rne-verification.service';

@Module({
  imports: [AuthModule, ProductsCacheModule],
  controllers: [
    StoresController,
    StoreLocationsController,
    StoreListingsController,
    ManagedStoreListingsController,
  ],
  providers: [
    StoresService,
    StoreLocationsService,
    StoreListingsService,
    RneVerificationService,
  ],
  exports: [StoresService, StoreLocationsService, StoreListingsService],
})
export class StoresModule {}
