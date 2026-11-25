import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RolePlateforme } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRolesGuard } from '../common/guards/platform-roles.guard';
import { CatalogueService } from './catalogue.service';
import { CreateCatalogueImageDto } from './dto/create-catalogue-image.dto';
import { CreateCatalogueProductDto } from './dto/create-catalogue-product.dto';
import { CreateCatalogueVariantDto } from './dto/create-catalogue-variant.dto';
import { QueryCatalogueProductsDto } from './dto/query-catalogue-products.dto';
import { UpdateCatalogueImageDto } from './dto/update-catalogue-image.dto';
import { UpdateCatalogueProductDto } from './dto/update-catalogue-product.dto';
import { UpdateCatalogueVariantDto } from './dto/update-catalogue-variant.dto';

@Controller('admin/catalogue')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
@ApiBearerAuth()
@ApiTags('Catalogue administration')
export class CatalogueAdminController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get shared catalogue totals' })
  getSummary() {
    return this.catalogue.getSummary();
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a shared catalogue product' })
  createProduct(@Body() input: CreateCatalogueProductDto) {
    return this.catalogue.createProduct(input);
  }

  @Get('products')
  @ApiOperation({ summary: 'Search shared catalogue products' })
  listProducts(@Query() query: QueryCatalogueProductsDto) {
    return this.catalogue.listProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a shared catalogue product and its images' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.findProduct(id);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update a shared catalogue product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateCatalogueProductDto,
  ) {
    return this.catalogue.updateProduct(id, input);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a shared catalogue product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.deleteProduct(id);
  }

  @Post('products/:id/images')
  @ApiOperation({ summary: 'Add image metadata to a catalogue product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  createImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() input: CreateCatalogueImageDto,
  ) {
    return this.catalogue.createImage(productId, input);
  }

  @Patch('images/:id')
  @ApiOperation({ summary: 'Update or verify a shared catalogue image' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateImage(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) imageId: string,
    @Body() input: UpdateCatalogueImageDto,
  ) {
    return this.catalogue.updateImage(imageId, user.id, input);
  }

  @Delete('images/:id')
  @ApiOperation({ summary: 'Delete a shared catalogue image' })
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteImage(@Param('id', ParseUUIDPipe) imageId: string) {
    return this.catalogue.deleteImage(imageId);
  }

  @Post('products/:id/variants')
  @ApiOperation({ summary: 'Add a colour variant to a catalogue product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  createVariant(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() input: CreateCatalogueVariantDto,
  ) {
    return this.catalogue.createVariant(productId, input);
  }

  @Patch('products/:id/variants/:variantId')
  @ApiOperation({ summary: 'Update a catalogue product variant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'variantId', format: 'uuid' })
  updateVariant(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() input: UpdateCatalogueVariantDto,
  ) {
    return this.catalogue.updateVariant(productId, variantId, input);
  }

  @Delete('products/:id/variants/:variantId')
  @ApiOperation({ summary: 'Delete a catalogue product variant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'variantId', format: 'uuid' })
  deleteVariant(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.catalogue.deleteVariant(productId, variantId);
  }
}
