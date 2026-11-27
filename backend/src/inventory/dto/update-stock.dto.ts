import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateStockDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seuil_reapprovisionnement?: number;

  @ApiPropertyOptional({
    minimum: 0.001,
    maximum: 999999999.999,
    description: 'Selling price per unit in the store currency',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(999999999.999)
  prix_vente?: number;

  @ApiPropertyOptional({
    description: 'Whether this frame stock item is published to the public shop',
  })
  @IsOptional()
  @IsBoolean()
  est_publie?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  catalogueProductId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  catalogueVariantId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  catalogueImageId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  frameImageUploadId?: string | null;
}
