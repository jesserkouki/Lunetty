import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  commence_le!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  termine_le!: string;
}
