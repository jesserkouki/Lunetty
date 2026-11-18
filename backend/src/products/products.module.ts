import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsCacheModule } from './products-cache.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, ProductsCacheModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
