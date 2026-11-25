import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogueAdminController } from './catalogue-admin.controller';
import { CatalogueService } from './catalogue.service';
import { ExternalImageSearchService } from './external-image-search.service';
import { BraveImageProvider } from './brave-image.provider';
import { OpenverseImageProvider } from './openverse-image.provider';
import { ProductImageSearchService } from './product-image-search.service';
import { SerpApiImageProvider } from './serpapi-image.provider';

@Module({
  imports: [AuthModule],
  controllers: [CatalogueAdminController],
  providers: [
    CatalogueService,
    ProductImageSearchService,
    BraveImageProvider,
    OpenverseImageProvider,
    SerpApiImageProvider,
    ExternalImageSearchService,
  ],
  exports: [
    CatalogueService,
    ProductImageSearchService,
    ExternalImageSearchService,
  ],
})
export class CatalogueModule {}
