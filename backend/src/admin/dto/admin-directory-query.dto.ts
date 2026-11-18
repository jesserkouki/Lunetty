import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AdminDirectoryQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @IsOptional()
  @IsIn(['clients', 'opticians', 'employees'])
  kind?: 'clients' | 'opticians' | 'employees';
}

export class AdminOrdersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}