import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateStoreLocationDto } from './create-store-location.dto';

export class CreateStoreLocationsDto {
  @ApiProperty({
    type: [CreateStoreLocationDto],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateStoreLocationDto)
  locations!: CreateStoreLocationDto[];
}
