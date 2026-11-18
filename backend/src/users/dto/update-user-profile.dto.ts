import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClientAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ligne_1!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ville!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code_postal!: string;

  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/)
  code_pays!: string;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*[\p{L}\p{M}]$|^[\p{L}\p{M}]$/u)
  prenom?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*[\p{L}\p{M}]$|^[\p{L}\p{M}]$/u)
  nom?: string;

  @ApiPropertyOptional({ maxLength: 50, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nom_utilisateur?: string | null;

  @ApiPropertyOptional({ maxLength: 30, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9][0-9\s().-]{5,24}$/)
  telephone?: string | null;

  @ApiPropertyOptional({ maxLength: 2048, nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url_image_profil?: string | null;

  @ApiPropertyOptional({ maxLength: 10 })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  langue_preferee?: string;

  @ApiPropertyOptional({ type: ClientAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientAddressDto)
  adresse?: ClientAddressDto;
}
