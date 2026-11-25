import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateCatalogueVariantDto {
  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  colorCode?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  colorName?: string;

  @ApiPropertyOptional({ maxLength: 14 })
  @IsOptional()
  @IsString()
  @Length(8, 14)
  ean?: string;
}
