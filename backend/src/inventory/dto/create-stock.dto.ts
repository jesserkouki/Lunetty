import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AgeMontureStock,
  ConceptionVerreStock,
  PublicCible,
  TraitementVerreStock,
  TypeArticleStock,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStockDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional direct link to a shared catalogue product',
  })
  @IsOptional()
  @IsUUID()
  catalogueProductId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional direct link to a shared catalogue variant',
  })
  @IsOptional()
  @IsUUID()
  catalogueVariantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Verified catalogue image selected for this frame',
  })
  @IsOptional()
  @IsUUID()
  catalogueImageId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Uploaded frame image owned by this store',
  })
  @IsOptional()
  @IsUUID()
  frameImageUploadId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Idempotency key reused for retries of this stock creation',
  })
  @IsOptional()
  @IsUUID()
  creationRequestId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Lien facultatif avec une variante du catalogue',
  })
  @IsOptional()
  @IsUUID()
  storeListingVariantId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  emplacement_id!: string;

  @ApiProperty({ enum: TypeArticleStock })
  @IsEnum(TypeArticleStock)
  type_article!: TypeArticleStock;

  @ApiPropertyOptional({ enum: ConceptionVerreStock })
  @IsOptional()
  @IsEnum(ConceptionVerreStock)
  conception_verre?: ConceptionVerreStock;

  @ApiPropertyOptional({ enum: TraitementVerreStock })
  @IsOptional()
  @IsEnum(TraitementVerreStock)
  traitement_verre?: TraitementVerreStock;

  @ApiPropertyOptional({ description: 'Puissance optique de l’œil droit' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  puissance_droite?: number;

  @ApiPropertyOptional({ description: 'Puissance optique de l’œil gauche' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  puissance_gauche?: number;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  marque_reference?: string;

  @ApiPropertyOptional({ enum: AgeMontureStock })
  @IsOptional()
  @IsEnum(AgeMontureStock)
  age_monture?: AgeMontureStock;

  @ApiPropertyOptional({ enum: PublicCible })
  @IsOptional()
  @IsEnum(PublicCible)
  public_cible?: PublicCible;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  taille_monture?: string;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  quantite_disponible = 0;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  seuil_reapprovisionnement = 0;

  @ApiProperty({
    minimum: 0.001,
    maximum: 999999999.999,
    description: 'Selling price per unit in the store currency',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(999999999.999)
  prix_vente!: number;
}
