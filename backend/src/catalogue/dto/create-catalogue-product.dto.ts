import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeProduit } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCatalogueProductDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @Length(1, 120)
  brand!: string;

  @ApiProperty({ maxLength: 160 })
  @IsString()
  @Length(1, 160)
  reference!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  model?: string;

  @ApiProperty({ enum: TypeProduit })
  @IsEnum(TypeProduit)
  productType!: TypeProduit;
}
