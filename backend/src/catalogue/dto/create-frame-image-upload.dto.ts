import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FrameImageVisibility } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFrameImageUploadDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  brand!: string;

  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  reference!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  model?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({ maxLength: 14 })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  ean?: string;

  @ApiProperty({ enum: FrameImageVisibility })
  @IsEnum(FrameImageVisibility)
  visibility!: FrameImageVisibility;

  @ApiPropertyOptional({
    description: 'Required when sharing the upload with all shops',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  confirmPublicSharing?: boolean;
}
