import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolePlateforme } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { ExternalImageSearchService } from '../catalogue/external-image-search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRolesGuard } from '../common/guards/platform-roles.guard';
import { ProductImageSearchService } from '../catalogue/product-image-search.service';
import { FrameImageUploadService } from '../catalogue/frame-image-upload.service';
import { ProductImageSuggestionsDto } from '../catalogue/dto/product-image-suggestions.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('Products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly imageSearch: ProductImageSearchService,
    private readonly externalImageSearch: ExternalImageSearchService,
    private readonly frameImages: FrameImageUploadService,
  ) {}

  @Get('image-suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suggest verified shared catalogue images for an authorized shop',
  })
  imageSuggestions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() query: ProductImageSuggestionsDto,
  ) {
    return this.imageSearch.suggestions(user.id, query);
  }

  @Get('image-suggestions/external')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Search commercial-use external image candidates for an authorized shop',
  })
  externalImageSuggestions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() query: ProductImageSuggestionsDto,
  ) {
    return this.externalImageSearch.freeSuggestions(user.id, query);
  }

  @Get('image-suggestions/paid')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Explicitly search SerpApi for unverified image candidates for an authorized shop',
  })
  paidExternalImageSuggestions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() query: ProductImageSuggestionsDto,
  ) {
    return this.externalImageSearch.paidSuggestions(user.id, query);
  }

  @Get('catalogue-image/:id')
  @Header('Content-Type', 'image/webp')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({
    summary: 'Serve an administrator-approved public frame image',
  })
  async catalogueImage(@Param('id', ParseUUIDPipe) id: string) {
    return new StreamableFile(await this.frameImages.readPublicImage(id));
  }

  @Get()
  @ApiOperation({ summary: 'Search the active product catalog' })
  list(@Query() query: QueryProductsDto) {
    return this.products.list(query);
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Get an active product with variants and specifications',
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  find(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.findPublic(productId);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a catalog product (platform admin)' })
  create(@Body() input: CreateProductDto) {
    return this.products.create(input);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Patch(':productId')
  @ApiOperation({ summary: 'Update a catalog product (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.products.update(productId, input);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete(':productId')
  @ApiOperation({ summary: 'Archive a catalog product (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  archive(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.archive(productId);
  }

  @Get(':productId/variants')
  @ApiOperation({ summary: 'List active product variants and specifications' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  variants(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.listVariants(productId);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post(':productId/variants')
  @ApiOperation({ summary: 'Create a product variant (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() input: CreateProductVariantDto,
  ) {
    return this.products.createVariant(productId, input);
  }
}
