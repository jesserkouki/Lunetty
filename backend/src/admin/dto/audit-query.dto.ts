import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AuditQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  type_entite?: string;

  @IsOptional()
  @IsUUID()
  acteur_id?: string;

  @IsOptional()
  @IsUUID()
  magasin_id?: string;

  @IsOptional()
  @IsUUID()
  utilisateur_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entite_id?: string;
}
